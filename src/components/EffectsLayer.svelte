<script lang="ts">
import { onMount } from "svelte";
import type { EffectSettings, SiteStyle } from "../constants/constants";
import { initClickFx } from "../scripts/effects/clickfx";
import { FallingLayer } from "../scripts/effects/falling";
import {
	getEffects,
	getStyle,
	prefersReducedMotion,
} from "../utils/setting-utils";

let canvas: HTMLCanvasElement;
let clickLayer: HTMLDivElement;

onMount(() => {
	const layer = new FallingLayer(canvas);
	let clickCleanup: (() => void) | null = null;
	let effects: EffectSettings = getEffects();

	const startFalling = () => {
		if (effects.falling && !prefersReducedMotion()) {
			layer.start(getStyle());
		} else {
			layer.stop();
		}
	};

	const startClick = () => {
		clickCleanup?.();
		if (effects.click && !prefersReducedMotion()) {
			clickCleanup = initClickFx(clickLayer);
		} else {
			clickCleanup = null;
		}
	};

	startFalling();
	startClick();

	const onEffectsChanged = (e: Event) => {
		effects = (e as CustomEvent<EffectSettings>).detail;
		startFalling();
		startClick();
	};

	const onStyleChanged = (e: Event) => {
		layer.setStyle((e as CustomEvent<SiteStyle>).detail);
	};

	// swup 切换页面时暂停粒子动画，把这一帧让给过渡动画
	const onSwupTransition = (e: Event) => {
		const active = (e as CustomEvent<{ active: boolean }>).detail?.active;
		if (active) layer.pause();
		else layer.resume();
	};

	document.addEventListener("effects-changed", onEffectsChanged);
	document.addEventListener("site-style-changed", onStyleChanged);
	document.addEventListener("swup-transition", onSwupTransition);

	return () => {
		document.removeEventListener("effects-changed", onEffectsChanged);
		document.removeEventListener("site-style-changed", onStyleChanged);
		document.removeEventListener("swup-transition", onSwupTransition);
		layer.destroy();
		clickCleanup?.();
	};
});
</script>

<canvas bind:this={canvas} class="falling-canvas" aria-hidden="true"></canvas>
<div bind:this={clickLayer} class="click-fx-layer" aria-hidden="true"></div>

<style>
	.falling-canvas {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 35;
	}
</style>
