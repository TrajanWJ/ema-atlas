"use client";

import { ProjectBenchView } from "../components/project-bench-view";

export type ProjectBenchKind = "client" | "personal" | "workshop";

export function ProjectBenchPage({
	projectId,
	kind,
}: {
	readonly projectId: string;
	readonly kind: ProjectBenchKind;
}) {
	// `kind` is currently informational — donor used the URL kind only for
	// breadcrumb routing and the underlying view always reads the project
	// row to decide what to render. We keep it on the prop so Slice 5 can
	// pre-select scope without an extra projection round-trip.
	void kind;
	return <ProjectBenchView projectId={projectId} />;
}
