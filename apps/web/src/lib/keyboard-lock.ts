/**
 * Keyboard Lock API — captures system keys (Escape, Tab) in fullscreen mode.
 */
export function setupKeyboardLock(): void {
	if (typeof document === 'undefined') return;

	document.addEventListener('fullscreenchange', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (document.fullscreenElement && (navigator as any).keyboard) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await (navigator as any).keyboard.lock(['Escape', 'Tab']);
			} catch {
				/* not supported */
			}
		}
	});
}
