'use client';

import { useEffect, useState } from "react";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useFocusStore } from "@/src/stores/focus-store";
import { formatDate, formatTime } from "@/src/lib/time";
import { useWeather } from "@/src/hooks/use-weather";
import { SoundToggle } from "./SoundToggle";

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	if (totalMinutes === 0) return "";
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	return `${minutes}m`;
}

export function AmbientBar() {
	const inboxCount = useDesktopStore((s) => s.inboxCount);
	const oneThing = useDesktopStore((s) => s.oneThing);
	const [now, setNow] = useState(() => new Date());
	const weather = useWeather();

	const isRunning = useFocusStore((s) => s.isRunning);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const todayFocusMs = useFocusStore((s) => s.todayStats.totalFocusMs);

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(id);
	}, []);

	const focusDisplay = isRunning
		? formatMs(elapsedMs)
		: formatMs(todayFocusMs);

	return (
		<div
			role="banner"
			className="glass absolute top-0 left-0 right-0 z-50 flex h-10 items-center px-4"
		>
			{/* Left: brand */}
			<span
				style={{
					color: "var(--accent-blue)",
					fontSize: "0.75rem",
					fontWeight: 600,
					letterSpacing: "0.05em",
					flexShrink: 0,
				}}
			>
				place.org
			</span>

			{/* Left-center: ONE thing */}
			{oneThing && (
				<span
					style={{
						color: "var(--text-secondary)",
						fontSize: "0.7rem",
						marginLeft: "1rem",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						maxWidth: "200px",
						flex: "0 1 auto",
					}}
					title={oneThing}
				>
					{oneThing}
				</span>
			)}

			<span style={{ flex: 1 }} />

			{/* Center: date + time + weather */}
			<span
				style={{
					color: "var(--text-secondary)",
					fontSize: "0.75rem",
					position: "absolute",
					left: "50%",
					transform: "translateX(-50%)",
				}}
			>
				{formatDate(now)} &nbsp; {formatTime(now)}
				{!weather.error && weather.icon && (
					<>
						&nbsp; {weather.icon} {weather.temp}°F
					</>
				)}
			</span>

			{/* Right: focus time + inbox count */}
			<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
				{focusDisplay && (
					<span
						style={{
							color: isRunning ? "var(--accent-blue)" : "var(--text-secondary)",
							fontSize: "0.75rem",
							fontVariantNumeric: "tabular-nums",
							fontWeight: isRunning ? 600 : 400,
						}}
					>
						{isRunning ? "⏱ " : ""}{focusDisplay}
					</span>
				)}
				{inboxCount > 0 && (
					<span
						style={{
							color: "var(--accent-warm)",
							fontSize: "0.75rem",
							fontWeight: 500,
						}}
					>
						{inboxCount} in inbox
					</span>
				)}
				<SoundToggle />
			</div>
		</div>
	);
}
