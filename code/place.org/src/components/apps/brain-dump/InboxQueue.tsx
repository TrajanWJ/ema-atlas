'use client';

import { motion, AnimatePresence } from "motion/react";
import { InboxItem } from "./InboxItem";
import type { InboxItem as InboxItemType } from "@/src/types/inbox";

interface InboxQueueProps {
	readonly items: readonly InboxItemType[];
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onDelete: (id: string) => void;
	readonly onConvertToNote?: (id: string) => void;
	readonly onPromoteToTask?: (id: string) => void;
	readonly onMarkIdea?: (id: string) => void;
}

export function InboxQueue({
	items,
	onProcess,
	onDelete,
	onConvertToNote,
	onPromoteToTask,
	onMarkIdea,
}: InboxQueueProps) {
	if (items.length === 0) {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center gap-3"
				style={{ padding: "2rem" }}
			>
				<svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--place-text-ghost, rgba(255,255,255,0.15))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
					<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
					<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
				</svg>
				<span style={{ fontSize: "0.8rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
					Capture your thoughts
				</span>
				<span style={{ fontSize: "0.65rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
					Type above or use voice input
				</span>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
			<AnimatePresence initial={false}>
				{items.map((item) => (
					<motion.div
						key={item.id}
						layout
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
						transition={{ duration: 0.2 }}
					>
						<InboxItem
							item={item}
							onProcess={onProcess}
							onDelete={onDelete}
							onConvertToNote={onConvertToNote}
							onPromoteToTask={onPromoteToTask}
							onMarkIdea={onMarkIdea}
						/>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
