'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTimeOfDay } from '@/src/hooks/use-time-of-day';
import { useContextMenu } from '@/src/hooks/use-context-menu';
import { useStickyStore } from '@/src/stores/sticky-store';
import { useSettingsStore } from '@/src/stores/settings-store';
import { usePresence } from '@/src/projections/use-presence';
import { useTopbar } from '@/src/projections/use-topbar';
import {
	getPresenceSessionId,
	publishPresenceCursor,
	publishPresenceJoin,
	type PresenceScope,
} from '@/src/lib/presence-client';
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
	const { scope, raw } = useTopbar();
	const presenceScope: PresenceScope = {
		org_id: scope.org?.id,
		space_id: scope.space?.id,
		room_id: "desktop_room:default",
	};
	const displayName = raw?.user?.display_name ?? "Trajan";
	const selfSessionId = getPresenceSessionId();
	const lastCursorSent = useRef(0);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (e.target !== e.currentTarget) return;
			addNote(e.clientX - 100, e.clientY - 75);
		},
		[addNote],
	);

	useEffect(() => {
		publishPresenceJoin(presenceScope, displayName);
	}, [presenceScope.org_id, presenceScope.space_id, displayName]);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const now = Date.now();
			if (now - lastCursorSent.current < 40) return;
			lastCursorSent.current = now;
			publishPresenceCursor(presenceScope, e.clientX, e.clientY, displayName);
		},
		[presenceScope.org_id, presenceScope.space_id, displayName],
	);

	return (
		<>
			<div
				ref={surfaceRef}
				className="absolute inset-0"
				onDoubleClick={handleDoubleClick}
				onPointerMove={handlePointerMove}
			>
				<DesktopBackground />
				<CursorLight />
				<RemoteCursorLayer selfSessionId={selfSessionId} />
			</div>
			<ContextMenu isOpen={isOpen} position={position} onClose={close} />
		</>
	);
}

function RemoteCursorLayer({ selfSessionId }: { readonly selfSessionId: string }) {
	const { cursors } = usePresence();
	const remote = cursors.filter((cursor) => cursor.session_id !== selfSessionId);
	if (remote.length === 0) return null;
	return (
		<div className="pointer-events-none absolute inset-0" style={{ zIndex: 20 }}>
			{remote.map((cursor) => (
				<div
					key={cursor.session_id}
					style={{
						position: "absolute",
						left: cursor.x,
						top: cursor.y,
						transform: "translate(4px, 4px)",
						display: "flex",
						alignItems: "center",
						gap: 6,
						color: cursor.color,
						filter: `drop-shadow(0 0 8px ${cursor.color})`,
					}}
				>
					<div
						style={{
							width: 0,
							height: 0,
							borderLeft: "8px solid currentColor",
							borderTop: "6px solid transparent",
							borderBottom: "6px solid transparent",
							transform: "rotate(35deg)",
						}}
					/>
					<span
						style={{
							borderRadius: 6,
							background: "rgba(5, 8, 18, 0.82)",
							border: `1px solid ${cursor.color}`,
							color: "white",
							fontSize: 11,
							fontWeight: 600,
							lineHeight: 1,
							padding: "4px 6px",
							whiteSpace: "nowrap",
							boxShadow: `0 0 18px ${cursor.color}55`,
						}}
					>
						{cursor.display_name}
					</span>
				</div>
			))}
		</div>
	);
}
