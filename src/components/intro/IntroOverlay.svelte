<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { onMount } from "svelte";
import { siteConfig } from "@/config";
import type { SiteStyle } from "../../constants/constants";
import { getStyle, prefersReducedMotion } from "../../utils/setting-utils";

/* 开场动画变体家族：每个风格映射到一种开场形式 */
type IntroVariant = "bocchi" | "eva" | "retro90" | "sakura";

const FAMILY: Record<SiteStyle, IntroVariant> = {
	bocchi: "bocchi",
	eva: "eva",
	retro90: "retro90",
	sakura: "sakura",
	violet: "bocchi",
	shinkai: "bocchi",
	demon: "eva",
};

/* 各开场形式时长（ms），其中最后 LEAVE_MS 是揭幕转场 */
const DURATION: Record<IntroVariant, number> = {
	bocchi: 2500,
	eva: 3400,
	retro90: 2900,
	sakura: 3000,
};
const LEAVE_MS = 620;
const SKIP_MS = 380;

/* 启动序列文案：EVA 系统启动 / 鬼灭呼吸法 */
const BOOT_LINES: Record<string, string[]> = {
	eva: [
		"> NERV OS v3.31 — BOOT SEQUENCE",
		"> MAGI LINK: CASPER / MELCHIOR / BALTHASAR ... OK",
		"> PATTERN SCAN ... BLUE TYPE: NONE DETECTED",
		"> A.T. FIELD ... ACTIVE",
		"> ALL SYSTEMS ... GREEN",
	],
	demon: [
		"> 全集中 · 呼吸法 — 起動",
		"> 日輪刀 鍛冶状態 ... 完了",
		"> 藤花の香り ... 検知なし",
		"> 鬼の反応 ... 探知不能",
		"> すべての呼吸 ... 開放",
	],
};

/* 系统框与进度标签（启动序列家族内按风格切换） */
const BOOT_BOXES: Record<string, string[]> = {
	eva: ["CASPER·01", "MELCHIOR·02", "BALTHASAR·03"],
	demon: ["水の呼吸·壱ノ型", "炎の呼吸·弐ノ型", "雷の呼吸·参ノ型"],
};
const BOOT_LABEL: Record<string, string> = {
	eva: "SYNC RATIO",
	demon: "呼吸率",
};

/* 柔幕家族的漂浮字符（按风格切换：音符 / 星光 / 钢笔与星） */
const FLOAT_GLYPHS: Record<string, string[]> = {
	bocchi: ["♪", "♫", "♩", "♪", "♬"],
	violet: ["✦", "✎", "✧", "✦", "❈"],
	shinkai: ["✦", "☆", "✧", "✦", "☆"],
};

const NOTES = [
	{ left: "8%", delay: "0.35s", dur: "1.9s", size: "1.3rem" },
	{ left: "22%", delay: "0.8s", dur: "2.1s", size: "1.1rem" },
	{ left: "71%", delay: "0.5s", dur: "2.0s", size: "1.2rem" },
	{ left: "84%", delay: "1.1s", dur: "1.8s", size: "1.4rem" },
	{ left: "52%", delay: "1.4s", dur: "1.9s", size: "1.0rem" },
];

let visible = $state(false);
let leaving = $state(false);
let variant = $state<IntroVariant>("bocchi");
let style = $state<SiteStyle>("bocchi");
let syncRatio = $state(0);
let vhsTime = $state("07:41:00.00");
let timers: number[] = [];
let raf = 0;
let vhsInterval = 0;

function schedule(fn: () => void, ms: number): void {
	timers.push(window.setTimeout(fn, ms));
}

function finish(): void {
	visible = false;
	sessionStorage.setItem("intro-played", "1");
	document.documentElement.classList.remove("intro-playing");
}

function startLeave(): void {
	if (leaving) return;
	leaving = true;
	// 幕布开始掀起时就放行页面入场动画
	document.documentElement.classList.remove("intro-playing");
	cancelAnimationFrame(raf);
	clearInterval(vhsInterval);
	schedule(finish, LEAVE_MS + 80);
}

function skip(): void {
	if (!visible || leaving) return;
	// 取消原时间线，立即进入揭幕转场
	timers.forEach((t) => {
		clearTimeout(t);
	});
	timers = [];
	startLeave();
}

function startEvaTicker(duration: number): void {
	const start = performance.now();
	const tick = (now: number) => {
		const t = Math.min((now - start) / duration, 1);
		const eased = 1 - (1 - t) ** 3;
		syncRatio = eased * 89.3;
		if (t < 1 && !leaving) {
			raf = requestAnimationFrame(tick);
		}
	};
	raf = requestAnimationFrame(tick);
}

function startVhsTicker(): void {
	let frame = 0;
	const baseSeconds = 7 * 3600 + 41 * 60;
	vhsInterval = window.setInterval(() => {
		frame += 7;
		const s = Math.floor(frame / 30) + 14;
		const ff = frame % 30;
		const hh = Math.floor((baseSeconds + s) / 3600) % 24;
		const mm = Math.floor(((baseSeconds + s) % 3600) / 60);
		const ss = (baseSeconds + s) % 60;
		vhsTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ff).padStart(2, "0")}`;
	}, 90);
}

function petalStyle(i: number): string {
	const left = (i * 7.4 + (i % 3) * 3.1) % 96;
	const delay = (i * 0.22).toFixed(2);
	const dur = (2.1 + (i % 4) * 0.45).toFixed(2);
	const scale = 0.7 + ((i * 13) % 10) / 22;
	return `left: ${left}%; animation-delay: ${delay}s; animation-duration: ${dur}s; transform: scale(${scale.toFixed(2)});`;
}

onMount(() => {
	if (sessionStorage.getItem("intro-played") || prefersReducedMotion()) {
		return;
	}
	style = getStyle();
	variant = FAMILY[style];
	visible = true;
	document.documentElement.classList.add("intro-playing");

	const total = DURATION[variant];
	schedule(startLeave, total - LEAVE_MS);

	if (variant === "eva") {
		startEvaTicker(total - LEAVE_MS - 300);
	} else if (variant === "retro90") {
		startVhsTicker();
	}

	const onSkip = () => skip();
	window.addEventListener("pointerdown", onSkip);
	window.addEventListener("keydown", onSkip);
	window.addEventListener("wheel", onSkip, { passive: true });

	return () => {
		window.removeEventListener("pointerdown", onSkip);
		window.removeEventListener("keydown", onSkip);
		window.removeEventListener("wheel", onSkip);
		timers.forEach((t) => {
			clearTimeout(t);
		});
		cancelAnimationFrame(raf);
		clearInterval(vhsInterval);
		document.documentElement.classList.remove("intro-playing");
	};
});
</script>

{#if visible}
	<div
		class="intro-overlay {variant}"
		class:leaving
		role="presentation"
		aria-hidden="true"
	>
		{#if variant === "eva"}
			<div class="eva-wrap">
				<div class="eva-lines">
					{#each BOOT_LINES[style] ?? BOOT_LINES.eva as line, i}
						<div class="eva-line" style={`animation-delay: ${260 + i * 250}ms`}>
							{line}
						</div>
					{/each}
				</div>
				<div class="eva-magi">
					<div class="magi-row">
						<div class="magi-box" style="animation-delay: 1050ms"
							>{(BOOT_BOXES[style] ?? BOOT_BOXES.eva)[0]}</div
						>
						<div class="magi-box" style="animation-delay: 1300ms"
							>{(BOOT_BOXES[style] ?? BOOT_BOXES.eva)[1]}</div
						>
					</div>
					<div class="magi-row">
						<div class="magi-box" style="animation-delay: 1550ms"
							>{(BOOT_BOXES[style] ?? BOOT_BOXES.eva)[2]}</div
						>
					</div>
				</div>
				<div class="eva-bottom">
					<div class="eva-bar">
						<div class="eva-bar-fill" style={`width: ${syncRatio / 0.893}%`}></div>
					</div>
					<div class="eva-sync"
						>{BOOT_LABEL[style] ?? "SYNC RATIO"} {syncRatio.toFixed(1).padStart(5, "0")}%</div
					>
				</div>
				<div class="intro-title eva-title">{siteConfig.title}</div>
			</div>
		{:else if variant === "retro90"}
			<div class="vhs-wrap">
				<div class="vhs-noise"></div>
				<div class="vhs-hud">
					<span class="vhs-play">▶ PLAY</span>
					<span class="vhs-time">PM {vhsTime}</span>
				</div>
				<div class="intro-title vhs-title">{siteConfig.title}</div>
				<div class="vhs-sub">{siteConfig.subtitle}</div>
			</div>
		{:else if variant === "bocchi"}
			<div class="bocchi-wrap">
				{#each NOTES as n, i}
					<span
						class="bocchi-note"
						style={`left: ${n.left}; animation-delay: ${n.delay}; animation-duration: ${n.dur}; font-size: ${n.size};`}>{(FLOAT_GLYPHS[style] ?? FLOAT_GLYPHS.bocchi)[i] ?? "♪"}</span
					>
				{/each}
				<div class="intro-title bocchi-title">{siteConfig.title}</div>
				<div class="bocchi-sub">{siteConfig.subtitle}</div>
			</div>
		{:else}
			<div class="sakura-wrap">
				{#each Array.from({ length: 14 }) as _, i}
					<span class="sakura-petal" style={petalStyle(i)}></span>
				{/each}
				<div class="intro-title sakura-title">{siteConfig.title}</div>
				<div class="sakura-sub">{siteConfig.subtitle}</div>
			</div>
		{/if}

		<div class="skip-hint">{i18n(I18nKey.skipIntro)}</div>
	</div>
{/if}

<style>
	.intro-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		overflow: hidden;
		cursor: pointer;
	}
	.intro-overlay.leaving {
		pointer-events: none;
	}

	.intro-title {
		font-weight: 800;
		font-size: clamp(2rem, 6vw, 3.5rem);
		letter-spacing: 0.12em;
		animation: title-in 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) 0.3s backwards;
	}
	@keyframes title-in {
		from {
			opacity: 0;
			transform: translateY(1.2rem) scale(0.96);
			filter: blur(6px);
		}
		to {
			opacity: 1;
			transform: none;
			filter: none;
		}
	}

	.skip-hint {
		position: absolute;
		right: 1.25rem;
		bottom: 1rem;
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.55);
		animation: hint-in 0.6s ease 1s backwards;
	}
	@keyframes hint-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* ============ EVA：黑底荧光绿启动序列（颜色可按风格覆盖） ============ */
	.intro-overlay.eva {
		--intro-bg: #04060a;
		--intro-fg: oklch(0.86 0.19 152);
		background: var(--intro-bg);
	}
	.eva-wrap {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.6rem;
		font-family: ui-monospace, "JetBrains Mono Variable", Consolas, monospace;
		color: var(--intro-fg);
	}
	.eva-lines {
		width: min(86%, 34rem);
		min-height: 8.5em;
		font-size: 0.8rem;
		line-height: 1.7;
	}
	.eva-line {
		opacity: 0;
		text-shadow: 0 0 8px color-mix(in oklab, var(--intro-fg) 75%, transparent);
		animation: line-in 90ms steps(2, end) forwards;
	}
	@keyframes line-in {
		to {
			opacity: 1;
		}
	}
	.eva-magi {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		align-items: center;
	}
	.magi-row {
		display: flex;
		gap: 0.55rem;
	}
	.magi-row:last-child {
		margin-left: 3.6rem;
	}
	.magi-box {
		border: 1px solid color-mix(in oklab, var(--intro-fg) 75%, transparent);
		box-shadow:
			0 0 10px color-mix(in oklab, var(--intro-fg) 35%, transparent),
			inset 0 0 8px color-mix(in oklab, var(--intro-fg) 18%, transparent);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		padding: 0.45rem 0.8rem;
		opacity: 0;
		animation: magi-on 0.35s ease forwards;
	}
	@keyframes magi-on {
		0% {
			opacity: 0;
			transform: scale(0.85);
		}
		60% {
			opacity: 1;
			transform: scale(1.04);
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}
	.eva-bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: min(86%, 22rem);
	}
	.eva-bar {
		width: 100%;
		height: 10px;
		border: 1px solid color-mix(in oklab, var(--intro-fg) 45%, transparent);
		padding: 1px;
	}
	.eva-bar-fill {
		height: 100%;
		background: linear-gradient(
			90deg,
			var(--intro-fg),
			color-mix(in oklab, var(--intro-fg) 75%, transparent)
		);
		box-shadow: 0 0 12px color-mix(in oklab, var(--intro-fg) 80%, transparent);
		transition: width 0.12s linear;
	}
	.eva-sync {
		font-size: 0.85rem;
		letter-spacing: 0.22em;
		text-shadow: 0 0 8px color-mix(in oklab, var(--intro-fg) 70%, transparent);
	}
	.eva-title {
		color: var(--intro-fg);
		font-size: 1.4rem;
		animation-delay: 1.7s;
	}
	.intro-overlay.eva.leaving {
		animation: eva-out 0.5s steps(4, end) forwards;
	}
	@keyframes eva-out {
		0% {
			opacity: 1;
		}
		35% {
			opacity: 1;
			filter: brightness(3.2) saturate(0.4);
		}
		100% {
			opacity: 0;
			filter: brightness(4) saturate(0);
		}
	}

	/* ============ 90年代复古：VHS 录像带播放 ============ */
	.intro-overlay.retro90 {
		background: linear-gradient(180deg, #1b2aa7 0%, #2236c9 55%, #16227f 100%);
	}
	.vhs-wrap {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: #f4f6ff;
	}
	.vhs-noise {
		position: absolute;
		inset: -20%;
		background: repeating-linear-gradient(
			0deg,
			rgba(255, 255, 255, 0.05) 0 2px,
			transparent 2px 4px
		);
		animation: vhs-shift 0.35s steps(3, end) infinite;
	}
	@keyframes vhs-shift {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(6px);
		}
	}
	.vhs-hud {
		position: absolute;
		top: 1.5rem;
		left: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-family: ui-monospace, "JetBrains Mono Variable", Consolas, monospace;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.45);
		animation: hud-in 0.4s steps(3, end) 0.15s backwards;
	}
	@keyframes hud-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.vhs-play {
		font-size: 1.6rem;
		font-weight: 800;
		letter-spacing: 0.25em;
	}
	.vhs-time {
		font-size: 0.95rem;
		letter-spacing: 0.12em;
		opacity: 0.85;
	}
	.vhs-title {
		font-family: "DotGothic16", "Zen Maru Gothic", sans-serif;
		color: #ffd23f;
		text-shadow:
			3px 3px 0 rgba(0, 0, 0, 0.4),
			0 0 24px rgba(255, 210, 63, 0.35);
	}
	.vhs-sub {
		font-size: 0.95rem;
		opacity: 0.85;
		letter-spacing: 0.3em;
		animation: title-in 0.9s ease 0.8s backwards;
	}
	.intro-overlay.retro90.leaving {
		animation: vhs-out 0.55s steps(8, end) forwards;
	}
	@keyframes vhs-out {
		0% {
			opacity: 1;
			transform: none;
			filter: none;
		}
		30% {
			opacity: 1;
			transform: skewX(-6deg) translateX(-4%);
			filter: brightness(1.8) contrast(1.4);
		}
		60% {
			transform: skewX(4deg) translateX(3%);
			filter: brightness(1.2);
		}
		100% {
			opacity: 0;
			transform: skewX(-8deg) translateX(-6%);
			filter: brightness(2.4) blur(4px);
		}
	}

	/* ============ 波奇/轻音：柔和幕布 + 漂浮字符（配色可按风格覆盖） ============ */
	.intro-overlay.bocchi {
		--intro-note: rgba(255, 255, 255, 0.85);
		--intro-bg: linear-gradient(
			155deg,
			oklch(0.32 0.08 280) 0%,
			oklch(0.42 0.12 300) 45%,
			oklch(0.62 0.14 330) 100%
		);
		background: var(--intro-bg);
		transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
	}
	.intro-overlay.bocchi.leaving {
		transform: translateY(-100%);
	}
	.bocchi-wrap {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		color: #fff;
	}
	.bocchi-title {
		text-shadow:
			0 2px 18px oklch(0.5 0.15 300 / 0.6),
			0 1px 2px rgba(0, 0, 0, 0.25);
	}
	.bocchi-sub {
		font-size: 1rem;
		letter-spacing: 0.35em;
		opacity: 0.9;
		animation: title-in 0.9s ease 0.9s backwards;
	}
	.bocchi-note {
		position: absolute;
		bottom: -8%;
		color: var(--intro-note);
		animation: note-float 2s ease-in infinite;
	}
	@keyframes note-float {
		0% {
			transform: translateY(0) rotate(-8deg);
			opacity: 0;
		}
		18% {
			opacity: 0.9;
		}
		85% {
			opacity: 0.5;
		}
		100% {
			transform: translateY(-108vh) rotate(14deg);
			opacity: 0;
		}
	}

	/* ============ 樱花粉：花瓣雨 + 光斑 ============ */
	.intro-overlay.sakura {
		background: linear-gradient(
			160deg,
			oklch(0.9 0.06 330) 0%,
			oklch(0.94 0.045 340) 50%,
			oklch(0.88 0.06 300) 100%
		);
	}
	.intro-overlay.sakura.leaving {
		animation: sakura-iris 0.58s ease-in forwards;
	}
	@keyframes sakura-iris {
		0% {
			clip-path: circle(142% at 50% 42%);
			opacity: 1;
		}
		100% {
			clip-path: circle(0% at 50% 42%);
			opacity: 1;
		}
	}
	.sakura-wrap {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		color: oklch(0.42 0.12 340);
	}
	.sakura-title {
		color: oklch(0.5 0.16 345);
		text-shadow: 0 2px 16px oklch(1 0 0 / 0.75);
	}
	.sakura-sub {
		font-size: 1rem;
		letter-spacing: 0.35em;
		color: oklch(0.55 0.1 340);
		animation: title-in 0.9s ease 0.9s backwards;
	}
	.sakura-petal {
		position: absolute;
		top: -6%;
		width: 12px;
		height: 16px;
		background: oklch(0.9 0.07 350);
		border-radius: 12px 0 12px 0;
		opacity: 0.9;
		box-shadow: 0 0 6px oklch(0.95 0.04 350 / 0.8);
		animation-name: petal-fall;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes petal-fall {
		0% {
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		50% {
			transform: translateY(52vh) translateX(5vw) rotate(160deg);
		}
		100% {
			transform: translateY(108vh) translateX(1vw) rotate(300deg);
		}
	}
</style>
