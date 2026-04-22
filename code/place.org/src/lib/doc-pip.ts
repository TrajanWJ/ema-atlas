// ----------------------------------------------------------------------------
// Document Picture-in-Picture helper
// ----------------------------------------------------------------------------

/**
 * Copy stylesheets from the main document into a PiP window.
 * Skips cross-origin sheets that can't be read.
 */
function copyStylesheets(pipWindow: Window): void {
	for (const sheet of document.styleSheets) {
		try {
			const href = (sheet as CSSStyleSheet).href;
			if (!href) continue;
			const link = pipWindow.document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href;
			pipWindow.document.head.appendChild(link);
		} catch {
			/* cross-origin sheets — skip */
		}
	}
}

/**
 * Copy CSS custom properties defined on :root into the PiP window.
 */
function copyCssVariables(pipWindow: Window): void {
	const rootStyles = getComputedStyle(document.documentElement);
	const vars = Array.from(document.styleSheets)
		.flatMap((s) => {
			try {
				return Array.from(s.cssRules);
			} catch {
				return [];
			}
		})
		.filter(
			(r): r is CSSStyleRule =>
				r instanceof CSSStyleRule && r.selectorText === ':root',
		)
		.flatMap((r) => Array.from(r.style))
		.filter((p) => p.startsWith('--'));

	for (const v of vars) {
		pipWindow.document.documentElement.style.setProperty(
			v,
			rootStyles.getPropertyValue(v),
		);
	}
}

/**
 * Open a Document Picture-in-Picture window.
 *
 * Returns the PiP `Window` on success, or `null` if the API is
 * unavailable or the request fails.
 */
export async function openDocPip(opts: {
	width: number;
	height: number;
}): Promise<Window | null> {
	if (!('documentPictureInPicture' in window)) return null;

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DocPiP not in TS types
		const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
			width: opts.width,
			height: opts.height,
		});

		copyStylesheets(pipWindow);
		copyCssVariables(pipWindow);

		return pipWindow;
	} catch {
		return null;
	}
}
