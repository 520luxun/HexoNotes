export const PAGE_SIZE = 8;

export const LIGHT_MODE = "light",
	DARK_MODE = "dark",
	AUTO_MODE = "auto";
export const DEFAULT_THEME = AUTO_MODE;

// Banner height unit: vh
export const BANNER_HEIGHT = 35;
export const BANNER_HEIGHT_EXTEND = 30;
export const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;

// The height the main panel overlaps the banner, unit: rem
export const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT = 3.5;

// Page width: rem
export const PAGE_WIDTH = 75;

/* ===== Site style (anime style switcher) ===== */
export const STYLE_BOCCHI = "bocchi";
export const STYLE_EVA = "eva";
export const STYLE_RETRO90 = "retro90";
export const STYLE_SAKURA = "sakura";
export const STYLE_VIOLET = "violet";
export const STYLE_SHINKAI = "shinkai";
export const STYLE_DEMON = "demon";

export const STYLES = [
	STYLE_BOCCHI,
	STYLE_EVA,
	STYLE_RETRO90,
	STYLE_SAKURA,
	STYLE_VIOLET,
	STYLE_SHINKAI,
	STYLE_DEMON,
] as const;
export type SiteStyle = (typeof STYLES)[number];

export const DEFAULT_STYLE: SiteStyle = STYLE_BOCCHI;

// The hue each style resets to when activated (the hue slider can still override it).
export const STYLE_DEFAULT_HUE: Record<SiteStyle, number> = {
	[STYLE_BOCCHI]: 250,
	[STYLE_EVA]: 285,
	[STYLE_RETRO90]: 35,
	[STYLE_SAKURA]: 330,
	[STYLE_VIOLET]: 215,
	[STYLE_SHINKAI]: 205,
	[STYLE_DEMON]: 230,
};

/* ===== Dynamic effect toggles ===== */
export interface EffectSettings {
	falling: boolean;
	click: boolean;
	reveal: boolean;
	progress: boolean;
}

export const DEFAULT_EFFECTS: EffectSettings = {
	falling: true,
	click: true,
	reveal: true,
	progress: true,
};
