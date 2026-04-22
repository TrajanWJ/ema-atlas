'use client';

interface CalendarStripProps {
	readonly currentDate: string;
	readonly onNavigate: (date: string) => void;
}

function offsetDate(dateStr: string, days: number): string {
	const d = new Date(dateStr + "T00:00:00");
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function formatDisplay(dateStr: string): string {
	const today = new Date().toISOString().slice(0, 10);
	if (dateStr === today) return "Today";
	const d = new Date(dateStr + "T00:00:00");
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CalendarStrip({ currentDate, onNavigate }: CalendarStripProps) {
	const prev = offsetDate(currentDate, -1);
	const next = offsetDate(currentDate, 1);
	const today = new Date().toISOString().slice(0, 10);
	const isToday = currentDate === today;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.5rem 0.75rem",
				borderBottom: "1px solid var(--border)",
				fontSize: "0.75rem",
			}}
		>
			<button
				type="button"
				onClick={() => onNavigate(prev)}
				style={{
					background: "none",
					border: "none",
					color: "var(--text-secondary)",
					cursor: "pointer",
					padding: "0.25rem 0.5rem",
					borderRadius: "4px",
				}}
				aria-label="Previous day"
			>
				◄
			</button>

			<span
				style={{
					flex: 1,
					textAlign: "center",
					color: "var(--text-primary)",
					fontWeight: 600,
					letterSpacing: "0.02em",
				}}
			>
				{formatDisplay(currentDate)}
			</span>

			{!isToday && (
				<button
					type="button"
					onClick={() => onNavigate(today)}
					style={{
						background: "none",
						border: "1px solid var(--border)",
						color: "var(--accent-blue)",
						cursor: "pointer",
						padding: "0.2rem 0.5rem",
						borderRadius: "4px",
						fontSize: "0.7rem",
					}}
				>
					today
				</button>
			)}

			<button
				type="button"
				onClick={() => onNavigate(next)}
				disabled={next > today}
				style={{
					background: "none",
					border: "none",
					color: next > today ? "var(--text-secondary)" : "var(--text-secondary)",
					cursor: next > today ? "not-allowed" : "pointer",
					padding: "0.25rem 0.5rem",
					borderRadius: "4px",
					opacity: next > today ? 0.3 : 1,
				}}
				aria-label="Next day"
			>
				►
			</button>
		</div>
	);
}
