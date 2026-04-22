'use client';

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useWindowStore } from "@/src/stores/window-store";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useSettingsStore } from "@/src/stores/settings-store";
import { useStickyStore } from "@/src/stores/sticky-store";
import type { ContextMenuPosition } from "@/src/hooks/use-context-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuAction {
	readonly label: string;
	readonly icon: string;
	readonly onClick: () => void;
}

type MenuItemDef = MenuAction | "separator";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MenuItemProps {
	readonly item: MenuItemDef;
	readonly onClose: () => void;
}

function MenuItem({ item, onClose }: MenuItemProps) {
	if (item === "separator") {
		return (
			<div
				role="separator"
				className="my-1 h-px"
				style={{ backgroundColor: "var(--place-border-default)" }}
			/>
		);
	}

	return (
		<button
			type="button"
			className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors"
			style={{ color: "var(--place-text-primary)" }}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLButtonElement).style.backgroundColor =
					"var(--place-surface-1)";
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
			}}
			onClick={() => {
				item.onClick();
				onClose();
			}}
		>
			<span aria-hidden="true">{item.icon}</span>
			<span>{item.label}</span>
		</button>
	);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampToViewport(
	x: number,
	y: number,
	menuWidth: number,
	menuHeight: number,
): { x: number; y: number } {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	return {
		x: Math.min(x, vw - menuWidth - 8),
		y: Math.min(y, vh - menuHeight - 8),
	};
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ContextMenuProps {
	readonly isOpen: boolean;
	readonly position: ContextMenuPosition;
	readonly onClose: () => void;
}

export function ContextMenu({ isOpen, position, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const openWindow = useWindowStore((s) => s.openWindow);
	const soundEnabled = useSettingsStore((s) => s.soundEnabled);
	const setSetting = useSettingsStore((s) => s.setSetting);
	const addNote = useStickyStore((s) => s.addNote);

	// Close on Esc
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		const handlePointerDown = (e: PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [isOpen, onClose]);

	// Clamp menu position so it never overflows the viewport. Use a fixed size
	// estimate; actual measurement would require a two-pass render.
	const MENU_WIDTH = 220;
	const MENU_HEIGHT = 260;
	const { x, y } = clampToViewport(
		position.x,
		position.y,
		MENU_WIDTH,
		MENU_HEIGHT,
	);

	const items: readonly MenuItemDef[] = [
		{
			label: "New Brain Dump",
			icon: "🧠",
			onClick: () => openWindow("brain-dump"),
		},
		{
			label: "Open Journal",
			icon: "📓",
			onClick: () => openWindow("journal"),
		},
		{
			label: "Start Focus",
			icon: "◉",
			onClick: () => openWindow("focus"),
		},
		"separator",
		{
			label: "New Sticky Note",
			icon: "\uD83D\uDCDD",
			onClick: () => addNote(position.x - 100, position.y - 75),
		},
		{
			label: soundEnabled ? "Mute Sound" : "Unmute Sound",
			icon: soundEnabled ? "🔊" : "🔇",
			onClick: () => setSetting('soundEnabled', !soundEnabled),
		},
		{
			label: "Change Wallpaper",
			icon: "\uD83D\uDDBC",
			onClick: () => openWindow("settings"),
		},
		"separator",
		{
			label: "About place.org",
			icon: "ℹ",
			onClick: () => {
				window.location.href = "/about";
			},
		},
	];

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={menuRef}
					role="menu"
					aria-label="Desktop context menu"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.1, ease: "easeOut" }}
					className="glass fixed z-[9999] min-w-[220px] rounded-xl p-1.5 shadow-xl"
					style={{
						top: y,
						left: x,
						transformOrigin: "top left",
					}}
				>
					{items.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static list, index is stable
						<MenuItem key={i} item={item} onClose={onClose} />
					))}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
