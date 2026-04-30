let wakeLock: WakeLockSentinel | null = null;

export async function acquireWakeLock(): Promise<boolean> {
	if (typeof navigator === "undefined" || !("wakeLock" in navigator))
		return false;
	try {
		wakeLock = await navigator.wakeLock.request("screen");
		wakeLock.addEventListener("release", () => {
			wakeLock = null;
		});
		return true;
	} catch {
		return false;
	}
}

export function releaseWakeLock(): void {
	wakeLock?.release();
	wakeLock = null;
}

export function isWakeLockHeld(): boolean {
	return wakeLock !== null;
}
