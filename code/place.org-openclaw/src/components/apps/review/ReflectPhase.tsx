'use client';

import { useReviewStore } from "@/src/stores/review-store";

interface ReflectPhaseProps {
	readonly onNext: () => void;
	readonly onBack: () => void;
}

export function ReflectPhase({ onNext, onBack }: ReflectPhaseProps) {
	const { currentReview, updateField, saveReview } = useReviewStore();

	const handleNext = () => {
		saveReview().catch(() => {});
		onNext();
	};

	return (
		<div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
			<div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
				Reflect — Look back honestly
			</div>

			{/* Wins */}
			<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
				<label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
					Wins
				</label>
				<textarea
					value={currentReview?.wins ?? ""}
					onChange={(e) => updateField("wins", e.target.value)}
					placeholder="What went well?"
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

			{/* Challenges */}
			<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
				<label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
					Challenges
				</label>
				<textarea
					value={currentReview?.challenges ?? ""}
					onChange={(e) => updateField("challenges", e.target.value)}
					placeholder="What was hard?"
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

			{/* Lessons */}
			<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
				<label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
					Lessons
				</label>
				<textarea
					value={currentReview?.lessons ?? ""}
					onChange={(e) => updateField("lessons", e.target.value)}
					placeholder="What did you learn?"
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
					onClick={handleNext}
					style={{
						flex: 1,
						background: "var(--accent-blue)",
						border: "1px solid var(--accent-blue)",
						borderRadius: "6px",
						padding: "0.5rem 1rem",
						color: "white",
						fontSize: "0.8rem",
						cursor: "pointer",
					}}
				>
					Next: Plan →
				</button>
			</div>
		</div>
	);
}
