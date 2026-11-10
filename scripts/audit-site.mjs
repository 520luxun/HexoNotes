import fs from "node:fs";
import path from "node:path";

// Check every image, stylesheet, script, internal link and page on the site.
// Usage: pnpm audit:site
// Override with AUDIT_ORIGIN / AUDIT_BASE for the Gitee mirror.
const dist = path.resolve("dist");
const origin = process.env.AUDIT_ORIGIN ?? "https://520luxun.github.io";
const siteBase = process.env.AUDIT_BASE ?? "/HexoNotes/";

const images = new Map();
const assets = new Map();
const links = new Map();
const pages = [];

const add = (map, u) => {
	if (!u || u.startsWith("data:") || u.startsWith("#")) return;
	const full = u.startsWith("http") ? u : origin + u;
	map.set(full, (map.get(full) ?? 0) + 1);
};
const isInternal = (u) => u.startsWith(siteBase) || u.startsWith(origin + siteBase);

function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			walk(p);
		} else if (e.name.endsWith(".html")) {
			const rel = path.relative(dist, p).split(path.sep).join("/");
			const pageUrl = rel === "index.html" ? siteBase : `${siteBase}${rel.replace(/index\.html$/, "")}`;
			pages.push(origin + pageUrl);
			const html = fs.readFileSync(p, "utf8");
			for (const m of html.matchAll(/<img\s[^>]*src="([^"]+)"/gi)) add(images, m[1]);
			for (const m of html.matchAll(/<source\s[^>]*srcset="([^"]+)"/gi))
				add(images, m[1].split(",")[0].trim());
			for (const m of html.matchAll(/<script\s[^>]*src="([^"]+)"/gi)) add(assets, m[1]);
			for (const m of html.matchAll(/<link\s[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi))
				add(assets, m[1]);
			for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
				const u = m[1].split("#")[0];
				if (u && isInternal(u)) add(links, u);
			}
		}
	}
}
walk(dist);

// Feeds, sitemap and search index are not linked from every page.
for (const p of ["rss.xml", "sitemap-index.xml", "robots.txt", "pagefind/pagefind.js"])
	add(assets, siteBase + p);

const targets = [
	...[...images.keys()].map((u) => ({ u, kind: "image" })),
	...[...assets.keys()].map((u) => ({ u, kind: "asset" })),
	...[...links.keys()].map((u) => ({ u, kind: "link" })),
	...pages.map((u) => ({ u, kind: "page" })),
].filter((t, i, arr) => arr.findIndex((x) => x.u === t.u) === i);

const results = [];
let cursor = 0;
await Promise.all(
	Array.from({ length: 20 }, async () => {
		while (cursor < targets.length) {
			const t = targets[cursor++];
			try {
				let res = await fetch(t.u, {
					method: "HEAD",
					signal: AbortSignal.timeout(15000),
					headers: { "User-Agent": "Mozilla/5.0" },
				});
				if ([403, 405, 501].includes(res.status)) {
					res = await fetch(t.u, {
						method: "GET",
						signal: AbortSignal.timeout(15000),
						headers: { "User-Agent": "Mozilla/5.0" },
					});
					await res.body?.cancel();
				}
				results.push({ ...t, status: res.status });
			} catch (e) {
				results.push({ ...t, status: 0, err: e.message });
			}
		}
	}),
);

const bad = results.filter((r) => r.status < 200 || r.status >= 300);
console.log(
	`images=${images.size} assets=${assets.size} links=${links.size} pages=${pages.length} checked=${results.length} bad=${bad.length}`,
);
for (const kind of ["image", "asset", "link", "page"]) {
	const list = bad.filter((b) => b.kind === kind);
	console.log(`-- bad ${kind}: ${list.length}`);
	for (const b of list.slice(0, 20)) console.log(`   ${b.status} ${b.err ?? ""} ${b.u}`);
}
if (bad.length) process.exitCode = 1;
