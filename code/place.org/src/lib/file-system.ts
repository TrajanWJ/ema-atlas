/**
 * File System Access API wrappers with download/null fallbacks.
 */

export async function saveToFile(
	content: string,
	suggestedName: string,
): Promise<boolean> {
	if (typeof window === 'undefined' || !('showSaveFilePicker' in window)) {
		// Fallback: trigger a download
		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = suggestedName;
		a.click();
		URL.revokeObjectURL(url);
		return false;
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const handle = await (window as any).showSaveFilePicker({
			suggestedName,
			types: [
				{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } },
				{ description: 'Text', accept: { 'text/plain': ['.txt'] } },
			],
		});
		const writable = await handle.createWritable();
		await writable.write(content);
		await writable.close();
		return true;
	} catch (err) {
		if ((err as Error).name === 'AbortError') return false;
		throw err;
	}
}

export async function openFile(): Promise<{
	name: string;
	content: string;
} | null> {
	if (typeof window === 'undefined' || !('showOpenFilePicker' in window)) {
		return null;
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const [handle] = await (window as any).showOpenFilePicker({
			types: [
				{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } },
				{ description: 'Text', accept: { 'text/plain': ['.txt'] } },
			],
		});
		const file = await handle.getFile();
		const content = await file.text();
		return { name: handle.name, content };
	} catch (err) {
		if ((err as Error).name === 'AbortError') return null;
		throw err;
	}
}
