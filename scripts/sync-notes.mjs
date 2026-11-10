import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD ||= "5000";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
	fs.readFileSync(path.join(projectRoot, "notes-sync.config.json"), "utf8"),
);

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
const cacheDir = path.join(projectRoot, ".notes-image-cache");

if (!targetDir.startsWith(projectRoot)) {
	throw new Error(`[notes-sync] target must be inside the project: ${targetDir}`);
}

const normalize = (p) => p.replace(/\\/g, "/").toLowerCase();

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
const featured = new Set((config.featured ?? []).map(normalize));
const isExcluded = (rel) => excludePatterns.some((re) => re.test(rel));
const isAlwaysIncluded = (rel) => alwaysIncludePatterns.some((re) => re.test(rel));
const isFeatured = (rel) => featured.has(normalize(rel));

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
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
const safeName = (s) => s.replace(/[\\/:*?"<>|#%\s]+/g, "_").replace(/^\.+/, "");

const extOf = (url) => {
	try {
		const p = new URL(url).pathname;
		const m = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.exec(p);
		return (m?.[1] ?? "png").toLowerCase().replace("jpeg", "jpg");
	} catch {
		return "png";
	}
};

async function downloadImage(url) {
	const key = sha(url);
	for (const e of ["png", "jpg", "gif", "webp", "svg"]) {
		const cached = path.join(cacheDir, `${key}.${e}`);
		if (fs.existsSync(cached) && fs.statSync(cached).size > 200)
			return { path: cached, ext: e };
	}
	fs.mkdirSync(cacheDir, { recursive: true });
	try {
		// No Referer header: image hosts (e.g. CSDN) reject requests whose
		// Referer is the blog domain, but serve requests without one.
		const res = await fetch(url, {
			headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
			signal: AbortSignal.timeout(20000),
		});
		if (!res.ok) return null;
		const buf = Buffer.from(await res.arrayBuffer());
		if (buf.length < 200) return null;
		const ct = (res.headers.get("content-type") ?? "").toLowerCase();
		const ext = ct.includes("gif")
			? "gif"
			: ct.includes("jpeg")
				? "jpg"
				: ct.includes("webp")
					? "webp"
					: ct.includes("svg")
						? "svg"
						: ct.includes("png")
							? "png"
							: extOf(url);
		const file = path.join(cacheDir, `${key}.${ext}`);
		fs.writeFileSync(file, buf);
		return { path: file, ext };
	} catch {
		return null;
	}
}

function collectFiles(dir, base = dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		const rel = path.relative(base, full).split(path.sep).join("/");
		if (entry.isDirectory()) {
			if (/^\./.test(entry.name)) continue;
			collectFiles(full, base, out);
		} else if (entry.isFile()) out.push({ full, rel });
	}
	return out;
}

const stripMarkup = (body) =>
	body
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/!\[\[[^\]]*\]\]/g, "")
		.replace(/<[^>]+>/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[#>*`|_\-\s]/g, "");

function cleanDescription(desc, body) {
	let d = String(desc ?? "").trim();
	if (/在这里插入图片描述|^答：|^\s*$/.test(d)) d = "";
	if (!d) {
		d = body
			.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
			.replace(/!\[\[[^\]]*\]\]/g, "")
			.replace(/<[^>]+>/g, "")
			.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
			.replace(/[#>*`|\-]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 80);
	}
	return d.replace(/["\\]/g, "");
}

function makeCategory(rel, data) {
	const parts = rel.split("/");
	return (
		data.category ||
		config.categoryMap?.[parts[1]] ||
		parts[1] ||
		config.categoryMap?.[parts[0]] ||
		config.defaultCategory ||
		""
	);
}

function convertNote(file, attachmentIndex, downloaded, assets) {
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

	const resolveImage = (ref) => {
		const r = ref.trim();
		if (/^https?:\/\//i.test(r)) {
			const item = downloaded.get(r);
			if (!item) return r; // download failed: keep original link
			const name = `img-${sha(r)}.${item.ext}`;
			assets.set(name, item.path);
			return `./assets/${name}`;
		}
		if (/^(data:|#|\/)/i.test(r)) return r;
		const decoded = decodeURIComponent(r.split("?")[0].split("#")[0]);
		const sameDir = path.join(path.dirname(file.full), decoded);
		const candidate = fs.existsSync(sameDir)
			? sameDir
			: attachmentIndex.get(path.basename(decoded));
		if (!candidate) return `./assets/${safeName(path.basename(decoded))}`;
		let name = safeName(path.basename(decoded));
		if (assets.has(name) && assets.get(name) !== candidate) {
			name = `${sha(file.rel)}-${name}`;
		}
		assets.set(name, candidate);
		return `./assets/${name}`;
	};

	let output = body
		.replace(/在这里插入图片描述/g, "")
		.replace(/\uFEFF/g, "") // stray BOM from copied notes
		// Normalise inline formulas: notes sometimes mix \( $...$ \) or put
		// Chinese text inside $...$, which KaTeX cannot render cleanly.
		.replace(/\\\(\s*\$([^$\n]*)\$\s*\\\)/g, (_, x) => `$${x}$`)
		.replace(/\\\(\s*/g, () => "$")
		.replace(/\s*\\\)/g, () => "$")
		.replace(/\$([^$\n]*[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef][^$\n]*)\$/g, "$1")
		// Expressive Code expects lowercase/standard language ids.
		.replace(/^```\s*C\+\+\s*$/gim, "```cpp")
		.replace(/^```\s*C#\s*$/gim, "```csharp")
		.replace(/^```\s*C\s*$/gim, "```c")
		.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, n) => `![](${n.trim()})`)
		.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, ref) => `![${alt}](${resolveImage(ref)})`)
		// Raw <img> tags are not processed by Astro, convert them to Markdown.
		.replace(/<img\s+[^>]*src="([^"]+)"[^>]*\/?>/gi, (_, src) => `![](${resolveImage(src)})`);

	if (stripMarkup(output).length < (config.minBodyChars ?? 120)) return null;

	const frontmatter = [
		"---",
		`title: ${yamlQuote(title)}`,
		`published: ${published}`,
		`description: ${yamlQuote(cleanDescription(data.description || data.summary, body))}`,
		`tags: ${yamlArray(Array.isArray(data.tags) ? data.tags.map(String) : [])}`,
		`category: ${yamlQuote(makeCategory(file.rel, data))}`,
		`draft: ${data.draft === true || data.publish === false}`,
		"---",
		"",
	].join("\n");

	return { frontmatter, output, basename, title, published };
}

async function main() {
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
		(f) => syncAll || isAlwaysIncluded(f.rel) || isFeatured(f.rel) || hasPublishFlag(f),
	);

	console.log(
		`[notes-sync] scanned ${candidates.length} notes, ${selected.length} to publish${syncAll ? " (--all)" : ""}${dryRun ? " [dry-run]" : ""}`,
	);

	// Collect external image URLs from the selected notes and cache them locally.
	const urlSet = new Set();
	for (const file of selected) {
		const raw = fs.readFileSync(file.full, "utf8");
		for (const m of raw.matchAll(/https?:\/\/[^\s)"'<>]+\.(?:png|jpe?g|gif|webp|bmp|svg)/gi))
			urlSet.add(m[0]);
		// Image hosts often hide the extension (e.g. /640?wx_fmt=gif).
		for (const m of raw.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi)) urlSet.add(m[1]);
		for (const m of raw.matchAll(/<img\s+[^>]*src="(https?:\/\/[^"]+)"/gi)) urlSet.add(m[1]);
	}
	const downloaded = new Map();
	if (!dryRun && urlSet.size) {
		const urls = [...urlSet];
		let cursor = 0;
		await Promise.all(
			Array.from({ length: Math.min(6, urls.length) }, async () => {
				while (cursor < urls.length) {
					const url = urls[cursor++];
					downloaded.set(url, await downloadImage(url));
				}
			}),
		);
		console.log(
			`[notes-sync] external images: ${[...downloaded.values()].filter(Boolean).length}/${urlSet.size} downloaded`,
		);
	}

	const assets = new Map();
	const usedNames = new Set();
	const outputs = [];
	for (const file of selected) {
		const note = convertNote(file, attachmentIndex, downloaded, assets);
		if (!note) {
			console.log(`  - skipped (empty): ${file.rel}`);
			continue;
		}
		let name = `${safeName(note.basename)}.md`;
		let n = 2;
		while (usedNames.has(name)) name = `${safeName(note.basename)}-${n++}.md`;
		usedNames.add(name);
		outputs.push({ name, content: `${note.frontmatter}${note.output}`, rel: file.rel });
	}

	if (!dryRun) {
		fs.rmSync(targetDir, { recursive: true, force: true });
		fs.mkdirSync(targetDir, { recursive: true });
		for (const o of outputs) fs.writeFileSync(path.join(targetDir, o.name), o.content, "utf8");
		if (assets.size) {
			fs.mkdirSync(path.join(targetDir, "assets"), { recursive: true });
			for (const [name, src] of assets)
				fs.copyFileSync(src, path.join(targetDir, "assets", name));
		}
		if (!outputs.length) fs.writeFileSync(path.join(targetDir, ".gitkeep"), "", "utf8");
	}
	for (const o of outputs) console.log(`  + notes/${o.name}  <- ${o.rel}`);
	console.log(`[notes-sync] ${outputs.length} posts, ${assets.size} images`);
}

main();
