/**
 * Web Share API wrapper with clipboard fallback.
 */
export async function shareContent(opts: {
	title: string;
	text?: string;
	url?: string;
}): Promise<boolean> {
	if (typeof navigator === 'undefined' || !navigator.share) {
		// Fallback: copy text to clipboard
		const content = opts.text || opts.url || opts.title;
		await navigator.clipboard.writeText(content);
		return false; // indicates fallback was used
	}
	try {
		await navigator.share(opts);
		return true;
	} catch (err) {
		if ((err as Error).name === 'AbortError') return false;
		throw err;
	}
}
