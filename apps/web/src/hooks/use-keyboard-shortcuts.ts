'use client';

import { useEffect } from "react";
import { useWindowStore } from "@/src/stores/window-store";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useVirtualDesktopStore } from "@/src/stores/virtual-desktop-store";
import type { AppId } from "@/src/types/window";

const APP_SHORTCUT_MAP: Record<string, AppId> = {
	b: "brain-dump",
	j: "journal",
	f: "focus",
	t: "tasks",
	x: "terminal",
} as const;

export function useKeyboardShortcuts(): void {
	const store = useWindowStore();
	const toggleCommandPalette = useDesktopStore((s) => s.toggleCommandPalette);
	const closeCommandPalette = useDesktopStore((s) => s.closeCommandPalette);
	const commandPaletteOpen = useDesktopStore((s) => s.commandPaletteOpen);
	const toggleShortcutHelp = useDesktopStore((s) => s.toggleShortcutHelp);
	const closeShortcutHelp = useDesktopStore((s) => s.closeShortcutHelp);
	const shortcutHelpOpen = useDesktopStore((s) => s.shortcutHelpOpen);
	const toggleQuickCapture = useDesktopStore((s) => s.toggleQuickCapture);
	const closeQuickCapture = useDesktopStore((s) => s.closeQuickCapture);
	const quickCaptureOpen = useDesktopStore((s) => s.quickCaptureOpen);
	const toggleTelescope = useDesktopStore((s) => s.toggleTelescope);
	const closeTelescope = useDesktopStore((s) => s.closeTelescope);
	const telescopeOpen = useDesktopStore((s) => s.telescopeOpen);
	const switchDesktopLeft = useVirtualDesktopStore((s) => s.switchLeft);
	const switchDesktopRight = useVirtualDesktopStore((s) => s.switchRight);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// Ctrl+Left / Ctrl+Right → switch virtual desktops
			if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
				if (e.key === "ArrowLeft") {
					e.preventDefault();
					switchDesktopLeft();
					return;
				}
				if (e.key === "ArrowRight") {
					e.preventDefault();
					switchDesktopRight();
					return;
				}
			}

			// Ctrl+K or Cmd+K → toggle Command Palette
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
				e.preventDefault();
				toggleCommandPalette();
				return;
			}

			// Ctrl+Shift+K or Cmd+Shift+K → toggle Telescope
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
				e.preventDefault();
				toggleTelescope();
				return;
			}

			// ? → toggle shortcut help (when not in input)
			if (e.key === "?" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
				const target = e.target as HTMLElement;
				const isInput =
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					(target as HTMLElement).contentEditable === "true";
				if (!isInput) {
					e.preventDefault();
					toggleShortcutHelp();
					return;
				}
			}

			// Esc closes overlays before window handling
			if (e.key === "Escape") {
				if (telescopeOpen) {
					closeTelescope();
					return;
				}
				if (commandPaletteOpen) {
					closeCommandPalette();
					return;
				}
				if (shortcutHelpOpen) {
					closeShortcutHelp();
					return;
				}
				if (quickCaptureOpen) {
					closeQuickCapture();
					return;
				}
			}

			// Ctrl+Shift+<key> → open or focus app
			if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
				const key = e.key.toLowerCase();

				// Ctrl+Shift+Enter → toggle quick capture
				if (e.key === "Enter") {
					e.preventDefault();
					toggleQuickCapture();
					return;
				}

				const appId = APP_SHORTCUT_MAP[key];

				if (appId !== undefined) {
					e.preventDefault();
					const existing = store.getWindowsByApp(appId);
					if (existing.length > 0) {
						const win = existing[0];
						if (win !== undefined) {
							store.focusWindow(win.id);
						}
					} else {
						store.openWindow(appId);
					}
					return;
				}

				// Ctrl+Shift+W → close active window
				if (key === "w") {
					e.preventDefault();
					const active = store.activeWindowId;
					if (active !== null) {
						store.closeWindow(active);
					}
					return;
				}

				// Ctrl+Shift+M → maximize/restore active window
				if (key === "m") {
					e.preventDefault();
					const active = store.activeWindowId;
					if (active !== null) {
						store.maximizeWindow(active);
					}
					return;
				}
			}

			// Esc → minimize active window
			if (e.key === "Escape" && !e.ctrlKey && !e.shiftKey) {
				const active = store.activeWindowId;
				if (active !== null) {
					store.minimizeWindow(active);
				}
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [store, toggleCommandPalette, closeCommandPalette, commandPaletteOpen, toggleShortcutHelp, closeShortcutHelp, shortcutHelpOpen, toggleQuickCapture, closeQuickCapture, quickCaptureOpen, toggleTelescope, closeTelescope, telescopeOpen, switchDesktopLeft, switchDesktopRight]);
}
