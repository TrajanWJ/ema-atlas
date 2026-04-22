'use client';

import { useEffect, useState } from "react";
import { BootSequence } from "@/src/components/boot/BootSequence";
import { DesktopSurface } from "@/src/components/desktop/DesktopSurface";
import { AmbientBar } from "@/src/components/desktop/AmbientBar";
import { WindowManager } from "@/src/components/window-manager/WindowManager";
import { Dock } from "@/src/components/desktop/Dock";
import { useKeyboardShortcuts } from "@/src/hooks/use-keyboard-shortcuts";
import { useFaviconBadge } from "@/src/hooks/use-favicon-badge";
import { usePrimarySync } from "@/src/hooks/use-primary-sync";
import { useAccentSync } from "@/src/hooks/use-accent-sync";
import { useGlassIntensity } from "@/src/hooks/use-glass-intensity";
import { useFontSize } from "@/src/hooks/use-font-size";
import { useWindowRadius } from "@/src/hooks/use-window-radius";
import { useFontFamily } from "@/src/hooks/use-font-family";
import { useFontWeight } from "@/src/hooks/use-font-weight";
import { useLineSpacing } from "@/src/hooks/use-line-spacing";
import { useColorMode } from "@/src/hooks/use-color-mode";
import { useContrast } from "@/src/hooks/use-contrast";
import { CommandPalette } from "@/src/components/desktop/CommandPalette";
import { ShortcutHelp } from "@/src/components/desktop/ShortcutHelp";
import { Screensaver } from "@/src/components/desktop/Screensaver";
import { StickyNoteLayer } from "@/src/components/widgets/StickyNoteLayer";
import { QuickCapture } from "@/src/components/desktop/QuickCapture";
import { Telescope } from "@/src/components/desktop/Telescope";
import { DesktopWidgets } from "@/src/components/desktop/DesktopWidgets";
import { useDeepLink } from "@/src/hooks/use-deep-link";
import { useFileHandler } from "@/src/hooks/use-file-handler";
import { useProtocolHandler } from "@/src/hooks/use-protocol-handler";
import { useWakeLock } from "@/src/hooks/use-wake-lock";
import { useNotificationWiring } from "@/src/hooks/use-notification-wiring";
import { useIdleEvents } from "@/src/hooks/use-idle-events";
import { getDbProxy } from "@/src/lib/db-proxy";
import { reattachPersistedPopouts } from "@/src/lib/popout-launcher";
import { companionBridge } from "@/src/lib/companion-bridge";
import { trackWindowOpen, shouldShowSustainedNudge, dismissSustainedNudge } from "@/src/lib/companion-nudge";
import { useToastStore } from "@/src/stores/toast-store";
import { WelcomeCard } from "@/src/components/desktop/WelcomeCard";
import { DesktopShortcuts } from "@/src/components/desktop/DesktopShortcuts";
import { AppLauncher } from "@/src/components/desktop/AppLauncher";
import { useWindowStore } from "@/src/stores/window-store";
import { useVirtualDesktopStore } from "@/src/stores/virtual-desktop-store";
import { useCapabilitiesStore } from "@/src/stores/capabilities-store";
import { useShortcutActions } from "@/src/hooks/use-shortcut-actions";
import { useDeskShortcut } from "@/src/hooks/use-desk-shortcut";
import { useIdleSentinel } from "@/src/hooks/use-idle-sentinel";
import { ActivityPulse } from "@/src/components/desktop/ActivityPulse";
import { requestPersistentStorage } from "@/src/lib/storage-persist";
import { setupKeyboardLock } from "@/src/lib/keyboard-lock";
import { useInboxStore } from "@/src/stores/inbox-store";
import type { AppId } from "@/src/types/window";
import { registerAllApps } from "@/src/lib/app-registrations";

// Register all apps into the registry at module load (idempotent — Map.set overwrites)
registerAllApps();

function useDbProxyListener() {
	useEffect(() => {
		const cleanup = getDbProxy().listen();
		return cleanup;
	}, []);
}

function usePopoutReattach() {
	useEffect(() => {
		reattachPersistedPopouts();
	}, []);
}

function useCompanionBridge() {
	useEffect(() => {
		companionBridge.connect();

		// Deduplicate reattach events — the broadcast channel sends to all
		// WS connections, so we may receive the same event multiple times.
		const reattachedWindows = new Set<string>();

		const offReattach = companionBridge.on("window-reattach", (data) => {
			const appId = data.appId as AppId | undefined;
			const windowId = data.windowId as string | undefined;
			if (!windowId || reattachedWindows.has(windowId)) return;
			reattachedWindows.add(windowId);
			// Clean up after 5s to prevent memory leak
			setTimeout(() => reattachedWindows.delete(windowId), 5000);

			if (appId) {
				useWindowStore.getState().openWindow(appId);
			}
			companionBridge.sendReattachAck(windowId);
		});

		return () => {
			offReattach();
			companionBridge.disconnect();
		};
	}, []);
}

function useCompanionSustainedNudge() {
	useEffect(() => {
		// Track window opens and show a one-time nudge after sustained use
		const unsub = useWindowStore.subscribe((state, prev) => {
			if (state.windows.size > prev.windows.size) {
				trackWindowOpen();
				if (shouldShowSustainedNudge()) {
					dismissSustainedNudge();
					useToastStore.getState().addToast(
						"Enjoying place.org? Go native — get the companion app at /companion",
						"info",
						10000,
					);
				}
			}
		});
		return unsub;
	}, []);
}

function useCapabilitiesDetect() {
	useEffect(() => {
		useCapabilitiesStore.getState().detect();
	}, []);
}

function usePersistentStorage() {
	useEffect(() => {
		requestPersistentStorage();
	}, []);
}

function useKeyboardLock() {
	useEffect(() => {
		setupKeyboardLock();
	}, []);
}

function useServiceWorker() {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	}, []);
}

function useShareReceiver() {
	useEffect(() => {
		if (!('serviceWorker' in navigator)) return;
		const handler = (event: MessageEvent) => {
			if (event.data?.type === 'share-received') {
				const { text, url } = event.data.data as { text?: string; url?: string };
				if (text || url) {
					useInboxStore.getState().add((text || url) as string, 'text');
				}
			}
		};
		navigator.serviceWorker.addEventListener('message', handler);
		return () => navigator.serviceWorker.removeEventListener('message', handler);
	}, []);
}

function useReattachListener() {
	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (e.origin !== window.location.origin) return;
			if (e.data?.type === 'place_reattach' && e.data.appId) {
				useWindowStore.getState().openWindow(e.data.appId as AppId);
			}
		};
		window.addEventListener('message', handler);
		return () => window.removeEventListener('message', handler);
	}, []);
}

function DesktopSlideLayer() {
	const transitioning = useVirtualDesktopStore((s) => s.transitioning);
	const direction = useVirtualDesktopStore((s) => s.transitionDirection);

	const translateX = !transitioning
		? "0%"
		: direction === "right"
			? "-100%"
			: "100%";

	return (
		<div
			className="absolute inset-0"
			style={{
				transform: `translateX(${translateX})`,
				transition: transitioning
					? "transform 300ms ease-out"
					: "none",
			}}
		>
			<DesktopShortcuts />
			<WindowManager />
			<StickyNoteLayer />
		</div>
	);
}

function Desktop() {
	useKeyboardShortcuts();
	useFaviconBadge();
	usePrimarySync();
	useAccentSync();
	useGlassIntensity();
	useFontSize();
	useWindowRadius();
	useFontFamily();
	useFontWeight();
	useLineSpacing();
	useColorMode();
	useContrast();
	useDeepLink();
	useShortcutActions();
	useDeskShortcut();
	useIdleSentinel();
	useCapabilitiesDetect();
	usePersistentStorage();
	useDbProxyListener();
	useWakeLock();
	useIdleEvents();
	useNotificationWiring();
	usePopoutReattach();
	useReattachListener();
	useCompanionBridge();
	useCompanionSustainedNudge();
	useServiceWorker();
	useShareReceiver();
	useFileHandler();
	useProtocolHandler();
	useKeyboardLock();

	return (
		<div style={{ animation: 'desktop-fade-in 0.2s ease' }}>
			<style>{`
				@keyframes desktop-fade-in {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`}</style>
			<DesktopSurface />
			<DesktopWidgets />
			<DesktopSlideLayer />
			<AmbientBar />
			<AppLauncher />
			<WelcomeCard />
			<Dock />
			<CommandPalette />
			<ShortcutHelp />
			<Screensaver />
			<QuickCapture />
			<Telescope />
			<ActivityPulse />
		</div>
	);
}

export default function DesktopPage() {
	const [booted, setBooted] = useState(false);

	useEffect(() => {
		const handleDesktop = () => setBooted(true);
		const handlePortfolio = () => {
			setBooted(true);
			// Navigate to portfolio after a tick so desktop mounts first
			setTimeout(() => { window.location.href = '/portfolio'; }, 50);
		};
		window.addEventListener('boot-desktop', handleDesktop);
		window.addEventListener('boot-portfolio', handlePortfolio);
		return () => {
			window.removeEventListener('boot-desktop', handleDesktop);
			window.removeEventListener('boot-portfolio', handlePortfolio);
		};
	}, []);

	if (!booted) {
		return <BootSequence onComplete={() => setBooted(true)} />;
	}

	return <Desktop />;
}
