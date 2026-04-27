/**
 * RIP: place.org src/components/desktop/DotsBg.tsx
 *
 * Direct-rip with provenance. Self-contained canvas particle field —
 * no external stores, no daemon binding, pure chrome.
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Dot {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

interface DotsBgProps {
	readonly speed?: number;
	readonly interactive?: boolean;
	readonly opacity?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOT_COUNT = 80;
const CONNECTION_DIST = 120;
const CURSOR_DIST = 200;
const CURSOR_STRENGTH = 0.015;
const BASE_SPEED = 0.3;
const DOT_COLOR = 'rgba(255,255,255,0.15)';
const DOT_RADIUS = 1.5;

// ---------------------------------------------------------------------------
// Dot helpers
// ---------------------------------------------------------------------------

function createDot(w: number, h: number, speedMul: number): Dot {
	const angle = Math.random() * Math.PI * 2;
	const v = BASE_SPEED * speedMul * (0.5 + Math.random() * 0.5);
	return {
		x: Math.random() * w,
		y: Math.random() * h,
		vx: Math.cos(angle) * v,
		vy: Math.sin(angle) * v,
	};
}

function wrapDot(dot: Dot, w: number, h: number): void {
	if (dot.x < 0) dot.x = w;
	else if (dot.x > w) dot.x = 0;
	if (dot.y < 0) dot.y = h;
	else if (dot.y > h) dot.y = 0;
}

// ---------------------------------------------------------------------------
// Draw frame
// ---------------------------------------------------------------------------

function drawFrame(
	ctx: CanvasRenderingContext2D,
	dots: Dot[],
	mouse: { x: number; y: number },
	interactive: boolean,
	w: number,
	h: number,
): void {
	ctx.clearRect(0, 0, w, h);

	// Update positions + apply cursor attraction
	for (const dot of dots) {
		if (interactive && mouse.x >= 0) {
			const dx = mouse.x - dot.x;
			const dy = mouse.y - dot.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < CURSOR_DIST && dist > 0) {
				const force = (1 - dist / CURSOR_DIST) * CURSOR_STRENGTH;
				dot.vx += (dx / dist) * force;
				dot.vy += (dy / dist) * force;
			}
		}
		dot.x += dot.vx;
		dot.y += dot.vy;
		dot.vx *= 0.998;
		dot.vy *= 0.998;
		wrapDot(dot, w, h);
	}

	drawConnections(ctx, dots);

	ctx.fillStyle = DOT_COLOR;
	ctx.beginPath();
	for (const dot of dots) {
		ctx.moveTo(dot.x + DOT_RADIUS, dot.y);
		ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
	}
	ctx.fill();
}

function drawConnections(
	ctx: CanvasRenderingContext2D,
	dots: Dot[],
): void {
	const len = dots.length;
	for (let i = 0; i < len; i++) {
		const dotA = dots[i];
		if (!dotA) continue;
		for (let j = i + 1; j < len; j++) {
			const dotB = dots[j];
			if (!dotB) continue;
			const dx = dotA.x - dotB.x;
			const dy = dotA.y - dotB.y;
			const distSq = dx * dx + dy * dy;
			if (distSq >= CONNECTION_DIST * CONNECTION_DIST) continue;

			const dist = Math.sqrt(distSq);
			const alpha = 0.06 * (1 - dist / CONNECTION_DIST);
			ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
			ctx.lineWidth = 0.5;
			ctx.beginPath();
			ctx.moveTo(dotA.x, dotA.y);
			ctx.lineTo(dotB.x, dotB.y);
			ctx.stroke();
		}
	}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DotsBg({
	speed = 1,
	interactive = true,
	opacity = 1,
}: DotsBgProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dotsRef = useRef<Dot[]>([]);
	const mouseRef = useRef({ x: -1, y: -1 });
	const rafRef = useRef<number>(0);

	const initDots = useCallback(
		(w: number, h: number) => {
			dotsRef.current = Array.from({ length: DOT_COUNT }, () =>
				createDot(w, h, speed),
			);
		},
		[speed],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const resize = () => {
			const dpr = window.devicePixelRatio || 1;
			const w = window.innerWidth;
			const h = window.innerHeight;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			if (dotsRef.current.length === 0) {
				initDots(w, h);
			}
		};

		resize();
		window.addEventListener('resize', resize);

		const handleMouse = (e: MouseEvent) => {
			mouseRef.current = { x: e.clientX, y: e.clientY };
		};
		const handleMouseLeave = () => {
			mouseRef.current = { x: -1, y: -1 };
		};

		window.addEventListener('mousemove', handleMouse, { passive: true });
		window.addEventListener('mouseleave', handleMouseLeave);

		const animate = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			drawFrame(ctx, dotsRef.current, mouseRef.current, interactive, w, h);
			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', handleMouse);
			window.removeEventListener('mouseleave', handleMouseLeave);
		};
	}, [interactive, initDots]);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none absolute inset-0"
			style={{ opacity }}
		/>
	);
}
