import { create } from "zustand";
import { rehydrateUserStores } from "@/src/lib/rehydrate-stores";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface AuthUser {
	readonly id: string;
	readonly email: string;
	readonly name: string;
	readonly avatarUrl?: string;
	readonly lastLogin?: string;
}

interface AuthState {
	readonly user: AuthUser | null;
	readonly isAuthenticated: boolean;
	readonly isLoading: boolean;
	readonly justSignedUp: boolean;
}

interface AuthActions {
	login(email: string, password: string): Promise<void>;
	signup(email: string, password: string, name: string): Promise<void>;
	loginWithGoogle(): Promise<void>;
	quickLogin(userId: string): void;
	logout(): void;
	loadSession(): void;
}

type AuthStore = AuthState & AuthActions;

// ----------------------------------------------------------------------------
// LocalStorage keys
// ----------------------------------------------------------------------------

const STORAGE_KEYS = {
	users: 'place-auth-users',
	session: 'place-auth-session',
} as const;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

interface StoredUser {
	readonly id: string;
	readonly email: string;
	readonly name: string;
	readonly password: string;
	readonly avatarUrl?: string;
}

const SEED_USERS: readonly StoredUser[] = [
	{ id: 'dev-testuser', email: 'test@place.org', name: 'TestUser', password: 'test' },
	{ id: 'dev-trajan', email: 'trajan@place.org', name: 'Trajan', password: 'trajan' },
];

function getStoredUsers(): readonly StoredUser[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.users);
		if (!raw) return [...SEED_USERS];
		const parsed = JSON.parse(raw) as StoredUser[];
		// Ensure seed users always exist
		const ids = new Set(parsed.map((u) => u.id));
		const merged = [...parsed];
		for (const seed of SEED_USERS) {
			if (!ids.has(seed.id)) merged.push(seed);
		}
		return merged;
	} catch {
		return [...SEED_USERS];
	}
}

export function getDevUsers(): readonly { id: string; name: string; email: string }[] {
	return SEED_USERS.map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

function saveStoredUsers(users: readonly StoredUser[]): void {
	localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function saveSession(user: AuthUser): void {
	localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

function clearSession(): void {
	localStorage.removeItem(STORAGE_KEYS.session);
}

function loadStoredSession(): AuthUser | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.session);
		if (!raw) return null;
		return JSON.parse(raw) as AuthUser;
	} catch {
		return null;
	}
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>((set) => ({
	user: null,
	isAuthenticated: false,
	isLoading: false,
	justSignedUp: false,

	async login(email: string, password: string) {
		set({ isLoading: true });

		const users = getStoredUsers();
		const match = users.find(
			(u) => u.email === email && u.password === password,
		);

		if (!match) {
			set({ isLoading: false });
			throw new Error('Invalid email or password');
		}

		const authUser: AuthUser = {
			id: match.id,
			email: match.email,
			name: match.name,
			avatarUrl: match.avatarUrl,
			lastLogin: new Date().toISOString(),
		};

		saveSession(authUser);
		set({ user: authUser, isAuthenticated: true, isLoading: false, justSignedUp: false });
		rehydrateUserStores();
	},

	async signup(email: string, password: string, name: string) {
		set({ isLoading: true });

		const users = getStoredUsers();
		const exists = users.some((u) => u.email === email);

		if (exists) {
			set({ isLoading: false });
			throw new Error('An account with this email already exists');
		}

		const newUser: StoredUser = {
			id: crypto.randomUUID(),
			email,
			name,
			password,
		};

		saveStoredUsers([...users, newUser]);

		const authUser: AuthUser = {
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			lastLogin: new Date().toISOString(),
		};

		saveSession(authUser);
		set({ user: authUser, isAuthenticated: true, isLoading: false, justSignedUp: true });
		rehydrateUserStores();
	},

	async loginWithGoogle() {
		// Placeholder — real OAuth would go here
		throw new Error('GOOGLE_OAUTH_PLACEHOLDER');
	},

	quickLogin(userId: string) {
		const users = getStoredUsers();
		const match = users.find((u) => u.id === userId);
		if (!match) return;
		const authUser: AuthUser = {
			id: match.id,
			email: match.email,
			name: match.name,
			lastLogin: new Date().toISOString(),
		};
		saveSession(authUser);
		set({ user: authUser, isAuthenticated: true, isLoading: false, justSignedUp: false });
		rehydrateUserStores();
	},

	logout() {
		clearSession();
		set({ user: null, isAuthenticated: false });
		rehydrateUserStores();
	},

	loadSession() {
		const session = loadStoredSession();
		if (session) {
			set({ user: session, isAuthenticated: true });
			rehydrateUserStores();
		}
	},
}));
