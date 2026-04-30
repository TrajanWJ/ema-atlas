import { create } from "zustand";
import { createId } from "@/src/lib/id";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface Notification {
	readonly id: string;
	readonly appId: string;
	readonly title: string;
	readonly body: string;
	readonly timestamp: number;
	readonly read: boolean;
	readonly urgency: "low" | "medium" | "high";
	readonly tag?: string;
	readonly action?: () => void;
}

interface NotifyOpts {
	readonly appId: string;
	readonly title: string;
	readonly body: string;
	readonly action?: () => void;
	readonly urgency?: "low" | "medium" | "high";
	readonly tag?: string;
}

interface NotificationState {
	readonly notifications: readonly Notification[];
	readonly unreadCount: number;
}

interface NotificationActions {
	notify(opts: NotifyOpts): void;
	markRead(id: string): void;
	markAllRead(): void;
	dismiss(id: string): void;
	clearAll(): void;
}

export type NotificationStore = NotificationState & NotificationActions;

// ----------------------------------------------------------------------------
// OS notification bridge
// ----------------------------------------------------------------------------

let permissionRequested = false;

async function ensurePermission(): Promise<boolean> {
	if (typeof globalThis.Notification === "undefined") return false;
	if (globalThis.Notification.permission === "granted") return true;
	if (globalThis.Notification.permission === "denied") return false;

	if (!permissionRequested) {
		permissionRequested = true;
		const result = await globalThis.Notification.requestPermission();
		return result === "granted";
	}

	return false;
}

function sendOsNotification(
	title: string,
	body: string,
	onClick?: () => void,
): void {
	if (typeof globalThis.Notification === "undefined") return;
	if (globalThis.Notification.permission !== "granted") return;

	try {
		const n = new globalThis.Notification(title, {
			body,
			icon: "/icons/icon-192.png",
			tag: title,
		});
		n.addEventListener("click", () => {
			window.focus();
			onClick?.();
			n.close();
		});
		setTimeout(() => n.close(), 6000);
	} catch {
		// Notification constructor can throw in insecure contexts
	}
}

// ----------------------------------------------------------------------------
// Badge API helper
// ----------------------------------------------------------------------------

function updateBadge(unreadCount: number): void {
	if (!("setAppBadge" in navigator)) return;
	if (unreadCount > 0) {
		navigator.setAppBadge(unreadCount);
	} else {
		navigator.clearAppBadge?.();
	}
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const MAX_NOTIFICATIONS = 100;

// ----------------------------------------------------------------------------
// Computed unread count
// ----------------------------------------------------------------------------

function countUnread(notifications: readonly Notification[]): number {
	return notifications.filter((n) => !n.read).length;
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useNotificationStore = create<NotificationStore>((set, get) => ({
	notifications: [],
	unreadCount: 0,

	notify(opts) {
		const notification: Notification = {
			id: createId(),
			appId: opts.appId,
			title: opts.title,
			body: opts.body,
			timestamp: Date.now(),
			read: false,
			urgency: opts.urgency ?? "medium",
			tag: opts.tag,
			action: opts.action,
		};

		set((state) => {
			let next: Notification[];

			// Tag dedup: replace existing notification with same tag
			if (opts.tag) {
				const filtered = state.notifications.filter(
					(n) => n.tag !== opts.tag,
				);
				next = [notification, ...filtered];
			} else {
				next = [notification, ...state.notifications];
			}

			// Evict oldest when exceeding max
			if (next.length > MAX_NOTIFICATIONS) {
				next = next.slice(0, MAX_NOTIFICATIONS);
			}

			const unreadCount = countUnread(next);
			updateBadge(unreadCount);
			return { notifications: next, unreadCount };
		});

		// OS notification (async, fire-and-forget)
		void ensurePermission().then((granted) => {
			if (granted) {
				sendOsNotification(opts.title, opts.body, opts.action);
			}
		});
	},

	markRead(id) {
		set((state) => {
			const notifications = state.notifications.map((n) =>
				n.id === id ? { ...n, read: true } : n,
			);
			const unreadCount = countUnread(notifications);
			updateBadge(unreadCount);
			return { notifications, unreadCount };
		});
	},

	markAllRead() {
		set((state) => {
			const notifications = state.notifications.map((n) =>
				n.read ? n : { ...n, read: true },
			);
			updateBadge(0);
			return { notifications, unreadCount: 0 };
		});
	},

	dismiss(id) {
		set((state) => {
			const notifications = state.notifications.filter(
				(n) => n.id !== id,
			);
			const unreadCount = countUnread(notifications);
			updateBadge(unreadCount);
			return { notifications, unreadCount };
		});
	},

	clearAll() {
		updateBadge(0);
		set({ notifications: [], unreadCount: 0 });
	},
}));
