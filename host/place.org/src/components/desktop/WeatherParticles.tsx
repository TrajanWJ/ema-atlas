'use client';

import { useRef, useEffect, useCallback, useMemo } from "react";
import type { WeatherBucket } from "@/src/lib/background-images";

// ---------------------------------------------------------------------------
// Particle types
// ---------------------------------------------------------------------------

interface Particle {
	x: number;
	y: number;
	speed: number;
	size: number;
	opacity: number;
	drift: number;
}

// ---------------------------------------------------------------------------
// Config per weather bucket
// ---------------------------------------------------------------------------

interface ParticleConfig {
	readonly count: number;
	readonly color: string;
	readonly minSpeed: number;
	readonly maxSpeed: number;
	readonly minSize: number;
	readonly maxSize: number;
	readonly drift: number;
	readonly angle: number; // degrees from vertical, 0 = straight down
}

const PARTICLE_CONFIGS: Partial<Record<WeatherBucket, ParticleConfig>> = {
	rain: {
		count: 120,
		color: "rgba(160,180,220,",
		minSpeed: 8,
		maxSpeed: 14,
		minSize: 1,
		maxSize: 2,
		drift: 2,
		angle: 12,
	},
	snow: {
		count: 80,
		color: "rgba(200,210,230,",
		minSpeed: 0.8,
		maxSpeed: 2,
		minSize: 2,
		maxSize: 4,
		drift: 1.5,
		angle: 0,
	},
	storm: {
		count: 200,
		color: "rgba(140,160,200,",
		minSpeed: 12,
		maxSpeed: 20,
		minSize: 1,
		maxSize: 2.5,
		drift: 4,
		angle: 25,
	},
};

// ---------------------------------------------------------------------------
// Fog overlay (pure CSS — no canvas needed)
// ---------------------------------------------------------------------------

function FogOverlay() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			<div
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(0deg, rgba(40,50,70,0.25) 0%, rgba(40,50,70,0.08) 40%, transparent 70%)",
				}}
			/>
			<div
				className="absolute h-full w-[200%]"
				style={{
					background:
						"repeating-linear-gradient(90deg, transparent 0%, rgba(60,70,90,0.06) 10%, transparent 20%)",
					animation: "fogDrift 60s linear infinite",
				}}
			/>
			<style>{`
				@keyframes fogDrift {
					from { transform: translateX(0); }
					to { transform: translateX(-50%); }
				}
			`}</style>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Canvas particle renderer
// ---------------------------------------------------------------------------

function useParticleCanvas(
	config: ParticleConfig | undefined,
	active: boolean
) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const rafRef = useRef<number>(0);

	const initParticles = useCallback(
		(width: number, height: number, cfg: ParticleConfig) => {
			const particles: Particle[] = [];
			for (let i = 0; i < cfg.count; i++) {
				particles.push({
					x: Math.random() * width,
					y: Math.random() * height,
					speed: cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed),
					size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
					opacity: 0.2 + Math.random() * 0.4,
					drift: (Math.random() - 0.5) * cfg.drift,
				});
			}
			return particles;
		},
		[]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !config || !active) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			particlesRef.current = initParticles(
				canvas.width,
				canvas.height,
				config
			);
		};

		resize();
		window.addEventListener("resize", resize);

		const angleRad = (config.angle * Math.PI) / 180;
		const isSnow = config.angle === 0 && config.maxSpeed < 3;

		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for (const p of particlesRef.current) {
				ctx.beginPath();

				if (isSnow) {
					ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
					ctx.fillStyle = `${config.color}${p.opacity})`;
					ctx.fill();
				} else {
					const len = p.speed * 1.5;
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(
						p.x + Math.sin(angleRad) * len,
						p.y + Math.cos(angleRad) * len
					);
					ctx.strokeStyle = `${config.color}${p.opacity})`;
					ctx.lineWidth = p.size;
					ctx.stroke();
				}

				p.y += p.speed;
				p.x += p.drift + Math.sin(angleRad) * p.speed * 0.3;

				if (isSnow) {
					p.x += Math.sin(p.y * 0.01 + p.drift) * 0.3;
				}

				if (p.y > canvas.height) {
					p.y = -10;
					p.x = Math.random() * canvas.width;
				}
				if (p.x > canvas.width) p.x = 0;
				if (p.x < 0) p.x = canvas.width;
			}

			rafRef.current = requestAnimationFrame(draw);
		};

		rafRef.current = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener("resize", resize);
		};
	}, [config, active, initParticles]);

	return canvasRef;
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

interface WeatherParticlesProps {
	readonly weatherBucket: WeatherBucket;
}

export function WeatherParticles({ weatherBucket }: WeatherParticlesProps) {
	const config = PARTICLE_CONFIGS[weatherBucket];
	const hasFog = weatherBucket === "fog";
	const hasParticles = config !== undefined;

	const canvasRef = useParticleCanvas(config, hasParticles);

	// Memoize to avoid re-renders when bucket hasn't changed
	const content = useMemo(() => {
		return (
			<>
				{hasParticles && (
					<canvas
						ref={canvasRef}
						className="pointer-events-none absolute inset-0"
						style={{ zIndex: 2, opacity: 0.7 }}
					/>
				)}
				{hasFog && <FogOverlay />}
			</>
		);
	}, [hasParticles, hasFog, canvasRef]);

	if (!hasParticles && !hasFog) return null;

	return content;
}
