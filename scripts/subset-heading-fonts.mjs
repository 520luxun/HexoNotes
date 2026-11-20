import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// 把「标题用」中日文字体裁剪成只包含站点上真实用到的字符。
// 用法：pnpm fonts:subset   （需先 pnpm build，脚本会读 dist 里的标题文字）
// 依赖：pip install fonttools brotli
//
// 只影响 h1~h6 的字体（--font-heading），正文用系统字体。
// 新增笔记后如果标题里出现新字，重跑一次即可；漏掉的字会自动回落到系统字体。

const DIST = "dist";
const OUT_DIR = "src/assets/fonts";
const FONTS = [
	{
		src: "node_modules/@fontsource/zen-maru-gothic/files/zen-maru-gothic-japanese-400-normal.woff2",
		out: "zenmaru-400.woff2",
	},
	{
		src: "node_modules/@fontsource/zen-maru-gothic/files/zen-maru-gothic-japanese-700-normal.woff2",
		out: "zenmaru-700.woff2",
	},
	{
		src: "node_modules/@fontsource/dotgothic16/files/dotgothic16-japanese-400-normal.woff2",
		out: "dotgothic-400.woff2",
	},
];

if (!fs.existsSync(DIST)) {
	console.error("找不到 dist/，先跑一次 pnpm build");
	process.exit(1);
}

const chars = new Set();
const walk = (dir) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(p);
			continue;
		}
		if (!entry.name.endsWith(".html")) continue;
		const html = fs.readFileSync(p, "utf8");
		const re = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g;
		let m;
		while ((m = re.exec(html))) {
			const text = m[1].replace(/<[^>]+>/g, "");
			for (const ch of text) if (ch.trim()) chars.add(ch);
		}
	}
};
walk(DIST);

// 基础字符集：ASCII + 常用中英标点，避免英文标题/数字缺字
for (let i = 32; i < 127; i++) chars.add(String.fromCharCode(i));
for (const ch of "（）【】《》，。、；：？！“”‘’—…·×÷±≈≤≥°①②③④⑤⑥⑦⑧⑨⑩")
	chars.add(ch);

const textFile = path.join(OUT_DIR, ".chars.txt");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(textFile, [...chars].join(""), "utf8");
console.log(`字符集：${chars.size} 个`);

for (const { src, out } of FONTS) {
	if (!fs.existsSync(src)) {
		console.warn(`跳过（源文件不存在）：${src}`);
		continue;
	}
	const target = path.join(OUT_DIR, out);
	execFileSync(
		"python",
		[
			"-m",
			"fontTools.subset",
			src,
			`--text-file=${textFile}`,
			"--flavor=woff2",
			`--output-file=${target}`,
			"--layout-features=*",
			"--no-hinting",
			"--desubroutinize",
		],
		{ stdio: "inherit" },
	);
	const before = fs.statSync(src).size / 1024;
	const after = fs.statSync(target).size / 1024;
	console.log(`${out}: ${before.toFixed(0)}KB -> ${after.toFixed(0)}KB`);
}

fs.unlinkSync(textFile);
