"use client";

import { AttachmentList } from "./attachment-list";
import { ConnectorsPanel } from "./connectors-panel";

/**
 * The git-ema vApp page.
 *
 *   scope="user"    — standalone /git-ema page, shows every attachment
 *                     the current user can see + connector management.
 *   scope="project" — rendered from within a project, scoped to that
 *                     project's attachments.
 *
 * The connectors panel is shown in both modes; the attachment list
 * scopes its projection name accordingly.
 */
export function GitEmaPage({ scope }: { scope: "user" | "project" }) {
	return (
		<section
			className="flex h-full w-full flex-col gap-6 overflow-auto p-8"
			data-app="git-ema"
			style={{ color: "var(--place-text-primary)" }}
		>
			<header className="flex flex-col gap-2">
				<span
					className="text-xs uppercase tracking-wider"
					style={{ color: "var(--place-secondary-400)" }}
				>
					files + repos surface
				</span>
				<h1 className="text-2xl font-semibold">git-ema</h1>
				<p
					className="max-w-prose text-sm leading-relaxed"
					style={{ color: "var(--place-text-secondary)" }}
				>
					Files and codebases, native to EMA.
				</p>
			</header>

			<ConnectorsPanel />

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					Attachments {scope === "project" ? "(this project)" : "(all visible)"}
				</h2>
				<AttachmentList scope={scope} />
			</section>
		</section>
	);
}

/**
 * Window-manager entry point. The shell mounts the user-scoped page; the
 * project-scoped variant renders inside future project shells via
 * `<GitEmaPage scope="project" />`.
 */
export function GitEmaApp() {
	return <GitEmaPage scope="user" />;
}

export default GitEmaApp;
