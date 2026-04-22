'use client';

import { useEffect, useRef } from "react";
import { renderMarkdown } from "@/src/lib/markdown";

interface MarkdownPreviewProps {
	content: string;
	/** 0–1 scroll ratio driven by the sibling editor */
	scrollRatio?: number;
	/** Called when this pane is scrolled (for sync back to editor) */
	onScroll?: (ratio: number) => void;
}

export function MarkdownPreview({
	content,
	scrollRatio,
	onScroll,
}: MarkdownPreviewProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isSyncing = useRef(false);

	// Apply incoming scroll ratio from the editor pane
	useEffect(() => {
		const el = ref.current;
		if (el === null || scrollRatio === undefined) return;

		isSyncing.current = true;
		el.scrollTop = scrollRatio * (el.scrollHeight - el.clientHeight);

		// Release the flag on the next tick so the scroll event we fired
		// doesn't echo back to the editor
		const id = requestAnimationFrame(() => {
			isSyncing.current = false;
		});
		return () => cancelAnimationFrame(id);
	}, [scrollRatio]);

	const handleScroll = () => {
		if (isSyncing.current || onScroll === undefined) return;
		const el = ref.current;
		if (el === null) return;
		const max = el.scrollHeight - el.clientHeight;
		onScroll(max > 0 ? el.scrollTop / max : 0);
	};

	const html = renderMarkdown(content);

	return (
		<div
			ref={ref}
			onScroll={handleScroll}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: output of renderMarkdown is sanitized (scripts stripped)
			dangerouslySetInnerHTML={{ __html: html }}
			style={{
				flex: 1,
				overflowY: "auto",
				padding: "0.75rem",
				color: "var(--place-text-primary)",
				fontFamily: "sans-serif",
				fontSize: "0.85rem",
				lineHeight: 1.7,
			}}
			className="markdown-preview"
		/>
	);
}
