'use client';

import { useCallback, useRef } from 'react';

export interface NotificationOptions {
	tag?: string;
	badge?: string;
	icon?: string;
	dir?: 'auto' | 'ltr' | 'rtl';
	lang?: string;
}

interface UseNotificationsReturn {
	permission: NotificationPermission | undefined;
	requestPermission: () => Promise<NotificationPermission | undefined>;
	notify: (title: string, body?: string, options?: NotificationOptions) => void;
}

export function useNotifications(): UseNotificationsReturn {
	const permissionRef = useRef<NotificationPermission | undefined>(
		typeof window === 'undefined' || !('Notification' in window) ? undefined : Notification.permission,
	);

	const requestPermission = useCallback(async (): Promise<NotificationPermission | undefined> => {
		if (typeof window === 'undefined') return undefined;
		if (!('Notification' in window)) return undefined;

		try {
			const permission = await Notification.requestPermission();
			permissionRef.current = permission;
			return permission;
		} catch {
			return undefined;
		}
	}, []);

	const notify = useCallback((title: string, body?: string, options?: NotificationOptions): void => {
		if (typeof window === 'undefined') return;
		if (!('Notification' in window)) return;
		if (permissionRef.current !== 'granted') return;

		try {
			new Notification(title, {
				body,
				...options,
			});
		} catch {
			// Silently ignore notification errors
		}
	}, []);

	return {
		permission: permissionRef.current,
		requestPermission,
		notify,
	};
}
