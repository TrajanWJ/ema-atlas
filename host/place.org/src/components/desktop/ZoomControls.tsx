'use client';

import { useCallback, useEffect } from 'react';
import { create } from 'zustand';

// ── Zoom store ──

const ZOOM_KEY = 'place-zoom-level';
const ZOOM_STEPS = [0.75, 0.85, 0.9, 1.0, 1.1, 1.25, 1.5];
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;

interface ZoomState {
	zoom: number;
	setZoom: (zoom: number) => void;
	zoomIn: () => void;
	zoomOut: () => void;
	resetZoom: () => void;
}

function loadZoom(): number {
	if (typeof window === 'undefined') return DEFAULT_ZOOM;
	try {
		const saved = localStorage.getItem(ZOOM_KEY);
		if (saved) {
			const parsed = Number.parseFloat(saved);
			if (!Number.isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) return parsed;
		}
	} catch { /* */ }
	return DEFAULT_ZOOM;
}

export const useZoomStore = create<ZoomState>((set, get) => ({
	zoom: loadZoom(),

	setZoom(zoom) {
		const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
		set({ zoom: clamped });
		applyZoom(clamped);
		try { localStorage.setItem(ZOOM_KEY, String(clamped)); } catch { /* */ }
	},

	zoomIn() {
		const current = get().zoom;
		const next = ZOOM_STEPS.find((s) => s > current + 0.01) ?? MAX_ZOOM;
		get().setZoom(next);
	},

	zoomOut() {
		const current = get().zoom;
		const prev = [...ZOOM_STEPS].reverse().find((s) => s < current - 0.01) ?? MIN_ZOOM;
		get().setZoom(prev);
	},

	resetZoom() {
		get().setZoom(DEFAULT_ZOOM);
	},
}));

function applyZoom(zoom: number): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	// Set CSS custom property for components to read
	root.style.setProperty('--place-zoom', String(zoom));
	// Scale the desktop content area (not the top bar or dock)
	const desktop = document.getElementById('desktop-content');
	if (desktop) {
		desktop.style.transform = zoom === 1 ? '' : `scale(${zoom})`;
		desktop.style.transformOrigin = 'top left';
		desktop.style.width = zoom === 1 ? '' : `${100 / zoom}%`;
		desktop.style.height = zoom === 1 ? '' : `${100 / zoom}%`;
	}
	// Also scale font size globally for accessibility
	root.style.fontSize = `${zoom * 100}%`;
}

// ── Component ──

export function ZoomControls() {
	const zoom = useZoomStore((s) => s.zoom);
	const zoomIn = useZoomStore((s) => s.zoomIn);
	const zoomOut = useZoomStore((s) => s.zoomOut);
	const resetZoom = useZoomStore((s) => s.resetZoom);

	// Apply on mount
	useEffect(() => {
		applyZoom(zoom);
	}, [zoom]);

	// Keyboard shortcuts: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 reset
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!e.ctrlKey && !e.metaKey) return;
			if (e.key === '=' || e.key === '+') {
				e.preventDefault();
				useZoomStore.getState().zoomIn();
			} else if (e.key === '-') {
				e.preventDefault();
				useZoomStore.getState().zoomOut();
			} else if (e.key === '0') {
				e.preventDefault();
				useZoomStore.getState().resetZoom();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	const pct = Math.round(zoom * 100);
	const isDefault = Math.abs(zoom - 1) < 0.01;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '2px',
				marginLeft: '4px',
				marginRight: '4px',
			}}
		>
			<ZoomButton
				label="Zoom out (Ctrl+-)"
				onClick={zoomOut}
				disabled={zoom <= MIN_ZOOM}
			>
				<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</ZoomButton>

			<button
				type="button"
				onClick={resetZoom}
				title={isDefault ? '100%' : `${pct}% — click to reset`}
				style={{
					fontSize: '0.55rem',
					fontWeight: 600,
					fontVariantNumeric: 'tabular-nums',
					color: isDefault
						? 'var(--place-text-muted, rgba(255,255,255,0.25))'
						: 'var(--place-primary-400, #2DD4A8)',
					background: 'none',
					border: 'none',
					cursor: 'default',
					padding: '0 2px',
					minWidth: '28px',
					textAlign: 'center',
					transition: 'color 0.15s',
				}}
			>
				{pct}%
			</button>

			<ZoomButton
				label="Zoom in (Ctrl+=)"
				onClick={zoomIn}
				disabled={zoom >= MAX_ZOOM}
			>
				<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</ZoomButton>
		</div>
	);
}

function ZoomButton({
	children,
	label,
	onClick,
	disabled,
}: {
	readonly children: React.ReactNode;
	readonly label: string;
	readonly onClick: () => void;
	readonly disabled: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			title={label}
			style={{
				width: 18,
				height: 18,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: 4,
				border: 'none',
				background: 'transparent',
				color: disabled
					? 'var(--place-text-ghost, rgba(255,255,255,0.12))'
					: 'var(--place-text-secondary, rgba(255,255,255,0.6))',
				cursor: disabled ? 'default' : 'default',
				transition: 'color 0.15s, background 0.15s',
				opacity: disabled ? 0.4 : 1,
			}}
			onMouseEnter={(e) => {
				if (!disabled) {
					(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
					(e.currentTarget as HTMLElement).style.color = 'var(--place-text-primary)';
				}
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLElement).style.background = 'transparent';
				(e.currentTarget as HTMLElement).style.color = disabled
					? 'var(--place-text-ghost)'
					: 'var(--place-text-secondary)';
			}}
		>
			{children}
		</button>
	);
}
