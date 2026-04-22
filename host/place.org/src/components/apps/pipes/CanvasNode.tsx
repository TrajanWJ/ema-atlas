'use client';

import { useCallback, useRef, useState } from "react";
import type { CanvasNode as CanvasNodeType } from "./types";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const NODE_WIDTH = 160;
const NODE_HEIGHT = 56;

export { NODE_WIDTH, NODE_HEIGHT };

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface CanvasNodeProps {
	readonly node: CanvasNodeType;
	readonly isActive: boolean;
	readonly isWiring: boolean;
	readonly isWiringSource: boolean;
	readonly onMove: (id: string, x: number, y: number) => void;
	readonly onPortClick: (id: string) => void;
	readonly onRemove: (id: string) => void;
}

export function CanvasNodeCard({
	node,
	isActive,
	isWiring,
	isWiringSource,
	onMove,
	onPortClick,
	onRemove,
}: CanvasNodeProps) {
	const dragRef = useRef<{ startX: number; startY: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).dataset.port) return;
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(true);
			dragRef.current = {
				startX: e.clientX - node.x,
				startY: e.clientY - node.y,
			};

			function handleMouseMove(ev: MouseEvent) {
				if (!dragRef.current) return;
				onMove(
					node.id,
					ev.clientX - dragRef.current.startX,
					ev.clientY - dragRef.current.startY,
				);
			}

			function handleMouseUp() {
				setIsDragging(false);
				dragRef.current = null;
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			}

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[node.id, node.x, node.y, onMove],
	);

	const portSide = node.type === "trigger" ? "right" : "left";

	return (
		<div
			onMouseDown={handleMouseDown}
			className="absolute select-none rounded-lg"
			style={{
				left: node.x,
				top: node.y,
				width: NODE_WIDTH,
				height: NODE_HEIGHT,
				background: "var(--place-surface-2)",
				border: isWiringSource
					? "1.5px solid var(--place-primary-400)"
					: "1px solid var(--place-surface-3)",
				borderLeft: `3px solid ${node.color}`,
				cursor: isDragging ? "grabbing" : "grab",
				boxShadow: isDragging
					? "0 4px 16px rgba(0,0,0,0.3)"
					: "0 1px 4px rgba(0,0,0,0.15)",
				zIndex: isDragging ? 50 : 10,
			}}
		>
			{/* Active indicator */}
			{isActive && (
				<div
					className="absolute rounded-full"
					style={{
						width: 6,
						height: 6,
						top: 4,
						right: 4,
						background: "#22c55e",
						boxShadow: "0 0 4px #22c55e",
					}}
				/>
			)}

			{/* Remove button */}
			<button
				type="button"
				onClick={() => onRemove(node.id)}
				className="absolute opacity-0 hover:opacity-100 transition-opacity"
				style={{
					top: 2,
					right: isActive ? 14 : 4,
					fontSize: "0.625rem",
					color: "var(--place-text-secondary)",
					background: "none",
					border: "none",
					cursor: "pointer",
					lineHeight: 1,
					padding: 2,
				}}
			>
				x
			</button>

			{/* Content */}
			<div className="flex flex-col justify-center h-full px-3 py-1.5">
				<span
					className="truncate"
					style={{
						fontSize: "0.6875rem",
						fontWeight: 600,
						color: "var(--place-text-primary)",
					}}
				>
					{node.label}
				</span>
				<span
					className="truncate"
					style={{
						fontSize: "0.5625rem",
						color: "var(--place-text-secondary)",
						opacity: 0.7,
					}}
				>
					{node.appName} / {node.type}
				</span>
			</div>

			{/* Port */}
			<button
				type="button"
				data-port="true"
				onClick={(e) => {
					e.stopPropagation();
					onPortClick(node.id);
				}}
				className="absolute rounded-full"
				style={{
					width: 10,
					height: 10,
					top: "50%",
					transform: "translateY(-50%)",
					...(portSide === "right"
						? { right: -5 }
						: { left: -5 }),
					background: isWiring
						? "var(--place-primary-400)"
						: "var(--place-surface-3)",
					border: "2px solid var(--place-surface-1)",
					cursor: "crosshair",
					zIndex: 20,
				}}
			/>
		</div>
	);
}
