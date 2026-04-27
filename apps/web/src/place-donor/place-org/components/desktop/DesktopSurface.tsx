'use client';

import { useRef, useCallback } from 'react';
import { useTimeOfDay } from '@/src/hooks/use-time-of-day';
import { useContextMenu } from '@/src/hooks/use-context-menu';
import { useStickyStore } from '@/src/stores/sticky-store';
import { useSettingsStore } from '@/src/stores/settings-store';
import { CursorLight } from './CursorLight';
import { ContextMenu } from './ContextMenu';
import { WeatherBackground } from './WeatherBackground';
import { DotsBg } from './DotsBg';
import { ParticlesBg } from './ParticlesBg';

// ---------------------------------------------------------------------------
// Pure-CSS wallpaper patterns
// ---------------------------------------------------------------------------

function DotsPattern() {
	return (
		<div
			className="absolute inset-0"
			style={{
				backgroundColor: 'var(--place-void)',
				backgroundImage:
					'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
				backgroundSize: '30px 30px',
			}}
		/>
	);
}

function GridPattern() {
	return (
		<div
			className="absolute inset-0"
			style={{
				backgroundColor: 'var(--place-void)',
				backgroundImage: [
					'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
					'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
				].join(', '),
				backgroundSize: '40px 40px',
			}}
		/>
	);
}

function GradientBg() {
	return (
		<>
			<style>{`
				@keyframes place-gradient-shift {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
			`}</style>
			<div
				className="absolute inset-0"
				style={{
					background:
						'linear-gradient(135deg, #060610, #0a1628, #0d0a20, #060610)',
					backgroundSize: '400% 400%',
					animation: 'place-gradient-shift 30s ease infinite',
				}}
			/>
		</>
	);
}

function CustomWallpaper({
	url,
}: {
	readonly url: string | null;
}) {
	if (!url) {
		return (
			<div
				className="absolute inset-0"
				style={{ background: 'var(--place-void)' }}
			/>
		);
	}

	return (
		<div
			className="absolute inset-0"
			style={{
				backgroundImage: `url(${url})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		/>
	);
}

// ---------------------------------------------------------------------------
// Background switcher — reads settings store
// ---------------------------------------------------------------------------

function DesktopBackground() {
	const wallpaper = useSettingsStore((s) => s.wallpaper);
	const wallpaperOpacity = useSettingsStore((s) => s.wallpaperOpacity);
	const bgAnimation = useSettingsStore((s) => s.bgAnimation);
	const bgAnimationSpeed = useSettingsStore((s) => s.bgAnimationSpeed);
	const bgAnimationInteractive = useSettingsStore(
		(s) => s.bgAnimationInteractive,
	);
	const customWallpaperUrl = useSettingsStore((s) => s.customWallpaperUrl);

	return (
		<>
			{/* Base void layer -- always present, fully opaque */}
			<div
				className="absolute inset-0"
				style={{ background: 'var(--place-void)' }}
			/>

			{/* Wallpaper layer with opacity */}
			<div className="absolute inset-0" style={{ opacity: wallpaperOpacity }}>
				{wallpaper === 'default' && <WeatherBackground />}
				{wallpaper === 'dots' && <DotsPattern />}
				{wallpaper === 'grid' && <GridPattern />}
				{wallpaper === 'gradient' && <GradientBg />}
				{wallpaper === 'particles' && <ParticlesBg />}
				{wallpaper === 'custom' && (
					<CustomWallpaper url={customWallpaperUrl} />
				)}
			</div>

			{/* Animation overlay */}
			{bgAnimation === 'dots-connect' && (
				<DotsBg
					speed={bgAnimationSpeed}
					interactive={bgAnimationInteractive}
				/>
			)}
		</>
	);
}

// ---------------------------------------------------------------------------
// Main surface
// ---------------------------------------------------------------------------

export function DesktopSurface() {
	useTimeOfDay();

	const surfaceRef = useRef<HTMLDivElement>(null);
	const { isOpen, position, close } = useContextMenu(surfaceRef);
	const addNote = useStickyStore((s) => s.addNote);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (e.target !== e.currentTarget) return;
			addNote(e.clientX - 100, e.clientY - 75);
		},
		[addNote],
	);

	return (
		<>
			<div
				ref={surfaceRef}
				className="absolute inset-0"
				onDoubleClick={handleDoubleClick}
			>
				<DesktopBackground />
				<CursorLight />
			</div>
			<ContextMenu isOpen={isOpen} position={position} onClose={close} />
		</>
	);
}
