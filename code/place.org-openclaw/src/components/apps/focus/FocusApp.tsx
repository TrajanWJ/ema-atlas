'use client';

import { useEffect, useRef, useState } from "react";
import { useFocusStore } from "@/src/stores/focus-store";
import { useTimer } from "@/src/hooks/use-timer";
import { useWakeLock } from "@/src/hooks/use-wake-lock";
import { useToast } from "@/src/hooks/use-toast";
import { TimerRing } from "./TimerRing";
import { SessionControls } from "./SessionControls";
import { SessionStats } from "./SessionStats";
import { AmbientSelector } from "./AmbientSelector";
import type { SoundscapeId, Soundscape } from "@/src/lib/ambient-sounds";

const AMBIENT_PREF_KEY = "focus:ambient";

type AmbientChoice = SoundscapeId | "off";

export function FocusApp() {
	const isRunning = useFocusStore((s) => s.isRunning);
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const loadTodayStats = useFocusStore((s) => s.loadTodayStats);

	const { warning } = useToast();
	const overrunFiredRef = useRef(false);

	const [ambientChoice, setAmbientChoice] = useState<AmbientChoice>(() => {
		if (typeof window === "undefined") return "off";
		return (localStorage.getItem(AMBIENT_PREF_KEY) as AmbientChoice) ?? "off";
	});

	const soundRef = useRef<Soundscape | null>(null);

	useTimer();
	useWakeLock(isRunning);

	useEffect(() => {
		loadTodayStats().catch(() => {});
	}, [loadTodayStats]);

	// Fire "Target reached!" toast once when the block first hits overrun
	useEffect(() => {
		const isOverrun = activeBlock !== null && elapsedMs > activeBlock.targetMs;
		if (isOverrun && !overrunFiredRef.current) {
			overrunFiredRef.current = true;
			warning("Target reached!");
		}
		if (!isOverrun) {
			overrunFiredRef.current = false;
		}
	}, [activeBlock, elapsedMs, warning]);

	useEffect(() => {
		async function syncAmbient() {
			if (soundRef.current) {
				soundRef.current.stop();
				soundRef.current = null;
			}

			if (!isRunning || ambientChoice === "off") return;

			const { createSoundscape, resumeAudioContext } = await import(
				"@/src/lib/ambient-sounds"
			);

			await resumeAudioContext();
			const sound = createSoundscape(ambientChoice);
			sound.start();
			soundRef.current = sound;
		}

		syncAmbient().catch(() => {});

		return () => {
			if (soundRef.current) {
				soundRef.current.stop();
				soundRef.current = null;
			}
		};
	}, [isRunning, ambientChoice]);

	function handleAmbientChange(id: AmbientChoice) {
		setAmbientChoice(id);
		localStorage.setItem(AMBIENT_PREF_KEY, id);
	}

	return (
		<div
			className="flex h-full flex-col"
			style={{ padding: "1.5rem", gap: "1.5rem", alignItems: "center" }}
		>
				<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
				{activeBlock ? (
					<TimerRing
						elapsedMs={elapsedMs}
						targetMs={activeBlock.targetMs}
						blockType={activeBlock.type}
					/>
				) : (
					<div
						style={{
							color: "var(--text-secondary)",
							fontSize: "0.8rem",
							textAlign: "center",
						}}
					>
						No active session
					</div>
				)}
			</div>

			<SessionControls />

			<AmbientSelector active={ambientChoice} onChange={handleAmbientChange} />

			<SessionStats />
		</div>
	);
}
