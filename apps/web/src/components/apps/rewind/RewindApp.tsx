'use client';

import { useEffect, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { weekBundle, composeWeekNarrative } from "@/src/context/week-bundle";
import type { WeekBundle } from "@/src/context/week-bundle";

export function RewindApp() {
	const [bundle, setBundle] = useState<WeekBundle | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void (async () => {
			try {
				const db = getDbClient();
				const b = await weekBundle(db);
				setBundle(b);
			} catch (err) {
				console.error("[rewind] load failed:", err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading || !bundle) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Rewinding…
			</div>
		);
	}

	const narrative = composeWeekNarrative(bundle);
	const maxFocus = Math.max(...bundle.days.map((d) => d.focusMinutesTotal), 1);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontSize: "0.85rem",
				overflow: "auto",
				padding: "1rem 1.25rem",
			}}
		>
			{/* Header */}
			<div style={{ marginBottom: "1rem" }}>
				<div
					style={{
						fontSize: "0.65rem",
						textTransform: "uppercase",
						letterSpacing: "0.12em",
						color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
						fontWeight: 600,
					}}
				>
					Rewind — {bundle.weekStart} → {bundle.weekEnd}
				</div>
				<div
					style={{
						fontSize: "1.15rem",
						lineHeight: 1.4,
						marginTop: "0.5rem",
						color: "var(--place-text-primary, rgba(255,255,255,0.92))",
					}}
				>
					{narrative}
				</div>
			</div>

			{/* 7-day focus bars */}
			<Section label="Focus by day" />
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(7, 1fr)",
					gap: "0.375rem",
					marginBottom: "1.25rem",
				}}
			>
				{bundle.days.map((d) => {
					const pct = Math.round((d.focusMinutesTotal / maxFocus) * 100);
					return (
						<div
							key={d.date}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "3px",
							}}
						>
							<div
								style={{
									width: "100%",
									height: "60px",
									background: "rgba(255,255,255,0.03)",
									borderRadius: "4px",
									position: "relative",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										position: "absolute",
										bottom: 0,
										left: 0,
										right: 0,
										height: `${pct}%`,
										background: "linear-gradient(180deg, #8ab4ff, #6b95f0)",
										transition: "height 0.3s ease",
									}}
								/>
							</div>
							<div
								style={{
									fontSize: "0.6rem",
									color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
								}}
							>
								{new Date(d.date).toLocaleDateString([], { weekday: "short" }).slice(0, 2)}
							</div>
							<div
								style={{
									fontSize: "0.58rem",
									color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
								}}
							>
								{d.focusMinutesTotal}m
							</div>
						</div>
					);
				})}
			</div>

			{/* Top right-now */}
			{bundle.topRightNowStates.length > 0 && (
				<>
					<Section label="What you spent time on" />
					<ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem 0" }}>
						{bundle.topRightNowStates.map((s, i) => (
							<li
								key={i}
								style={{
									fontSize: "0.82rem",
									padding: "0.3rem 0",
									color: "var(--place-text-secondary, rgba(255,255,255,0.75))",
								}}
							>
								<span style={{ opacity: 0.5, marginRight: "6px" }}>◉</span>
								{s}
							</li>
						))}
					</ul>
				</>
			)}

			{/* Big numbers */}
			<Section label="The week in numbers" />
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "0.625rem",
					marginTop: "0.5rem",
				}}
			>
				<Stat label="Tasks done" value={bundle.tasksCompleted} />
				<Stat label="Loops closed" value={bundle.loopsClosed} />
				<Stat label="Captures" value={bundle.capturesTotal} />
				<Stat label="Habits" value={bundle.habitsCompleted} />
				<Stat label="Decisions" value={bundle.decisionsCount} />
				<Stat label="Learnings" value={bundle.learningsCount} />
			</div>
		</div>
	);
}

function Section({ label }: { readonly label: string }) {
	return (
		<div
			style={{
				fontSize: "0.6rem",
				textTransform: "uppercase",
				letterSpacing: "0.12em",
				color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
				fontWeight: 600,
				marginBottom: "0.5rem",
			}}
		>
			{label}
		</div>
	);
}

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
	return (
		<div
			style={{
				background: "rgba(255,255,255,0.025)",
				border: "1px solid rgba(255,255,255,0.05)",
				borderRadius: "8px",
				padding: "0.625rem",
				textAlign: "center",
			}}
		>
			<div
				style={{
					fontSize: "1.5rem",
					fontWeight: 600,
					color: "var(--place-text-primary, rgba(255,255,255,0.92))",
				}}
			>
				{value}
			</div>
			<div
				style={{
					fontSize: "0.62rem",
					color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					marginTop: "3px",
				}}
			>
				{label}
			</div>
		</div>
	);
}
