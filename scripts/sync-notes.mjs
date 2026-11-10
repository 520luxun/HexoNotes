import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(projectRoot, "notes-sync.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
	const i = args.indexOf(flag);
	return i >= 0 ? args[i + 1] : undefined;
};

const dryRun = has("--dry-run");
const syncAll = has("--all");
const sourceDir = path.resolve(valueOf("--source") ?? config.source);
const targetDir = path.resolve(projectRoot, valueOf("--target") ?? config.target);

if (!targetDir.startsWith(projectRoot)) {
	throw new Error(`[notes-sync] target must be inside the project: ${targetDir}`);
}

function toRegExp(glob) {
	let re = "";
	for (let i = 0; i < glob.length; i++) {
		const c = glob[i];
		if (c === "*") {
			if (glob[i + 1] === "*") {
				i++;
				if (glob[i + 1] === "/") {
					i++;
					re += "(?:.*[/\\\\])?";
				} else re += ".*";
			} else re += "[^/\\\\]*";
		} else if (c === "?") re += "[^/\\\\]";
		else if (c === "/") re += "[/\\\\]";
		else if ("\\^$.|+()[]{}".includes(c)) re += `\\${c}`;
		else re += c;
	}
	return new RegExp(`^${re}$`);
}
const excludePatterns = (config.exclude ?? []).map(toRegExp);
const alwaysIncludePatterns = (config.alwaysInclude ?? []).map(toRegExp);
const isExcluded = (rel) => excludePatterns.some((re) => re.test(rel));
const isAlwaysIncluded = (rel) => alwaysIncludePatterns.some((re) => re.test(rel));

const stripQuotes = (v) => v.replace(/^['"]|['"]$/g, "").trim();
const parseScalar = (v) => {
	if (/^(true|false)$/i.test(v)) return /^true$/i.test(v);
	if (/^null$|^~$/.test(v)) return null;
	return stripQuotes(v);
};

function parseFrontmatter(text) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
	if (!match) return { data: {}, body: text };
	const data = {};
	let listKey = null;
	for (const line of match[1].split(/\r?\n/)) {
		const item = /^\s+-\s+(.*)$/.exec(line);
		if (item && listKey) {
			if (!Array.isArray(data[listKey])) data[listKey] = [];
			data[listKey].push(parseScalar(item[1].trim()));
			continue;
		}
		const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
		if (!kv) continue;
		listKey = kv[1];
		const raw = kv[2].trim();
		if (raw === "") data[listKey] = [];
		else if (raw.startsWith("[") && raw.endsWith("]"))
			data[listKey] = raw
				.slice(1, -1)
				.split(",")
				.map((s) => parseScalar(s.trim()))
				.filter((s) => s !== "");
		else data[listKey] = parseScalar(raw);
	}
	return { data, body: text.slice(match[0].length) };
}

const normalizeDate = (value) => {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	const s = String(value ?? "");
	const m = /(?:^|[^\d])(\d{4})[-/._]?(\d{2})[-/._]?(\d{2})(?!\d)/.exec(s);
	if (!m) return null;
	const date = `${m[1]}-${m[2]}-${m[3]}`;
	const d = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(d.getTime()) ? null : date;
};

const yamlQuote = (v) => JSON.stringify(String(v ?? ""));
const yamlArray = (arr) => `[${arr.map((v) => JSON.stringify(String(v))).join(", ")}]`;

function collectFiles(dir, base = dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		const rel = path.relative(base, full).split(path.sep).join("/");
		if (entry.isDirectory()) {
			if (/^\./.test(entry.name)) continue; // skip hidden dirs entirely
			collectFiles(full, base, out);
		} else if (entry.isFile()) out.push({ full, rel });
	}
	return out;
}

function convertNote(file, attachmentIndex) {
	const raw = fs.readFileSync(file.full, "utf8");
	const { data, body } = parseFrontmatter(raw);
	const basename = path.basename(file.rel, ".md");
	const title = data.title || basename.replace(/^\d{4}-\d{2}-\d{2}[-_\s]*/, "") || basename;
	const published =
		normalizeDate(data.published) ??
		normalizeDate(data.date) ??
		normalizeDate(data.created) ??
		normalizeDate(data.upload_date) ??
		normalizeDate(basename) ??
		normalizeDate(fs.statSync(file.full).mtime);

	const firstDir = file.rel.split("/")[0];
	const category = data.category || config.categoryMap?.[firstDir] || config.defaultCategory || "";
	const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
	const description = data.description || data.summary || "";
	const draft = data.draft === true || data.publish === false;

	const frontmatter = [
		"---",
		`title: ${yamlQuote(title)}`,
		`published: ${published}`,
		`description: ${yamlQuote(description)}`,
		`tags: ${yamlArray(tags)}`,
		`category: ${yamlQuote(category)}`,
		`draft: ${draft}`,
		"---",
		"",
	].join("\n");

	// Convert Obsidian image embeds to standard Markdown and collect attachments.
	const attachments = new Set();
	let output = body.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, name) => {
		const cleaned = name.trim();
		attachments.add(cleaned);
		return `![](${cleaned})`;
	});
	for (const match of output.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
		const ref = match[1].trim().split(/[?#]/)[0];
		if (ref && !/^(https?:|data:|#|\/)/i.test(ref)) attachments.add(decodeURIComponent(ref));
	}

	const rel = file.rel.replace(/^Blog\//i, "").replace(/^blog\//, "");

	const copiedAttachments = [];
	if (config.copyAttachments !== false) {
		for (const ref of attachments) {
			const local = path.join(path.dirname(file.full), ref);
			const candidate = fs.existsSync(local) ? local : attachmentIndex.get(path.basename(ref));
			if (!candidate) continue;
			const destRel = path.join(path.dirname(rel), ref);
			copiedAttachments.push({ from: candidate, to: destRel });
		}
	}
	return { frontmatter, output, rel, title, published, copiedAttachments };
}

function main() {
	if (!fs.existsSync(sourceDir)) {
		console.log(`[notes-sync] source not found (${sourceDir}), keep previously synced notes.`);
		return;
	}

	const files = collectFiles(sourceDir);
	const attachmentIndex = new Map();
	for (const f of files) {
		if (!f.rel.toLowerCase().endsWith(".md") && !attachmentIndex.has(path.basename(f.rel)))
			attachmentIndex.set(path.basename(f.rel), f.full);
	}

	const candidates = files.filter(
		(f) => f.rel.toLowerCase().endsWith(".md") && !isExcluded(f.rel),
	);
	const hasPublishFlag = (file) => {
		const flag = parseFrontmatter(fs.readFileSync(file.full, "utf8")).data[config.publishField];
		return flag === true || flag === "true" || flag === "yes" || flag === 1;
	};
	const selected = candidates.filter(
		(f) => syncAll || isAlwaysIncluded(f.rel) || hasPublishFlag(f),
	);

	console.log(
		`[notes-sync] scanned ${candidates.length} notes, ${selected.length} to publish${syncAll ? " (--all)" : ""}${dryRun ? " [dry-run]" : ""}`,
	);

	if (!dryRun) {
		fs.rmSync(targetDir, { recursive: true, force: true });
		fs.mkdirSync(targetDir, { recursive: true });
	}

	for (const file of selected) {
		const note = convertNote(file, attachmentIndex);
		const dest = path.join(targetDir, note.rel);
		if (!dryRun) {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.writeFileSync(dest, `${note.frontmatter}${note.output}`, "utf8");
			for (const att of note.copiedAttachments) {
				const attDest = path.join(targetDir, att.to);
				fs.mkdirSync(path.dirname(attDest), { recursive: true });
				fs.copyFileSync(att.from, attDest);
			}
		}
		console.log(`  + ${note.rel}  (${note.published}) ${note.copiedAttachments.length ? `+${note.copiedAttachments.length} attachments` : ""}`);
	}
	if (!dryRun && selected.length === 0) {
		fs.writeFileSync(path.join(targetDir, ".gitkeep"), "", "utf8");
	}
}

main();
