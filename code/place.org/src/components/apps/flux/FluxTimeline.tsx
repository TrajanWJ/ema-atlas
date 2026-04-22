'use client';

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFluxStore } from "@/src/stores/flux-store";
import { useJournalStore } from "@/src/stores/journal-store";
import { formatTime, appColor } from "@/src/lib/flux-formatter";
import type { FluxEntry } from "@/src/stores/flux-store";

// ----------------------------------------------------------------------------
// Single timeline entry
// ----------------------------------------------------------------------------

function AutoEntry({ entry }: { readonly entry: FluxEntry }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -8 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: "0.75rem",
				padding: "0.35rem 0",
			}}
		>
			{/* Timestamp */}
			<span
				style={{
					color: "var(--place-text-muted)",
					fontSize: "0.65rem",
					fontFamily: "monospace",
					flexShrink: 0,
					width: "3.2rem",
					textAlign: "right",
					paddingTop: "0.1rem",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{formatTime(entry.timestamp)}
			</span>

			{/* Dot */}
			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: appColor(entry.appId ?? ""),
					flexShrink: 0,
					marginTop: "0.25rem",
				}}
			/>

			{/* Content */}
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.75rem",
					lineHeight: 1.5,
				}}
			>
				{entry.content}
			</span>
		</motion.div>
	);
}

function ManualEntrySection() {
	const content = useJournalStore((s) => s.currentEntry?.content ?? "");
	const updatedAt = useJournalStore(
		(s) => s.currentEntry?.updatedAt ?? "",
	);

	if (!content || content.trim().length === 0) return null;

	const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();

	return (
		<motion.div
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: "0.75rem",
				padding: "0.5rem 0",
				borderTop: "1px solid var(--place-border-default)",
				borderBottom: "1px solid var(--place-border-default)",
				marginTop: "0.25rem",
				marginBottom: "0.25rem",
			}}
		>
			<span
				style={{
					color: "var(--place-text-muted)",
					fontSize: "0.65rem",
					fontFamily: "monospace",
					flexShrink: 0,
					width: "3.2rem",
					textAlign: "right",
					paddingTop: "0.1rem",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{formatTime(timestamp)}
			</span>

			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: "var(--place-secondary-400)",
					flexShrink: 0,
					marginTop: "0.25rem",
				}}
			/>

			<div
				style={{
					color: "var(--place-text-primary)",
					fontSize: "0.8rem",
					lineHeight: 1.6,
					fontFamily: "monospace",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					flex: 1,
					minWidth: 0,
				}}
			>
				{content.length > 200 ? `${content.slice(0, 200)}...` : content}
			</div>
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Timeline
// ----------------------------------------------------------------------------

export function FluxTimeline() {
	const entries = useFluxStore((s) => s.entries);
	const loading = useFluxStore((s) => s.loading);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new entries arrive
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [entries.length]);

	const sortedEntries = [...entries].sort(
		(a, b) => a.timestamp - b.timestamp,
	);

	return (
		<div
			ref={scrollRef}
			className="glass"
			style={{
				flex: 1,
				overflow: "auto",
				padding: "0.5rem 0.75rem",
				borderRadius: "8px",
				margin: "0.5rem",
				minHeight: 0,
			}}
		>
			{loading && (
				<div
					style={{
						textAlign: "center",
						padding: "2rem",
						color: "var(--place-text-secondary)",
						fontSize: "0.75rem",
					}}
				>
					Loading timeline...
				</div>
			)}

			{!loading && sortedEntries.length === 0 && (
				<div
					style={{
						textAlign: "center",
						padding: "2rem",
						color: "var(--place-text-secondary)",
						fontSize: "0.75rem",
					}}
				>
					No activity yet today. Events will appear as you use apps.
				</div>
			)}

			<ManualEntrySection />

			<AnimatePresence mode="popLayout">
				{sortedEntries.map((entry) => (
					<AutoEntry key={entry.id} entry={entry} />
				))}
			</AnimatePresence>
		</div>
	);
}
