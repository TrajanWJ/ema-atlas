'use client';

import { relativeTime } from "@/src/lib/time";
import type { InboxItem as InboxItemType } from "@/src/types/inbox";

interface InboxItemProps {
	readonly item: InboxItemType;
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onDelete: (id: string) => void;
}

export function InboxItem({ item, onProcess, onDelete }: InboxItemProps) {
	return (
		<div
			className="flex flex-col gap-2 rounded-lg p-3"
			style={{
				background: "rgba(255,255,255,0.03)",
				border: "1px solid var(--border)",
			}}
		>
			{/* Content */}
			<p style={{ color: "var(--text-primary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
				{item.content}
			</p>

			{/* Meta + actions */}
			<div className="flex items-center justify-between">
				<span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>
					{relativeTime(item.createdAt)}
				</span>

				<div className="flex gap-1">
					<ActionButton
						label="Task"
						color="var(--accent-blue)"
						onClick={() => onProcess(item.id, "task")}
					/>
					<ActionButton
						label="Journal"
						color="var(--accent-warm)"
						onClick={() => onProcess(item.id, "journal")}
					/>
					<ActionButton
						label="Archive"
						color="var(--text-secondary)"
						onClick={() => onProcess(item.id, "archive")}
					/>
					<ActionButton
						label="✕"
						color="var(--accent-urgent)"
						onClick={() => onDelete(item.id)}
					/>
				</div>
			</div>
		</div>
	);
}

function ActionButton({
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
			className="rounded px-2 py-0.5 text-xs transition-opacity hover:opacity-80"
			style={{
				color,
				border: `1px solid ${color}`,
				fontSize: "0.65rem",
				opacity: 0.85,
			}}
		>
			{label}
		</button>
	);
}
