'use client';

import { useCallback, useRef } from "react";
import { useSettingsStore } from "@/src/stores/settings-store";
import { soundEngine } from "@/src/lib/sound-engine";

interface UseSoundReturn {
	readonly playClick: () => void;
	readonly playOpen: () => void;
	readonly playClose: () => void;
	readonly playNotification: () => void;
}

/**
 * Wraps SoundEngine with lazy AudioContext initialization and soundEnabled guard.
 * AudioContext is created on first user gesture to comply with browser autoplay policy.
 */
export function useSound(): UseSoundReturn {
	const soundEnabled = useSettingsStore((s) => s.soundEnabled);
	const initializedRef = useRef(false);

	const ensureInit = useCallback(() => {
		if (initializedRef.current) return;
		try {
			const ctx = new AudioContext();
			soundEngine.init(ctx);
			initializedRef.current = true;
		} catch {
			// AudioContext unavailable — sounds silently disabled
		}
	}, []);

	const playClick = useCallback(() => {
		if (!soundEnabled) return;
		ensureInit();
		soundEngine.playClick();
	}, [soundEnabled, ensureInit]);

	const playOpen = useCallback(() => {
		if (!soundEnabled) return;
		ensureInit();
		soundEngine.playOpen();
	}, [soundEnabled, ensureInit]);

	const playClose = useCallback(() => {
		if (!soundEnabled) return;
		ensureInit();
		soundEngine.playClose();
	}, [soundEnabled, ensureInit]);

	const playNotification = useCallback(() => {
		if (!soundEnabled) return;
		ensureInit();
		soundEngine.playNotification();
	}, [soundEnabled, ensureInit]);

	return { playClick, playOpen, playClose, playNotification };
}
