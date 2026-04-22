'use client';

import { useState } from "react";
import { useReviewStore } from "@/src/stores/review-store";
import { CollectPhase } from "./CollectPhase";
import { ReflectPhase } from "./ReflectPhase";
import { PlanPhase } from "./PlanPhase";
import type { ReviewType, ReviewPhase } from "@/src/types/review";

const REVIEW_TYPES: { readonly id: ReviewType; readonly label: string }[] = [
	{ id: "daily", label: "Daily" },
	{ id: "weekly", label: "Weekly" },
	{ id: "monthly", label: "Monthly" },
];

const PHASE_STEPS: readonly ReviewPhase[] = ["collect", "reflect", "plan"];
const PHASE_LABELS: Record<ReviewPhase, string> = {
	collect: "Collect",
	reflect: "Reflect",
	plan: "Plan",
};

export function ReviewApp() {
	const { currentReview, phase, setPhase, startReview, loading } = useReviewStore();
	const [done, setDone] = useState(false);

	if (done) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					gap: "1rem",
					color: "var(--text-primary)",
				}}
			>
				<div style={{ fontSize: "2rem" }}>✅</div>
				<div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Review complete!</div>
				<p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", maxWidth: "200px" }}>
					Great work. Your review has been saved.
				</p>
				<button
					type="button"
					onClick={() => setDone(false)}
					style={{
						background: "transparent",
						border: "1px solid var(--border)",
						borderRadius: "6px",
						padding: "0.4rem 1rem",
						color: "var(--text-secondary)",
						fontSize: "0.75rem",
						cursor: "pointer",
					}}
				>
					Start another review
				</button>
			</div>
		);
	}

	if (!currentReview) {
		return (
			<div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
				<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
					Start a Review
				</div>
				<p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
					Select the type of review to begin the Collect → Reflect → Plan flow.
				</p>
				<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					{REVIEW_TYPES.map(({ id, label }) => (
						<button
							key={id}
							type="button"
							disabled={loading}
							onClick={() => startReview(id).catch(() => {})}
							style={{
								background: "var(--surface)",
								border: "1px solid var(--border)",
								borderRadius: "6px",
								padding: "0.75rem 1rem",
								color: "var(--text-primary)",
								fontSize: "0.8rem",
								cursor: "pointer",
								textAlign: "left",
							}}
						>
							{label} Review
						</button>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Phase stepper */}
			<div
				style={{
					display: "flex",
					borderBottom: "1px solid var(--border)",
					flexShrink: 0,
				}}
			>
				{PHASE_STEPS.map((p, i) => (
					<div
						key={p}
						style={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "0.25rem",
							padding: "0.5rem",
							fontSize: "0.7rem",
							color: p === phase ? "var(--accent-blue)" : "var(--text-secondary)",
							borderBottom: p === phase ? "2px solid var(--accent-blue)" : "2px solid transparent",
							fontWeight: p === phase ? 600 : 400,
						}}
					>
						<span style={{ opacity: 0.5 }}>{i + 1}.</span>
						{PHASE_LABELS[p]}
					</div>
				))}
			</div>

			{/* Phase content */}
			<div style={{ flex: 1, overflowY: "auto" }}>
				{phase === "collect" && (
					<CollectPhase onNext={() => setPhase("reflect")} />
				)}
				{phase === "reflect" && (
					<ReflectPhase
						onNext={() => setPhase("plan")}
						onBack={() => setPhase("collect")}
					/>
				)}
				{phase === "plan" && (
					<PlanPhase
						onBack={() => setPhase("reflect")}
						onComplete={() => setDone(true)}
					/>
				)}
			</div>
		</div>
	);
}
