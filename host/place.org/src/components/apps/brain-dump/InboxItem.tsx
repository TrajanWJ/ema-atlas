'use client';

import { useState, useCallback, useRef } from "react";
import { relativeTime } from "@/src/lib/time";
import { SendToMenu } from "@/src/components/ui/SendToMenu";
import type { InboxItem as InboxItemType } from "@/src/types/inbox";
import type { SendPayload } from "@/src/types/send-to";

interface InboxItemProps {
	readonly item: InboxItemType;
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onDelete: (id: string) => void;
	readonly onConvertToNote?: (id: string) => void;
	readonly onPromoteToTask?: (id: string) => void;
	readonly onMarkIdea?: (id: string) => void;
	readonly compact?: boolean;
}

export function InboxItem({
	item,
	onProcess,
	onDelete,
	onConvertToNote,
	onPromoteToTask,
	onMarkIdea,
	compact = false,
}: InboxItemProps) {
	const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
	const sendBtnRef = useRef<HTMLDivElement>(null);

	const openSendTo = useCallback(() => {
		const el = sendBtnRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		setMenuPos({ x: rect.right + 4, y: rect.top });
	}, []);

	const closeSendTo = useCallback(() => setMenuPos(null), []);

	const payload: SendPayload = {
		type: "braindump_item",
		data: { id: item.id, content: item.content, createdAt: item.createdAt },
		sourceAppId: "brain-dump",
	};

	const handleTask = () => {
		if (onPromoteToTask) {
			onPromoteToTask(item.id);
		} else {
			onProcess(item.id, "task");
		}
	};

	return (
		<div
			className="flex flex-col gap-2 rounded-lg p-3"
			style={{
				background: compact ? "transparent" : "rgba(255,255,255,0.03)",
				border: compact ? "none" : "1px solid var(--place-border-default)",
			}}
		>
			<p
				style={{
					color: "var(--place-text-primary)",
					fontSize: compact ? "0.8rem" : "0.875rem",
					lineHeight: 1.5,
				}}
			>
				{compact ? truncate(item.content, 80) : item.content}
			</p>

			<div className="flex items-center justify-between">
				<span style={{ color: "var(--place-text-secondary)", fontSize: "0.7rem" }}>
					{relativeTime(item.createdAt)}
				</span>

				<div className="flex gap-1">
					{!compact && (
						<div ref={sendBtnRef}>
							<ActionButton
								label="Send to..."
								color="var(--place-secondary-400)"
								onClick={openSendTo}
							/>
						</div>
					)}
					{onConvertToNote && (
						<ActionButton
							label="Note"
							color="var(--place-secondary-400)"
							onClick={() => onConvertToNote(item.id)}
						/>
					)}
					<ActionButton
						label="Task"
						color="var(--place-primary-400)"
						onClick={handleTask}
					/>
					{onMarkIdea && (
						<ActionButton
							label="Idea"
							color="#ffcf73"
							onClick={() => onMarkIdea(item.id)}
						/>
					)}
					{!compact && (
						<>
							<ActionButton
								label="Journal"
								color="var(--place-tertiary-400)"
								onClick={() => onProcess(item.id, "journal")}
							/>
							<ActionButton
								label="Archive"
								color="var(--place-text-secondary)"
								onClick={() => onProcess(item.id, "archive")}
							/>
						</>
					)}
					<ActionButton
						label="✕"
						color="var(--place-error)"
						onClick={() => onDelete(item.id)}
					/>
				</div>
			</div>

			{menuPos && (
				<SendToMenu
					payload={payload}
					position={menuPos}
					onClose={closeSendTo}
					onSent={closeSendTo}
				/>
			)}
		</div>
	);
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max)}...`;
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
