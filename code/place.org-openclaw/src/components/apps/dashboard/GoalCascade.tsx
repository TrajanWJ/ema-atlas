'use client';

import { useEffect, useState } from "react";
import { useGoalStore, selectGoalsByLevel, selectChildGoals } from "@/src/stores/goal-store";
import type { Goal, GoalLevel } from "@/src/types/goal";

const LEVEL_ORDER: readonly GoalLevel[] = ["3year", "yearly", "monthly", "weekly"];
const LEVEL_LABELS: Record<GoalLevel, string> = {
	"3year": "3-Year",
	yearly: "Yearly",
	monthly: "Monthly",
	weekly: "Weekly",
};

interface GoalNodeProps {
	readonly goal: Goal;
	readonly goals: readonly Goal[];
	readonly depth: number;
	readonly onEdit: (goal: Goal) => void;
	readonly onDelete: (id: string) => void;
}

function GoalNode({ goal, goals, depth, onEdit, onDelete }: GoalNodeProps) {
	const [open, setOpen] = useState(depth < 2);
	const children = selectChildGoals(goals, goal.id);

	return (
		<div style={{ paddingLeft: depth > 0 ? "1rem" : 0 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "0.4rem",
					padding: "0.25rem 0",
				}}
			>
				{children.length > 0 && (
					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						style={{
							background: "transparent",
							border: "none",
							cursor: "pointer",
							color: "var(--text-secondary)",
							fontSize: "0.6rem",
							padding: 0,
							width: "0.75rem",
							flexShrink: 0,
						}}
					>
						{open ? "▼" : "▶"}
					</button>
				)}
				{children.length === 0 && <span style={{ width: "0.75rem", flexShrink: 0 }} />}

				<span
					style={{
						flex: 1,
						fontSize: "0.78rem",
						color: "var(--text-primary)",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{goal.title}
				</span>

				{goal.progress > 0 && (
					<span style={{ fontSize: "0.65rem", color: "var(--accent-blue)", flexShrink: 0 }}>
						{goal.progress}%
					</span>
				)}

				<button
					type="button"
					onClick={() => onEdit(goal)}
					title="Edit"
					style={{
						background: "transparent",
						border: "none",
						cursor: "pointer",
						color: "var(--text-secondary)",
						fontSize: "0.6rem",
						padding: "0 0.1rem",
					}}
				>
					✎
				</button>
				<button
					type="button"
					onClick={() => onDelete(goal.id)}
					title="Delete"
					style={{
						background: "transparent",
						border: "none",
						cursor: "pointer",
						color: "var(--text-secondary)",
						fontSize: "0.6rem",
						padding: "0 0.1rem",
					}}
				>
					×
				</button>
			</div>

			{open && children.length > 0 && (
				<div>
					{children.map((child) => (
						<GoalNode
							key={child.id}
							goal={child}
							goals={goals}
							depth={depth + 1}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function GoalCascade() {
	const { goals, loading, load, add, update, remove } = useGoalStore();
	const [addingLevel, setAddingLevel] = useState<GoalLevel | null>(null);
	const [newTitle, setNewTitle] = useState("");
	const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
	const [editTitle, setEditTitle] = useState("");

	useEffect(() => {
		load().catch(() => {});
	}, [load]);

	const handleAdd = (level: GoalLevel) => {
		const trimmed = newTitle.trim();
		if (!trimmed) return;
		add(trimmed, level).catch(() => {});
		setNewTitle("");
		setAddingLevel(null);
	};

	const handleEditStart = (goal: Goal) => {
		setEditingGoal(goal);
		setEditTitle(goal.title);
	};

	const handleEditSave = () => {
		if (!editingGoal) return;
		const trimmed = editTitle.trim();
		if (trimmed && trimmed !== editingGoal.title) {
			update(editingGoal.id, { title: trimmed }).catch(() => {});
		}
		setEditingGoal(null);
	};

	const handleDelete = (id: string) => {
		remove(id).catch(() => {});
	};

	if (loading) return null;

	return (
		<div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)" }}>
			<div
				style={{
					fontSize: "0.65rem",
					color: "var(--text-secondary)",
					textTransform: "uppercase",
					letterSpacing: "0.1em",
					marginBottom: "0.5rem",
					fontWeight: 600,
				}}
			>
				Goals
			</div>

			{/* Edit dialog */}
			{editingGoal && (
				<div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.4rem" }}>
					<input
						type="text"
						value={editTitle}
						onChange={(e) => setEditTitle(e.target.value)}
						autoFocus
						style={{
							flex: 1,
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "4px",
							padding: "0.2rem 0.4rem",
							color: "var(--text-primary)",
							fontSize: "0.75rem",
							outline: "none",
						}}
					/>
					<button
						type="button"
						onClick={handleEditSave}
						style={{ fontSize: "0.7rem", color: "var(--accent-blue)", background: "transparent", border: "1px solid var(--accent-blue)", borderRadius: "4px", padding: "0.2rem 0.4rem", cursor: "pointer" }}
					>
						Save
					</button>
					<button
						type="button"
						onClick={() => setEditingGoal(null)}
						style={{ fontSize: "0.7rem", color: "var(--text-secondary)", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", padding: "0.2rem 0.4rem", cursor: "pointer" }}
					>
						Cancel
					</button>
				</div>
			)}

			{/* Goals tree by level */}
			{LEVEL_ORDER.map((level) => {
				const levelGoals = selectGoalsByLevel(goals, level);
				return (
					<div key={level} style={{ marginBottom: "0.5rem" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: "0.2rem",
							}}
						>
							<span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 600 }}>
								{LEVEL_LABELS[level]}
							</span>
							<button
								type="button"
								onClick={() => setAddingLevel(addingLevel === level ? null : level)}
								style={{
									background: "transparent",
									border: "none",
									cursor: "pointer",
									fontSize: "0.65rem",
									color: "var(--accent-blue)",
									padding: 0,
								}}
							>
								+
							</button>
						</div>

						{/* Add form */}
						{addingLevel === level && (
							<div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.25rem" }}>
								<input
									type="text"
									value={newTitle}
									onChange={(e) => setNewTitle(e.target.value)}
									placeholder={`New ${LEVEL_LABELS[level]} goal…`}
									autoFocus
									onKeyDown={(e) => { if (e.key === "Enter") handleAdd(level); if (e.key === "Escape") setAddingLevel(null); }}
									style={{
										flex: 1,
										background: "var(--surface)",
										border: "1px solid var(--border)",
										borderRadius: "4px",
										padding: "0.2rem 0.4rem",
										color: "var(--text-primary)",
										fontSize: "0.72rem",
										outline: "none",
									}}
								/>
								<button
									type="button"
									onClick={() => handleAdd(level)}
									style={{ fontSize: "0.65rem", color: "var(--accent-blue)", background: "transparent", border: "1px solid var(--accent-blue)", borderRadius: "4px", padding: "0.2rem 0.4rem", cursor: "pointer" }}
								>
									Add
								</button>
							</div>
						)}

						{levelGoals.filter((g) => g.parentId === null).map((goal) => (
							<GoalNode
								key={goal.id}
								goal={goal}
								goals={goals}
								depth={0}
								onEdit={handleEditStart}
								onDelete={handleDelete}
							/>
						))}

						{levelGoals.length === 0 && addingLevel !== level && (
							<div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", paddingLeft: "0.5rem" }}>
								No goals
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
