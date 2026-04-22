'use client';

import { Rnd } from "react-rnd";
import { useStickyStore } from "@/src/stores/sticky-store";
import type { StickyNote as StickyNoteType, StickyColor } from "@/src/stores/sticky-store";

// ----------------------------------------------------------------------------
// Color map — slightly more opaque for readability
// ----------------------------------------------------------------------------

const COLOR_STYLES: Record<StickyColor, { background: string; border: string; accent: string }> = {
	yellow: {
		background: "rgba(255, 230, 100, 0.12)",
		border: "1px solid rgba(255, 230, 100, 0.20)",
		accent: "rgba(255, 230, 100, 0.6)",
	},
	pink: {
		background: "rgba(255, 150, 180, 0.12)",
		border: "1px solid rgba(255, 150, 180, 0.20)",
		accent: "rgba(255, 150, 180, 0.6)",
	},
	blue: {
		background: "rgba(100, 180, 255, 0.12)",
		border: "1px solid rgba(100, 180, 255, 0.20)",
		accent: "rgba(100, 180, 255, 0.6)",
	},
	green: {
		background: "rgba(100, 255, 170, 0.12)",
		border: "1px solid rgba(100, 255, 170, 0.20)",
		accent: "rgba(100, 255, 170, 0.6)",
	},
	purple: {
		background: "rgba(180, 130, 255, 0.12)",
		border: "1px solid rgba(180, 130, 255, 0.20)",
		accent: "rgba(180, 130, 255, 0.6)",
	},
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface StickyNoteProps {
	readonly note: StickyNoteType;
}

export function StickyNote({ note }: StickyNoteProps) {
	const { removeNote, updateNote, moveNote } = useStickyStore();
	const colorStyle = COLOR_STYLES[note.color];

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		updateNote(note.id, e.target.value);
	};

	return (
		<Rnd
			position={{ x: note.x, y: note.y }}
			default={{ x: note.x, y: note.y, width: 200, height: 160 }}
			minWidth={140}
			minHeight={100}
			maxWidth={400}
			maxHeight={400}
			enableResizing
			onDragStop={(_e, d) => moveNote(note.id, d.x, d.y)}
			style={{ zIndex: 8 }}
		>
			<div
				style={{
					background: colorStyle.background,
					border: colorStyle.border,
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
					borderRadius: "6px",
					width: "100%",
					height: "100%",
					position: "relative",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
				}}
			>
				{/* Header bar — drag handle + close */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "4px 6px 2px",
						borderBottom: `1px solid ${colorStyle.accent.replace('0.6', '0.1')}`,
						flexShrink: 0,
						cursor: "grab",
					}}
				>
					{/* Color dot */}
					<div
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: colorStyle.accent,
							flexShrink: 0,
						}}
					/>

					{/* Close button */}
					<button
						type="button"
						aria-label="Close sticky note"
						onClick={() => removeNote(note.id)}
						onMouseDown={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						style={{
							background: "none",
							border: "none",
							cursor: "default",
							color: "var(--place-text-muted)",
							fontSize: "12px",
							lineHeight: 1,
							padding: "0 2px",
							transition: "color 0.15s",
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLElement).style.color = "var(--place-error)";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLElement).style.color = "var(--place-text-muted)";
						}}
					>
						×
					</button>
				</div>

				{/* Content area */}
				<textarea
					value={note.content}
					onChange={handleChange}
					onMouseDown={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
					data-testid="sticky-content"
					placeholder="Type here..."
					style={{
						flex: 1,
						padding: "8px 10px",
						fontSize: "13px",
						lineHeight: 1.5,
						fontStyle: "italic",
						color: "var(--place-text-primary)",
						background: "transparent",
						border: "none",
						outline: "none",
						resize: "none",
						overflowY: "auto",
						wordBreak: "break-word",
						whiteSpace: "pre-wrap",
						cursor: "text",
						direction: "ltr",
						textAlign: "left",
						fontFamily: "inherit",
						width: "100%",
					}}
				/>

				{/* Resize handle indicator */}
				<div
					style={{
						position: "absolute",
						bottom: 2,
						right: 2,
						width: 10,
						height: 10,
						opacity: 0.3,
						pointerEvents: "none",
					}}
				>
					<svg width={10} height={10} viewBox="0 0 10 10" fill="none">
						<path d="M9 1L1 9M9 5L5 9" stroke={colorStyle.accent} strokeWidth={1} />
					</svg>
				</div>
			</div>
		</Rnd>
	);
}
