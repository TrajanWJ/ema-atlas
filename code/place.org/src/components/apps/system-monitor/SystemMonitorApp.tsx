'use client';

import { useEffect, useState, useCallback } from "react";
import { useWindowStore } from "@/src/stores/window-store";
import { eventBus } from "@/src/lib/event-bus";
import { getApp } from "@/src/lib/app-registry";
import { APP_LABELS } from "@/src/lib/constants";
import type { AppEvent } from "@/src/lib/event-bus";
import type { AppId, ProcessWindow } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 2_000;
const MAX_EVENTS = 50;
const MAX_PAYLOAD_LENGTH = 60;

type MonitorTab = "windows" | "events" | "stats";

const TABS: readonly { id: MonitorTab; label: string }[] = [
	{ id: "windows", label: "Windows" },
	{ id: "events", label: "Events" },
	{ id: "stats", label: "Stats" },
];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getDotColor(appId: string): string {
	const app = getApp(appId);
	return app?.titlebarDotColor ?? "rgba(255,255,255,0.4)";
}

function getAppLabel(appId: string): string {
	return APP_LABELS[appId as AppId] ?? appId;
}

function formatUptime(openedAtMs: number, nowMs: number): string {
	const diff = Math.max(0, nowMs - openedAtMs);
	const seconds = Math.floor(diff / 1000) % 60;
	const minutes = Math.floor(diff / 60_000) % 60;
	const hours = Math.floor(diff / 3_600_000);
	if (hours > 0) return `${hours}h ${minutes}m`;
	if (minutes > 0) return `${minutes}m ${seconds}s`;
	return `${seconds}s`;
}

function truncatePayload(payload: Record<string, unknown>): string {
	const json = JSON.stringify(payload);
	if (json.length <= MAX_PAYLOAD_LENGTH) return json;
	return `${json.slice(0, MAX_PAYLOAD_LENGTH - 1)}\u2026`;
}

function formatTimestamp(ts: number): string {
	const d = new Date(ts);
	return d.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

// ----------------------------------------------------------------------------
// Tab bar
// ----------------------------------------------------------------------------

function TabBar({
	active,
	onChange,
}: {
	readonly active: MonitorTab;
	readonly onChange: (tab: MonitorTab) => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				padding: "0.5rem 0.75rem",
				borderBottom: "1px solid var(--place-border-default)",
				flexShrink: 0,
			}}
		>
			<div
				style={{
					display: "flex",
					gap: "2px",
					background: "var(--place-surface-3)",
					borderRadius: "6px",
					padding: "2px",
				}}
			>
				{TABS.map((tab) => {
					const isActive = tab.id === active;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onChange(tab.id)}
							style={{
								fontSize: "0.65rem",
								padding: "0.2rem 0.5rem",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
								background: isActive
									? "var(--place-secondary-subtle)"
									: "transparent",
								color: isActive
									? "var(--place-secondary-400)"
									: "var(--place-text-tertiary)",
								fontWeight: isActive ? 600 : 400,
								transition: "background 0.15s, color 0.15s",
							}}
						>
							{tab.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Open Windows panel
// ----------------------------------------------------------------------------

function OpenWindowsPanel() {
	const windows = useWindowStore((s) => s.windows);
	const focusWindow = useWindowStore((s) => s.focusWindow);
	const closeWindow = useWindowStore((s) => s.closeWindow);
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1_000);
		return () => clearInterval(id);
	}, []);

	const entries = Array.from(windows.values());

	if (entries.length === 0) {
		return <EmptyState message="No windows open" />;
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
			{entries.map((win) => (
				<WindowRow
					key={win.id}
					win={win}
					now={now}
					onFocus={focusWindow}
					onClose={closeWindow}
				/>
			))}
		</div>
	);
}

function WindowRow({
	win,
	now,
	onFocus,
	onClose,
}: {
	readonly win: ProcessWindow;
	readonly now: number;
	readonly onFocus: (id: string) => void;
	readonly onClose: (id: string) => void;
}) {
	const dotColor = getDotColor(win.appId);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.4rem 0.6rem",
				borderRadius: "4px",
				background: "rgba(255,255,255,0.03)",
			}}
		>
			<span
				style={{
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					background: dotColor,
					flexShrink: 0,
				}}
			/>
			<span
				style={{
					flex: 1,
					fontSize: "0.72rem",
					color: "var(--place-text-primary)",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{getAppLabel(win.appId)}
			</span>
			<span
				style={{
					fontSize: "0.6rem",
					color: "var(--place-text-secondary)",
					fontFamily: "monospace",
					flexShrink: 0,
				}}
			>
				{win.id.slice(0, 6)}
			</span>
			<span
				style={{
					fontSize: "0.6rem",
					color: "var(--place-text-secondary)",
					fontVariantNumeric: "tabular-nums",
					minWidth: "50px",
					textAlign: "right",
					flexShrink: 0,
				}}
			>
				{formatUptime(now - (win.zIndex * 100), now)}
			</span>
			<SmallButton label="Focus" onClick={() => onFocus(win.id)} />
			<SmallButton label="Close" onClick={() => onClose(win.id)} />
		</div>
	);
}

function SmallButton({
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
				padding: "0.25rem 0.5rem",
				fontSize: "0.65rem",
				borderRadius: "6px",
				border: "1px solid var(--place-border-default)",
				background: "transparent",
				color: "var(--place-text-secondary)",
				cursor: "pointer",
				flexShrink: 0,
			}}
		>
			{label}
		</button>
	);
}

// ----------------------------------------------------------------------------
// Event Activity panel
// ----------------------------------------------------------------------------

function EventActivityPanel() {
	const [events, setEvents] = useState<readonly AppEvent[]>([]);

	const refresh = useCallback(() => {
		setEvents(eventBus.history(MAX_EVENTS));
	}, []);

	useEffect(() => {
		refresh();
		const id = setInterval(refresh, REFRESH_INTERVAL_MS);
		return () => clearInterval(id);
	}, [refresh]);

	if (events.length === 0) {
		return <EmptyState message="No events recorded yet" />;
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
			{[...events].reverse().map((ev) => (
				<EventRow key={ev.id} event={ev} />
			))}
		</div>
	);
}

function EventRow({ event }: { readonly event: AppEvent }) {
	const dotColor = getDotColor(event.appId);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.4rem",
				padding: "0.3rem 0.6rem",
				fontSize: "0.62rem",
			}}
		>
			<span
				style={{
					width: "6px",
					height: "6px",
					borderRadius: "50%",
					background: dotColor,
					flexShrink: 0,
				}}
			/>
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontFamily: "monospace",
					fontVariantNumeric: "tabular-nums",
					flexShrink: 0,
					minWidth: "60px",
				}}
			>
				{formatTimestamp(event.timestamp)}
			</span>
			<span
				style={{
					color: dotColor,
					fontWeight: 500,
					flexShrink: 0,
					minWidth: "60px",
				}}
			>
				{getAppLabel(event.appId)}
			</span>
			<span
				style={{
					color: "var(--place-text-primary)",
					flexShrink: 0,
				}}
			>
				{event.eventType}
			</span>
			<span
				style={{
					flex: 1,
					color: "var(--place-text-secondary)",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
					opacity: 0.7,
				}}
			>
				{truncatePayload(event.payload)}
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Usage Stats panel
// ----------------------------------------------------------------------------

function UsageStatsPanel() {
	const [counts, setCounts] = useState<readonly { appId: string; count: number }[]>([]);

	const refresh = useCallback(() => {
		const events = eventBus.history();
		const map = new Map<string, number>();
		for (const ev of events) {
			map.set(ev.appId, (map.get(ev.appId) ?? 0) + 1);
		}
		const sorted = Array.from(map.entries())
			.map(([appId, count]) => ({ appId, count }))
			.sort((a, b) => b.count - a.count);
		setCounts(sorted);
	}, []);

	useEffect(() => {
		refresh();
		const id = setInterval(refresh, REFRESH_INTERVAL_MS);
		return () => clearInterval(id);
	}, [refresh]);

	if (counts.length === 0) {
		return <EmptyState message="No event data to chart" />;
	}

	const maxCount = counts[0]?.count ?? 1;

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
			{counts.map(({ appId, count }) => (
				<BarRow
					key={appId}
					appId={appId}
					count={count}
					maxCount={maxCount}
				/>
			))}
		</div>
	);
}

function BarRow({
	appId,
	count,
	maxCount,
}: {
	readonly appId: string;
	readonly count: number;
	readonly maxCount: number;
}) {
	const dotColor = getDotColor(appId);
	const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.2rem 0.6rem",
			}}
		>
			<span
				style={{
					width: "6px",
					height: "6px",
					borderRadius: "50%",
					background: dotColor,
					flexShrink: 0,
				}}
			/>
			<span
				style={{
					fontSize: "0.65rem",
					color: "var(--place-text-primary)",
					minWidth: "70px",
					flexShrink: 0,
				}}
			>
				{getAppLabel(appId)}
			</span>
			<div
				style={{
					flex: 1,
					height: "12px",
					borderRadius: "3px",
					background: "color-mix(in srgb, var(--place-text-primary) 6%, transparent)",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${pct}%`,
						height: "100%",
						borderRadius: "3px",
						background: dotColor,
						transition: "width 0.3s ease",
					}}
				/>
			</div>
			<span
				style={{
					fontSize: "0.6rem",
					color: "var(--place-text-secondary)",
					fontFamily: "monospace",
					fontVariantNumeric: "tabular-nums",
					minWidth: "24px",
					textAlign: "right",
					flexShrink: 0,
				}}
			>
				{count}
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

function EmptyState({ message }: { readonly message: string }) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				minHeight: "80px",
				color: "var(--place-text-secondary)",
				fontSize: "0.72rem",
			}}
		>
			{message}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main app
// ----------------------------------------------------------------------------

export function SystemMonitorApp() {
	const [activeTab, setActiveTab] = useState<MonitorTab>("windows");

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				background: "transparent",
			}}
		>
			<TabBar active={activeTab} onChange={setActiveTab} />
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "0.5rem 0",
				}}
			>
				{activeTab === "windows" && <OpenWindowsPanel />}
				{activeTab === "events" && <EventActivityPanel />}
				{activeTab === "stats" && <UsageStatsPanel />}
			</div>
		</div>
	);
}
