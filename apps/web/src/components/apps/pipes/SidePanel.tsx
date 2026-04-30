'use client';

import { useMemo } from "react";
import { getAllApps, type PlaceApp } from "@/src/lib/app-registry";
import type { DragItem } from "./types";

// ----------------------------------------------------------------------------
// Gather triggers and actions from all registered apps
// ----------------------------------------------------------------------------

interface CatalogEntry {
	readonly appId: string;
	readonly appName: string;
	readonly color: string;
	readonly icon: React.ReactNode;
	readonly itemId: string;
	readonly label: string;
	readonly type: "trigger" | "action";
}

function gatherTriggers(
	apps: readonly PlaceApp[],
): readonly CatalogEntry[] {
	const result: CatalogEntry[] = [];
	for (const app of apps) {
		if (!app.triggers) continue;
		for (const t of app.triggers) {
			result.push({
				appId: t.busAppId ?? app.id,
				appName: app.name,
				color: app.titlebarDotColor,
				icon: app.icon,
				itemId: t.eventType,
				label: t.label,
				type: "trigger",
			});
		}
	}
	return result;
}

function gatherActions(
	apps: readonly PlaceApp[],
): readonly CatalogEntry[] {
	const result: CatalogEntry[] = [];
	for (const app of apps) {
		if (!app.actions) continue;
		for (const a of app.actions) {
			result.push({
				appId: app.id,
				appName: app.name,
				color: app.titlebarDotColor,
				icon: app.icon,
				itemId: a.actionId,
				label: a.label,
				type: "action",
			});
		}
	}
	return result;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface SidePanelProps {
	readonly onDragStart: (item: DragItem) => void;
}

function CatalogItem({
	entry,
	onDragStart,
}: {
	readonly entry: CatalogEntry;
	readonly onDragStart: (item: DragItem) => void;
}) {
	function handleDragStart(e: React.DragEvent) {
		const item: DragItem = {
			type: entry.type,
			appId: entry.appId,
			itemId: entry.itemId,
			label: entry.label,
			appName: entry.appName,
			color: entry.color,
		};
		e.dataTransfer.setData("application/pipes-item", JSON.stringify(item));
		e.dataTransfer.effectAllowed = "copy";
		onDragStart(item);
	}

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-grab active:cursor-grabbing"
			style={{
				background: "rgba(255,255,255,0.03)",
				borderLeft: `3px solid ${entry.color}`,
				fontSize: "0.65rem",
				color: "var(--place-text-primary)",
				borderRadius: "6px",
			}}
		>
			<span className="flex-shrink-0 w-4 h-4 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
				{entry.icon}
			</span>
			<span className="truncate flex-1">{entry.label}</span>
			<span
				className="text-[0.625rem] opacity-50 truncate"
				style={{ maxWidth: 60 }}
			>
				{entry.appName}
			</span>
		</div>
	);
}

export function SidePanel({ onDragStart }: SidePanelProps) {
	const apps = useMemo(() => getAllApps(), []);
	const triggers = useMemo(() => gatherTriggers(apps), [apps]);
	const actions = useMemo(() => gatherActions(apps), [apps]);

	return (
		<div
			className="flex flex-col h-full overflow-hidden"
			style={{
				width: 200,
				minWidth: 200,
				borderRight: "1px solid var(--place-border-default)",
				background: "transparent",
			}}
		>
			{/* Triggers section */}
			<SectionHeader label="Triggers" count={triggers.length} />
			<div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 min-h-0">
				{triggers.length === 0 && (
					<EmptyHint text="No app triggers registered" />
				)}
				{triggers.map((entry) => (
					<CatalogItem
						key={`${entry.appId}:${entry.itemId}`}
						entry={entry}
						onDragStart={onDragStart}
					/>
				))}
			</div>

			{/* Actions section */}
			<SectionHeader label="Actions" count={actions.length} />
			<div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 min-h-0">
				{actions.length === 0 && (
					<EmptyHint text="No app actions registered" />
				)}
				{actions.map((entry) => (
					<CatalogItem
						key={`${entry.appId}:${entry.itemId}`}
						entry={entry}
						onDragStart={onDragStart}
					/>
				))}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Small sub-components
// ----------------------------------------------------------------------------

function SectionHeader({
	label,
	count,
}: {
	readonly label: string;
	readonly count: number;
}) {
	return (
		<div
			className="px-3 py-2 flex items-center justify-between"
			style={{
				fontSize: "0.65rem",
				fontWeight: 600,
				letterSpacing: "0.06em",
				textTransform: "uppercase",
				color: "var(--place-text-secondary)",
				borderBottom: "1px solid var(--place-border-default)",
			}}
		>
			<span>{label}</span>
			<span
				className="rounded-full px-1.5 py-0.5"
				style={{
					background: "var(--place-surface-2)",
					fontSize: "0.625rem",
				}}
			>
				{count}
			</span>
		</div>
	);
}

function EmptyHint({ text }: { readonly text: string }) {
	return (
		<div
			className="text-center py-4 opacity-40"
			style={{ fontSize: "0.6875rem", color: "var(--place-text-secondary)" }}
		>
			{text}
		</div>
	);
}
