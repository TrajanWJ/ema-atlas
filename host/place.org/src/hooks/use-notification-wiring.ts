'use client';

import { useEffect } from 'react';
import { eventBus } from '@/src/lib/event-bus';
import { useNotificationStore } from '@/src/stores/notification-store';
import type { AppEvent } from '@/src/lib/event-bus';

// ----------------------------------------------------------------------------
// Streak milestone check
// ----------------------------------------------------------------------------

const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90, 100, 365] as const;

function isStreakMilestone(streak: number): boolean {
	return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

// ----------------------------------------------------------------------------
// Event handlers
// ----------------------------------------------------------------------------

function handleTimerCompleted(event: AppEvent): void {
	const duration = event.payload.duration as number | undefined;
	const label = duration && duration > 0 ? `${duration}min` : '';
	const body = label
		? `You completed a ${label} focus session.`
		: 'You completed a focus session.';

	useNotificationStore.getState().notify({
		appId: event.appId,
		title: 'Focus session complete',
		body,
		urgency: 'medium',
		tag: 'timer:session_completed',
	});
}

function handleHabitToggled(event: AppEvent): void {
	const name = (event.payload.name as string) ?? 'Unknown';
	const streak = event.payload.streak as number | undefined;

	if (streak && isStreakMilestone(streak)) {
		useNotificationStore.getState().notify({
			appId: event.appId,
			title: `${streak}-day streak on ${name}!`,
			body: `Keep it going — you've hit ${streak} days in a row.`,
			urgency: 'high',
			tag: `habits:streak:${name}`,
		});
	}
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

const WELCOME_KEY = 'place-welcome-notification-sent';

function sendWelcomeNotification(): void {
	if (typeof window === 'undefined') return;
	if (localStorage.getItem(WELCOME_KEY)) return;

	useNotificationStore.getState().notify({
		appId: 'system',
		title: 'Welcome to place.org',
		body: 'Your virtual desktop is ready. Click any icon in the dock to get started.',
		urgency: 'low',
		tag: 'system:welcome',
	});

	localStorage.setItem(WELCOME_KEY, '1');
}

export function useNotificationWiring(): void {
	useEffect(() => {
		// Welcome notification for new visitors (slight delay for desktop to render)
		const welcomeTimer = setTimeout(sendWelcomeNotification, 500);

		const unsubTimer = eventBus.on(
			'timer:session_completed',
			handleTimerCompleted,
		);
		const unsubFocus = eventBus.on(
			'focus:session_completed',
			handleTimerCompleted,
		);
		const unsubHabits = eventBus.on(
			'habits:habit_toggled',
			handleHabitToggled,
		);

		return () => {
			clearTimeout(welcomeTimer);
			unsubTimer();
			unsubFocus();
			unsubHabits();
		};
	}, []);
}
