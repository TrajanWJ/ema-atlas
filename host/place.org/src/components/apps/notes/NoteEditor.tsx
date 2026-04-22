'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Note } from "@/src/types/note";
import { shareContent } from "@/src/lib/web-share";
import { saveToFile, openFile } from "@/src/lib/file-system";
import { useNotesStore } from "@/src/stores/notes-store";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function countWords(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatSavedTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface NoteEditorProps {
	readonly note: Note;
	readonly onUpdate: (id: string, changes: { title?: string; content?: string }) => void;
	readonly onDelete: (id: string) => void;
	readonly onPin: (id: string, pinned: boolean) => void;
	readonly onArchive: (id: string) => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function NoteEditor({
	note,
	onUpdate,
	onDelete,
	onPin,
	onArchive,
}: NoteEditorProps) {
	const [title, setTitle] = useState(note.title);
	const [content, setContent] = useState(note.content);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const noteIdRef = useRef(note.id);

	// Reset local state when switching notes
	useEffect(() => {
		if (noteIdRef.current !== note.id) {
			noteIdRef.current = note.id;
			setTitle(note.title);
			setContent(note.content);
		}
	}, [note.id, note.title, note.content]);

	const debouncedUpdate = useCallback(
		(changes: { title?: string; content?: string }) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				onUpdate(note.id, changes);
			}, 500);
		},
		[note.id, onUpdate],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const handleTitleChange = useCallback(
		(value: string) => {
			setTitle(value);
			debouncedUpdate({ title: value });
		},
		[debouncedUpdate],
	);

	const handleContentChange = useCallback(
		(value: string) => {
			setContent(value);
			debouncedUpdate({ content: value });
		},
		[debouncedUpdate],
	);

	const wordCount = useMemo(() => countWords(content), [content]);

	const handleShare = useCallback(async () => {
		await shareContent({
			title: title || "Untitled",
			text: content.slice(0, 500),
		});
	}, [title, content]);

	const handleSaveAs = useCallback(async () => {
		const fileName = (title || "Untitled") + ".md";
		await saveToFile(content, fileName);
	}, [title, content]);

	const handleOpenFile = useCallback(async () => {
		const result = await openFile();
		if (!result) return;
		const name = result.name.replace(/\.(md|txt)$/, "");
		await useNotesStore.getState().create({
			title: name,
			content: result.content,
		});
	}, []);

	return (
		<div
			className="flex h-full flex-1 flex-col"
			style={{ background: "var(--place-base, #08090E)" }}
		>
			{/* Title */}
			<input
				type="text"
				value={title}
				onChange={(e) => handleTitleChange(e.target.value)}
				placeholder="Untitled"
				className="w-full border-none bg-transparent px-5 pt-5 pb-2 outline-none"
				style={{
					color: "var(--place-text-primary)",
					fontSize: "1.1rem",
					fontWeight: 600,
				}}
			/>

			{/* Content textarea */}
			<textarea
				value={content}
				onChange={(e) => handleContentChange(e.target.value)}
				placeholder="Start writing..."
				className="flex-1 resize-none border-none bg-transparent px-5 py-2 font-mono text-sm leading-[1.7] outline-none"
				style={{ color: "var(--place-text-secondary)" }}
			/>

			{/* Bottom bar */}
			<EditorBottomBar
				note={note}
				wordCount={wordCount}
				onShare={handleShare}
				onSaveAs={handleSaveAs}
				onOpenFile={handleOpenFile}
				onPin={onPin}
				onArchive={onArchive}
				onDelete={onDelete}
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Bottom bar (extracted for line-count)
// ----------------------------------------------------------------------------

interface BottomBarProps {
	readonly note: Note;
	readonly wordCount: number;
	readonly onShare: () => void;
	readonly onSaveAs: () => void;
	readonly onOpenFile: () => void;
	readonly onPin: (id: string, pinned: boolean) => void;
	readonly onArchive: (id: string) => void;
	readonly onDelete: (id: string) => void;
}

function EditorBottomBar({
	note,
	wordCount,
	onShare,
	onSaveAs,
	onOpenFile,
	onPin,
	onArchive,
	onDelete,
}: BottomBarProps) {
	const btnStyle = {
		color: "var(--place-text-secondary)",
		transition: "color 0.15s",
	};

	return (
		<div
			className="flex items-center justify-between px-5 py-2"
			style={{
				background: "transparent",
				borderTop: "1px solid var(--place-border-default)",
			}}
		>
			<div
				className="flex items-center gap-3 text-[10px]"
				style={{ color: "var(--place-text-muted)" }}
			>
				<span>{wordCount} words</span>
				<span>saved {formatSavedTime(note.updatedAt)}</span>
			</div>

			<div className="flex items-center gap-1">
				<BarButton label="Share" onClick={onShare} style={btnStyle} />
				<BarButton label="Save As" onClick={onSaveAs} style={btnStyle} />
				<BarButton label="Open" onClick={onOpenFile} style={btnStyle} />
				<BarButton
					label={note.pinned ? "Unpin" : "Pin"}
					onClick={() => onPin(note.id, !note.pinned)}
					style={{
						color: note.pinned
							? "var(--place-text-primary)"
							: "var(--place-text-muted)",
						transition: "color 0.15s",
					}}
				/>
				<BarButton label="Archive" onClick={() => onArchive(note.id)} style={btnStyle} />
				<BarButton
					label="Delete"
					onClick={() => onDelete(note.id)}
					style={{ color: "var(--place-error, #ef4444)", transition: "color 0.15s" }}
				/>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Tiny bar button
// ----------------------------------------------------------------------------

interface BarButtonProps {
	readonly label: string;
	readonly onClick: () => void;
	readonly style: React.CSSProperties;
}

function BarButton({ label, onClick, style }: BarButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded px-2 py-0.5 text-[10px] hover:brightness-150"
			style={style}
			title={label}
		>
			{label}
		</button>
	);
}
