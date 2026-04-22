// ----------------------------------------------------------------------------
// IdleDetector API type declaration (not in standard TypeScript lib types)
// ----------------------------------------------------------------------------

interface IdleDetectorInstance extends EventTarget {
	readonly userState: "active" | "idle";
	readonly screenState: "locked" | "unlocked";
	start(options: { threshold: number }): Promise<void>;
	stop(): void;
	addEventListener(type: "change", listener: () => void): void;
}

interface IdleDetectorConstructor {
	new (): IdleDetectorInstance;
}

// ----------------------------------------------------------------------------
// Idle detection using the IdleDetector API (Chrome 94+)
// Falls back to null if the API is unavailable.
// ----------------------------------------------------------------------------

export async function startIdleDetection(
	onIdle: () => void,
	onActive: () => void,
	thresholdMs?: number,
): Promise<(() => void) | null> {
	if (typeof window === "undefined" || !("IdleDetector" in window))
		return null;
	try {
		const IdleDetector = (window as unknown as { IdleDetector: IdleDetectorConstructor }).IdleDetector;
		const detector = new IdleDetector();
		detector.addEventListener("change", () => {
			if (detector.userState === "idle") onIdle();
			else onActive();
		});
		await detector.start({ threshold: thresholdMs ?? 60_000 });
		return () => detector.stop();
	} catch {
		return null;
	}
}
