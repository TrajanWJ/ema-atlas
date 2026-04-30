/**
 * Returns the current user ID, or 'guest' if not logged in.
 *
 * Reads directly from localStorage rather than the Zustand auth store.
 * The store may not be hydrated yet when DB queries run during boot,
 * but localStorage is always available synchronously.
 */
export function getCurrentUserId(): string {
	try {
		if (typeof window === 'undefined') return 'guest';
		const raw = localStorage.getItem('place-auth-session');
		if (!raw) return 'guest';
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return 'guest';
		const id = (parsed as Record<string, unknown>).id;
		return typeof id === 'string' && id.length > 0 ? id : 'guest';
	} catch {
		return 'guest';
	}
}
