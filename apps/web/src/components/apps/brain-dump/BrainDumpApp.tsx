'use client';

import { useEffect, useCallback, useState } from "react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useToast } from "@/src/hooks/use-toast";
import { useSendToReceiver } from "@/src/hooks/use-send-to-receiver";
import { CaptureInput } from "./CaptureInput";
import { InboxQueue } from "./InboxQueue";
import { KanbanView } from "./KanbanView";
import { withViewTransition } from "@/src/lib/view-transition";
import { ProjectPicker } from "@/src/components/shared/ProjectPicker";
import type { SendPayload } from "@/src/types/send-to";

type ViewMode = "inbox" | "kanban";

const ACTIVE_PROJECT_KEY = "brain-dump:active-project";

function readActiveProject(): string | null {
	if (typeof window === "undefined") return null;
	try {
		const v = sessionStorage.getItem(ACTIVE_PROJECT_KEY);
		return v && v !== "null" ? v : null;
	} catch {
		return null;
	}
}

function writeActiveProject(id: string | null): void {
	if (typeof window === "undefined") return;
	try {
		if (id === null) {
			sessionStorage.removeItem(ACTIVE_PROJECT_KEY);
		} else {
			sessionStorage.setItem(ACTIVE_PROJECT_KEY, id);
		}
	} catch {
		/* quota */
	}
}

export function BrainDumpApp() {
	const [viewMode, setViewMode] = useState<ViewMode>("inbox");
	const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => readActiveProject());
	const { items, loading, load, add, process, markAsIdea, remove, convertToNote, promoteToTask } =
		useInboxStore();
	const setInboxCount = useDesktopStore((s) => s.setInboxCount);
	const { success } = useToast();

	const setActiveProjectId = useCallback((id: string | null) => {
		setActiveProjectIdState(id);
		writeActiveProject(id);
	}, []);

	// Receive "text" and "task" payloads from other apps
	const handleReceive = useCallback(
		(payload: SendPayload) => {
			const content =
				typeof payload.data.content === "string"
					? payload.data.content
					: typeof payload.data.title === "string"
						? payload.data.title
						: String(payload.data.content ?? "");
			if (!content) return;
			void add(content).then(() => {
				success("Added to Brain Dump");
			});
		},
		[add, success],
	);

	useSendToReceiver("brain-dump", handleReceive);

	// Load all items on mount (single source of truth)
	useEffect(() => {
		load().catch(() => {});
	}, [load]);

	// Sync inbox count to desktop store
	useEffect(() => {
		setInboxCount(items.length);
	}, [items.length, setInboxCount]);

	const handleCapture = (text: string) => {
		void add(text, "text", activeProjectId).then(() => {
			success("Thought captured!");
		});
	};

	const handleProcess = (id: string, action: "task" | "journal" | "archive") => {
		process(id, action).catch(() => {});
	};

	const handleMarkIdea = (id: string) => {
		void markAsIdea(id).then(() => {
			success("Saved as idea");
		});
	};

	const handleDelete = (id: string) => {
		remove(id).catch(() => {});
	};

	const handleConvertToNote = (id: string) => {
		void convertToNote(id).then(() => {
			success("Converted to note");
		});
	};

	const handlePromoteToTask = (id: string) => {
		void promoteToTask(id, activeProjectId).then(() => {
			success("Promoted to task");
		});
	};

	return (
		<div className="flex h-full flex-col">
			{/* Shell-level active project */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "6px",
					padding: "0.375rem 0.625rem",
					borderBottom: "1px solid var(--place-border-default)",
				}}
			>
				<span
					style={{
						fontSize: "0.6rem",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
					}}
				>
					Project
				</span>
				<ProjectPicker
					value={activeProjectId}
					onChange={setActiveProjectId}
					placeholder="No project"
					compact
				/>
			</div>

			<CaptureInput onCapture={handleCapture} disabled={loading} />

			<div
				style={{
					height: "1px",
					background: "var(--place-border-default)",
					margin: "0 0.75rem",
				}}
			/>

			<ViewToggle active={viewMode} onChange={(mode) => withViewTransition(() => setViewMode(mode))} itemCount={items.length} />

			{viewMode === "inbox" ? (
				<InboxQueue
					items={items}
					onProcess={handleProcess}
					onDelete={handleDelete}
					onConvertToNote={handleConvertToNote}
					onPromoteToTask={handlePromoteToTask}
					onMarkIdea={handleMarkIdea}
				/>
			) : (
				<KanbanView />
			)}
		</div>
	);
}

// ----------------------------------------------------------------------------
// ViewToggle
// ----------------------------------------------------------------------------

function ViewToggle({
	active,
	onChange,
	itemCount,
}: {
	readonly active: ViewMode;
	readonly onChange: (mode: ViewMode) => void;
	readonly itemCount: number;
}) {
	return (
		<div className="flex items-center justify-between px-3 py-2">
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.7rem",
				}}
			>
				{active === "inbox"
					? itemCount === 0
						? "no items"
						: `${itemCount} item${itemCount !== 1 ? "s" : ""}`
					: "board view"}
			</span>

			<div
				style={{
					display: "flex",
					gap: "2px",
					background: "var(--place-surface-3, #1A1D2A)",
					borderRadius: "0.375rem",
					padding: "2px",
				}}
			>
				<ToggleButton
					label="Inbox"
					isActive={active === "inbox"}
					onClick={() => onChange("inbox")}
				/>
				<ToggleButton
					label="Board"
					isActive={active === "kanban"}
					onClick={() => onChange("kanban")}
				/>
			</div>
		</div>
	);
}

function ToggleButton({
	label,
	isActive,
	onClick,
}: {
	readonly label: string;
	readonly isActive: boolean;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				fontSize: "0.6rem",
				padding: "0.2rem 0.5rem",
				border: "none",
				borderRadius: "0.25rem",
				cursor: "pointer",
				background: isActive
					? "var(--place-secondary-subtle, rgba(75,123,229,0.10))"
					: "transparent",
				color: isActive
					? "var(--place-secondary-400, #6B95F0)"
					: "var(--place-text-tertiary, rgba(255,255,255,0.4))",
				fontWeight: isActive ? 600 : 400,
				transition: "background 0.15s, color 0.15s",
			}}
		>
			{label}
		</button>
	);
}
