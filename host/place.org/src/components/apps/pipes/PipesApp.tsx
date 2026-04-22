'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePipesStore } from "@/src/stores/pipes-store";
import type { DragItem } from "./types";
import { useCanvas } from "./use-canvas";
import { SidePanel } from "./SidePanel";
import { Canvas } from "./Canvas";
import { BottomBar } from "./BottomBar";
import { seedExamplePipe } from "./seed";

// ----------------------------------------------------------------------------
// PipesApp — main entry
// ----------------------------------------------------------------------------

export function PipesApp() {
	const {
		pipes,
		load,
		addPipe,
		removePipe,
		togglePipe,
	} = usePipesStore();

	const canvas = useCanvas();
	const [pipeName, setPipeName] = useState("New Pipe");

	// Load pipes on mount, seed example if first time
	useEffect(() => {
		load();
		seedExamplePipe();
	}, [load]);

	// Build the set of active trigger IDs for the green dot indicator
	const activePipeIds = useMemo(() => {
		const set = new Set<string>();
		for (const pipe of pipes) {
			if (pipe.active) set.add(pipe.triggerId);
		}
		return set;
	}, [pipes]);

	// Determine if canvas has a valid pipe (at least one trigger->action wire)
	const canSave = useMemo(() => {
		const hasTrigger = canvas.nodes.some((n) => n.type === "trigger");
		const hasAction = canvas.nodes.some((n) => n.type === "action");
		return hasTrigger && hasAction && canvas.wires.length > 0;
	}, [canvas.nodes, canvas.wires]);

	const handleSave = useCallback(() => {
		if (!canSave) return;
		// Find the trigger node connected by wires
		const triggerNodes = canvas.nodes.filter((n) => n.type === "trigger");
		if (triggerNodes.length === 0) return;

		// For each trigger, create a pipe with its connected actions
		for (const triggerNode of triggerNodes) {
			const connectedWires = canvas.wires.filter(
				(w) => w.fromNodeId === triggerNode.id,
			);
			if (connectedWires.length === 0) continue;

			const actionEntries = connectedWires
				.map((w) => canvas.nodes.find((n) => n.id === w.toNodeId))
				.filter(
					(n): n is NonNullable<typeof n> =>
						n !== undefined && n.type === "action",
				)
				.map((n) => ({ appId: n.appId, actionId: n.itemId }));

			if (actionEntries.length === 0) continue;

			addPipe({
				name: pipeName || "Untitled Pipe",
				triggerId: `${triggerNode.appId}:${triggerNode.itemId}`,
				actions: actionEntries,
				active: true,
			});
		}

		canvas.clearAll();
		setPipeName("New Pipe");
	}, [canSave, canvas, pipeName, addPipe]);

	const handleDragStart = useCallback((_item: DragItem) => {
		// Could track drag state for visual feedback
	}, []);

	return (
		<div
			className="flex flex-col h-full overflow-hidden"
			style={{ background: "transparent" }}
		>
			{/* Top: pipe name input + saved pipes list */}
			<TopBar
				pipeName={pipeName}
				onPipeNameChange={setPipeName}
				pipes={pipes}
				onToggle={togglePipe}
				onRemove={removePipe}
			/>

			{/* Main area: side panel + canvas */}
			<div className="flex flex-1 min-h-0">
				<SidePanel onDragStart={handleDragStart} />
				<Canvas
					nodes={canvas.nodes}
					wires={canvas.wires}
					wiringFrom={canvas.wiringFrom}
					activePipeIds={activePipeIds}
					onAddNode={canvas.addNode}
					onMoveNode={canvas.moveNode}
					onRemoveNode={canvas.removeNode}
					onStartWiring={canvas.startWiring}
					onCompleteWiring={canvas.completeWiring}
					onCancelWiring={canvas.cancelWiring}
					onRemoveWire={canvas.removeWire}
				/>
			</div>

			<BottomBar
				pipeCount={pipes.length}
				canSave={canSave}
				onSave={handleSave}
				onClear={canvas.clearAll}
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// TopBar — pipe name input + list of saved pipes
// ----------------------------------------------------------------------------

interface TopBarProps {
	readonly pipeName: string;
	readonly onPipeNameChange: (name: string) => void;
	readonly pipes: readonly {
		readonly id: string;
		readonly name: string;
		readonly active: boolean;
		readonly triggerId: string;
		readonly actions: readonly { readonly appId: string; readonly actionId: string }[];
	}[];
	readonly onToggle: (id: string) => void;
	readonly onRemove: (id: string) => void;
}

function TopBar({
	pipeName,
	onPipeNameChange,
	pipes,
	onToggle,
	onRemove,
}: TopBarProps) {
	return (
		<div
			className="flex items-center gap-3 px-3 py-2 overflow-x-auto"
			style={{
				borderBottom: "1px solid var(--place-border-default)",
				background: "transparent",
				minHeight: 36,
			}}
		>
			<input
				type="text"
				value={pipeName}
				onChange={(e) => onPipeNameChange(e.target.value)}
				placeholder="Pipe name..."
				style={{
					background: "rgba(255,255,255,0.03)",
					border: "1px solid var(--place-border-default)",
					borderRadius: "6px",
					color: "var(--place-text-primary)",
					fontSize: "0.65rem",
					padding: "0.25rem 0.5rem",
					width: 140,
					outline: "none",
				}}
			/>

			<div
				className="h-4"
				style={{
					width: 1,
					background: "var(--place-border-default)",
				}}
			/>

			{/* Saved pipes chips */}
			<div className="flex gap-1.5 overflow-x-auto">
				{pipes.map((pipe) => (
					<PipeChip
						key={pipe.id}
						pipe={pipe}
						onToggle={onToggle}
						onRemove={onRemove}
					/>
				))}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// PipeChip — compact saved-pipe indicator
// ----------------------------------------------------------------------------

interface PipeChipProps {
	readonly pipe: {
		readonly id: string;
		readonly name: string;
		readonly active: boolean;
		readonly triggerId: string;
	};
	readonly onToggle: (id: string) => void;
	readonly onRemove: (id: string) => void;
}

function PipeChip({ pipe, onToggle, onRemove }: PipeChipProps) {
	return (
		<div
			className="flex items-center gap-1.5 shrink-0"
			style={{
				background: pipe.active
					? "rgba(34,197,94,0.08)"
					: "rgba(255,255,255,0.03)",
				border: `1px solid ${pipe.active ? "rgba(34,197,94,0.2)" : "var(--place-border-default)"}`,
				borderRadius: "6px",
				padding: "0.15rem 0.5rem",
				fontSize: "0.65rem",
				color: "var(--place-text-primary)",
			}}
		>
			{/* Active dot */}
			<div
				style={{
					width: 5,
					height: 5,
					borderRadius: "50%",
					background: pipe.active ? "var(--place-success)" : "var(--place-text-secondary)",
					opacity: pipe.active ? 1 : 0.3,
				}}
			/>

			<button
				type="button"
				onClick={() => onToggle(pipe.id)}
				style={{
					background: "none",
					border: "none",
					color: "inherit",
					cursor: "pointer",
					padding: 0,
					fontSize: "inherit",
				}}
			>
				{pipe.name}
			</button>

			<button
				type="button"
				onClick={() => onRemove(pipe.id)}
				style={{
					background: "none",
					border: "none",
					color: "var(--place-text-secondary)",
					cursor: "pointer",
					padding: 0,
					fontSize: "0.5625rem",
					lineHeight: 1,
				}}
			>
				x
			</button>
		</div>
	);
}
