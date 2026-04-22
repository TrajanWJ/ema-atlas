'use client';

import { useMemo } from "react";
import {
	todayLocal,
	offsetDate,
	formatDateLabel,
	dayOfWeek,
	weekDates,
} from "@/src/lib/date-utils";

interface CalendarStripProps {
	readonly currentDate: string;
	readonly onNavigate: (date: string) => void;
}

function WeekDay({
	dateStr,
	isSelected,
	isToday,
	isFuture,
	onSelect,
}: {
	readonly dateStr: string;
	readonly isSelected: boolean;
	readonly isToday: boolean;
	readonly isFuture: boolean;
	readonly onSelect: () => void;
}) {
	const day = new Date(dateStr + "T12:00:00").getDate();
	const label = dayOfWeek(dateStr);

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-label={`${label} ${dateStr}`}
			aria-pressed={isSelected}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "2px",
				padding: "0.25rem 0.4rem",
				borderRadius: "6px",
				border: isSelected
					? "1px solid var(--place-secondary-400)"
					: "1px solid transparent",
				background: isSelected ? "var(--place-surface-1)" : "transparent",
				color: isSelected
					? "var(--place-secondary-400)"
					: isFuture
						? "var(--place-text-tertiary, rgba(255,255,255,0.4))"
						: "var(--place-text-primary)",
				cursor: "pointer",
				opacity: isFuture ? 0.6 : 1,
				fontSize: "0.7rem",
				lineHeight: 1.3,
				minWidth: "2rem",
				transition: "border-color 0.15s, background 0.15s",
			}}
		>
			<span
				style={{
					fontSize: "0.6rem",
					textTransform: "uppercase",
					letterSpacing: "0.04em",
					color: isSelected
						? "var(--place-secondary-400)"
						: "var(--place-text-secondary)",
				}}
			>
				{label}
			</span>
			<span style={{ fontWeight: isToday ? 700 : 500 }}>{day}</span>
			{isToday && (
				<span
					style={{
						width: 4,
						height: 4,
						borderRadius: "50%",
						background: "var(--place-secondary-400)",
					}}
				/>
			)}
		</button>
	);
}

export function CalendarStrip({ currentDate, onNavigate }: CalendarStripProps) {
	const today = todayLocal();
	const week = useMemo(() => weekDates(currentDate), [currentDate]);

	const handlePrevWeek = () => {
		onNavigate(offsetDate(currentDate, -7));
	};

	const handleNextWeek = () => {
		onNavigate(offsetDate(currentDate, 7));
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				borderBottom: "1px solid var(--place-border-default)",
				padding: "0.4rem 0.5rem 0.35rem",
				gap: "0.3rem",
			}}
		>
			{/* Header row: arrows + date label */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<button
					type="button"
					onClick={() => onNavigate(offsetDate(currentDate, -1))}
					aria-label="Previous day"
					style={{
						background: "none",
						border: "none",
						color: "var(--place-text-secondary)",
						cursor: "pointer",
						padding: "0.15rem 0.4rem",
						fontSize: "0.75rem",
					}}
				>
					&#9664;
				</button>

				<span
					style={{
						color: "var(--place-text-primary)",
						fontWeight: 600,
						fontSize: "0.75rem",
						letterSpacing: "0.02em",
					}}
				>
					{formatDateLabel(currentDate)}
					{currentDate !== today && (
						<>
							{" "}
							<span
								style={{
									color: "var(--place-text-secondary)",
									fontSize: "0.65rem",
									fontWeight: 400,
								}}
							>
								{currentDate}
							</span>
						</>
					)}
				</span>

				<div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
					{currentDate !== today && (
						<button
							type="button"
							onClick={() => onNavigate(today)}
							style={{
								background: "none",
								border: "1px solid var(--place-border-default)",
								color: "var(--place-secondary-400)",
								cursor: "pointer",
								padding: "0.15rem 0.4rem",
								borderRadius: "4px",
								fontSize: "0.6rem",
								letterSpacing: "0.03em",
							}}
						>
							today
						</button>
					)}
					<button
						type="button"
						onClick={() => onNavigate(offsetDate(currentDate, 1))}
						aria-label="Next day"
						style={{
							background: "none",
							border: "none",
							color: "var(--place-text-secondary)",
							cursor: "pointer",
							padding: "0.15rem 0.4rem",
							fontSize: "0.75rem",
						}}
					>
						&#9654;
					</button>
				</div>
			</div>

			{/* Week strip */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "2px",
				}}
			>
				<button
					type="button"
					onClick={handlePrevWeek}
					aria-label="Previous week"
					style={{
						background: "none",
						border: "none",
						color: "var(--place-text-secondary)",
						cursor: "pointer",
						padding: "0 0.2rem",
						fontSize: "0.6rem",
					}}
				>
					&#9664;
				</button>
				{week.map((dateStr) => (
					<WeekDay
						key={dateStr}
						dateStr={dateStr}
						isSelected={dateStr === currentDate}
						isToday={dateStr === today}
						isFuture={dateStr > today}
						onSelect={() => onNavigate(dateStr)}
					/>
				))}
				<button
					type="button"
					onClick={handleNextWeek}
					aria-label="Next week"
					style={{
						background: "none",
						border: "none",
						color: "var(--place-text-secondary)",
						cursor: "pointer",
						padding: "0 0.2rem",
						fontSize: "0.6rem",
					}}
				>
					&#9654;
				</button>
			</div>
		</div>
	);
}
