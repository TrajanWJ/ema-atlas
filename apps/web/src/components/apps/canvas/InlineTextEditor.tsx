"use client";

import { useState, useRef, useEffect } from "react";
import type { CanvasElement } from "@/src/stores/canvas-store";

interface InlineTextEditorProps {
	readonly element: CanvasElement;
	readonly viewport: { x: number; y: number; zoom: number };
	readonly onCommit: (text: string) => void;
}

export function InlineTextEditor({
	element,
	viewport,
	onCommit,
}: InlineTextEditorProps) {
	const [text, setText] = useState(element.text ?? "");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		textareaRef.current?.focus();
		textareaRef.current?.select();
	}, []);

	const screenX = (element.x + viewport.x) * viewport.zoom;
	const screenY = (element.y + viewport.y) * viewport.zoom;
	const screenW = element.width * viewport.zoom;
	const screenH = element.height * viewport.zoom;

	return (
		<textarea
			ref={textareaRef}
			value={text}
			onChange={(e) => setText(e.target.value)}
			onBlur={() => onCommit(text)}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					onCommit(text);
				}
				e.stopPropagation();
			}}
			style={{
				position: "absolute",
				left: screenX,
				top: screenY,
				width: Math.max(screenW, 60),
				height: Math.max(screenH, 30),
				fontSize: (element.fontSize ?? 16) * viewport.zoom,
				fontFamily: element.fontFamily ?? "Inter, system-ui, sans-serif",
				background: element.type === "sticky" ? element.fill : "transparent",
				color:
					element.type === "sticky"
						? "#1a1a2e"
						: element.stroke,
				border: "2px solid var(--place-secondary-400)",
				borderRadius: 4,
				outline: "none",
				resize: "none",
				padding: 4,
				zIndex: 50,
				lineHeight: 1.3,
			}}
		/>
	);
}
