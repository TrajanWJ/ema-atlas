'use client';

import { useSettingsStore } from "@/src/stores/settings-store";

export function SoundToggle() {
	const soundEnabled = useSettingsStore((s) => s.soundEnabled);
	const setSetting = useSettingsStore((s) => s.setSetting);

	return (
		<button
			type="button"
			aria-label={soundEnabled ? "Mute sounds" : "Unmute sounds"}
			aria-pressed={soundEnabled}
			onClick={() => setSetting('soundEnabled', !soundEnabled)}
			style={{
				background: "none",
				border: "none",
				cursor: "default",
				fontSize: "0.85rem",
				lineHeight: 1,
				padding: "0 0.1rem",
				opacity: soundEnabled ? 1 : 0.45,
			}}
		>
			{soundEnabled ? "🔊" : "🔇"}
		</button>
	);
}
