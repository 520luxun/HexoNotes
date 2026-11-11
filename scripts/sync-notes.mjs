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
const pathCollator = new Intl.Collator("zh", { numeric: true, sensitivity: "base" });

// Directory-first natural ordering: FreeRTOS/01 < FreeRTOS/02 < .../10,
// and parent-level notes before notes in subdirectories.
const comparePath = (a, b) => {
	const pa = a.split("/");
	const pb = b.split("/");
	for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
		const c = pathCollator.compare(pa[i], pb[i]);
		if (c !== 0) return c;
	}
	return pa.length - pb.length;
};

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
			signal: AbortSignal.timeout(12000),
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

// Splits a note path into the first and second category levels.
function categoryParts(rel) {
	const parts = rel.split("/");
	const parent =
		config.categoryMap?.[parts[1]] ||
		parts[1] ||
		config.categoryMap?.[parts[0]] ||
		config.defaultCategory ||
		"";
	const raw = parts.length > 3 ? config.categoryMap?.[parts[2]] || parts[2] : "";
	// Attachment folders must not turn into visible sub-categories.
	const isAssetFolder = /^(assets?|images?|imgs?|pics?|attachments?|files?|docs?|附件|图片|素材)$/i.test(
		raw.trim(),
	);
	const sub = isAssetFolder ? "" : raw;
	return { parent, sub: sub === parent ? "" : sub };
}

// Category = the note's second-level folder (mapped to Chinese), e.g.
// Embedded/FreeRTOS -> FreeRTOS, Embedded/PCB -> 硬件电路.
function makeCategory(rel, data, _multiSub) {
	if (data.category) return data.category;
	const parts = rel.split("/");
	const parent =
		config.categoryMap?.[parts[1]] ||
		parts[1] ||
		config.categoryMap?.[parts[0]] ||
		config.defaultCategory ||
		"笔记";
	// Use the next folder down as a sub-category when it is a real folder.
	const raw = parts.length > 3 ? parts[2] : "";
	const isAsset = /\.assets$/i.test(raw) || /^(assets?|images?|imgs?|pics?|photos?|attachments?|files?)$/i.test(raw);
	const sub = raw && !isAsset ? config.categoryMap?.[raw] || raw : "";
	return sub ? `${parent}/${sub}` : parent;
}

// URL path keeps the full folder tree so links stay readable.
function categoryDirs(rel) {
	const labels = [];
	for (const p of rel.split("/").slice(0, -1)) {
		if (/\.assets$/i.test(p)) continue;
		if (/^(assets?|images?|imgs?|pics?|photos?|attachments?|files?)$/i.test(p)) continue;
		labels.push(stripPunct(config.categoryMap?.[p] || p));
	}
	return labels;
}

function preferNearest(list, noteDir) {
	const key = noteDir.toLowerCase();
	let best = list[0];
	let bestScore = -1;
	for (const p of list) {
		const a = p.toLowerCase();
		let i = 0;
		while (i < a.length && i < key.length && a[i] === key[i]) i++;
		if (i > bestScore) {
			bestScore = i;
			best = p;
		}
	}
	return best;
}

// Astro slugs come from the file name: keep only letters/digits/CJK/_/- so the
// generated URL is predictable (Astro lowercases it).
const stripPunct = (s) =>
	s
		.replace(/[^\p{L}\p{N}_-]+/gu, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");
const slugOf = (s) => stripPunct(s).toLowerCase();

// Relative link from a page at /posts/notes/<dirs>/<slug>/ to another note.
const relLink = (fromDirs, toDirs, toSlug) =>
	`${"../".repeat(fromDirs + 1)}${toDirs.length ? `${toDirs.join("/")}/` : ""}${toSlug}/`;

function convertNote(file, attachments, downloaded, assets, order, multiSub, ctx) {
	const raw = fs.readFileSync(file.full, "utf8");
	const { data, body } = parseFrontmatter(raw);
	const basename = path.basename(file.rel, ".md");
	// Titles follow the note file name (minus any date prefix), not the
	// longer descriptive frontmatter title.
	const title = basename.replace(/^\d{4}-\d{2}-\d{2}[-_\s]*/, "") || basename;
	const published =
		normalizeDate(data.published) ??
		normalizeDate(data.date) ??
		normalizeDate(data.created) ??
		normalizeDate(data.upload_date) ??
		normalizeDate(basename) ??
		normalizeDate(fs.statSync(file.full).mtime);

	// Lower-case extensions and de-duplicate case-insensitively: on Windows
	// "22.PNG" and "22.png" are the same file, but Linux (and the CI runner)
	// treat them as different paths and fail with ImageNotFound.
	const usedNames = new Map();
	const registerImage = (candidate) => {
		const base = path.basename(candidate);
		const ext = path.extname(base).toLowerCase();
		const stem = safeName(base.slice(0, base.length - ext.length)) || "img";
		let name = `${stem}${ext}`;
		const known = usedNames.get(name.toLowerCase());
		if (known && known !== candidate) {
			name = `${sha(candidate)}-${stem}${ext}`;
		}
		usedNames.set(name.toLowerCase(), candidate);
		assets.set(name, candidate);
		return `./assets/${name}`;
	};

	const isFile = (p) => {
		try {
			return fs.existsSync(p) && fs.statSync(p).isFile();
		} catch {
			return false;
		}
	};

	const resolveImage = (ref) => {
		const r = ref.trim();
		if (/^https?:\/\//i.test(r)) {
			const item = downloaded.get(r);
			// Expired signed URLs cannot be recovered; drop the broken image
			// instead of leaving an <img> that 403s on the deployed site.
			if (!item) return null;
			const name = `img-${sha(r)}.${item.ext}`;
			assets.set(name, item.path);
			return `./assets/${name}`;
		}
		if (/^(data:|#)/i.test(r)) return r;

		const decoded = decodeURIComponent(r.split("?")[0].split("#")[0]).replace(/\\/g, "/");
		const norm = decoded.replace(/^\.\//, "");
		const noteDir = path.dirname(file.full);
		const candidates = [];

		// Path-style refs ("SchoolStudy/计算机操作系统/asserts/Photo/1.png"):
		// try the vault root, the implicit "Embedded" prefix Obsidian links use,
		// the note folder and each ancestor folder.
		if (norm.includes("/")) {
			candidates.push(path.join(attachments.root, norm));
			candidates.push(path.join(attachments.root, "Embedded", norm));
			let dir = noteDir;
			for (let i = 0; i < 6 && dir.length >= attachments.root.length; i++) {
				candidates.push(path.join(dir, norm));
				dir = path.dirname(dir);
			}
			for (const c of candidates) if (isFile(c)) return registerImage(c);

			const suffix = `/${norm.toLowerCase()}`;
			const hits = [];
			for (const [key, full] of attachments.byPath) {
				if (key.endsWith(suffix)) hits.push(full);
			}
			if (hits.length) return registerImage(preferNearest(hits, noteDir));
			return null;
		}

		// Bare file names ("a.png"): resolve next to the note and inside its
		// attachment folders first, walking up the folder tree like Obsidian's
		// "shortest path" mode. A global basename hit is only a last resort,
		// otherwise one "1.png" from another chapter would be picked silently.
		const subdirs = ["", "assets", "asserts", "Photo", "photos", "images", "img", "attachments"];
		let dir = noteDir;
		for (let i = 0; i < 6 && dir.length >= attachments.root.length; i++) {
			for (const sub of subdirs) {
				candidates.push(sub ? path.join(dir, sub, norm) : path.join(dir, norm));
			}
			candidates.push(path.join(dir, `${path.basename(dir)}.assets`, norm));
			dir = path.dirname(dir);
		}
		for (const c of candidates) if (isFile(c)) return registerImage(c);

		const all = attachments.byBase.get(norm.toLowerCase()) ?? [];
		if (all.length === 1) return registerImage(all[0]);
		if (all.length > 1) return registerImage(preferNearest(all, noteDir));
		return null; // missing source file: drop the broken image rather than guess
	};

	// Resolve [[note]] to a relative URL; unknown targets fall back to plain text.
	const noteLink = (target, alias) => {
		const raw = target.trim();
		const [pathPart] = raw.split("#");
		const key = pathPart.replace(/\\/g, "/").replace(/\.md$/i, "");
		const base = path.basename(key);
		const hit =
			ctx.byRel.get(key.toLowerCase()) ??
			ctx.byBase.get(base.toLowerCase()) ??
			ctx.byBase.get(slugOf(base));
		if (!hit) return (alias ?? raw).trim();
		return `[${(alias ?? pathPart).trim()}](${relLink(ctx.dirs.length, hit.dirs, hit.slug)})`;
	};

	let output = body
		.replace(/在这里插入图片描述/g, "")
		.replace(/\uFEFF/g, "") // stray BOM from copied notes
		// Obsidian-only syntax that plain Markdown would show literally.
		.replace(/==([^=\n]+)==/g, "<mark>$1</mark>")
		.replace(/^>\s*\[!(\w+)\][+-]?\s*(.*)$/gim, (_, _type, title) =>
			title ? `> **${title.trim()}**` : ">",
		)
		// NOTE: do not rewrite $...$ here. Notes contain tables with several
		// inline formulas per row; a cross-cell match would swallow the
		// delimiters and break KaTeX rendering. Warnings about Chinese text in
		// math mode are harmless.
		// Expressive Code expects lowercase/standard language ids.
		.replace(/^```\s*C\+\+\s*$/gim, "```cpp")
		.replace(/^```\s*C#\s*$/gim, "```csharp")
		.replace(/^```\s*C\s*$/gim, "```c")
		.replace(/^```\s*ld\s*$/gim, "```txt")
		// Dead links to other vault notes (*.md that is not published) become text.
		.replace(/\[([^\]]+)\]\((?![a-z][a-z0-9+.-]*:)[^)]*\.md(?:#[^)]*)?\)/gi, "$1")
		// Obsidian embeds: images stay images, notes become links.
		.replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, target, alias) => {
			const t = target.trim();
			if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(t)) return `![](${t})`;
			return noteLink(t, alias);
		})
		// Obsidian wiki links: [[note]] / [[note|alias]] / [[note#heading]]
		.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, target, alias) =>
			noteLink(target, alias),
		)
		.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, ref) => {
			const resolved = resolveImage(ref);
			return resolved === null ? "" : `![${alt}](${resolved})`;
		})
		// Raw <img> tags are not processed by Astro, convert them to Markdown.
		.replace(/<img\s+[^>]*src="([^"]+)"[^>]*\/?>/gi, (_, src) => {
			const resolved = resolveImage(src);
			return resolved === null ? "" : `![](${resolved})`;
		});

	if (stripMarkup(output).length < (config.minBodyChars ?? 120)) return null;

	const frontmatter = [
		"---",
		`title: ${yamlQuote(title)}`,
		`published: ${published}`,
		`description: ${yamlQuote(cleanDescription(data.description || data.summary, body))}`,
		`tags: ${yamlArray(Array.isArray(data.tags) ? data.tags.map(String) : [])}`,
		`category: ${yamlQuote(makeCategory(file.rel, data, multiSub))}`,
		`draft: ${data.draft === true || data.publish === false}`,
		`order: ${order}`,
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
	const attachments = { root: sourceDir, byPath: new Map(), byBase: new Map() };
	for (const f of files) {
		if (f.rel.toLowerCase().endsWith(".md")) continue;
		attachments.byPath.set(f.rel.split(path.sep).join("/").toLowerCase(), f.full);
		const base = path.basename(f.rel).toLowerCase();
		const list = attachments.byBase.get(base);
		if (list) list.push(f.full);
		else attachments.byBase.set(base, [f.full]);
	}

	// Keep excluded folders (Clippings/Daily/...) as candidates so a note can
	// still opt in with `publish: true`.
	const candidates = files.filter((f) => f.rel.toLowerCase().endsWith(".md"));
	const hasPublishFlag = (file) => {
		const flag = parseFrontmatter(fs.readFileSync(file.full, "utf8")).data[config.publishField];
		return flag === true || flag === "true" || flag === "yes" || flag === 1;
	};
	const selected = candidates.filter(
		(f) =>
			syncAll ||
			hasPublishFlag(f) ||
			isFeatured(f.rel) ||
			(!isExcluded(f.rel) && isAlwaysIncluded(f.rel)),
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
			Array.from({ length: Math.min(12, urls.length) }, async () => {
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
	const outputs = [];
	const ordered = [...selected].sort((a, b) => comparePath(a.rel, b.rel));

	// A folder only becomes a visible sub-category when it holds 2+ notes.
	const subCounts = new Map();
	for (const file of ordered) {
		const { parent, sub } = categoryParts(file.rel);
		if (!sub) continue;
		const key = `${parent}\u0000${sub}`;
		subCounts.set(key, (subCounts.get(key) ?? 0) + 1);
	}
	const multiSub = new Set([...subCounts].filter(([, n]) => n >= 2).map(([k]) => k));

	// Pass 1: plan where every note lives, so [[wiki links]] can point at it.
	const byRel = new Map();
	const byBase = new Map();
	const usedPaths = new Set();
	const planned = [];
	for (const file of ordered) {
		const raw = fs.readFileSync(file.full, "utf8");
		const { data } = parseFrontmatter(raw);
		const basename = path.basename(file.rel, ".md");
		const title = basename.replace(/^\d{4}-\d{2}-\d{2}[-_\s]*/, "") || basename;
		const category = makeCategory(file.rel, data, multiSub);
		// URL keeps the folder tree; the category label is the second level.
		const dirs = categoryDirs(file.rel);
		const baseSlug = slugOf(basename) || "note";
		let slug = baseSlug;
		let rel = [...dirs, `${slug}.md`].join("/");
		let n = 2;
		while (usedPaths.has(rel)) {
			slug = `${baseSlug}-${n++}`;
			rel = [...dirs, `${slug}.md`].join("/");
		}
		usedPaths.add(rel);
		const entry = { file, title, category, dirs, slug, rel };
		planned.push(entry);
		byRel.set(file.rel.replace(/\.md$/i, "").toLowerCase(), entry);
		byBase.set(basename.toLowerCase(), entry);
		byBase.set(slug, entry);
		byBase.set(title.toLowerCase(), entry);
	}

	// Pass 2: convert bodies with the link map and matching relative depth.
	for (const [index, p] of planned.entries()) {
		const ctx = {
			dirs: p.dirs,
			byRel,
			byBase,
			assetPrefix: `${"../".repeat(p.dirs.length)}assets/`,
		};
		const note = convertNote(p.file, attachments, downloaded, assets, index + 1, multiSub, ctx);
		if (!note) {
			console.log(`  - skipped (empty): ${p.file.rel}`);
			continue;
		}
		outputs.push({
			name: p.rel,
			content: `${note.frontmatter}${note.output.replace(/\.\/assets\//g, ctx.assetPrefix)}`,
			rel: p.file.rel,
		});
	}

	if (!dryRun) {
		fs.rmSync(targetDir, { recursive: true, force: true });
		fs.mkdirSync(targetDir, { recursive: true });
		for (const o of outputs) {
			const dest = path.join(targetDir, o.name);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.writeFileSync(dest, o.content, "utf8");
		}
		if (assets.size) {
			const assetDir = path.join(targetDir, "assets");
			fs.mkdirSync(assetDir, { recursive: true });
			const sharp = (await import("sharp")).default;
			let resized = 0;
			for (const [name, src] of assets) {
				const dest = path.join(assetDir, name);
				try {
					const meta = await sharp(src).metadata();
					const w = meta.width ?? 0;
					const h = meta.height ?? 0;
					const frames = meta.pages ?? 1;
					// Animated GIF/WebP: total decoded pixels can exceed sharp's
					// limit even when one frame is small. Keep only the first frame.
					if (w * h * frames > 100_000_000 || Math.max(w, h) > 10000 || frames > 1) {
						await sharp(src, { animated: false })
							.resize({
								width: 4096,
								height: 4096,
								fit: "inside",
								withoutEnlargement: true,
							})
							.toFile(dest);
						resized++;
					} else {
						fs.copyFileSync(src, dest);
					}
				} catch {
					fs.copyFileSync(src, dest);
				}
			}
			if (resized) console.log(`[notes-sync] resized ${resized} oversized images`);
		}
		if (!outputs.length) fs.writeFileSync(path.join(targetDir, ".gitkeep"), "", "utf8");
	}
	for (const o of outputs) console.log(`  + notes/${o.name}  <- ${o.rel}`);
	console.log(`[notes-sync] ${outputs.length} posts, ${assets.size} images`);
}

main();
