'use client';

import { useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { relativeTime } from "@/src/lib/time";
import type { InboxItem } from "@/src/types/inbox";

// ----------------------------------------------------------------------------
// Column definitions
// ----------------------------------------------------------------------------

type ColumnId = "inbox" | "processing" | "done";

interface ColumnDef {
	readonly id: ColumnId;
	readonly label: string;
	readonly accentVar: string | null;
}

const COLUMNS: readonly ColumnDef[] = [
	{ id: "inbox", label: "INBOX", accentVar: null },
	{ id: "processing", label: "PROCESSING", accentVar: "var(--place-tertiary-border)" },
	{ id: "done", label: "DONE", accentVar: "var(--place-primary-border)" },
];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function classifyItem(item: InboxItem): ColumnId {
	if (item.action === "processing" && !item.processed) return "processing";
	if (item.processed) return "done";
	return "inbox";
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max)}...`;
}

// ----------------------------------------------------------------------------
// KanbanView
// ----------------------------------------------------------------------------

export function KanbanView() {
	const allItems = useInboxStore((s) => s.allItems);
	const process = useInboxStore((s) => s.process);
	const remove = useInboxStore((s) => s.remove);
	const convertToNote = useInboxStore((s) => s.convertToNote);
	const promoteToTask = useInboxStore((s) => s.promoteToTask);
	const moveToProcessing = useInboxStore((s) => s.moveToProcessing);
	const unprocess = useInboxStore((s) => s.unprocess);

	const grouped = useMemo(() => {
		const map: Record<ColumnId, InboxItem[]> = {
			inbox: [],
			processing: [],
			done: [],
		};
		for (const item of allItems) {
			map[classifyItem(item)].push(item);
		}
		return map;
	}, [allItems]);

	const handleDrop = useCallback(
		(columnId: ColumnId, itemId: string) => {
			if (columnId === "inbox") {
				void unprocess(itemId);
			} else if (columnId === "processing") {
				void moveToProcessing(itemId);
			} else if (columnId === "done") {
				void process(itemId, "archive");
			}
		},
		[unprocess, moveToProcessing, process],
	);

	return (
		<div className="flex flex-1 gap-3 overflow-hidden p-3">
			{COLUMNS.map((col) => (
				<KanbanColumn
					key={col.id}
					column={col}
					items={grouped[col.id]}
					onDrop={handleDrop}
					onDelete={remove}
					onProcess={process}
					onConvertToNote={convertToNote}
					onPromoteToTask={promoteToTask}
				/>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// KanbanColumn
// ----------------------------------------------------------------------------

interface KanbanColumnProps {
	readonly column: ColumnDef;
	readonly items: readonly InboxItem[];
	readonly onDrop: (columnId: ColumnId, itemId: string) => void;
	readonly onDelete: (id: string) => void;
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onConvertToNote: (id: string) => void;
	readonly onPromoteToTask: (id: string) => void;
}

function KanbanColumn({
	column,
	items,
	onDrop,
	onDelete,
	onProcess,
	onConvertToNote,
	onPromoteToTask,
}: KanbanColumnProps) {
	const [dragOver, setDragOver] = useState(false);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			const itemId = e.dataTransfer.getData("text/plain");
			if (itemId) onDrop(column.id, itemId);
		},
		[column.id, onDrop],
	);

	return (
		<div
			className="flex flex-1 flex-col rounded-lg overflow-hidden"
			style={{
				background: "var(--place-surface-1, rgba(255,255,255,0.03))",
				border: dragOver ? "1px dashed var(--place-border-strong)" : "1px solid var(--place-border-default)",
				borderLeft: column.accentVar
					? `3px solid ${column.accentVar}`
					: undefined,
				transition: "border-color 0.15s",
			}}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<ColumnHeader label={column.label} count={items.length} />

			<div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
				<AnimatePresence initial={false}>
					{items.map((item) => (
						<motion.div
							key={item.id}
							layout
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.15 }}
						>
							<KanbanCard
								item={item}
								isDone={column.id === "done"}
								onDelete={onDelete}
								onProcess={onProcess}
								onConvertToNote={onConvertToNote}
								onPromoteToTask={onPromoteToTask}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// ColumnHeader
// ----------------------------------------------------------------------------

function ColumnHeader({
	label,
	count,
}: {
	readonly label: string;
	readonly count: number;
}) {
	return (
		<div
			className="flex items-center justify-between px-3 py-2"
			style={{ borderBottom: "1px solid var(--place-border-default)" }}
		>
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.65rem",
					fontWeight: 600,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
				}}
			>
				{label}
			</span>
			<span
				className="rounded-full px-1.5 py-0.5"
				style={{
					background: "rgba(255,255,255,0.06)",
					color: "var(--place-text-secondary)",
					fontSize: "0.6rem",
					fontWeight: 600,
				}}
			>
				{count}
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// KanbanCard
// ----------------------------------------------------------------------------

interface KanbanCardProps {
	readonly item: InboxItem;
	readonly isDone: boolean;
	readonly onDelete: (id: string) => void;
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onConvertToNote: (id: string) => void;
	readonly onPromoteToTask: (id: string) => void;
}

function KanbanCard({
	item,
	isDone,
	onDelete,
	onProcess,
	onConvertToNote,
	onPromoteToTask,
}: KanbanCardProps) {
	const [dragging, setDragging] = useState(false);

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			e.dataTransfer.setData("text/plain", item.id);
			e.dataTransfer.effectAllowed = "move";
			setDragging(true);
		},
		[item.id],
	);

	const handleDragEnd = useCallback(() => {
		setDragging(false);
	}, []);

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			className="cursor-grab rounded-md p-2 active:cursor-grabbing"
			style={{
				background: "var(--place-surface-2, rgba(255,255,255,0.05))",
				border: "1px solid var(--place-border-default)",
				opacity: dragging ? 0.4 : 1,
				transition: "opacity 0.15s",
			}}
		>
			<p
				style={{
					color: isDone ? "var(--place-text-secondary)" : "var(--place-text-primary)",
					fontSize: "0.8rem",
					lineHeight: 1.4,
					opacity: isDone ? 0.7 : 1,
				}}
			>
				{truncate(item.content, 100)}
			</p>

			<div className="mt-1.5 flex items-center justify-between">
				<span style={{ color: "var(--place-text-secondary)", fontSize: "0.6rem" }}>
					{relativeTime(item.createdAt)}
				</span>

				{!isDone && (
					<CardActions
						itemId={item.id}
						onDelete={onDelete}
						onProcess={onProcess}
						onConvertToNote={onConvertToNote}
						onPromoteToTask={onPromoteToTask}
					/>
				)}

				{isDone && item.action && (
					<span
						className="rounded px-1.5 py-0.5"
						style={{
							color: "var(--place-text-secondary)",
							fontSize: "0.55rem",
							background: "rgba(255,255,255,0.04)",
						}}
					>
						{item.action}
					</span>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// CardActions (extracted for line-length compliance)
// ----------------------------------------------------------------------------

function CardActions({
	itemId,
	onDelete,
	onProcess,
	onConvertToNote,
	onPromoteToTask,
}: {
	readonly itemId: string;
	readonly onDelete: (id: string) => void;
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onConvertToNote: (id: string) => void;
	readonly onPromoteToTask: (id: string) => void;
}) {
	return (
		<div className="flex gap-1">
			<SmallBtn
				label="Note"
				color="var(--place-secondary-400)"
				onClick={() => onConvertToNote(itemId)}
			/>
			<SmallBtn
				label="Task"
				color="var(--place-primary-400)"
				onClick={() => onPromoteToTask(itemId)}
			/>
			<SmallBtn
				label="Arch"
				color="var(--place-text-secondary)"
				onClick={() => onProcess(itemId, "archive")}
			/>
			<SmallBtn
				label="✕"
				color="var(--place-error)"
				onClick={() => onDelete(itemId)}
			/>
		</div>
	);
}

function SmallBtn({
	label,
	color,
	onClick,
}: {
	readonly label: string;
	readonly color: string;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded px-1.5 py-0.5 transition-opacity hover:opacity-80"
			style={{
				color,
				border: `1px solid ${color}`,
				fontSize: "0.55rem",
				opacity: 0.8,
			}}
		>
			{label}
		</button>
	);
}
