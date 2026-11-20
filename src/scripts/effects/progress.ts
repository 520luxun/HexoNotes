/* 阅读进度条：顶部 3px 细线随页面滚动填充 */

let onScroll: (() => void) | null = null;

export function setProgressBar(enabled: boolean): void {
	let bar = document.getElementById("reading-progress");
	if (!enabled) {
		if (bar) bar.style.display = "none";
		if (onScroll) {
			window.removeEventListener("scroll", onScroll);
			onScroll = null;
		}
		return;
	}

	if (!bar) {
		bar = document.createElement("div");
		bar.id = "reading-progress";
		document.body.appendChild(bar);
	}
	bar.style.display = "";

	if (onScroll) {
		window.removeEventListener("scroll", onScroll);
	}
	const barEl = bar;
	let raf = 0;
	// 用 transform: scaleX 代替 width，并把多次 scroll 合并到一帧里，
	// 避免滚动时反复触发布局。
	const paint = () => {
		raf = 0;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
		barEl.style.transform = `scaleX(${pct.toFixed(4)})`;
	};
	const update = () => {
		if (!raf) raf = requestAnimationFrame(paint);
	};
	onScroll = update;
	window.addEventListener("scroll", onScroll, { passive: true });
	paint();
}
