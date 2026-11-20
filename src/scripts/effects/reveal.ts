/* 滚动入场：IntersectionObserver 给 .reveal 元素加 .reveal-visible
   Swup 换页后需要重新调用 initReveal() 观察新内容。 */

import { getEffects, prefersReducedMotion } from "../../utils/setting-utils";

let observer: IntersectionObserver | null = null;

export function initReveal(): void {
	const elements = document.querySelectorAll(".reveal:not(.reveal-visible)");
	if (
		!getEffects().reveal ||
		prefersReducedMotion() ||
		!("IntersectionObserver" in window)
	) {
		// 关闭特效时直接显示，避免内容一直隐藏
		elements.forEach((el) => {
			el.classList.add("reveal-visible");
		});
		return;
	}

	observer?.disconnect();
	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add("reveal-visible");
					observer?.unobserve(entry.target);
				}
			}
		},
		{ rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
	);

	elements.forEach((el) => {
		observer?.observe(el);
	});
}
