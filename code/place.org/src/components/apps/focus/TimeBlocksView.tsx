'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { ActualVsPlanned } from "./ActualVsPlanned";

type SubTab = "day" | "week" | "avp";

const SUB_TABS: readonly { id: SubTab; label: string }[] = [
	{ id: "day", label: "Day" },
	{ id: "week", label: "Week" },
	{ id: "avp", label: "Actual vs Planned" },
];

// ----------------------------------------------------------------------------
// Date helpers
// ----------------------------------------------------------------------------

function todayDateStr(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDaysToStr(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T12:00:00`);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
	const d = new Date(`${dateStr}T12:00:00`);
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
	const d = new Date(`${dateStr}T12:00:00`);
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
// Sub-tab toggle bar
// ----------------------------------------------------------------------------

function SubTabBar({
	active,
	onChange,
}: {
	readonly active: SubTab;
	readonly onChange: (tab: SubTab) => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				background: "var(--place-surface-1)",
				borderRadius: "6px",
				border: "1px solid var(--place-border-default)",
				overflow: "hidden",
			}}
		>
			{SUB_TABS.map((tab) => {
				const isActive = tab.id === active;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onChange(tab.id)}
						style={{
							padding: "0.2rem 0.4rem",
							fontSize: "0.55rem",
							fontWeight: isActive ? 600 : 400,
							background: isActive
								? "color-mix(in srgb, var(--place-secondary-400) 15%, transparent)"
								: "transparent",
							border: "none",
							color: isActive
								? "var(--place-text-primary)"
								: "var(--place-text-secondary)",
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Navigation button
// ----------------------------------------------------------------------------

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
				width: "22px",
				height: "22px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "transparent",
				border: "1px solid var(--place-border-default)",
				borderRadius: "4px",
				color: "var(--place-text-secondary)",
				cursor: "pointer",
				fontSize: "0.65rem",
				fontWeight: 600,
			}}
		>
			{label}
		</button>
	);
}

// ----------------------------------------------------------------------------
// Toolbar
// ----------------------------------------------------------------------------

function BlocksToolbar({
	date,
	subTab,
	onPrev,
	onNext,
	onToday,
	onSubTabChange,
}: {
	readonly date: string;
	readonly subTab: SubTab;
	readonly onPrev: () => void;
	readonly onNext: () => void;
	readonly onToday: () => void;
	readonly onSubTabChange: (tab: SubTab) => void;
}) {
	const isToday = date === todayDateStr();
	const dateLabel =
		subTab === "week" ? formatWeekRange(date) : formatDateDisplay(date);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.4rem",
				padding: "0.4rem 0.6rem",
				borderBottom: "1px solid var(--place-border-default)",
				flexShrink: 0,
				flexWrap: "wrap",
			}}
		>
			{/* Date nav */}
			<NavButton label="<" onClick={onPrev} />
			<NavButton label=">" onClick={onNext} />
			{!isToday && (
				<button
					type="button"
					onClick={onToday}
					style={{
						padding: "0.15rem 0.35rem",
						fontSize: "0.5rem",
						background:
							"color-mix(in srgb, var(--place-secondary-400) 10%, transparent)",
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

			{/* Date display */}
			<span
				style={{
					fontSize: "0.7rem",
					fontWeight: 600,
					color: "var(--place-text-primary)",
					flex: 1,
					minWidth: 0,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{dateLabel}
			</span>

			{/* Sub-tab toggle */}
			<SubTabBar active={subTab} onChange={onSubTabChange} />
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main container
// ----------------------------------------------------------------------------

export function TimeBlocksView() {
	const [date, setDate] = useState(todayDateStr);
	const [subTab, setSubTab] = useState<SubTab>("day");

	function handlePrev() {
		setDate((d) => addDaysToStr(d, subTab === "week" ? -7 : -1));
	}

	function handleNext() {
		setDate((d) => addDaysToStr(d, subTab === "week" ? 7 : 1));
	}

	function handleToday() {
		setDate(todayDateStr());
	}

	function handleWeekDaySelect(selectedDate: string) {
		setDate(selectedDate);
		setSubTab("day");
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
			}}
		>
			<BlocksToolbar
				date={date}
				subTab={subTab}
				onPrev={handlePrev}
				onNext={handleNext}
				onToday={handleToday}
				onSubTabChange={setSubTab}
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
					{subTab === "week" && (
						<motion.div
							key="week"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							style={{ flex: 1, overflow: "hidden" }}
						>
							<WeekView
								weekStart={new Date(`${date}T12:00:00`)}
								onSelectDate={handleWeekDaySelect}
							/>
						</motion.div>
					)}
					{subTab === "day" && (
						<motion.div
							key={`day-${date}`}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							style={{
								flex: 1,
								overflow: "hidden",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<DayView date={date} />
						</motion.div>
					)}
					{subTab === "avp" && (
						<motion.div
							key={`avp-${date}`}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							style={{
								flex: 1,
								overflow: "hidden",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<ActualVsPlanned date={date} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
