'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// ── Types ──

interface DesktopIconContextMenuProps {
	readonly x: number;
	readonly y: number;
	readonly onClose: () => void;
	readonly onNewFolder: () => void;
	readonly onNewSticky: () => void;
	readonly onChangeWallpaper: () => void;
	readonly onAddDesktop?: () => void;
}

interface MenuAction {
	readonly label: string;
	readonly icon: string;
	readonly onClick: () => void;
}

// ── Helpers ──

function clampToViewport(
	x: number,
	y: number,
	w: number,
	h: number,
): { x: number; y: number } {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	return {
		x: Math.min(x, vw - w - 8),
		y: Math.min(y, vh - h - 8),
	};
}

// ── Component ──

export function DesktopIconContextMenu({
	x,
	y,
	onClose,
	onNewFolder,
	onNewSticky,
	onChangeWallpaper,
	onAddDesktop,
}: DesktopIconContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Close on Esc
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleKey);
		return () => document.removeEventListener('keydown', handleKey);
	}, [onClose]);

	// Close on outside click
	useEffect(() => {
		const handlePointer = (e: PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		// Use requestAnimationFrame to avoid the opening right-click closing it
		const id = requestAnimationFrame(() => {
			document.addEventListener('pointerdown', handlePointer);
		});
		return () => {
			cancelAnimationFrame(id);
			document.removeEventListener('pointerdown', handlePointer);
		};
	}, [onClose]);

	const MENU_WIDTH = 200;
	const MENU_HEIGHT = onAddDesktop ? 180 : 140;
	const clamped = clampToViewport(x, y, MENU_WIDTH, MENU_HEIGHT);

	const items: MenuAction[] = [
		{ label: 'New Folder', icon: '\uD83D\uDCC1', onClick: onNewFolder },
		{ label: 'New Sticky Note', icon: '\uD83D\uDCDD', onClick: onNewSticky },
		{ label: 'Change Wallpaper', icon: '\uD83D\uDDBC', onClick: onChangeWallpaper },
	];
	if (onAddDesktop) {
		items.push({ label: 'Add Virtual Desktop', icon: '\uD83D\uDDA5', onClick: onAddDesktop });
	}

	return (
		<AnimatePresence>
			<motion.div
				ref={menuRef}
				role="menu"
				aria-label="Desktop icon context menu"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.1, ease: 'easeOut' }}
				style={{
					position: 'fixed',
					top: clamped.y,
					left: clamped.x,
					minWidth: MENU_WIDTH,
					padding: 6,
					borderRadius: 10,
					background: 'rgba(20, 20, 30, 0.92)',
					border: '1px solid rgba(255,255,255,0.1)',
					backdropFilter: 'blur(20px)',
					boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
					zIndex: 9999,
					transformOrigin: 'top left',
				}}
			>
				{items.map((item) => (
					<button
						key={item.label}
						type="button"
						role="menuitem"
						onClick={() => {
							item.onClick();
							onClose();
						}}
						style={{
							display: 'flex',
							width: '100%',
							alignItems: 'center',
							gap: 8,
							padding: '6px 10px',
							borderRadius: 6,
							border: 'none',
							background: 'transparent',
							color: 'var(--place-text-primary, #fff)',
							fontSize: 13,
							cursor: 'default',
							textAlign: 'left',
						}}
						onMouseEnter={(e) => {
							(e.currentTarget).style.background =
								'rgba(255,255,255,0.08)';
						}}
						onMouseLeave={(e) => {
							(e.currentTarget).style.background = 'transparent';
						}}
					>
						<span aria-hidden="true">{item.icon}</span>
						<span>{item.label}</span>
					</button>
				))}
			</motion.div>
		</AnimatePresence>
	);
}
