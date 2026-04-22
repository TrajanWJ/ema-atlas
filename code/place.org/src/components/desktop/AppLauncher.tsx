'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWindowStore } from '@/src/stores/window-store';
import { APP_LABELS } from '@/src/lib/constants';
import type { AppId } from '@/src/types/window';
import {
	BrainIcon,
	JournalIcon,
	TargetIcon,
	CheckIcon,
	RepeatIcon,
	TerminalIcon,
	MusicIcon,
	SettingsIcon,
	NotesIcon,
} from '@/src/components/icons';

// ── App list with icons ──

interface LauncherApp {
	readonly id: AppId;
	readonly icon: React.ReactNode;
	readonly description: string;
}

const ALL_APPS: readonly LauncherApp[] = [
	{ id: 'brain-dump', icon: <BrainIcon size={16} />, description: 'Quick-capture inbox' },
	{ id: 'journal', icon: <JournalIcon size={16} />, description: 'Daily markdown journal' },
	{ id: 'focus', icon: <TargetIcon size={16} />, description: 'Pomodoro timer' },
	{ id: 'tasks', icon: <CheckIcon size={16} />, description: 'Kanban task board' },
	{ id: 'habits', icon: <RepeatIcon size={16} />, description: 'Streak tracker' },
	{ id: 'notes', icon: <NotesIcon size={16} />, description: 'Markdown notes' },
	{ id: 'terminal', icon: <TerminalIcon size={16} />, description: 'Command line' },
	{ id: 'music', icon: <MusicIcon size={16} />, description: 'Lo-fi radio' },
	{ id: 'calculator', icon: <SettingsIcon size={16} />, description: 'Calculator' },
	{ id: 'clock', icon: <SettingsIcon size={16} />, description: 'World clocks' },
	{ id: 'settings', icon: <SettingsIcon size={16} />, description: 'Preferences' },
];

// ── Pill (collapsed state) ──

function LauncherPill({ onClick }: { readonly onClick: () => void }) {
	return (
		<motion.button
			type="button"
			onClick={onClick}
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.95 }}
			style={{
				width: '36px',
				height: '36px',
				borderRadius: '50%',
				background: 'rgba(74, 222, 128, 0.15)',
				border: '1px solid rgba(74, 222, 128, 0.3)',
				boxShadow: '0 0 12px rgba(74, 222, 128, 0.2), 0 0 4px rgba(74, 222, 128, 0.1)',
				cursor: 'default',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'rgba(74, 222, 128, 0.9)',
				fontSize: '1rem',
			}}
			aria-label="Open app launcher"
		>
			<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
				<rect x="3" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="3" width="7" height="7" rx="1" />
				<rect x="3" y="14" width="7" height="7" rx="1" />
				<rect x="14" y="14" width="7" height="7" rx="1" />
			</svg>
		</motion.button>
	);
}

// ── Expanded panel ──

function LauncherPanel({
	onClose,
	onLaunch,
}: {
	readonly onClose: () => void;
	readonly onLaunch: (id: AppId) => void;
}) {
	const [filter, setFilter] = useState('');
	const filtered = filter
		? ALL_APPS.filter(
				(a) =>
					APP_LABELS[a.id].toLowerCase().includes(filter.toLowerCase()) ||
					a.description.toLowerCase().includes(filter.toLowerCase()),
			)
		: ALL_APPS;

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9, y: -8 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: -8 }}
			transition={{ type: 'spring', stiffness: 400, damping: 25 }}
			style={{
				width: '240px',
				maxHeight: '420px',
				background: 'var(--place-surface-1)',
				border: '1px solid rgba(74, 222, 128, 0.15)',
				borderRadius: '12px',
				backdropFilter: 'blur(20px)',
				WebkitBackdropFilter: 'blur(20px)',
				boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 16px rgba(74, 222, 128, 0.08)',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			{/* Header */}
			<div
				className="drag-handle"
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '0.5rem 0.65rem',
					borderBottom: '1px solid var(--place-border-subtle)',
					cursor: 'grab',
				}}
			>
				<span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(74, 222, 128, 0.8)' }}>
					Apps
				</span>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close launcher"
					style={{
						background: 'none',
						border: 'none',
						color: 'var(--place-text-muted, rgba(255,255,255,0.25))',
						cursor: 'default',
						fontSize: '0.8rem',
						lineHeight: 1,
						padding: '2px 4px',
						borderRadius: '4px',
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.color = 'var(--place-error, #E24B4A)';
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.color = 'var(--place-text-muted, rgba(255,255,255,0.25))';
					}}
				>
					✕
				</button>
			</div>

			{/* Search */}
			<div style={{ padding: '0.4rem 0.5rem' }}>
				<input
					type="text"
					placeholder="Search apps..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					autoFocus
					style={{
						width: '100%',
						background: 'rgba(255,255,255,0.03)',
						border: '1px solid var(--place-border-subtle)',
						borderRadius: '6px',
						color: 'var(--place-text-primary, rgba(255,255,255,0.87))',
						fontSize: '0.7rem',
						padding: '0.35rem 0.5rem',
						outline: 'none',
					}}
				/>
			</div>

			{/* App list */}
			<div style={{ flex: 1, overflowY: 'auto', padding: '0.15rem 0' }}>
				{filtered.map((app, i) => (
					<motion.button
						key={app.id}
						type="button"
						initial={{ opacity: 0, x: -8 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: i * 0.02 }}
						onClick={() => onLaunch(app.id)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							width: '100%',
							padding: '0.4rem 0.65rem',
							background: 'transparent',
							border: 'none',
							cursor: 'default',
							color: 'var(--place-text-secondary, rgba(255,255,255,0.6))',
							fontSize: '0.7rem',
							textAlign: 'left',
							transition: 'background 0.1s',
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
							(e.currentTarget as HTMLElement).style.color = 'var(--place-text-primary, rgba(255,255,255,0.87))';
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLElement).style.background = 'transparent';
							(e.currentTarget as HTMLElement).style.color = 'var(--place-text-secondary, rgba(255,255,255,0.6))';
						}}
					>
						<span style={{ flexShrink: 0, display: 'flex' }}>{app.icon}</span>
						<span style={{ fontWeight: 500 }}>{APP_LABELS[app.id]}</span>
						<span
							style={{
								marginLeft: 'auto',
								fontSize: '0.55rem',
								color: 'var(--place-text-muted, rgba(255,255,255,0.25))',
								whiteSpace: 'nowrap',
							}}
						>
							{app.description}
						</span>
					</motion.button>
				))}
				{filtered.length === 0 && (
					<div
						style={{
							padding: '1rem',
							textAlign: 'center',
							fontSize: '0.65rem',
							color: 'var(--place-text-muted)',
						}}
					>
						No matching apps
					</div>
				)}
			</div>
		</motion.div>
	);
}

// ── Main component ──

export function AppLauncher() {
	const [expanded, setExpanded] = useState(false);
	const [pos, setPos] = useState({ x: 0, y: 0 });
	const [initialized, setInitialized] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
	const openWindow = useWindowStore((s) => s.openWindow);

	// Randomize initial position on mount, clamped to visible area
	useEffect(() => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const margin = 50;
		const pillSize = 36;
		const rawX = vw - 80 - Math.floor(Math.random() * 120);
		const rawY = 60 + Math.floor(Math.random() * 100);
		const x = Math.max(margin, Math.min(rawX, vw - pillSize - margin));
		const y = Math.max(margin, Math.min(rawY, vh - pillSize - margin));
		setPos({ x, y });
		setInitialized(true);
	}, []);

	const handleLaunch = useCallback(
		(id: AppId) => {
			openWindow(id);
			setExpanded(false);
		},
		[openWindow],
	);

	// Drag handling
	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			const target = e.target as HTMLElement;
			// Only drag from the pill or the panel header
			if (!target.closest('.drag-handle') && expanded) return;
			e.preventDefault();
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
			dragState.current = {
				startX: e.clientX,
				startY: e.clientY,
				origX: pos.x,
				origY: pos.y,
			};
		},
		[pos, expanded],
	);

	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		if (!dragState.current) return;
		const dx = e.clientX - dragState.current.startX;
		const dy = e.clientY - dragState.current.startY;
		setPos({
			x: dragState.current.origX + dx,
			y: dragState.current.origY + dy,
		});
	}, []);

	const handlePointerUp = useCallback(() => {
		dragState.current = null;
	}, []);

	if (!initialized) return null;

	return (
		<div
			ref={containerRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			style={{
				position: 'absolute',
				left: pos.x,
				top: pos.y,
				zIndex: 48,
				touchAction: 'none',
			}}
		>
			<AnimatePresence mode="wait">
				{expanded ? (
					<LauncherPanel
						key="panel"
						onClose={() => setExpanded(false)}
						onLaunch={handleLaunch}
					/>
				) : (
					<LauncherPill key="pill" onClick={() => setExpanded(true)} />
				)}
			</AnimatePresence>
		</div>
	);
}
