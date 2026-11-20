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
	const update = () => {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
		barEl.style.width = `${(pct * 100).toFixed(2)}%`;
	};
	onScroll = update;
	window.addEventListener("scroll", onScroll, { passive: true });
	update();
}
