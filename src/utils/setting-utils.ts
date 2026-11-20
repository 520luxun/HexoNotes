import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_EFFECTS,
	DEFAULT_STYLE,
	DEFAULT_THEME,
	type EffectSettings,
	LIGHT_MODE,
	type SiteStyle,
	STYLE_DEFAULT_HUE,
	STYLES,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

/**
 * 带圆形扩散过渡的亮暗切换（View Transitions API，渐进增强：
 * 不支持的浏览器自动退化为即时切换）。
 */
export function setThemeWithTransition(
	theme: LIGHT_DARK_MODE,
	origin?: { x: number; y: number },
): void {
	if (
		prefersReducedMotion() ||
		typeof document.startViewTransition !== "function"
	) {
		setTheme(theme);
		return;
	}
	const transition = document.startViewTransition(() => setTheme(theme));
	const { x, y } = origin ?? { x: window.innerWidth - 56, y: 40 };
	const radius = Math.hypot(
		Math.max(x, window.innerWidth - x),
		Math.max(y, window.innerHeight - y),
	);
	transition.ready.then(() => {
		document.documentElement.animate(
			{
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${radius}px at ${x}px ${y}px)`,
				],
			},
			{
				duration: 480,
				easing: "ease-in-out",
				pseudoElement: "::view-transition-new(root)",
			},
		);
	});
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}

/* ===== Site style ===== */
export function getStyle(): SiteStyle {
	const stored = localStorage.getItem("site-style");
	if (stored && (STYLES as readonly string[]).includes(stored)) {
		return stored as SiteStyle;
	}
	return DEFAULT_STYLE;
}

function applyStyleToDocument(style: SiteStyle) {
	document.documentElement.dataset.style = style;
}

export function setStyle(style: SiteStyle, options?: { resetHue?: boolean }) {
	localStorage.setItem("site-style", style);
	applyStyleToDocument(style);
	if (options?.resetHue !== false) {
		setHue(STYLE_DEFAULT_HUE[style]);
	}
	document.dispatchEvent(
		new CustomEvent("site-style-changed", { detail: style }),
	);
}

/* ===== Dynamic effect toggles ===== */
export function getEffects(): EffectSettings {
	try {
		const raw = localStorage.getItem("effects");
		if (!raw) {
			return { ...DEFAULT_EFFECTS };
		}
		const parsed = JSON.parse(raw) as Partial<EffectSettings>;
		return {
			falling: parsed.falling ?? DEFAULT_EFFECTS.falling,
			click: parsed.click ?? DEFAULT_EFFECTS.click,
			reveal: parsed.reveal ?? DEFAULT_EFFECTS.reveal,
			progress: parsed.progress ?? DEFAULT_EFFECTS.progress,
		};
	} catch {
		return { ...DEFAULT_EFFECTS };
	}
}

export function setEffects(effects: EffectSettings): void {
	localStorage.setItem("effects", JSON.stringify(effects));
	document.dispatchEvent(
		new CustomEvent("effects-changed", { detail: effects }),
	);
}
