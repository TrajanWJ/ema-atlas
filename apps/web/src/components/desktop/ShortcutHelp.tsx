'use client';

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDesktopStore } from "@/src/stores/desktop-store";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface Shortcut {
	readonly keys: string[];
	readonly description: string;
	readonly category: "Apps" | "Windows" | "Navigation";
}

// ----------------------------------------------------------------------------
// Shortcuts data
// ----------------------------------------------------------------------------

const SHORTCUTS: readonly Shortcut[] = [
	// Apps
	{ keys: ["Ctrl", "Shift", "B"], description: "Brain Dump", category: "Apps" },
	{ keys: ["Ctrl", "Shift", "J"], description: "Journal", category: "Apps" },
	{ keys: ["Ctrl", "Shift", "F"], description: "Focus Timer", category: "Apps" },
	{ keys: ["Ctrl", "Shift", "T"], description: "Tasks", category: "Apps" },
	{ keys: ["Ctrl", "K"], description: "Command Palette", category: "Navigation" },
	{ keys: ["Ctrl", "Shift", "Enter"], description: "Quick Capture", category: "Navigation" },
	// Windows
	{ keys: ["Esc"], description: "Minimize Window", category: "Windows" },
	{ keys: ["Ctrl", "Shift", "W"], description: "Close Window", category: "Windows" },
	{ keys: ["Ctrl", "Shift", "M"], description: "Maximize Window", category: "Windows" },
	// Navigation
	{ keys: ["?"], description: "Keyboard Help", category: "Navigation" },
] as const;

// Group shortcuts by category
const GROUPED_SHORTCUTS = SHORTCUTS.reduce(
	(acc, shortcut) => {
		const existing = acc.find((g) => g.category === shortcut.category);
		if (existing) {
			existing.shortcuts.push(shortcut);
		} else {
			acc.push({ category: shortcut.category, shortcuts: [shortcut] });
		}
		return acc;
	},
	[] as Array<{ category: string; shortcuts: Shortcut[] }>,
);

// Ensure consistent order
const CATEGORY_ORDER = ["Apps", "Windows", "Navigation"];
const SORTED_GROUPED = CATEGORY_ORDER.map((cat) => GROUPED_SHORTCUTS.find((g) => g.category === cat)).filter(
	(g): g is (typeof GROUPED_SHORTCUTS)[0] => g !== undefined,
);

// ----------------------------------------------------------------------------
// Key badge component
// ----------------------------------------------------------------------------

interface KeyBadgeProps {
	readonly keys: readonly string[];
}

function KeyBadge({ keys }: KeyBadgeProps) {
	return (
		<div className="flex items-center gap-1">
			{keys.map((key, idx) => (
				<div key={`${key}-${idx}`}>
					<kbd
						className="px-2 py-1 rounded text-xs font-medium"
						style={{
							backgroundColor: "rgba(91,156,245,0.12)",
							color: "var(--place-text-primary)",
							border: "1px solid var(--place-secondary-400)",
							minWidth: "32px",
							textAlign: "center",
							display: "inline-block",
						}}
					>
						{key}
					</kbd>
					{idx < keys.length - 1 && (
						<span className="mx-1" style={{ color: "var(--place-text-secondary)" }}>
							+
						</span>
					)}
				</div>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shortcut row component
// ----------------------------------------------------------------------------

interface ShortcutRowProps {
	readonly shortcut: Shortcut;
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
	return (
		<div className="flex items-center justify-between px-4 py-3 border-b gap-4" style={{ borderColor: "var(--place-border-default)" }}>
			<KeyBadge keys={shortcut.keys} />
			<span className="text-sm" style={{ color: "var(--place-text-primary)" }}>
				{shortcut.description}
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function ShortcutHelp() {
	const isOpen = useDesktopStore((s) => s.shortcutHelpOpen);
	const close = useDesktopStore((s) => s.closeShortcutHelp);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				close();
			}
		};

		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, close]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={overlayRef}
					role="dialog"
					aria-modal="true"
					aria-label="Keyboard shortcuts help"
					className="fixed inset-0 flex items-center justify-center"
					style={{ zIndex: 9100, backgroundColor: "rgba(6,6,16,0.6)" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					onClick={(e) => {
						if (e.target === e.currentTarget) close();
					}}
				>
					<motion.div
						className="glass w-full max-w-3xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
						style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--place-border-default)" }}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
					>
						{/* Header */}
						<div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--place-border-default)" }}>
							<h2 className="text-lg font-semibold" style={{ color: "var(--place-text-primary)" }}>
								Keyboard Shortcuts
							</h2>
							<kbd
								className="text-xs px-2 py-1 rounded"
								style={{
									color: "var(--place-text-secondary)",
									backgroundColor: "rgba(255,255,255,0.05)",
									border: "1px solid var(--place-border-default)",
								}}
							>
								Esc
							</kbd>
						</div>

						{/* Content */}
						<div className="overflow-y-auto flex-1">
							{SORTED_GROUPED.map((group) => (
								<div key={group.category}>
									{/* Category header */}
									<div className="px-6 py-3 mt-2 first:mt-0" style={{ backgroundColor: "rgba(91,156,245,0.08)" }}>
										<h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--place-text-secondary)" }}>
											{group.category}
										</h3>
									</div>
									{/* Shortcuts in category */}
									{group.shortcuts.map((shortcut, idx) => (
										<ShortcutRow key={`${group.category}-${idx}`} shortcut={shortcut} />
									))}
								</div>
							))}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
