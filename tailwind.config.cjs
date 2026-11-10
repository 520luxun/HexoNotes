/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin");

// Component classes that are referenced via `@apply` in OTHER css files
// (e.g. `@apply link` in markdown.css). Registering them here through a
// plugin guarantees they are always available when Tailwind processes any
// stylesheet, regardless of Vite's CSS compilation order.
// See https://github.com/saicaca/fuwari/issues/766
const sharedComponents = plugin(function ({ addComponents }) {
	addComponents({
		".expand-animation": {
			"@apply relative z-0 active:bg-none": {},
			"&::before": {
				"@apply ease-out transition absolute rounded-[inherit] inset-0 scale-[0.85] -z-10": {},
			},
			"&:hover::before": {
				"@apply scale-100 bg-[var(--btn-plain-bg-hover)]": {},
			},
			"&:active::before": {
				"@apply bg-[var(--btn-plain-bg-active)]": {},
			},
		},
		".link": {
			"@apply transition rounded-md p-1 -m-1 expand-animation": {},
		},
		".link-lg": {
			"@apply transition rounded-md p-1.5 -m-1.5 expand-animation": {},
		},
		".btn-regular-dark": {
			"@apply flex items-center justify-center bg-[oklch(0.45_0.01_var(--hue))] hover:bg-[oklch(0.50_0.01_var(--hue))] active:bg-[oklch(0.55_0.01_var(--hue))] dark:bg-[oklch(0.30_0.02_var(--hue))] dark:hover:bg-[oklch(0.35_0.03_var(--hue))] dark:active:bg-[oklch(0.40_0.03_var(--hue))]": {},
			"&.success": {
				"@apply bg-[oklch(0.75_0.14_var(--hue))] dark:bg-[oklch(0.75_0.14_var(--hue))]": {},
			},
		},
	});
});

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), sharedComponents],
}
