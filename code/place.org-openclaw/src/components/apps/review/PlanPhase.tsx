'use client';

import { useReviewStore } from "@/src/stores/review-store";
import { useTaskStore } from "@/src/stores/task-store";

interface PlanPhaseProps {
	readonly onBack: () => void;
	readonly onComplete: () => void;
}

export function PlanPhase({ onBack, onComplete }: PlanPhaseProps) {
	const { currentReview, updateField, saveReview } = useReviewStore();
	const { tasks } = useTaskStore();

	const pendingMust = tasks.filter((t) => t.status === "pending" && t.priority === "must").slice(0, 5);

	const handleComplete = () => {
		saveReview().catch(() => {});
		onComplete();
	};

	return (
		<div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
			<div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
				Plan — Look forward clearly
			</div>

			{/* ONE Thing */}
			<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
				<label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
					The ONE Thing
				</label>
				<p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-secondary)" }}>
					What is the one thing you can do this week such that by doing it, everything else will be easier or unnecessary?
				</p>
				<textarea
					value={currentReview?.nextOneThing ?? ""}
					onChange={(e) => updateField("nextOneThing", e.target.value)}
					placeholder="My ONE Thing for next week…"
					rows={2}
					style={{
						background: "var(--surface)",
						border: "1px solid var(--border)",
						borderRadius: "4px",
						padding: "0.5rem",
						color: "var(--text-primary)",
						fontSize: "0.8rem",
						resize: "vertical",
						outline: "none",
					}}
				/>
			</div>

			{/* Priority tasks */}
			{pendingMust.length > 0 && (
				<div style={{ background: "var(--surface)", borderRadius: "6px", padding: "0.75rem", border: "1px solid var(--border)" }}>
					<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
						Must-Do Tasks
					</div>
					<ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
						{pendingMust.map((t) => (
							<li key={t.id} style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>
								{t.title}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Notes */}
			<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
				<label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
					Additional Notes
				</label>
				<textarea
					value={currentReview?.content ?? ""}
					onChange={(e) => updateField("content", e.target.value)}
					placeholder="Any other plans or intentions…"
					rows={3}
					style={{
						background: "var(--surface)",
						border: "1px solid var(--border)",
						borderRadius: "4px",
						padding: "0.5rem",
						color: "var(--text-primary)",
						fontSize: "0.8rem",
						resize: "vertical",
						outline: "none",
					}}
				/>
			</div>

			<div style={{ display: "flex", gap: "0.5rem" }}>
				<button
					type="button"
					onClick={onBack}
					style={{
						background: "transparent",
						border: "1px solid var(--border)",
						borderRadius: "6px",
						padding: "0.5rem 1rem",
						color: "var(--text-secondary)",
						fontSize: "0.8rem",
						cursor: "pointer",
					}}
				>
					← Back
				</button>
				<button
					type="button"
					onClick={handleComplete}
					style={{
						flex: 1,
						background: "var(--accent-green, #22c55e)",
						border: "1px solid var(--accent-green, #22c55e)",
						borderRadius: "6px",
						padding: "0.5rem 1rem",
						color: "white",
						fontSize: "0.8rem",
						cursor: "pointer",
						fontWeight: 600,
					}}
				>
					Complete Review ✓
				</button>
			</div>
		</div>
	);
}
