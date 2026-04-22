'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useWeather } from "@/src/hooks/use-weather";
import {
	getBackgroundStyles,
	getBackgroundKey,
	weatherCodeToBucket,
} from "@/src/lib/background-images";
import type { WeatherBucket, TimeOfDay } from "@/src/lib/background-images";
import { WeatherParticles } from "./WeatherParticles";

// ---------------------------------------------------------------------------
// Parallax hook — subtle mouse-based background shift
// ---------------------------------------------------------------------------

function useParallax(strength = 8) {
	const [offset, setOffset] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			const cx = window.innerWidth / 2;
			const cy = window.innerHeight / 2;
			const dx = ((e.clientX - cx) / cx) * strength;
			const dy = ((e.clientY - cy) / cy) * strength;
			setOffset({ x: -dx, y: -dy });
		};

		window.addEventListener("mousemove", handler, { passive: true });
		return () => window.removeEventListener("mousemove", handler);
	}, [strength]);

	return offset;
}

// ---------------------------------------------------------------------------
// Gradient fallback map (kept from original DesktopSurface for loading state)
// ---------------------------------------------------------------------------

const FALLBACK_GRADIENTS: Record<TimeOfDay, string> = {
	night: "linear-gradient(135deg, #060610, #080818, #060610)",
	dawn: "linear-gradient(135deg, #0a0820, #150d2e, #0a0820)",
	morning: "linear-gradient(135deg, #0a1020, #0d1530, #0a1020)",
	midday: "linear-gradient(135deg, #060b18, #0a1228, #060b18)",
	afternoon: "linear-gradient(135deg, #080a18, #0c1020, #080a18)",
	sunset: "linear-gradient(135deg, #100810, #1a0d18, #100810)",
	evening: "linear-gradient(135deg, #080610, #0e0c18, #080610)",
};

// ---------------------------------------------------------------------------
// Crossfade background layer
// ---------------------------------------------------------------------------

interface BackgroundLayerProps {
	readonly styles: CSSProperties;
	readonly active: boolean;
	readonly parallaxOffset: { x: number; y: number };
}

function BackgroundLayer({
	styles,
	active,
	parallaxOffset,
}: BackgroundLayerProps) {
	return (
		<div
			className="absolute inset-[-16px]"
			style={{
				...styles,
				opacity: active ? 1 : 0,
				transition: "opacity 3s ease-in-out",
				transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
				willChange: "opacity, transform",
			}}
		/>
	);
}

// ---------------------------------------------------------------------------
// Lightning flash for storms
// ---------------------------------------------------------------------------

function useLightningFlash(isStorm: boolean) {
	const [flash, setFlash] = useState(false);

	useEffect(() => {
		if (!isStorm) return;

		const scheduleFlash = () => {
			const delay = 4000 + Math.random() * 12000;
			return setTimeout(() => {
				setFlash(true);
				setTimeout(() => setFlash(false), 120);
				// Double flash sometimes
				if (Math.random() > 0.5) {
					setTimeout(() => {
						setFlash(true);
						setTimeout(() => setFlash(false), 80);
					}, 200);
				}
			}, delay);
		};

		let timeoutId = scheduleFlash();
		const interval = setInterval(() => {
			clearTimeout(timeoutId);
			timeoutId = scheduleFlash();
		}, 16000);

		return () => {
			clearTimeout(timeoutId);
			clearInterval(interval);
		};
	}, [isStorm]);

	return flash;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WeatherBackground() {
	const timeOfDay = useDesktopStore((s) => s.timeOfDay);
	const weather = useWeather();

	const weatherBucket: WeatherBucket = weather.loading
		? "clear"
		: weatherCodeToBucket(weather.weatherCode);

	const currentKey = getBackgroundKey(timeOfDay, weatherBucket);
	const currentStyles = useMemo(
		() => getBackgroundStyles(timeOfDay, weatherBucket),
		[timeOfDay, weatherBucket]
	);

	// Track two layers for crossfade
	const [layers, setLayers] = useState<{
		a: { key: string; styles: CSSProperties };
		b: { key: string; styles: CSSProperties };
		activeLayer: "a" | "b";
	}>({
		a: { key: currentKey, styles: currentStyles },
		b: { key: "", styles: {} },
		activeLayer: "a",
	});

	const prevKeyRef = useRef(currentKey);

	useEffect(() => {
		if (currentKey === prevKeyRef.current) return;
		prevKeyRef.current = currentKey;

		setLayers((prev) => {
			const inactiveLayer = prev.activeLayer === "a" ? "b" : "a";
			return {
				...prev,
				[inactiveLayer]: { key: currentKey, styles: currentStyles },
				activeLayer: inactiveLayer,
			};
		});
	}, [currentKey, currentStyles]);

	const parallaxOffset = useParallax(8);
	const isStorm = weatherBucket === "storm";
	const flash = useLightningFlash(isStorm);

	const fallbackGradient = FALLBACK_GRADIENTS[timeOfDay];

	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* Base fallback gradient — always visible underneath */}
			<div
				className="absolute inset-0"
				style={{ background: fallbackGradient }}
			/>

			{/* Crossfading background layers */}
			<BackgroundLayer
				styles={layers.a.styles}
				active={layers.activeLayer === "a"}
				parallaxOffset={parallaxOffset}
			/>
			<BackgroundLayer
				styles={layers.b.styles}
				active={layers.activeLayer === "b"}
				parallaxOffset={parallaxOffset}
			/>

			{/* Noise texture for grain/depth */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
					opacity: 0.03,
					mixBlendMode: "overlay",
				}}
			/>

			{/* Atmospheric vignette */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)",
				}}
			/>

			{/* Weather particles */}
			<WeatherParticles weatherBucket={weatherBucket} />

			{/* Lightning flash overlay */}
			{flash && (
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background: "rgba(180,190,220,0.12)",
						zIndex: 3,
					}}
				/>
			)}
		</div>
	);
}
