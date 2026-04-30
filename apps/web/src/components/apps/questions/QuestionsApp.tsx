'use client';

import { useEffect, useState, useMemo } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";

export function QuestionsApp() {
	const { questions, openQuestion, answerQuestion, deleteQuestion, loadAll, loading } = useTrackersStore();
	const [text, setText] = useState("");
	const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});

	useEffect(() => {
		if (questions.length === 0 && !loading) void loadAll();
	}, [questions.length, loading, loadAll]);

	const open = useMemo(() => questions.filter((q) => q.state === "open"), [questions]);
	const answered = useMemo(
		() => questions.filter((q) => q.state === "answered").slice(0, 15),
		[questions],
	);

	async function handleAdd() {
		if (!text.trim()) return;
		await openQuestion(text);
		setText("");
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontSize: "0.85rem",
			}}
		>
			<div style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
				<input
					type="text"
					placeholder="What's the question you don't have an answer to?"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
					style={{
						width: "100%",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: "6px",
						color: "inherit",
						fontFamily: "inherit",
						fontSize: "0.85rem",
						padding: "0.4rem 0.625rem",
						outline: "none",
					}}
				/>
			</div>
			<div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
				<Section label={`Open — ${open.length}`} />
				{open.length === 0 ? (
					<Empty text="No open questions." />
				) : (
					open.map((q) => (
						<div
							key={q.id}
							style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
						>
							<div style={{ fontSize: "0.85rem", fontStyle: "italic" }}>{q.text}?</div>
							<div style={{ display: "flex", gap: "0.375rem", marginTop: "6px" }}>
								<input
									type="text"
									placeholder="answer…"
									value={answerDraft[q.id] ?? ""}
									onChange={(e) => setAnswerDraft({ ...answerDraft, [q.id]: e.target.value })}
									onKeyDown={(e) => {
										if (e.key === "Enter" && (answerDraft[q.id]?.trim() ?? "")) {
											void answerQuestion(q.id, answerDraft[q.id] ?? "");
											setAnswerDraft({ ...answerDraft, [q.id]: "" });
										}
									}}
									style={{
										flex: 1,
										background: "rgba(255,255,255,0.03)",
										border: "1px solid rgba(255,255,255,0.06)",
										borderRadius: "4px",
										padding: "3px 6px",
										color: "inherit",
										fontFamily: "inherit",
										fontSize: "0.78rem",
										outline: "none",
									}}
								/>
								<button
									type="button"
									onClick={() => void deleteQuestion(q.id)}
									style={{
										background: "transparent",
										border: "none",
										color: "var(--place-text-tertiary, rgba(255,255,255,0.3))",
										fontSize: "0.75rem",
										cursor: "pointer",
									}}
								>
									×
								</button>
							</div>
						</div>
					))
				)}
				{answered.length > 0 && (
					<>
						<Section label={`Answered — ${answered.length}`} />
						<div style={{ opacity: 0.7 }}>
							{answered.map((q) => (
								<div
									key={q.id}
									style={{
										padding: "0.4rem 0",
										borderBottom: "1px solid rgba(255,255,255,0.04)",
									}}
								>
									<div style={{ fontSize: "0.78rem", fontStyle: "italic" }}>{q.text}?</div>
									<div
										style={{
											fontSize: "0.75rem",
											color: "var(--place-text-secondary, rgba(255,255,255,0.55))",
											marginTop: "2px",
										}}
									>
										→ {q.answer}
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function Section({ label }: { readonly label: string }) {
	return (
		<div
			style={{
				fontSize: "0.65rem",
				textTransform: "uppercase",
				letterSpacing: "0.1em",
				color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
				padding: "0.5rem 0 0.25rem",
			}}
		>
			{label}
		</div>
	);
}

function Empty({ text }: { readonly text: string }) {
	return (
		<div
			style={{
				textAlign: "center",
				padding: "1rem",
				color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
				fontSize: "0.8rem",
			}}
		>
			{text}
		</div>
	);
}
