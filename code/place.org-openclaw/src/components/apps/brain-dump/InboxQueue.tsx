'use client';

import { motion, AnimatePresence } from "motion/react";
import { InboxItem } from "./InboxItem";
import type { InboxItem as InboxItemType } from "@/src/types/inbox";

interface InboxQueueProps {
	readonly items: readonly InboxItemType[];
	readonly onProcess: (id: string, action: "task" | "journal" | "archive") => void;
	readonly onDelete: (id: string) => void;
}

export function InboxQueue({ items, onProcess, onDelete }: InboxQueueProps) {
	if (items.length === 0) {
		return (
			<div
				className="flex flex-1 items-center justify-center"
				style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
			>
				inbox clear
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
						<InboxItem item={item} onProcess={onProcess} onDelete={onDelete} />
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
