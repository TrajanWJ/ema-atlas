"use client";

import { sendCommand, useProjection } from "@/src/lib/ipc";

type Attachment = {
	id: string;
	display_name: string;
	kind: string;
	source: string;
};

type AttachmentsShape = { attachments: Attachment[] };

export type LinkTarget = {
	object_kind:
		| "project"
		| "space"
		| "blueprint_section"
		| "proposal"
		| "incident"
		| "lane_item";
	object_id: string;
};

/**
 * The shared attach dialog. Any vApp can open this to link an existing
 * attachment to one of its objects. Creating a brand-new attachment (via
 * picker) is done from the git-ema page itself; this dialog only links.
 *
 * Anti-silo rule: other vApps MUST NOT build their own attach UI. They
 * render this.
 */
export function AttachDialog({
	object,
	onClose,
}: {
	object: LinkTarget;
	onClose: () => void;
}) {
	const p = useProjection<AttachmentsShape>("git_ema.user_attachments");
	const attachments: Attachment[] = p?.attachments ?? [];

	async function link(attachmentId: string) {
		await sendCommand("attachment.link", {
			attachment_id: attachmentId,
			object_kind: object.object_kind,
			object_id: object.object_id,
		});
		onClose();
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-label="Attach to object"
		>
			<button
				type="button"
				aria-label="Close attach dialog"
				className="absolute inset-0"
				style={{
					background: "var(--place-surface-1)",
					opacity: 0.7,
					backdropFilter: "blur(6px)",
				}}
				onClick={onClose}
			/>
			<div
				className="relative z-10 flex max-h-[70vh] w-full max-w-md flex-col gap-3 rounded-lg border p-4"
				style={{
					background: "var(--place-surface-1)",
					borderColor: "var(--place-border-default)",
					color: "var(--place-text-primary)",
				}}
			>
				<header className="flex items-center justify-between gap-3">
					<h3 className="text-base font-semibold">Attach to {object.object_kind}</h3>
					<button
						type="button"
						className="rounded-md px-2 py-1 text-xs"
						style={{
							background: "var(--place-surface-3)",
							color: "var(--place-text-secondary)",
						}}
						onClick={onClose}
					>
						Close
					</button>
				</header>
				{attachments.length === 0 ? (
					<p className="text-sm" style={{ color: "var(--place-text-secondary)" }}>
						No attachments yet. Open git-ema to import a source first.
					</p>
				) : (
					<ul className="flex flex-col gap-2 overflow-auto">
						{attachments.map((a) => (
							<li
								key={a.id}
								className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
								style={{
									background: "var(--place-surface-2)",
									borderColor: "var(--place-border-default)",
								}}
							>
								<span style={{ color: "var(--place-text-primary)" }}>{a.display_name}</span>
								<span className="text-xs" style={{ color: "var(--place-text-tertiary)" }}>
									{a.source} · {a.kind}
								</span>
								<button
									type="button"
									className="ml-auto rounded-md px-2 py-1 text-xs"
									style={{
										background: "var(--place-primary-subtle)",
										color: "var(--place-primary-400)",
									}}
									onClick={() => link(a.id)}
								>
									Attach
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
