/* 鼠标点击特效：点击处绽放涟漪 + 风格专属图形（爱心/音符/数据符号/花瓣） */

import type { SiteStyle } from "../../constants/constants";
import { getStyle } from "../../utils/setting-utils";

const STYLE_GLYPHS: Record<SiteStyle, string[]> = {
	bocchi: ["♥", "♪", "♥"],
	eva: ["◆", "▲", "◆"],
	retro90: ["♥", "✦", "♥"],
	sakura: ["❀", "♥", "❀"],
	violet: ["✦", "❈", "✦"],
	shinkai: ["✦", "☆", "✧"],
	demon: ["❁", "✦", "❁"],
};

const STYLE_COLORS: Record<SiteStyle, string> = {
	bocchi: "",
	eva: "#39ff9b",
	retro90: "#ffb02e",
	sakura: "#ff7fb2",
	violet: "#d9b45c",
	shinkai: "",
	demon: "#ff7b5e",
};

const MAX_NODES = 90;

export function initClickFx(layer: HTMLElement): () => void {
	const onPointerDown = (e: PointerEvent) => {
		if (e.button !== 0) return;
		if (layer.childElementCount > MAX_NODES) return;

		const style = getStyle();
		const glyphs = STYLE_GLYPHS[style] ?? STYLE_GLYPHS.bocchi;
		const color = STYLE_COLORS[style];
		const { clientX: x, clientY: y } = e;

		// 涟漪
		const ring = document.createElement("span");
		ring.className = "click-fx click-fx-ring";
		ring.style.left = `${x}px`;
		ring.style.top = `${y}px`;
		if (color) ring.style.borderColor = color;
		layer.appendChild(ring);
		window.setTimeout(() => ring.remove(), 550);

		// 迸发的图形
		const count = 6 + Math.floor(Math.random() * 3);
		for (let i = 0; i < count; i++) {
			const el = document.createElement("span");
			el.className = "click-fx click-fx-icon";
			el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
			el.style.left = `${x}px`;
			el.style.top = `${y}px`;
			const angle = (Math.PI * 2 * i) / count + rand(-0.3, 0.3);
			const dist = rand(26, 58);
			el.style.setProperty("--fx-x", `${Math.cos(angle) * dist}px`);
			el.style.setProperty(
				"--fx-y",
				`${Math.sin(angle) * dist - rand(8, 26)}px`,
			);
			el.style.setProperty("--fx-r", `${rand(-40, 40)}deg`);
			el.style.fontSize = `${rand(0.7, 1.15)}rem`;
			if (color) el.style.color = color;
			layer.appendChild(el);
			window.setTimeout(() => el.remove(), 800);
		}
	};

	document.addEventListener("pointerdown", onPointerDown);
	return () => {
		document.removeEventListener("pointerdown", onPointerDown);
		layer.textContent = "";
	};
}

function rand(a: number, b: number): number {
	return a + Math.random() * (b - a);
}
