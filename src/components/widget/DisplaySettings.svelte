<script lang="ts">
import {
	type EffectSettings,
	type SiteStyle,
	STYLE_BOCCHI,
	STYLE_DEFAULT_HUE,
	STYLE_DEMON,
	STYLE_EVA,
	STYLE_RETRO90,
	STYLE_SAKURA,
	STYLE_SHINKAI,
	STYLE_VIOLET,
} from "@constants/constants";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	getEffects,
	getHue,
	getStyle,
	setEffects,
	setHue,
	setStyle,
} from "@utils/setting-utils";

interface StyleCard {
	id: SiteStyle;
	key: I18nKey;
	swatch: string;
}

const STYLE_CARDS: StyleCard[] = [
	{
		id: STYLE_BOCCHI,
		key: I18nKey.styleBocchi,
		swatch: "linear-gradient(135deg, #8b7ff5 0%, #f0abfc 100%)",
	},
	{
		id: STYLE_EVA,
		key: I18nKey.styleEva,
		swatch: "linear-gradient(135deg, #17102e 0%, #39ff9b 55%, #ff9e2c 100%)",
	},
	{
		id: STYLE_RETRO90,
		key: I18nKey.styleRetro,
		swatch: "linear-gradient(135deg, #ffd23f 0%, #ff8c5a 55%, #4ea9c9 100%)",
	},
	{
		id: STYLE_SAKURA,
		key: I18nKey.styleSakura,
		swatch: "linear-gradient(135deg, #ff9ec7 0%, #ffe3ee 55%, #c9b6f5 100%)",
	},
	{
		id: STYLE_VIOLET,
		key: I18nKey.styleViolet,
		swatch: "linear-gradient(135deg, #3d5a8f 0%, #7fa3cf 55%, #d9b45c 100%)",
	},
	{
		id: STYLE_SHINKAI,
		key: I18nKey.styleShinkai,
		swatch: "linear-gradient(135deg, #0e2a52 0%, #1e5f9e 55%, #f2a65a 100%)",
	},
	{
		id: STYLE_DEMON,
		key: I18nKey.styleDemon,
		swatch: "linear-gradient(135deg, #16182f 0%, #8f7fd4 55%, #c8453f 100%)",
	},
];

const EFFECT_ROWS: { key: keyof EffectSettings; label: I18nKey }[] = [
	{ key: "falling", label: I18nKey.effectFalling },
	{ key: "click", label: I18nKey.effectClick },
	{ key: "reveal", label: I18nKey.effectReveal },
	{ key: "progress", label: I18nKey.effectProgress },
];

let hue = $state(getHue());
let style = $state(getStyle());
let effects = $state(getEffects());

$effect(() => {
	if (hue || hue === 0) {
		setHue(hue);
	}
});

function resetHue() {
	hue = STYLE_DEFAULT_HUE[style];
}

function pickStyle(id: SiteStyle) {
	style = id;
	setStyle(id);
	hue = STYLE_DEFAULT_HUE[id];
}

function toggleEffect(key: keyof EffectSettings) {
	effects = { ...effects, [key]: !effects[key] };
	setEffects(effects);
}
let { class: className = "" } = $props();
</script>

<div
	id="display-setting"
	class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4 max-h-[calc(100vh-7rem)] overflow-y-auto {className}"
>
	<!-- 站点风格 -->
	<div
		class="flex flex-row gap-2 mb-2 items-center justify-between relative ml-3
		font-bold text-lg text-neutral-900 dark:text-neutral-100 transition
		before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
		before:absolute before:-left-3 before:top-[0.42rem]"
	>
		{i18n(I18nKey.siteStyle)}
	</div>
	<div class="grid grid-cols-2 gap-2 mb-1">
		{#each STYLE_CARDS as card (card.id)}
			<button
				aria-label={i18n(card.key)}
				class="style-card"
				class:style-card-current={style === card.id}
				onclick={() => pickStyle(card.id)}
			>
				<div class="style-swatch" style={`background: ${card.swatch}`}></div>
				<div class="style-name">{i18n(card.key)}</div>
			</button>
		{/each}
	</div>

	<!-- 主题色 -->
	<div
		class="flex flex-row gap-2 mt-3 mb-2 items-center justify-between relative ml-3
		font-bold text-lg text-neutral-900 dark:text-neutral-100 transition
		before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
		before:absolute before:-left-3 before:top-[0.42rem]"
	>
		{i18n(I18nKey.themeColor)}
		<button
			aria-label="Reset to Default"
			class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
			onclick={resetHue}
		>
			<div class="text-[var(--btn-content)]">
				<Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"
				></Icon>
			</div>
		</button>
	</div>
	<div
		class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none"
	>
		<input
			aria-label={i18n(I18nKey.themeColor)}
			type="range"
			min="0"
			max="360"
			bind:value={hue}
			class="slider"
			id="colorSlider"
			step="5"
			style="width: 100%"
		/>
	</div>

	<!-- 动态特效 -->
	<div
		class="flex flex-row gap-2 mt-3 mb-2 items-center justify-between relative ml-3
		font-bold text-lg text-neutral-900 dark:text-neutral-100 transition
		before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
		before:absolute before:-left-3 before:top-[0.42rem]"
	>
		{i18n(I18nKey.effectTitle)}
	</div>
	<div class="flex flex-col gap-1">
		{#each EFFECT_ROWS as row (row.key)}
			<button
				class="effect-row"
				role="switch"
				aria-checked={effects[row.key]}
				onclick={() => toggleEffect(row.key)}
			>
				<span class="effect-label">{i18n(row.label)}</span>
				<span class="fx-switch" class:fx-switch-on={effects[row.key]}>
					<span class="fx-knob"></span>
				</span>
			</button>
		{/each}
	</div>
</div>

<style lang="stylus">
	#display-setting
		input[type="range"]
			-webkit-appearance none
			height 1.5rem
			background-image var(--color-selection-bar)
			transition background-image 0.15s ease-in-out

			/* Input Thumb */
			&::-webkit-slider-thumb
				-webkit-appearance none
				height 1rem
				width 0.5rem
				border-radius 0.125rem
				background rgba(255, 255, 255, 0.7)
				box-shadow none
				&:hover
					background rgba(255, 255, 255, 0.8)
				&:active
					background rgba(255, 255, 255, 0.6)

			&::-moz-range-thumb
				-webkit-appearance none
				height 1rem
				width 0.5rem
				border-radius 0.125rem
				border-width 0
				background rgba(255, 255, 255, 0.7)
				box-shadow none
				&:hover
					background rgba(255, 255, 255, 0.8)
				&:active
					background rgba(255, 255, 255, 0.6)

			&::-ms-thumb
				-webkit-appearance none
				height 1rem
				width 0.5rem
				border-radius 0.125rem
				background rgba(255, 255, 255, 0.7)
				box-shadow none
				&:hover
					background rgba(255, 255, 255, 0.8)
				&:active
					background rgba(255, 255, 255, 0.6)

	.style-card
		display flex
		flex-direction column
		align-items center
		gap 0.4rem
		padding 0.6rem 0.5rem 0.5rem
		border-radius 0.75rem
		background var(--btn-regular-bg)
		transition transform 0.2s cubic-bezier(0.34, 1.3, 0.64, 1), background-color 0.2s, box-shadow 0.2s
		&:hover
			transform translateY(-2px)
			background var(--btn-plain-bg-hover)
		&:active
			transform scale(0.96)

	.style-card-current
		box-shadow 0 0 0 2px var(--primary), 0 6px 16px -6px rgba(0, 0, 0, 0.3)

	.style-swatch
		width 100%
		height 2.4rem
		border-radius 0.5rem
		box-shadow inset 0 0 0 1px rgba(255, 255, 255, 0.18)

	.style-name
		font-size 0.8rem
		font-weight 700
		color var(--btn-content)

	.effect-row
		display flex
		align-items center
		justify-content space-between
		width 100%
		height 2.25rem
		padding 0 0.5rem 0 0.75rem
		border-radius 0.5rem
		transition background-color 0.15s
		&:hover
			background var(--btn-plain-bg-hover)

	.effect-label
		font-size 0.875rem
		font-weight 500
		color var(--btn-content)

	.fx-switch
		position relative
		width 2.1rem
		height 1.15rem
		border-radius 9999px
		background var(--btn-regular-bg)
		transition background-color 0.2s
		.fx-knob
			position absolute
			top 0.14rem
			left 0.14rem
			width 0.87rem
			height 0.87rem
			border-radius 9999px
			background white
			box-shadow 0 1px 3px rgba(0, 0, 0, 0.25)
			transition transform 0.2s cubic-bezier(0.34, 1.3, 0.64, 1)

	.fx-switch-on
		background var(--primary)
		.fx-knob
			transform translateX(0.95rem)
</style>
