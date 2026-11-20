/* 飘落特效层：canvas 粒子，随站点风格切换粒子形态与配色 */

import type { SiteStyle } from "../../constants/constants";

interface Particle {
	x: number;
	y: number;
	vy: number;
	size: number;
	rot: number;
	vr: number;
	phase: number;
	freq: number;
	sway: number;
	alpha: number;
	kind: number;
	color: string;
}

interface Palette {
	colors: string[];
	kinds: number[];
	speed: [number, number];
	drift: number; // 水平整体漂移
}

const PALETTES: Record<SiteStyle, Palette> = {
	bocchi: {
		colors: ["#a78bfa", "#f0abfc", "#ffffff", "#c4b5fd"],
		kinds: [0, 1, 1], // 音符 / 光点
		speed: [0.4, 0.9],
		drift: 0.1,
	},
	eva: {
		colors: ["#39ff9b", "#ff9e2c", "#b18cff", "#39ff9b"],
		kinds: [0, 1], // 数据块 / 加号
		speed: [0.7, 1.5],
		drift: 0.22,
	},
	retro90: {
		colors: ["#ffd23f", "#ff8c5a", "#7be0d0", "#ffffff"],
		kinds: [0, 1], // 四角星 / 圆点
		speed: [0.35, 0.8],
		drift: 0.12,
	},
	sakura: {
		colors: ["#ffc2d9", "#ff9ec7", "#ffe3ee", "#f8a5c2"],
		kinds: [0], // 樱花瓣
		speed: [0.4, 0.85],
		drift: 0.18,
	},
	violet: {
		colors: ["#9db8dc", "#d9b45c", "#e6ddc8", "#7fa3cf"],
		kinds: [0, 1], // 金蓝星光 / 光点
		speed: [0.35, 0.8],
		drift: 0.1,
	},
	shinkai: {
		colors: ["#ffd9a0", "#9ecbff", "#ffffff", "#f2a65a"],
		kinds: [0, 1, 1], // 星光 / 光点
		speed: [0.4, 0.9],
		drift: 0.12,
	},
	demon: {
		colors: ["#b9a8e8", "#8f7fd4", "#ff7b5e", "#c8453f"],
		kinds: [0, 1], // 藤花花瓣 / 火花
		speed: [0.4, 0.85],
		drift: 0.15,
	},
};

function rand(a: number, b: number): number {
	return a + Math.random() * (b - a);
}

export class FallingLayer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private particles: Particle[] = [];
	private raf = 0;
	private running = false;
	private style: SiteStyle = "bocchi";
	private last = 0;
	private time = 0;
	private dpr = 1;
	private onResize = () => this.resize();
	private onVisibility = () => {
		if (document.hidden) {
			this.pauseLoop();
		} else if (this.running) {
			this.resumeLoop();
		}
	};

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("canvas 2d context unavailable");
		}
		this.ctx = ctx;
		this.resize();
	}

	start(style: SiteStyle): void {
		this.stop();
		this.style = style;
		this.running = true;
		this.resize();
		this.seed();
		window.addEventListener("resize", this.onResize);
		document.addEventListener("visibilitychange", this.onVisibility);
		this.last = performance.now();
		this.raf = requestAnimationFrame(this.loop);
	}

	setStyle(style: SiteStyle): void {
		if (!this.running) return;
		this.style = style;
		this.seed();
	}

	stop(): void {
		this.running = false;
		this.pauseLoop();
		window.removeEventListener("resize", this.onResize);
		document.removeEventListener("visibilitychange", this.onVisibility);
	}

	destroy(): void {
		this.stop();
	}

	private pauseLoop(): void {
		if (this.raf) {
			cancelAnimationFrame(this.raf);
			this.raf = 0;
		}
	}

	private resumeLoop(): void {
		if (!this.raf && this.running) {
			this.last = performance.now();
			this.raf = requestAnimationFrame(this.loop);
		}
	}

	private resize(): void {
		this.dpr = Math.min(window.devicePixelRatio || 1, 2);
		this.canvas.width = Math.floor(window.innerWidth * this.dpr);
		this.canvas.height = Math.floor(window.innerHeight * this.dpr);
	}

	private count(): number {
		const w = window.innerWidth;
		const base = Math.min(26, Math.max(8, Math.floor(w / 52)));
		return w < 640 ? Math.floor(base * 0.55) : base;
	}

	private seed(): void {
		const palette = PALETTES[this.style];
		const n = this.count();
		this.particles = Array.from({ length: n }, () => this.spawn(palette, true));
	}

	private spawn(palette: Palette, anywhere = false): Particle {
		const h = window.innerHeight;
		return {
			x: rand(-10, window.innerWidth + 10),
			y: anywhere ? rand(-h * 0.2, h) : rand(-60, -20),
			vy: rand(palette.speed[0], palette.speed[1]) * 60, // px/s
			size: this.style === "sakura" ? rand(7, 13) : rand(5, 11),
			rot: rand(0, Math.PI * 2),
			vr: rand(-1.2, 1.2),
			phase: rand(0, Math.PI * 2),
			freq: rand(0.5, 1.4),
			sway: rand(10, 30),
			alpha: rand(0.35, 0.8),
			kind: palette.kinds[Math.floor(Math.random() * palette.kinds.length)],
			color: palette.colors[Math.floor(Math.random() * palette.colors.length)],
		};
	}

	private loop = (now: number): void => {
		if (!this.running) return;
		const dt = Math.min((now - this.last) / 1000, 0.05);
		this.last = now;
		this.time += dt;
		this.render(dt);
		this.raf = requestAnimationFrame(this.loop);
	};

	private render(dt: number): void {
		const { ctx, canvas } = this;
		const palette = PALETTES[this.style];
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.scale(this.dpr, this.dpr);

		const w = window.innerWidth;
		const h = window.innerHeight;

		for (let i = 0; i < this.particles.length; i++) {
			const p = this.particles[i];
			p.y += p.vy * dt;
			p.rot += p.vr * dt;
			const swayX = Math.sin(this.time * p.freq + p.phase) * p.sway * dt;
			p.x += swayX + palette.drift * p.vy * dt;

			if (p.y > h + 24 || p.x < -40 || p.x > w + 40) {
				this.particles[i] = this.spawn(palette);
				continue;
			}

			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.globalAlpha = p.alpha;
			this.draw(p);
			ctx.restore();
		}
		ctx.restore();
	}

	private draw(p: Particle): void {
		const { ctx } = this;
		const s = this.style;
		if (s === "bocchi") {
			if (p.kind === 0) {
				// 音符
				ctx.fillStyle = p.color;
				ctx.font = `${p.size * 2.2}px sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(Math.random() < 0.001 ? "♫" : "♪", 0, 0);
			} else {
				// 光点
				ctx.fillStyle = p.color;
				ctx.beginPath();
				ctx.arc(0, 0, p.size * 0.32, 0, Math.PI * 2);
				ctx.fill();
			}
			return;
		}
		if (s === "eva") {
			ctx.fillStyle = p.color;
			ctx.globalAlpha = p.alpha * 0.9;
			if (p.kind === 0) {
				// 数据块
				ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56);
			} else {
				// 加号
				ctx.fillRect(-p.size * 0.5, -p.size * 0.12, p.size, p.size * 0.24);
				ctx.fillRect(-p.size * 0.12, -p.size * 0.5, p.size * 0.24, p.size);
			}
			return;
		}
		ctx.fillStyle = p.color;
		if (s === "retro90" || s === "violet" || s === "shinkai") {
			if (p.kind === 0) {
				// 四角星
				const s4 = p.size * 0.7;
				ctx.beginPath();
				ctx.moveTo(0, -s4);
				ctx.quadraticCurveTo(s4 * 0.18, -s4 * 0.18, s4, 0);
				ctx.quadraticCurveTo(s4 * 0.18, s4 * 0.18, 0, s4);
				ctx.quadraticCurveTo(-s4 * 0.18, s4 * 0.18, -s4, 0);
				ctx.quadraticCurveTo(-s4 * 0.18, -s4 * 0.18, 0, -s4);
				ctx.fill();
			} else {
				ctx.beginPath();
				ctx.arc(0, 0, p.size * 0.24, 0, Math.PI * 2);
				ctx.fill();
			}
			return;
		}
		// 樱花瓣（sakura）/ 藤花花瓣 + 火花（demon）
		if (s === "demon" && p.kind === 1) {
			// 火花（加号）
			ctx.globalAlpha = p.alpha * 0.9;
			ctx.fillRect(-p.size * 0.4, -p.size * 0.1, p.size * 0.8, p.size * 0.2);
			ctx.fillRect(-p.size * 0.1, -p.size * 0.4, p.size * 0.2, p.size * 0.8);
			return;
		}
		ctx.beginPath();
		ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.34, 0, 0, Math.PI * 2);
		ctx.fill();
	}
}
