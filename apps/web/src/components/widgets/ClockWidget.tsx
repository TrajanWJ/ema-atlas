'use client';

import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Canvas analog clock
// ---------------------------------------------------------------------------

function drawClock(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	now: Date,
): void {
	const cx = w / 2;
	const cy = w / 2;
	const r = w / 2 - 6;

	ctx.clearRect(0, 0, w, h);

	// Face
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(255,255,255,0.03)';
	ctx.fill();
	ctx.strokeStyle = 'var(--place-border-default)';
	ctx.lineWidth = 1;
	ctx.stroke();

	// Hour marks
	for (let i = 0; i < 12; i++) {
		const angle = (i * Math.PI) / 6 - Math.PI / 2;
		const inner = r - 8;
		const outer = r - 3;
		ctx.beginPath();
		ctx.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
		ctx.lineTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle));
		ctx.strokeStyle = 'rgba(255,255,255,0.3)';
		ctx.lineWidth = i % 3 === 0 ? 2 : 1;
		ctx.stroke();
	}

	const hours = now.getHours() % 12;
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	// Hour hand
	const hAngle =
		((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
	drawHand(ctx, cx, cy, hAngle, r * 0.5, 2.5, 'rgba(255,255,255,0.85)');

	// Minute hand
	const mAngle =
		((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
	drawHand(ctx, cx, cy, mAngle, r * 0.72, 1.8, 'rgba(255,255,255,0.7)');

	// Second hand
	const sAngle = (seconds * Math.PI) / 30 - Math.PI / 2;
	drawHand(ctx, cx, cy, sAngle, r * 0.8, 0.8, 'var(--place-primary-400)');

	// Center dot
	ctx.beginPath();
	ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
	ctx.fillStyle = 'var(--place-primary-400)';
	ctx.fill();
}

function drawHand(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	angle: number,
	length: number,
	width: number,
	color: string,
): void {
	ctx.beginPath();
	ctx.moveTo(cx, cy);
	ctx.lineTo(cx + length * Math.cos(angle), cy + length * Math.sin(angle));
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.lineCap = 'round';
	ctx.stroke();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClockWidget() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [dateStr, setDateStr] = useState('');

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const size = 100;
		canvas.width = size * dpr;
		canvas.height = size * dpr;
		canvas.style.width = `${size}px`;
		canvas.style.height = `${size}px`;
		ctx.scale(dpr, dpr);

		function tick() {
			const now = new Date();
			if (ctx) drawClock(ctx, size, size, now);
			setDateStr(
				now.toLocaleDateString(undefined, {
					weekday: 'short',
					month: 'short',
					day: 'numeric',
				}),
			);
		}

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<div
			style={{
				width: 120,
				padding: '6px 10px 8px',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
			}}
		>
			<canvas ref={canvasRef} style={{ display: 'block' }} />
			<span
				style={{
					fontSize: '0.6rem',
					color: 'var(--place-text-secondary)',
					textAlign: 'center',
				}}
			>
				{dateStr}
			</span>
		</div>
	);
}
