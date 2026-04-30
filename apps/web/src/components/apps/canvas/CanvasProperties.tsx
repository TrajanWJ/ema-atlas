"use client";

import { useCanvasStore, type CanvasElement } from "@/src/stores/canvas-store";
import { useCallback } from "react";

// ----------------------------------------------------------------------------
// Color swatches
// ----------------------------------------------------------------------------

const COLOR_SWATCHES = [
	"transparent",
	"#ffffff",
	"#1a1a2e",
	"#EF4444",
	"#F59E0B",
	"#FBBF24",
	"#22C55E",
	"#3B82F6",
	"#4A90D9",
	"#8B5CF6",
	"#EC4899",
	"#6B7280",
] as const;

// ----------------------------------------------------------------------------
// Swatch picker
// ----------------------------------------------------------------------------

function SwatchPicker({
	label,
	value,
	onChange,
}: {
	readonly label: string;
	readonly value: string;
	readonly onChange: (c: string) => void;
}) {
	return (
		<div style={{ marginBottom: 12 }}>
			<div
				style={{
					fontSize: 11,
					color: "var(--place-text-secondary)",
					marginBottom: 4,
				}}
			>
				{label}
			</div>
			<div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
				{COLOR_SWATCHES.map((c) => (
					<button
						key={c}
						type="button"
						onClick={() => onChange(c)}
						title={c}
						style={{
							width: 20,
							height: 20,
							borderRadius: 4,
							border:
								value === c
									? "2px solid var(--place-secondary-400)"
									: "1px solid var(--place-border-default)",
							background:
								c === "transparent"
									? "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px"
									: c,
							cursor: "pointer",
							padding: 0,
						}}
					/>
				))}
			</div>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					marginTop: 4,
					width: "100%",
					fontSize: 11,
					padding: "2px 6px",
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: 4,
					color: "var(--place-text-primary)",
					outline: "none",
				}}
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Number input
// ----------------------------------------------------------------------------

function NumberField({
	label,
	value,
	onChange,
	min,
	max,
	step,
}: {
	readonly label: string;
	readonly value: number;
	readonly onChange: (v: number) => void;
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				marginBottom: 6,
			}}
		>
			<span
				style={{
					fontSize: 11,
					color: "var(--place-text-secondary)",
					flexShrink: 0,
				}}
			>
				{label}
			</span>
			<input
				type="number"
				value={Math.round(value * 100) / 100}
				onChange={(e) => onChange(Number(e.target.value))}
				min={min}
				max={max}
				step={step ?? 1}
				style={{
					width: 60,
					fontSize: 11,
					padding: "2px 4px",
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: 4,
					color: "var(--place-text-primary)",
					outline: "none",
					textAlign: "right",
				}}
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Slider
// ----------------------------------------------------------------------------

function SliderField({
	label,
	value,
	onChange,
	min,
	max,
	step,
}: {
	readonly label: string;
	readonly value: number;
	readonly onChange: (v: number) => void;
	readonly min: number;
	readonly max: number;
	readonly step?: number;
}) {
	return (
		<div style={{ marginBottom: 8 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: 11,
					color: "var(--place-text-secondary)",
					marginBottom: 2,
				}}
			>
				<span>{label}</span>
				<span>{Math.round(value * 100) / 100}</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step ?? 1}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width: "100%", accentColor: "var(--place-secondary-400)" }}
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

interface CanvasPropertiesProps {
	readonly visible: boolean;
}

export function CanvasProperties({ visible }: CanvasPropertiesProps) {
	const selectedIds = useCanvasStore((s) => s.selectedIds);
	const elements = useCanvasStore((s) => s.elements);
	const updateElement = useCanvasStore((s) => s.updateElement);
	const deleteElements = useCanvasStore((s) => s.deleteElements);
	const bringToFront = useCanvasStore((s) => s.bringToFront);
	const sendToBack = useCanvasStore((s) => s.sendToBack);
	const pushHistory = useCanvasStore((s) => s.pushHistory);

	const selected = elements.filter((e) => selectedIds.has(e.id));
	const el: CanvasElement | undefined = selected[0];

	const update = useCallback(
		(changes: Partial<CanvasElement>) => {
			if (!el) return;
			pushHistory();
			updateElement(el.id, changes);
		},
		[el, updateElement, pushHistory],
	);

	if (!visible || selected.length === 0 || !el) {
		return null;
	}

	const ids = [...selectedIds];

	return (
		<div
			style={{
				width: 180,
				flexShrink: 0,
				borderLeft: "1px solid var(--place-border-default)",
				background: "var(--place-surface-0)",
				padding: "8px 10px",
				overflowY: "auto",
				fontSize: 12,
				color: "var(--place-text-primary)",
			}}
		>
			<div
				style={{
					fontSize: 11,
					fontWeight: 600,
					marginBottom: 8,
					color: "var(--place-text-secondary)",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
				{selected.length === 1 ? el.type : `${selected.length} elements`}
			</div>

			<SwatchPicker
				label="Fill"
				value={el.fill}
				onChange={(c) => update({ fill: c })}
			/>

			<SwatchPicker
				label="Stroke"
				value={el.stroke}
				onChange={(c) => update({ stroke: c })}
			/>

			<SliderField
				label="Stroke Width"
				value={el.strokeWidth}
				onChange={(v) => update({ strokeWidth: v })}
				min={0}
				max={20}
				step={0.5}
			/>

			<SliderField
				label="Opacity"
				value={el.opacity}
				onChange={(v) => update({ opacity: v })}
				min={0}
				max={1}
				step={0.05}
			/>

			{(el.type === "text" || el.type === "sticky") && (
				<NumberField
					label="Font Size"
					value={el.fontSize ?? 16}
					onChange={(v) => update({ fontSize: v })}
					min={8}
					max={120}
				/>
			)}

			{el.type === "rectangle" && (
				<NumberField
					label="Corner Radius"
					value={el.cornerRadius ?? 0}
					onChange={(v) => update({ cornerRadius: v })}
					min={0}
					max={100}
				/>
			)}

			<div
				style={{
					borderTop: "1px solid var(--place-border-default)",
					marginTop: 8,
					paddingTop: 8,
				}}
			>
				<NumberField
					label="X"
					value={el.x}
					onChange={(v) => update({ x: v })}
				/>
				<NumberField
					label="Y"
					value={el.y}
					onChange={(v) => update({ y: v })}
				/>
				<NumberField
					label="W"
					value={el.width}
					onChange={(v) => update({ width: Math.max(1, v) })}
					min={1}
				/>
				<NumberField
					label="H"
					value={el.height}
					onChange={(v) => update({ height: Math.max(1, v) })}
					min={1}
				/>
			</div>

			<div
				style={{
					borderTop: "1px solid var(--place-border-default)",
					marginTop: 8,
					paddingTop: 8,
					display: "flex",
					gap: 4,
					flexWrap: "wrap",
				}}
			>
				<PanelButton
					label="To Front"
					onClick={() => {
						pushHistory();
						bringToFront(ids);
					}}
				/>
				<PanelButton
					label="To Back"
					onClick={() => {
						pushHistory();
						sendToBack(ids);
					}}
				/>
				<PanelButton
					label="Delete"
					danger
					onClick={() => {
						pushHistory();
						deleteElements(ids);
					}}
				/>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Small button
// ----------------------------------------------------------------------------

function PanelButton({
	label,
	onClick,
	danger,
}: {
	readonly label: string;
	readonly onClick: () => void;
	readonly danger?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				fontSize: 11,
				padding: "3px 8px",
				borderRadius: 4,
				border: "1px solid var(--place-border-default)",
				background: danger
					? "rgba(239, 68, 68, 0.15)"
					: "var(--place-surface-1)",
				color: danger ? "#EF4444" : "var(--place-text-primary)",
				cursor: "pointer",
			}}
		>
			{label}
		</button>
	);
}
