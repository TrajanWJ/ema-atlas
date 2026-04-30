'use client';

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Note } from "@/src/types/note";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatDate(iso: string): string {
	const d = new Date(iso);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
	return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getPreviewLine(content: string): string {
	const firstLine = content.split("\n").find((l) => l.trim().length > 0);
	if (!firstLine) return "No content";
	return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface NotesSidebarProps {
	readonly notes: readonly Note[];
	readonly activeNoteId: string | null;
	readonly onSelect: (id: string) => void;
	readonly onCreate: () => void;
	readonly onSearch: (query: string) => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function NotesSidebar({
	notes,
	activeNoteId,
	onSelect,
	onCreate,
	onSearch,
}: NotesSidebarProps) {
	const [query, setQuery] = useState("");

	const handleSearch = useCallback(
		(value: string) => {
			setQuery(value);
			onSearch(value);
		},
		[onSearch],
	);

	const pinned = notes.filter((n) => n.pinned);
	const unpinned = notes.filter((n) => !n.pinned);

	return (
		<div
			className="flex h-full w-[200px] shrink-0 flex-col border-r"
			style={{
				background: "transparent",
				borderColor: "var(--place-border-default)",
			}}
		>
			{/* Header */}
			<div className="flex items-center gap-1 p-2">
				<button
					type="button"
					onClick={onCreate}
					style={{
						background: "var(--place-primary-subtle)",
						color: "var(--place-primary-400)",
						border: "1px solid var(--place-primary-border)",
						borderRadius: "6px",
						fontSize: "0.65rem",
						fontWeight: 600,
						padding: "0.25rem 0.5rem",
						cursor: "pointer",
					}}
				>
					+ New
				</button>
			</div>

			{/* Search */}
			<div className="px-2 pb-2">
				<input
					type="text"
					placeholder="Search notes..."
					value={query}
					onChange={(e) => handleSearch(e.target.value)}
					style={{
						width: "100%",
						color: "var(--place-text-primary)",
						background: "rgba(255,255,255,0.03)",
						border: "1px solid var(--place-border-default)",
						borderRadius: "6px",
						fontSize: "0.65rem",
						padding: "0.25rem 0.5rem",
						outline: "none",
					}}
				/>
			</div>

			{/* Note list */}
			<div className="flex-1 overflow-y-auto">
				<AnimatePresence initial={false}>
					{pinned.map((note, i) => (
						<NoteItem
							key={note.id}
							note={note}
							isActive={note.id === activeNoteId}
							onSelect={onSelect}
							index={i}
						/>
					))}
					{unpinned.map((note, i) => (
						<NoteItem
							key={note.id}
							note={note}
							isActive={note.id === activeNoteId}
							onSelect={onSelect}
							index={pinned.length + i}
						/>
					))}
				</AnimatePresence>

				{notes.length === 0 && (
					<div
						className="px-3 py-4 text-center text-xs"
						style={{ color: "var(--place-text-tertiary)" }}
					>
						{query ? "No matches" : "No notes yet"}
					</div>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Note list item
// ----------------------------------------------------------------------------

interface NoteItemProps {
	readonly note: Note;
	readonly isActive: boolean;
	readonly onSelect: (id: string) => void;
	readonly index: number;
}

function NoteItem({ note, isActive, onSelect, index }: NoteItemProps) {
	return (
		<motion.button
			type="button"
			layout
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -10 }}
			transition={{ duration: 0.15, delay: index * 0.02 }}
			onClick={() => onSelect(note.id)}
			className="w-full px-3 py-2 text-left transition-colors"
			style={{
				background: isActive ? "var(--place-secondary-subtle)" : "transparent",
				borderLeft: isActive
					? "2px solid var(--place-secondary-400)"
					: "2px solid transparent",
			}}
		>
			<div className="flex items-center gap-1">
				{note.pinned && (
					<svg
						width={10}
						height={10}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						className="shrink-0"
						style={{ color: "var(--place-tertiary-400)" }}
						aria-label="Pinned"
					>
						<line x1="12" y1="17" x2="12" y2="22" />
						<path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
					</svg>
				)}
				<span
					className="truncate text-xs font-semibold"
					style={{ color: "var(--place-text-primary)" }}
				>
					{note.title || "Untitled"}
				</span>
			</div>
			<div
				className="mt-0.5 truncate text-[10px]"
				style={{ color: "var(--place-text-tertiary)" }}
			>
				{getPreviewLine(note.content)}
			</div>
			<div
				className="mt-0.5 text-[10px]"
				style={{ color: "var(--place-text-muted)" }}
			>
				{formatDate(note.updatedAt)}
			</div>
		</motion.button>
	);
}
