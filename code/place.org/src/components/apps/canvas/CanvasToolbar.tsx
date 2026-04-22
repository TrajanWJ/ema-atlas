"use client";

import type { CanvasTool } from "@/src/stores/canvas-store";

// ----------------------------------------------------------------------------
// Tool definitions
// ----------------------------------------------------------------------------

interface ToolDef {
	readonly id: CanvasTool;
	readonly label: string;
	readonly shortcut: string;
	readonly icon: string; // SVG path(s)
}

const TOOLS: readonly ToolDef[] = [
	{
		id: "select",
		label: "Select",
		shortcut: "V",
		icon: "M4 4l7 17 2.5-6.5L20 12z",
	},
	{
		id: "rectangle",
		label: "Rectangle",
		shortcut: "R",
		icon: "M3 3h18v18H3z",
	},
	{
		id: "ellipse",
		label: "Ellipse",
		shortcut: "O",
		icon: "M12 5a7 5 0 1 0 0 10 7 5 0 1 0 0-10z",
	},
	{
		id: "line",
		label: "Line",
		shortcut: "L",
		icon: "M4 20L20 4",
	},
	{
		id: "arrow",
		label: "Arrow",
		shortcut: "A",
		icon: "M4 20L20 4M14 4h6v6",
	},
	{
		id: "text",
		label: "Text",
		shortcut: "T",
		icon: "M6 4h12M12 4v16",
	},
	{
		id: "freehand",
		label: "Freehand",
		shortcut: "P",
		icon: "M3 17c2-4 5-8 9-8s4 4 6 4 3-2 3-2",
	},
	{
		id: "sticky",
		label: "Sticky Note",
		shortcut: "S",
		icon: "M4 4h12l4 4v12H4zM12 4v4h4",
	},
	{
		id: "eraser",
		label: "Eraser",
		shortcut: "E",
		icon: "M19 20H8.5l-4.21-4.3a1 1 0 0 1 0-1.41L15.5 3.06a1 1 0 0 1 1.41 0L21.3 7.4a1 1 0 0 1 0 1.42L13 17H19z",
	},
	{
		id: "hand",
		label: "Hand (Pan)",
		shortcut: "H",
		icon: "M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v7M10 9.5V6a2 2 0 0 0-4 0v8l-1.46-1.46a2 2 0 0 0-2.83 2.83L7 22h10c1.1 0 2-.9 2-2v-6a2 2 0 0 0-4 0",
	},
];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface CanvasToolbarProps {
	readonly activeTool: CanvasTool;
	readonly onToolChange: (tool: CanvasTool) => void;
}

export function CanvasToolbar({ activeTool, onToolChange }: CanvasToolbarProps) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 2,
				padding: "4px 8px",
				borderBottom: "1px solid var(--place-border-default)",
				background: "var(--place-surface-0)",
				flexShrink: 0,
				overflowX: "auto",
			}}
		>
			{TOOLS.map((tool) => (
				<button
					key={tool.id}
					type="button"
					title={`${tool.label} (${tool.shortcut})`}
					onClick={() => onToolChange(tool.id)}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: 32,
						height: 32,
						borderRadius: 6,
						border: "none",
						cursor: "pointer",
						flexShrink: 0,
						background:
							activeTool === tool.id
								? "var(--place-secondary-400)"
								: "transparent",
						color:
							activeTool === tool.id
								? "#fff"
								: "var(--place-text-secondary)",
						transition: "background 0.15s, color 0.15s",
					}}
				>
					<svg
						width={18}
						height={18}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.8}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d={tool.icon} />
					</svg>
				</button>
			))}
		</div>
	);
}
