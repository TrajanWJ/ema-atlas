'use client';

import { useState } from 'react';

interface PopoutTitleBarProps {
	readonly appName: string;
	readonly appId?: string;
	readonly isCompanion?: boolean;
	readonly onClose: () => void;
}

// macOS-style traffic light colors
const TRAFFIC = {
	close: { bg: '#FF5F57', hover: '#E0443E' },
	minimize: { bg: '#FEBC2E', hover: '#D4A019' },
	maximize: { bg: '#28C840', hover: '#1FA834' },
} as const;

function TrafficLight({
	color,
	hoverColor,
	onClick,
	label,
	icon,
}: {
	readonly color: string;
	readonly hoverColor: string;
	readonly onClick: () => void;
	readonly label: string;
	readonly icon: React.ReactNode;
}) {
	const [hovered, setHovered] = useState(false);

	return (
		<button
			type="button"
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			aria-label={label}
			style={{
				width: '12px',
				height: '12px',
				borderRadius: '50%',
				background: hovered ? hoverColor : color,
				border: 'none',
				cursor: 'default',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 0,
				WebkitAppRegion: 'no-drag',
				transition: 'background 0.1s',
			} as React.CSSProperties}
		>
			{hovered && (
				<span style={{ fontSize: '8px', lineHeight: 1, color: 'rgba(0,0,0,0.6)' }}>
					{icon}
				</span>
			)}
		</button>
	);
}

function ReattachIcon() {
	return (
		<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
			<path d="M15 3h6v6" />
			<path d="M10 14L21 3" />
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		</svg>
	);
}

export function PopoutTitleBar({ appName, appId, isCompanion, onClose }: PopoutTitleBarProps) {
	const [controlsHovered, setControlsHovered] = useState(false);

	const handleReattach = () => {
		// Companion mode: use the injected IPC bridge
		if (isCompanion) {
			const reattachFn = (window as unknown as Record<string, unknown>).__PLACE_COMPANION_REATTACH__ as
				| ((windowId: string, appId: string) => void)
				| undefined;
			if (reattachFn) {
				const params = new URLSearchParams(window.location.search);
				reattachFn(params.get('windowId') ?? '', appId ?? '');
				return; // companion will close the window after ack
			}
		}
		// Browser popup mode: postMessage to opener
		if (window.opener && !window.opener.closed) {
			window.opener.postMessage(
				{ type: 'place_reattach', appId },
				window.location.origin,
			);
		}
		window.close();
	};

	const handleMinimize = () => {
		window.blur();
	};

	const handleMaximize = () => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen().catch(() => {});
		}
	};

	const handleDragStart = (e: React.MouseEvent) => {
		if (!isCompanion) return;
		// Don't drag when clicking on buttons (they have WebkitAppRegion: no-drag)
		if ((e.target as HTMLElement).closest('button')) return;
		// Call Tauri's native window drag directly
		try {
			const internals = (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ as
				| { invoke: (cmd: string) => void }
				| undefined;
			if (internals) {
				internals.invoke('plugin:window|start_dragging');
			}
		} catch {
			// Not in Tauri webview — ignore
		}
	};

	return (
		<div
			data-tauri-drag-region
			onMouseDown={handleDragStart}
			style={{
				display: 'flex',
				alignItems: 'center',
				height: '38px',
				padding: '0 12px',
				background: isCompanion
					? 'rgba(14, 16, 23, 0.6)'
					: 'var(--place-surface-1, #0E1017)',
				borderBottom: '1px solid var(--place-border-subtle, rgba(255,255,255,0.04))',
				WebkitAppRegion: 'drag',
				userSelect: 'none',
				position: 'relative',
				flexShrink: 0,
				cursor: 'grab',
				...(isCompanion ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
			} as React.CSSProperties}
		>
			{/* Traffic light buttons */}
			<div
				style={{
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
				}}
				onMouseEnter={() => setControlsHovered(true)}
				onMouseLeave={() => setControlsHovered(false)}
			>
				<TrafficLight
					color={(controlsHovered || isCompanion) ? TRAFFIC.close.bg : 'rgba(255,255,255,0.12)'}
					hoverColor={TRAFFIC.close.hover}
					onClick={onClose}
					label="Close"
					icon="×"
				/>
				<TrafficLight
					color={(controlsHovered || isCompanion) ? TRAFFIC.minimize.bg : 'rgba(255,255,255,0.12)'}
					hoverColor={TRAFFIC.minimize.hover}
					onClick={handleMinimize}
					label="Minimize"
					icon="−"
				/>
				<TrafficLight
					color={(controlsHovered || isCompanion) ? TRAFFIC.maximize.bg : 'rgba(255,255,255,0.12)'}
					hoverColor={TRAFFIC.maximize.hover}
					onClick={handleMaximize}
					label="Maximize"
					icon="⤢"
				/>
			</div>

			{/* App name — centered */}
			<span
				style={{
					position: 'absolute',
					left: '50%',
					transform: 'translateX(-50%)',
					color: 'var(--place-text-tertiary, rgba(255,255,255,0.40))',
					fontSize: '0.8rem',
					fontWeight: 500,
					letterSpacing: '0.02em',
					pointerEvents: 'none',
				}}
			>
				{appName}
			</span>

			{/* Right: reattach button */}
			<div style={{ marginLeft: 'auto' }}>
				<button
					type="button"
					onClick={handleReattach}
					aria-label="Return to desktop"
					title="Return to desktop"
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						background: 'transparent',
						border: 'none',
						color: 'var(--place-text-muted, rgba(255,255,255,0.25))',
						cursor: 'default',
						fontSize: '0.6rem',
						padding: '4px 6px',
						borderRadius: '4px',
						transition: 'color 0.15s, background 0.15s',
						WebkitAppRegion: 'no-drag',
					} as React.CSSProperties}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.color = 'var(--place-primary-400, #2DD4A8)';
						(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.color = 'var(--place-text-muted, rgba(255,255,255,0.25))';
						(e.currentTarget as HTMLElement).style.background = 'transparent';
					}}
				>
					<ReattachIcon />
					<span>Desktop</span>
				</button>
			</div>
		</div>
	);
}
