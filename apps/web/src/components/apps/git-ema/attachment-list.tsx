"use client";

import {
	MOCK_PROJECTION_LABEL,
	gitEmaAttachmentsProjection,
} from "@/src/app/mock-projections";
import { sendCommand, useProjection } from "@/src/lib/ipc";

type Attachment = {
	id: string;
	kind: string;
	source: string;
	display_name: string;
	mime?: string;
	size_bytes?: number;
};

type AttachmentsShape = { attachments: Attachment[] };

export function AttachmentList({ scope }: { scope: "user" | "project" }) {
	const projectionName =
		scope === "project"
			? "git_ema.project_attachments"
			: "git_ema.user_attachments";

	const p = useProjection<AttachmentsShape>(projectionName);
	const isMock = p == null;
	const attachments: Attachment[] =
		p?.attachments ?? gitEmaAttachmentsProjection.attachments;

	if (attachments.length === 0) {
		return (
			<p
				className="text-sm"
				style={{ color: "var(--place-text-tertiary)" }}
			>
				No attachments yet.
			</p>
		);
	}

	async function remove(id: string) {
		await sendCommand("attachment.delete", { attachment_id: id });
	}

	return (
		<>
			{isMock && (
				<p
					className="text-xs"
					style={{ color: "var(--place-text-tertiary)" }}
				>
					Showing {MOCK_PROJECTION_LABEL}. Delete is disabled until a
					daemon projection is present.
				</p>
			)}
			<ul className="flex flex-col gap-2">
				{attachments.map((a) => (
					<li
						key={a.id}
						className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
						data-kind={a.kind}
						data-state="attached"
						style={{
							background: "var(--place-surface-2)",
							borderColor: "var(--place-border-default)",
							color: "var(--place-text-secondary)",
						}}
					>
						<span
							className="inline-flex h-7 w-7 items-center justify-center rounded-md text-base"
							data-kind={a.kind}
							style={{
								background: "var(--place-surface-3)",
								color: "var(--place-tertiary-400)",
							}}
						>
							{iconFor(a.kind)}
						</span>
						<span
							className="font-medium"
							style={{ color: "var(--place-text-primary)" }}
						>
							{a.display_name}
						</span>
						<span className="text-xs" style={{ color: "var(--place-text-tertiary)" }}>
							{a.source}
						</span>
						<button
							type="button"
							className="ml-auto rounded-md px-2 py-1 text-xs"
							style={{
								background: "var(--place-surface-3)",
								color: "var(--place-text-secondary)",
							}}
							onClick={() => remove(a.id)}
							disabled={isMock}
						>
							Delete
						</button>
					</li>
				))}
			</ul>
		</>
	);
}

function iconFor(kind: string): string {
	switch (kind) {
		case "git_repo":
		case "git_path":
			return "git";
		case "drive_file":
		case "drive_folder":
			return "drv";
		case "folder":
			return "dir";
		default:
			return "doc";
	}
}
