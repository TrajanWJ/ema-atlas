"use client";

import { useState, useTransition, type ReactNode } from "react";

import { publishQueueCapture } from "../data/projections";
import type { CockpitProject, ProjectKind } from "../data/types";

export interface CaptureFormProps {
	readonly projects: ReadonlyArray<{
		readonly id: string;
		readonly name: string;
		readonly kind: ProjectKind;
	}>;
}

export function captureProjectsForForm(
	projects: readonly CockpitProject[],
): CaptureFormProps["projects"] {
	return projects.map((project) => ({
		id: project.id,
		name: project.client_label ? `${project.client_label} / ${project.name}` : project.name,
		kind: project.kind,
	}));
}

export function CaptureForm({ projects }: CaptureFormProps) {
	const [pending, startTransition] = useTransition();
	const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

	const grouped = {
		client: projects.filter((entry) => entry.kind === "client"),
		personal: projects.filter((entry) => entry.kind === "personal"),
		internal: projects.filter((entry) => entry.kind === "internal"),
	};

	function handleSubmit(formData: FormData) {
		startTransition(async () => {
			const project_id = String(formData.get("project_id") ?? "");
			const title = String(formData.get("title") ?? "").trim();
			const why = String(formData.get("why") ?? "").trim();
			const done_when = String(formData.get("done_when") ?? "").trim();
			const source = String(formData.get("source") ?? "").trim();
			const priority = Number(formData.get("priority") ?? 3);
			const tags = String(formData.get("tags") ?? "").trim();

			if (!project_id || !title || !why || !done_when || !source) {
				setResult({ ok: false, message: "missing required field" });
				return;
			}

			const safePriority = (
				[1, 2, 3, 4, 5] as const
			).includes(priority as 1 | 2 | 3 | 4 | 5)
				? (priority as 1 | 2 | 3 | 4 | 5)
				: 3;

			const response = await publishQueueCapture({
				project_id,
				title,
				why,
				done_when,
				source,
				priority: safePriority,
				tags,
			});
			if (response.ok) {
				setResult({ ok: true, message: `queued ${response.queue_id}` });
				// Page-level revalidate signal — cockpit projection consumers
				// can listen for this to refresh without prop drilling.
				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("cockpit:queue-captured", {
							detail: { queue_id: response.queue_id, project_id },
						}),
					);
				}
			} else {
				setResult({
					ok: false,
					message: response.error ?? response.status ?? "queue capture failed",
				});
			}
		});
	}

	return (
		<form
			action={handleSubmit}
			className="cockpit-capture"
		>
			<Field id="cockpit-capture-project" label="Project (which surface does this belong to?)" required>
				<select
					id="cockpit-capture-project"
					name="project_id"
					required
					defaultValue=""
					className="cockpit-input"
				>
					<option value="" disabled>
						choose a project...
					</option>
					{grouped.client.length > 0 ? (
						<optgroup label="Client work">
							{grouped.client.map((entry) => (
								<option key={entry.id} value={entry.id}>
									{entry.name}
								</option>
							))}
						</optgroup>
					) : null}
					{grouped.personal.length > 0 ? (
						<optgroup label="Personal">
							{grouped.personal.map((entry) => (
								<option key={entry.id} value={entry.id}>
									{entry.name}
								</option>
							))}
						</optgroup>
					) : null}
					{grouped.internal.length > 0 ? (
						<optgroup label="Workshop">
							{grouped.internal.map((entry) => (
								<option key={entry.id} value={entry.id}>
									{entry.name}
								</option>
							))}
						</optgroup>
					) : null}
				</select>
			</Field>

			<Field id="cockpit-capture-title" label="Title (one line)" required>
				<input
					id="cockpit-capture-title"
					name="title"
					required
					maxLength={200}
					className="cockpit-input"
				/>
			</Field>

			<Field id="cockpit-capture-why" label="Why" required>
				<textarea
					id="cockpit-capture-why"
					name="why"
					required
					rows={3}
					className="cockpit-input"
				/>
			</Field>

			<Field id="cockpit-capture-done" label="Done when" required>
				<textarea
					id="cockpit-capture-done"
					name="done_when"
					required
					rows={2}
					className="cockpit-input"
					placeholder="A concrete check, not a feeling."
				/>
			</Field>

			<Field id="cockpit-capture-source" label="Source" required>
				<input
					id="cockpit-capture-source"
					name="source"
					required
					defaultValue="brain dump 2026-05-07"
					className="cockpit-input"
				/>
			</Field>

			<div className="cockpit-capture__row">
				<Field id="cockpit-capture-priority" label="Priority">
					<select
						id="cockpit-capture-priority"
						name="priority"
						defaultValue="3"
						className="cockpit-input"
					>
						<option value="1">P1 - drop everything</option>
						<option value="2">P2 - today</option>
						<option value="3">P3 - this week</option>
						<option value="4">P4 - later</option>
						<option value="5">P5 - someday</option>
					</select>
				</Field>
				<Field id="cockpit-capture-tags" label="Tags (comma-separated)">
					<input
						id="cockpit-capture-tags"
						name="tags"
						className="cockpit-input"
					/>
				</Field>
			</div>

			<div className="cockpit-capture__actions">
				<p className="cockpit-capture__hint">
					Writes through{" "}
					<span className="cockpit-mono">
						ema queue add --project proslync-app-ios-final --json
					</span>.
				</p>
				<button
					type="submit"
					disabled={pending}
					className="cockpit-button cockpit-button--primary"
				>
					{pending ? "Saving..." : "Capture"}
				</button>
			</div>

			{result ? (
				<p
					className={
						result.ok
							? "cockpit-capture__result cockpit-capture__result--ok"
							: "cockpit-capture__result cockpit-capture__result--err"
					}
				>
					{result.message}
				</p>
			) : null}
		</form>
	);
}

function Field({
	id,
	label,
	required,
	children,
}: {
	readonly id: string;
	readonly label: string;
	readonly required?: boolean;
	readonly children: ReactNode;
}) {
	return (
		<div className="cockpit-field">
			<label htmlFor={id} className="cockpit-field__label">
				{label}
				{required ? <span className="cockpit-field__required">*</span> : null}
			</label>
			{children}
		</div>
	);
}
