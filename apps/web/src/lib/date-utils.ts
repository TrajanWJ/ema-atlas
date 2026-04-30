// ----------------------------------------------------------------------------
// Local-date utilities for the journal (timezone-safe)
// ----------------------------------------------------------------------------

/** Returns today's date as "YYYY-MM-DD" in the local timezone. */
export function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Offsets a "YYYY-MM-DD" string by `days` and returns another "YYYY-MM-DD". */
export function offsetDate(dateStr: string, days: number): string {
	const d = new Date(dateStr + "T12:00:00"); // noon avoids DST edge cases
	d.setDate(d.getDate() + days);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Human-readable label: "Today", "Yesterday", or "Mar 21". */
export function formatDateLabel(dateStr: string): string {
	const today = todayLocal();
	if (dateStr === today) return "Today";
	const yesterday = offsetDate(today, -1);
	if (dateStr === yesterday) return "Yesterday";
	const d = new Date(dateStr + "T12:00:00");
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Short day-of-week label: "Mon", "Tue", etc. */
export function dayOfWeek(dateStr: string): string {
	const d = new Date(dateStr + "T12:00:00");
	return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Returns an array of 7 date strings for the week containing `dateStr` (Mon–Sun). */
export function weekDates(dateStr: string): string[] {
	const d = new Date(dateStr + "T12:00:00");
	const day = d.getDay(); // 0=Sun
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = offsetDate(dateStr, mondayOffset);
	return Array.from({ length: 7 }, (_, i) => offsetDate(monday, i));
}
