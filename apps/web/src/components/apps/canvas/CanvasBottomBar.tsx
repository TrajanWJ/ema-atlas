"use client";

import { useCanvasStore } from "@/src/stores/canvas-store";
import { renderToPNG, renderToSVG } from "./CanvasRenderer";
import { useCallback } from "react";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function CanvasBottomBar() {
	const viewport = useCanvasStore((s) => s.viewport);
	const setViewport = useCanvasStore((s) => s.setViewport);
	const gridVisible = useCanvasStore((s) => s.gridVisible);
	const setGridVisible = useCanvasStore((s) => s.setGridVisible);
	const snapToGrid = useCanvasStore((s) => s.snapToGrid);
	const setSnapToGrid = useCanvasStore((s) => s.setSnapToGrid);
	const elements = useCanvasStore((s) => s.elements);

	const zoomPercent = Math.round(viewport.zoom * 100);

	const zoomIn = useCallback(() => {
		setViewport({ zoom: Math.min(viewport.zoom * 1.2, 5) });
	}, [viewport.zoom, setViewport]);

	const zoomOut = useCallback(() => {
		setViewport({ zoom: Math.max(viewport.zoom / 1.2, 0.1) });
	}, [viewport.zoom, setViewport]);

	const fitContent = useCallback(() => {
		if (elements.length === 0) {
			setViewport({ x: 0, y: 0, zoom: 1 });
			return;
		}
		// This is a simplified fit — the CanvasCore handles the actual
		// sizing because it knows the canvas dimensions.
		setViewport({ x: 0, y: 0, zoom: 1 });
	}, [elements.length, setViewport]);

	const exportPNG = useCallback(async () => {
		const blob = await renderToPNG(elements);
		if (blob) downloadBlob(blob, "canvas-export.png");
	}, [elements]);

	const exportSVG = useCallback(() => {
		const svg = renderToSVG(elements);
		const blob = new Blob([svg], { type: "image/svg+xml" });
		downloadBlob(blob, "canvas-export.svg");
	}, [elements]);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "3px 8px",
				borderTop: "1px solid var(--place-border-default)",
				background: "var(--place-surface-0)",
				fontSize: 11,
				color: "var(--place-text-secondary)",
				flexShrink: 0,
				gap: 8,
			}}
		>
			{/* Zoom controls */}
			<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
				<BarButton label="-" onClick={zoomOut} />
				<span style={{ minWidth: 38, textAlign: "center" }}>
					{zoomPercent}%
				</span>
				<BarButton label="+" onClick={zoomIn} />
				<BarButton label="Fit" onClick={fitContent} />
			</div>

			{/* Toggles */}
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<ToggleButton
					label="Grid"
					active={gridVisible}
					onClick={() => setGridVisible(!gridVisible)}
				/>
				<ToggleButton
					label="Snap"
					active={snapToGrid}
					onClick={() => setSnapToGrid(!snapToGrid)}
				/>
				<span>{elements.length} elements</span>
			</div>

			{/* Export */}
			<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
				<BarButton label="PNG" onClick={exportPNG} />
				<BarButton label="SVG" onClick={exportSVG} />
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Small buttons
// ----------------------------------------------------------------------------

function BarButton({
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
				fontSize: 11,
				padding: "2px 6px",
				borderRadius: 4,
				border: "1px solid var(--place-border-default)",
				background: "var(--place-surface-1)",
				color: "var(--place-text-secondary)",
				cursor: "pointer",
			}}
		>
			{label}
		</button>
	);
}

function ToggleButton({
	label,
	active,
	onClick,
}: {
	readonly label: string;
	readonly active: boolean;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				fontSize: 11,
				padding: "2px 6px",
				borderRadius: 4,
				border: active
					? "1px solid var(--place-secondary-400)"
					: "1px solid var(--place-border-default)",
				background: active
					? "color-mix(in srgb, var(--place-secondary-400) 20%, transparent)"
					: "var(--place-surface-1)",
				color: active
					? "var(--place-secondary-400)"
					: "var(--place-text-secondary)",
				cursor: "pointer",
			}}
		>
			{label}
		</button>
	);
}
