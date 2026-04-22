// Boot message generator with time-aware and context-aware greetings

export type BootLineColor = 'success' | 'accent' | 'muted';

export interface BootLine {
	readonly text: string;
	readonly color: BootLineColor;
}

export function getGreeting(hour: number): string {
	if (hour < 5) return 'burning the midnight oil?';
	if (hour < 8) return 'early bird gets the worm.';
	if (hour < 12) return 'good morning.';
	if (hour < 14) return 'afternoon session.';
	if (hour < 17) return 'deep into it.';
	if (hour < 20) return 'evening mode.';
	return 'night owl session.';
}

export function getBootLines(
	hour: number,
	dbVersion: number,
	entryCount?: number,
	username?: string,
): readonly BootLine[] {
	return [
		{ text: 'place.org v0.2.0', color: 'success' },
		{ text: 'initializing workspace...', color: 'muted' },
		{ text: `database ready (v${dbVersion})`, color: 'muted' },
		...(entryCount !== undefined
			? [{ text: `${entryCount} entries loaded`, color: 'muted' as const }]
			: []),
		{ text: getGreeting(hour), color: 'accent' },
		...(username
			? [{ text: `session restored: ${username}`, color: 'success' as const }]
			: []),
	];
}
