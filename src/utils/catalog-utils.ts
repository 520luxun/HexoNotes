import type { CollectionEntry } from "astro:content";

export type CatalogPost = CollectionEntry<"posts">;

export type CatalogNode = {
	label: string;
	posts: CatalogPost[];
	children: Map<string, CatalogNode>;
};

// 目录页 = Obsidian 文件夹结构的原样镜像，层级名取 frontmatter 的 path
// （保留库里的原始大小写，例如 Embedded / PCB / Docs / Expand）。
// 注意不能用 slug：Astro 生成的 slug 是小写的。
const segmentsOf = (post: CatalogPost): string[] => {
	const raw = String(post.data.path ?? "").trim();
	if (raw) return raw.split("/").filter(Boolean);
	const parts = String(post.slug).split("/").filter(Boolean);
	return parts.slice(1, -1);
};

/** 把文章列表折叠成「文件夹 → 文章」的树，保持传入顺序（即 order / 时间顺序）。 */
export function buildCatalogTree(posts: CatalogPost[]): CatalogNode {
	const root: CatalogNode = { label: "", posts: [], children: new Map() };
	for (const post of posts) {
		let node = root;
		for (const segment of segmentsOf(post)) {
			let child = node.children.get(segment);
			if (!child) {
				child = { label: segment, posts: [], children: new Map() };
				node.children.set(segment, child);
			}
			node = child;
		}
		node.posts.push(post);
	}
	return root;
}

/** 子分组按中文拼音 / 数字自然序排列，保证 `01-`、`02-` 不会排到 `10-` 后面。 */
export function sortedChildren(node: CatalogNode): CatalogNode[] {
	return [...node.children.values()].sort((a, b) =>
		a.label.localeCompare(b.label, "zh", { numeric: true }),
	);
}

export function countPosts(node: CatalogNode): number {
	return (
		node.posts.length +
		[...node.children.values()].reduce(
			(sum, child) => sum + countPosts(child),
			0,
		)
	);
}

/** 分组图标：按名字猜一个 FA6 solid 图标，猜不到就用文件夹。 */
const ICON_RULES: [RegExp, string][] = [
	[/freertos|rtos|kernel/i, "fa6-solid:gears"],
	[/school|study|课程|考试|王道/i, "fa6-solid:graduation-cap"],
	[/pcb|硬件|hardware|电路/i, "fa6-solid:microchip"],
	[/pid|电机|控制|control/i, "fa6-solid:wave-square"],
	[/ota|boot|固件/i, "fa6-solid:cloud-arrow-up"],
	[/docs|doc|笔记|手册/i, "fa6-solid:book-open"],
	[/misc|随笔|杂谈|其它/i, "fa6-solid:layer-group"],
];

export function iconForLabel(label: string): string {
	return (
		ICON_RULES.find(([pattern]) => pattern.test(label))?.[1] ??
		"fa6-solid:folder-open"
	);
}

const pad = (n: number) => String(n).padStart(2, "0");

export const formatShortDate = (value: Date | string): string => {
	const d = new Date(value);
	return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatFullDate = (value: Date | string): string => {
	const d = new Date(value);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
