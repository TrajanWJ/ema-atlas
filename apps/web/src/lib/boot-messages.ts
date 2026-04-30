// Boot message generator — EMA-flavored. The voice: declarative, calm,
// technical. Daemon-owned architecture, local-first, scope-aware.

export type BootLineColor = 'success' | 'accent' | 'muted';

export interface BootLine {
	readonly text: string;
	readonly color: BootLineColor;
}

export function getGreeting(hour: number): string {
	if (hour < 5) return 'late session.';
	if (hour < 8) return 'morning.';
	if (hour < 12) return 'workspace ready.';
	if (hour < 14) return 'midday session.';
	if (hour < 17) return 'deep work mode.';
	if (hour < 20) return 'evening session.';
	return 'night session.';
}

export function getBootLines(
	hour: number,
	dbVersion: number,
	entryCount?: number,
	username?: string,
): readonly BootLine[] {
	return [
		{ text: 'EMA workspace · local-first', color: 'success' },
		{ text: 'daemon-owned architecture', color: 'accent' },
		{ text: 'scope: EMA / EMA Studio / 0.0.5', color: 'muted' },
		{ text: `database ready (v${dbVersion})`, color: 'muted' },
		...(entryCount !== undefined && entryCount > 0
			? [{ text: `${entryCount} entries restored`, color: 'muted' as const }]
			: []),
		...(username
			? [{ text: `identity: ${username}`, color: 'success' as const }]
			: []),
		{ text: getGreeting(hour), color: 'accent' },
		{ text: 'ready.', color: 'success' },
	];
}
