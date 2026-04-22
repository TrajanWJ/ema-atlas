'use client';

import type { CanvasNode, Wire } from "./types";
import { NODE_WIDTH, NODE_HEIGHT } from "./CanvasNode";

// ----------------------------------------------------------------------------
// Build a smooth cubic bezier path between two nodes
// ----------------------------------------------------------------------------

function buildPath(from: CanvasNode, to: CanvasNode): string {
	const x1 = from.x + NODE_WIDTH; // right edge of trigger
	const y1 = from.y + NODE_HEIGHT / 2;
	const x2 = to.x; // left edge of action
	const y2 = to.y + NODE_HEIGHT / 2;
	const dx = Math.abs(x2 - x1) * 0.5;
	return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface WireSvgProps {
	readonly wires: readonly Wire[];
	readonly nodes: readonly CanvasNode[];
	readonly onRemoveWire: (fromId: string, toId: string) => void;
}

export function WireSvg({ wires, nodes, onRemoveWire }: WireSvgProps) {
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));

	return (
		<svg
			className="absolute inset-0 pointer-events-none"
			style={{ width: "100%", height: "100%", overflow: "visible" }}
		>
			{wires.map((wire) => {
				const from = nodeMap.get(wire.fromNodeId);
				const to = nodeMap.get(wire.toNodeId);
				if (!from || !to) return null;
				const d = buildPath(from, to);
				return (
					<g key={`${wire.fromNodeId}-${wire.toNodeId}`}>
						{/* Invisible wider stroke for click target */}
						<path
							d={d}
							fill="none"
							stroke="transparent"
							strokeWidth={12}
							className="pointer-events-auto cursor-pointer"
							onClick={() =>
								onRemoveWire(
									wire.fromNodeId,
									wire.toNodeId,
								)
							}
						/>
						{/* Visible wire */}
						<path
							d={d}
							fill="none"
							stroke="var(--place-primary-400)"
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</g>
				);
			})}
		</svg>
	);
}
