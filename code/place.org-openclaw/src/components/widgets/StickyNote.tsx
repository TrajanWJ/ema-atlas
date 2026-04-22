'use client';

import { useRef } from "react";
import { Rnd } from "react-rnd";
import { useStickyStore } from "@/src/stores/sticky-store";
import type { StickyNote as StickyNoteType, StickyColor } from "@/src/stores/sticky-store";

// ----------------------------------------------------------------------------
// Color map
// ----------------------------------------------------------------------------

const COLOR_STYLES: Record<StickyColor, { background: string; border: string }> = {
	yellow: {
		background: "rgba(255, 230, 100, 0.08)",
		border: "1px solid rgba(255, 230, 100, 0.15)",
	},
	pink: {
		background: "rgba(255, 150, 180, 0.08)",
		border: "1px solid rgba(255, 150, 180, 0.15)",
	},
	blue: {
		background: "rgba(100, 180, 255, 0.08)",
		border: "1px solid rgba(100, 180, 255, 0.15)",
	},
	green: {
		background: "rgba(100, 255, 170, 0.08)",
		border: "1px solid rgba(100, 255, 170, 0.15)",
	},
	purple: {
		background: "rgba(180, 130, 255, 0.08)",
		border: "1px solid rgba(180, 130, 255, 0.15)",
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
	const contentRef = useRef<HTMLDivElement>(null);
	const colorStyle = COLOR_STYLES[note.color];

	const handleInput = () => {
		const text = contentRef.current?.innerText ?? "";
		updateNote(note.id, text);
	};

	return (
		<Rnd
			position={{ x: note.x, y: note.y }}
			default={{ x: note.x, y: note.y, width: 200, height: 150 }}
			size={{ width: 200, height: 150 }}
			enableResizing={false}
			onDragStop={(_e, d) => moveNote(note.id, d.x, d.y)}
			style={{ zIndex: 5 }}
		>
			<div
				style={{
					...colorStyle,
					borderRadius: "4px",
					transform: `rotate(${note.rotation}deg)`,
					width: "200px",
					height: "150px",
					position: "relative",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{/* Close button */}
				<button
					type="button"
					aria-label="Close sticky note"
					onClick={() => removeNote(note.id)}
					style={{
						position: "absolute",
						top: "4px",
						right: "6px",
						background: "none",
						border: "none",
						cursor: "default",
						color: "var(--text-secondary)",
						fontSize: "14px",
						lineHeight: 1,
						padding: "0 2px",
						opacity: 0.5,
						zIndex: 1,
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.opacity = "1";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.opacity = "0.5";
					}}
				>
					×
				</button>

				{/* Content area */}
				<div
					ref={contentRef}
					contentEditable
					suppressContentEditableWarning
					onInput={handleInput}
					data-testid="sticky-content"
					style={{
						flex: 1,
						padding: "10px 20px 10px 10px",
						fontSize: "13px",
						fontStyle: "italic",
						color: "var(--text-primary)",
						outline: "none",
						overflowY: "auto",
						wordBreak: "break-word",
						whiteSpace: "pre-wrap",
						cursor: "text",
					}}
					suppressHydrationWarning
				>
					{note.content}
				</div>
			</div>
		</Rnd>
	);
}
