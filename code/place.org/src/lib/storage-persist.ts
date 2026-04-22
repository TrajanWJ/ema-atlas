// ----------------------------------------------------------------------------
// Persistent Storage — request the browser to keep our data permanently
// ----------------------------------------------------------------------------

export async function requestPersistentStorage(): Promise<boolean> {
	if (typeof navigator === "undefined") return false;
	if (!navigator.storage?.persist) return false;

	try {
		return await navigator.storage.persist();
	} catch {
		return false;
	}
}
