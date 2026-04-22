/**
 * User-scoped localStorage key helper.
 *
 * Reads the persisted auth session directly from localStorage (not the Zustand
 * store) so it works at module-init time before the auth store has hydrated.
 *
 * Guest data uses the base key unchanged for backward compatibility.
 * Logged-in users get `base:userId`.
 */

const AUTH_SESSION_KEY = 'place-auth-session';

function getStorageUserId(): string {
	try {
		if (typeof window === 'undefined') return 'guest';
		const raw = localStorage.getItem(AUTH_SESSION_KEY);
		if (!raw) return 'guest';
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return 'guest';
		const id = (parsed as Record<string, unknown>).id;
		return typeof id === 'string' && id.length > 0 ? id : 'guest';
	} catch {
		return 'guest';
	}
}

export function userKey(base: string): string {
	const userId = getStorageUserId();
	return userId === 'guest' ? base : `${base}:${userId}`;
}
