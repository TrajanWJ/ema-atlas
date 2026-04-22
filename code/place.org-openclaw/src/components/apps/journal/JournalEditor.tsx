'use client';

import { useEffect, useRef, useState } from "react";
import { useJournalStore } from "@/src/stores/journal-store";
import { EditorToggle } from "./EditorToggle";
import type { EditorMode } from "./EditorToggle";
import { MarkdownPreview } from "./MarkdownPreview";

const DEBOUNCE_MS = 500;

export function JournalEditor() {
	const content = useJournalStore((s) => s.currentEntry?.content ?? "");
	const loading = useJournalStore((s) => s.loading);
	const updateContent = useJournalStore((s) => s.updateContent);
	const save = useJournalStore((s) => s.saveEntry);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [mode, setMode] = useState<EditorMode>('edit');
	const [scrollRatio, setScrollRatio] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const isSyncingEditor = useRef(false);

	// Clear debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current !== null) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const handleChange = (value: string) => {
		updateContent(value);

		if (debounceRef.current !== null) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			save().catch(() => {});
		}, DEBOUNCE_MS);
	};

	const handleEditorScroll = () => {
		if (isSyncingEditor.current) return;
		const el = textareaRef.current;
		if (el === null) return;
		const max = el.scrollHeight - el.clientHeight;
		setScrollRatio(max > 0 ? el.scrollTop / max : 0);
	};

	const handlePreviewScroll = (ratio: number) => {
		const el = textareaRef.current;
		if (el === null) return;
		isSyncingEditor.current = true;
		el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
		requestAnimationFrame(() => {
			isSyncingEditor.current = false;
		});
	};

	const showEditor = mode === 'edit' || mode === 'split';
	const showPreview = mode === 'preview' || mode === 'split';

	const textareaStyle: React.CSSProperties = {
		flex: 1,
		width: '100%',
		background: 'transparent',
		border: 'none',
		outline: 'none',
		resize: 'none',
		color: 'var(--text-primary)',
		fontFamily: 'monospace',
		fontSize: '0.8rem',
		lineHeight: 1.7,
		padding: '0.75rem',
		opacity: loading ? 0.5 : 1,
	};

	return (
		<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
			<EditorToggle mode={mode} onChange={setMode} />
			<div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, overflow: 'hidden' }}>
				{showEditor && (
					<textarea
						ref={textareaRef}
						aria-label="Journal entry"
						value={content}
						onChange={(e) => handleChange(e.target.value)}
						onScroll={handleEditorScroll}
						disabled={loading}
						spellCheck={false}
						style={{
							...textareaStyle,
							width: mode === 'split' ? '50%' : '100%',
							flex: mode === 'split' ? '0 0 50%' : 1,
							borderRight: mode === 'split' ? '1px solid var(--border)' : 'none',
						}}
					/>
				)}
				{showPreview && (
					<div
						style={{
							flex: mode === 'split' ? '0 0 50%' : 1,
							width: mode === 'split' ? '50%' : '100%',
							overflow: 'hidden',
							display: 'flex',
						}}
					>
						<MarkdownPreview
							content={content}
							scrollRatio={mode === 'split' ? scrollRatio : undefined}
							onScroll={mode === 'split' ? handlePreviewScroll : undefined}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
