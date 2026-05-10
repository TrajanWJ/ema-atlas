"use client";

import { ProjectBenchView } from "../components/project-bench-view";

export type ProjectBenchKind = "client" | "personal" | "workshop";

export function ProjectBenchPage({
	projectId,
	kind,
	defaultTab,
}: {
	readonly projectId: string;
	readonly kind: ProjectBenchKind;
	readonly defaultTab?: string;
}) {
	// `kind` is currently informational. The underlying view reads the project
	// row from the live cockpit projection and decides what to render there.
	void kind;
	return <ProjectBenchView projectId={projectId} defaultTab={defaultTab} />;
}
