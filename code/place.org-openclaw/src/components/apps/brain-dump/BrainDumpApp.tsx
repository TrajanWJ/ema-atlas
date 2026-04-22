'use client';

import { useEffect } from "react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useToast } from "@/src/hooks/use-toast";
import { CaptureInput } from "./CaptureInput";
import { InboxQueue } from "./InboxQueue";

export function BrainDumpApp() {
	const { items, loading, load, add, process, remove } = useInboxStore();
	const setInboxCount = useDesktopStore((s) => s.setInboxCount);
	const { success } = useToast();

	// Load items on mount
	useEffect(() => {
		load().catch(() => {
			// DB may not be ready in all environments; silently ignore
		});
	}, [load]);

	// Sync inbox count to desktop store
	useEffect(() => {
		setInboxCount(items.length);
	}, [items.length, setInboxCount]);

	const handleCapture = (text: string) => {
		add(text)
			.then(() => { success("Thought captured!"); })
			.catch(() => {
				// Silently ignore failures in offline/demo mode
			});
	};

	const handleProcess = (id: string, action: "task" | "journal" | "archive") => {
		process(id, action).catch(() => {});
	};

	const handleDelete = (id: string) => {
		remove(id).catch(() => {});
	};

	return (
		<div className="flex h-full flex-col">
			<CaptureInput onCapture={handleCapture} disabled={loading} />

			<div
				style={{
					height: "1px",
					background: "var(--border)",
					margin: "0 0.75rem",
				}}
			/>

			<div
				className="px-3 py-2"
				style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}
			>
				{items.length === 0 ? "no items" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
			</div>

			<InboxQueue
				items={items}
				onProcess={handleProcess}
				onDelete={handleDelete}
			/>
		</div>
	);
}
