/**
 * Window Management API — multi-monitor screen details.
 * Utility for future workspace layout support.
 */

interface ScreenDetailed {
	availLeft: number;
	availTop: number;
	availWidth: number;
	availHeight: number;
	isPrimary: boolean;
	label: string;
}

export async function getScreenDetails(): Promise<{
	screens: ScreenDetailed[];
	currentScreen: ScreenDetailed;
} | null> {
	if (typeof window === 'undefined' || !('getScreenDetails' in window)) {
		return null;
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return await (window as any).getScreenDetails();
	} catch {
		return null;
	}
}
