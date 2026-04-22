'use client';

import { useCallback, useRef } from "react";
import type { CanvasNode as CanvasNodeType, DragItem, Wire } from "./types";
import { CanvasNodeCard } from "./CanvasNode";
import { WireSvg } from "./WireSvg";

// ----------------------------------------------------------------------------
// Dot-grid background pattern (inline SVG data URI)
// ----------------------------------------------------------------------------

const DOT_SIZE = 1;
const DOT_GAP = 20;
const dotPattern = `url("data:image/svg+xml,%3Csvg width='${DOT_GAP}' height='${DOT_GAP}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${DOT_GAP / 2}' cy='${DOT_GAP / 2}' r='${DOT_SIZE}' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E")`;

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface CanvasProps {
	readonly nodes: readonly CanvasNodeType[];
	readonly wires: readonly Wire[];
	readonly wiringFrom: string | null;
	readonly activePipeIds: ReadonlySet<string>;
	readonly onAddNode: (item: DragItem, x: number, y: number) => string;
	readonly onMoveNode: (id: string, x: number, y: number) => void;
	readonly onRemoveNode: (id: string) => void;
	readonly onStartWiring: (nodeId: string) => void;
	readonly onCompleteWiring: (nodeId: string) => boolean;
	readonly onCancelWiring: () => void;
	readonly onRemoveWire: (fromId: string, toId: string) => void;
}

export function Canvas({
	nodes,
	wires,
	wiringFrom,
	activePipeIds,
	onAddNode,
	onMoveNode,
	onRemoveNode,
	onStartWiring,
	onCompleteWiring,
	onCancelWiring,
	onRemoveWire,
}: CanvasProps) {
	const canvasRef = useRef<HTMLDivElement>(null);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const raw = e.dataTransfer.getData("application/pipes-item");
			if (!raw) return;
			try {
				const item = JSON.parse(raw) as DragItem;
				const rect = canvasRef.current?.getBoundingClientRect();
				if (!rect) return;
				const x = e.clientX - rect.left - 80;
				const y = e.clientY - rect.top - 28;
				onAddNode(item, Math.max(0, x), Math.max(0, y));
			} catch {
				// invalid drag data
			}
		},
		[onAddNode],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	}, []);

	const handleCanvasClick = useCallback(() => {
		if (wiringFrom) onCancelWiring();
	}, [wiringFrom, onCancelWiring]);

	const handlePortClick = useCallback(
		(nodeId: string) => {
			if (!wiringFrom) {
				onStartWiring(nodeId);
			} else {
				onCompleteWiring(nodeId);
			}
		},
		[wiringFrom, onStartWiring, onCompleteWiring],
	);

	// Build set of trigger node IDs that belong to active pipes
	const activeTriggerNodeIds = new Set<string>();
	for (const node of nodes) {
		if (node.type === "trigger") {
			const triggerId = `${node.appId}:${node.itemId}`;
			if (activePipeIds.has(triggerId)) {
				activeTriggerNodeIds.add(node.id);
			}
		}
	}

	return (
		<div
			ref={canvasRef}
			className="relative flex-1 overflow-hidden"
			style={{
				background: "var(--place-base)",
				backgroundImage: dotPattern,
				cursor: wiringFrom ? "crosshair" : "default",
			}}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onClick={handleCanvasClick}
		>
			{nodes.length === 0 && <EmptyCanvas />}

			<WireSvg
				wires={wires}
				nodes={nodes}
				onRemoveWire={onRemoveWire}
			/>

			{nodes.map((node) => (
				<CanvasNodeCard
					key={node.id}
					node={node}
					isActive={activeTriggerNodeIds.has(node.id)}
					isWiring={wiringFrom !== null}
					isWiringSource={wiringFrom === node.id}
					onMove={onMoveNode}
					onPortClick={handlePortClick}
					onRemove={onRemoveNode}
				/>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

function EmptyCanvas() {
	return (
		<div
			className="absolute inset-0 flex items-center justify-center"
			style={{ color: "var(--place-text-secondary)", opacity: 0.4 }}
		>
			<div className="text-center space-y-1">
				<div style={{ fontSize: "0.875rem" }}>
					Drag triggers and actions here
				</div>
				<div style={{ fontSize: "0.6875rem" }}>
					Connect a trigger output to an action input to create a pipe
				</div>
			</div>
		</div>
	);
}
