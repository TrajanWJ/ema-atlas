'use client';

import { useEffect, useState } from "react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useTaskStore } from "@/src/stores/task-store";

interface CollectPhaseProps {
	readonly onNext: () => void;
}

export function CollectPhase({ onNext }: CollectPhaseProps) {
	const { items: inboxItems, load: loadInbox } = useInboxStore();
	const { tasks, load: loadTasks } = useTaskStore();
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		loadInbox().catch(() => {});
		loadTasks().catch(() => {});
	}, [loadInbox, loadTasks]);

	const unprocessedCount = inboxItems.length;
	const overdueTasks = tasks.filter((t) => {
		if (t.status !== "pending" || !t.dueDate) return false;
		return t.dueDate < new Date().toISOString().slice(0, 10);
	});

	return (
		<div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
			<div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
				Collect — Clear the deck
			</div>

			<p style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
				Before reflecting, make sure everything is captured. Review the items below.
			</p>

			{/* Inbox */}
			<div style={{ background: "var(--surface)", borderRadius: "6px", padding: "0.75rem", border: "1px solid var(--border)" }}>
				<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
					Brain Dump Inbox
				</div>
				<div style={{ fontSize: "0.8rem", color: unprocessedCount > 0 ? "var(--accent-warm, #f97316)" : "var(--text-secondary)" }}>
					{unprocessedCount === 0 ? "✓ All processed" : `${unprocessedCount} unprocessed item${unprocessedCount !== 1 ? "s" : ""}`}
				</div>
			</div>

			{/* Overdue tasks */}
			<div style={{ background: "var(--surface)", borderRadius: "6px", padding: "0.75rem", border: "1px solid var(--border)" }}>
				<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
					Overdue Tasks
				</div>
				{overdueTasks.length === 0 ? (
					<div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>✓ None overdue</div>
				) : (
					<ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
						{overdueTasks.slice(0, 5).map((t) => (
							<li key={t.id} style={{ fontSize: "0.75rem", color: "var(--accent-red, #ef4444)" }}>
								{t.title}
							</li>
						))}
						{overdueTasks.length > 5 && (
							<li style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
								+{overdueTasks.length - 5} more
							</li>
						)}
					</ul>
				)}
			</div>

			{/* Acknowledge */}
			<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => setChecked(e.target.checked)}
				/>
				<span style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>
					I have reviewed and cleared the above
				</span>
			</label>

			<button
				type="button"
				onClick={onNext}
				disabled={!checked}
				style={{
					background: checked ? "var(--accent-blue)" : "var(--surface)",
					border: "1px solid var(--accent-blue)",
					borderRadius: "6px",
					padding: "0.5rem 1rem",
					color: checked ? "white" : "var(--text-secondary)",
					fontSize: "0.8rem",
					cursor: checked ? "pointer" : "not-allowed",
				}}
			>
				Next: Reflect →
			</button>
		</div>
	);
}
