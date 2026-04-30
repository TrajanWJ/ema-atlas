export function withViewTransition(callback: () => void): void {
	if (typeof document === 'undefined') { callback(); return; }
	if (!('startViewTransition' in document)) { callback(); return; }
	(document as { startViewTransition: (cb: () => void) => void }).startViewTransition(callback);
}
