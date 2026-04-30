'use client';

import { useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Particle {
	x: number;
	y: number;
	radius: number;
	speed: number;
	alpha: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 60;
const MIN_RADIUS = 2;
const MAX_RADIUS = 4;
const MIN_SPEED = 0.2;
const MAX_SPEED = 0.5;
const MIN_ALPHA = 0.06;
const MAX_ALPHA = 0.12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createParticle(w: number, h: number): Particle {
	return {
		x: Math.random() * w,
		y: Math.random() * h,
		radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
		speed: MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
		alpha: MIN_ALPHA + Math.random() * (MAX_ALPHA - MIN_ALPHA),
	};
}

function drawFrame(
	ctx: CanvasRenderingContext2D,
	particles: Particle[],
	w: number,
	h: number,
): void {
	ctx.clearRect(0, 0, w, h);

	for (const p of particles) {
		p.y -= p.speed;
		if (p.y + p.radius < 0) {
			p.y = h + p.radius;
			p.x = Math.random() * w;
		}

		ctx.beginPath();
		ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
		ctx.fill();
	}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParticlesBg() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const rafRef = useRef<number>(0);

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

			if (particlesRef.current.length === 0) {
				particlesRef.current = Array.from(
					{ length: PARTICLE_COUNT },
					() => createParticle(w, h),
				);
			}
		};

		resize();
		window.addEventListener('resize', resize);

		const animate = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			drawFrame(ctx, particlesRef.current, w, h);
			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none absolute inset-0"
		/>
	);
}
