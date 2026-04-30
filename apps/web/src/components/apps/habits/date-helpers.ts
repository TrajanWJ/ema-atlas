/**
 * Date utility helpers for habit views.
 * All dates use ISO 'YYYY-MM-DD' string format.
 */

export function toDateStr(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function todayStr(): string {
	return toDateStr(new Date());
}

/** Get Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	// Sunday is 0, we want Monday as start
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Get all 7 days (Mon-Sun) of a week starting from Monday */
export function getWeekDays(monday: Date): Date[] {
	const days: Date[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		days.push(d);
	}
	return days;
}

/** Get the first day of the month */
export function getMonthStart(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Get the last day of the month */
export function getMonthEnd(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Get all calendar cells for a month view (6 rows x 7 cols, Mon start) */
export function getCalendarDays(year: number, month: number): Array<Date | null> {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	// Day of week for first day (0=Sun, 1=Mon, ..., 6=Sat)
	// Convert to Mon=0 format
	let startDow = firstDay.getDay() - 1;
	if (startDow < 0) startDow = 6;

	const cells: Array<Date | null> = [];

	// Leading empty cells
	for (let i = 0; i < startDow; i++) {
		cells.push(null);
	}

	// Actual days
	for (let d = 1; d <= lastDay.getDate(); d++) {
		cells.push(new Date(year, month, d));
	}

	// Trailing empty cells to fill last row
	while (cells.length % 7 !== 0) {
		cells.push(null);
	}

	return cells;
}

const DAY_ABBREVS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function getDayAbbrev(date: Date): string {
	let idx = date.getDay() - 1;
	if (idx < 0) idx = 6;
	return DAY_ABBREVS[idx] ?? 'Mon';
}

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function getMonthName(month: number): string {
	return MONTH_NAMES[month] ?? 'January';
}
