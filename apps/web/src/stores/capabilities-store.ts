import { create } from "zustand";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface Capabilities {
	readonly pwa: boolean;
	readonly wco: boolean;
	readonly docPip: boolean;
	readonly windowMgmt: boolean;
	readonly wakeLock: boolean;
	readonly notifications: boolean;
	readonly badge: boolean;
	readonly share: boolean;
	readonly fileSystem: boolean;
	readonly viewTransitions: boolean;
	readonly idleDetection: boolean;
	readonly persistentStorage: boolean;
	readonly speechRecognition: boolean;
}

interface CapabilitiesStore extends Capabilities {
	readonly detected: boolean;
	detect: () => void;
}

// ----------------------------------------------------------------------------
// Detection helpers (SSR-safe)
// ----------------------------------------------------------------------------

function isServer(): boolean {
	return typeof window === "undefined";
}

function detectCapabilities(): Capabilities {
	if (isServer()) {
		return {
			pwa: false,
			wco: false,
			docPip: false,
			windowMgmt: false,
			wakeLock: false,
			notifications: false,
			badge: false,
			share: false,
			fileSystem: false,
			viewTransitions: false,
			idleDetection: false,
			persistentStorage: false,
			speechRecognition: false,
		};
	}

	return {
		pwa: "serviceWorker" in navigator,
		wco: "windowControlsOverlay" in navigator,
		docPip: "documentPictureInPicture" in window,
		windowMgmt: "getScreenDetails" in window,
		wakeLock: "wakeLock" in navigator,
		notifications: "Notification" in window,
		badge: "setAppBadge" in navigator,
		share: "share" in navigator,
		fileSystem: "showOpenFilePicker" in window,
		viewTransitions: "startViewTransition" in document,
		idleDetection: "IdleDetector" in window,
		persistentStorage:
			"storage" in navigator &&
			"persist" in (navigator.storage ?? {}),
		speechRecognition:
			"SpeechRecognition" in window ||
			"webkitSpeechRecognition" in window,
	};
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useCapabilitiesStore = create<CapabilitiesStore>((set) => ({
	pwa: false,
	wco: false,
	docPip: false,
	windowMgmt: false,
	wakeLock: false,
	notifications: false,
	badge: false,
	share: false,
	fileSystem: false,
	viewTransitions: false,
	idleDetection: false,
	persistentStorage: false,
	speechRecognition: false,
	detected: false,

	detect() {
		const caps = detectCapabilities();
		set({ ...caps, detected: true });
	},
}));
