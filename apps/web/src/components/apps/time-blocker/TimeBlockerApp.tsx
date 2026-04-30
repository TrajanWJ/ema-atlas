'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TimerWidget } from "@/src/components/apps/focus/TimerWidget";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { ActualVsPlanned } from "./ActualVsPlanned";

type ViewMode = "day" | "week";
type BottomTab = "timeline" | "comparison";

// ----------------------------------------------------------------------------
// Date helpers
// ----------------------------------------------------------------------------

function todayDateStr(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDaysToStr(dateStr: string, days: number): string {
	const d = new Date(dateStr + "T12:00:00");
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
	const d = new Date(dateStr + "T12:00:00");
	const today = todayDateStr();
	const yesterday = addDaysToStr(today, -1);
	const tomorrow = addDaysToStr(today, 1);

	if (dateStr === today) return "Today";
	if (dateStr === yesterday) return "Yesterday";
	if (dateStr === tomorrow) return "Tomorrow";

	return d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

function getMonday(dateStr: string): Date {
	const d = new Date(dateStr + "T12:00:00");
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function formatWeekRange(dateStr: string): string {
	const monday = getMonday(dateStr);
	const sunday = new Date(monday);
	sunday.setDate(sunday.getDate() + 6);

	const fmt = (d: Date) =>
		d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

	return `${fmt(monday)} - ${fmt(sunday)}`;
}

// ----------------------------------------------------------------------------
// Toolbar
// ----------------------------------------------------------------------------

interface ToolbarProps {
	readonly date: string;
	readonly viewMode: ViewMode;
	readonly onPrev: () => void;
	readonly onNext: () => void;
	readonly onToday: () => void;
	readonly onViewModeChange: (mode: ViewMode) => void;
}

function Toolbar({
	date,
	viewMode,
	onPrev,
	onNext,
	onToday,
	onViewModeChange,
}: ToolbarProps) {
	const isToday = date === todayDateStr();

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.5rem 0.75rem",
				borderBottom: "1px solid var(--place-border-default)",
				flexShrink: 0,
			}}
		>
			{/* Date navigation */}
			<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
				<NavButton label="<" onClick={onPrev} />
				<NavButton label=">" onClick={onNext} />
				{!isToday && (
					<button
						type="button"
						onClick={onToday}
						style={{
							padding: "0.2rem 0.4rem",
							fontSize: "0.55rem",
							background: "color-mix(in srgb, var(--place-secondary-400) 10%, transparent)",
							border: "1px solid var(--place-secondary-400)",
							borderRadius: "4px",
							color: "var(--place-secondary-400)",
							cursor: "pointer",
							fontWeight: 500,
						}}
					>
						Today
					</button>
				)}
			</div>

			{/* Date display */}
			<div
				style={{
					fontSize: "0.75rem",
					fontWeight: 600,
					color: "var(--place-text-primary)",
					flex: 1,
				}}
			>
				{viewMode === "day" ? formatDateDisplay(date) : formatWeekRange(date)}
			</div>

			{/* View toggle */}
			<div
				style={{
					display: "flex",
					background: "var(--place-surface-1)",
					borderRadius: "6px",
					border: "1px solid var(--place-border-default)",
					overflow: "hidden",
				}}
			>
				<ViewToggleButton
					label="Day"
					isActive={viewMode === "day"}
					onClick={() => onViewModeChange("day")}
				/>
				<ViewToggleButton
					label="Week"
					isActive={viewMode === "week"}
					onClick={() => onViewModeChange("week")}
				/>
			</div>

			{/* Timer widget */}
			<TimerWidget />
		</div>
	);
}

function NavButton({
	label,
	onClick,
}: {
	readonly label: string;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				width: "24px",
				height: "24px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "transparent",
				border: "1px solid var(--place-border-default)",
				borderRadius: "4px",
				color: "var(--place-text-secondary)",
				cursor: "pointer",
				fontSize: "0.7rem",
				fontWeight: 600,
			}}
		>
			{label}
		</button>
	);
}

function ViewToggleButton({
	label,
	isActive,
	onClick,
}: {
	readonly label: string;
	readonly isActive: boolean;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				padding: "0.25rem 0.5rem",
				fontSize: "0.6rem",
				fontWeight: isActive ? 600 : 400,
				background: isActive
					? "color-mix(in srgb, var(--place-secondary-400) 15%, transparent)"
					: "transparent",
				border: "none",
				color: isActive ? "var(--place-text-primary)" : "var(--place-text-secondary)",
				cursor: "pointer",
			}}
		>
			{label}
		</button>
	);
}

// ----------------------------------------------------------------------------
// Bottom tab bar (Day view only)
// ----------------------------------------------------------------------------

function BottomTabBar({
	active,
	onChange,
}: {
	readonly active: BottomTab;
	readonly onChange: (tab: BottomTab) => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				borderTop: "1px solid var(--place-border-default)",
				flexShrink: 0,
			}}
		>
			<TabButton
				label="Timeline"
				isActive={active === "timeline"}
				onClick={() => onChange("timeline")}
			/>
			<TabButton
				label="Actual vs Planned"
				isActive={active === "comparison"}
				onClick={() => onChange("comparison")}
			/>
		</div>
	);
}

function TabButton({
	label,
	isActive,
	onClick,
}: {
	readonly label: string;
	readonly isActive: boolean;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				flex: 1,
				padding: "0.4rem 0.5rem",
				fontSize: "0.6rem",
				fontWeight: isActive ? 600 : 400,
				letterSpacing: "0.04em",
				border: "none",
				borderTop: isActive
					? "2px solid var(--place-secondary-400)"
					: "2px solid transparent",
				background: isActive
					? "color-mix(in srgb, var(--place-secondary-400) 6%, transparent)"
					: "transparent",
				color: isActive ? "var(--place-text-primary)" : "var(--place-text-secondary)",
				cursor: "pointer",
				transition: "all 0.2s",
				textTransform: "uppercase",
			}}
		>
			{label}
		</button>
	);
}

// ----------------------------------------------------------------------------
// Main app
// ----------------------------------------------------------------------------

export function TimeBlockerApp() {
	const [date, setDate] = useState(todayDateStr);
	const [viewMode, setViewMode] = useState<ViewMode>("day");
	const [bottomTab, setBottomTab] = useState<BottomTab>("timeline");

	function handlePrev() {
		setDate((d) => addDaysToStr(d, viewMode === "day" ? -1 : -7));
	}

	function handleNext() {
		setDate((d) => addDaysToStr(d, viewMode === "day" ? 1 : 7));
	}

	function handleToday() {
		setDate(todayDateStr());
	}

	function handleViewModeChange(mode: ViewMode) {
		setViewMode(mode);
	}

	function handleWeekDaySelect(selectedDate: string) {
		setDate(selectedDate);
		setViewMode("day");
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				background: "var(--place-surface-1)",
			}}
		>
			<Toolbar
				date={date}
				viewMode={viewMode}
				onPrev={handlePrev}
				onNext={handleNext}
				onToday={handleToday}
				onViewModeChange={handleViewModeChange}
			/>

			<div
				style={{
					flex: 1,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					position: "relative",
				}}
			>
				<AnimatePresence mode="wait">
					{viewMode === "week" ? (
						<motion.div
							key="week"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							style={{ flex: 1, overflow: "hidden" }}
						>
							<WeekView
								weekStart={new Date(date + "T12:00:00")}
								onSelectDate={handleWeekDaySelect}
							/>
						</motion.div>
					) : (
						<motion.div
							key={`day-${date}-${bottomTab}`}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							style={{
								flex: 1,
								overflow: "hidden",
								display: "flex",
								flexDirection: "column",
							}}
						>
							{bottomTab === "timeline" ? (
								<DayView date={date} />
							) : (
								<ActualVsPlanned date={date} />
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{viewMode === "day" && (
				<BottomTabBar active={bottomTab} onChange={setBottomTab} />
			)}
		</div>
	);
}
