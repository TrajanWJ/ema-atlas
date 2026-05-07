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
	// Trimmed from 6+ lines to 3. The boot terminal is a pre-flight check,
	// not a feature tour — every extra line adds delay without adding info
	// the user reads. We collapse scope/architecture into one EMA line, keep
	// the time-aware greeting (it's the only personal touch), then "ready.".
	const dbDetail =
		entryCount !== undefined && entryCount > 0
			? `db v${dbVersion} · ${entryCount} entries`
			: `db v${dbVersion}`;

	return [
		{
			text: username
				? `EMA · ${username} · ${dbDetail}`
				: `EMA workspace · ${dbDetail}`,
			color: 'success',
		},
		{ text: getGreeting(hour), color: 'accent' },
		{ text: 'ready.', color: 'success' },
	];
}
