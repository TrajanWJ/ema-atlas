'use client';

import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/src/stores/focus-store';
import { useNotifications } from '@/src/hooks/use-notifications';

/**
 * Manages notifications for focus timer:
 * - Requests permission on first session start
 * - Sends notification when target is reached
 * - Only notifies once per block
 */
export function FocusNotificationManager(): null {
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const isRunning = useFocusStore((s) => s.isRunning);

	const { requestPermission, notify } = useNotifications();

	const hasRequestedPermissionRef = useRef(false);
	const hasNotifiedRef = useRef(false);
	const lastBlockIdRef = useRef<string | null>(null);

	// Request permission on first session start
	useEffect(() => {
		if (isRunning && !hasRequestedPermissionRef.current) {
			hasRequestedPermissionRef.current = true;
			requestPermission().catch(() => {});
		}
	}, [isRunning, requestPermission]);

	// Reset notification flag when block changes
	useEffect(() => {
		if (activeBlock?.id !== lastBlockIdRef.current) {
			hasNotifiedRef.current = false;
			lastBlockIdRef.current = activeBlock?.id ?? null;
		}
	}, [activeBlock?.id]);

	// Send notification when target is reached
	useEffect(() => {
		if (!activeBlock || !isRunning || hasNotifiedRef.current) return;
		if (elapsedMs < activeBlock.targetMs) return;

		hasNotifiedRef.current = true;

		const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);

		notify('Target reached!', `You've been focusing for ${elapsedMinutes} minutes. Transition when ready.`, {
			tag: 'focus-target-reached',
		});
	}, [activeBlock, elapsedMs, isRunning, notify]);

	return null;
}
