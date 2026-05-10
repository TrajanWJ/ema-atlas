/**
 * Project registry barrel — web mirror.
 *
 * Source of truth: `apps/cli/src/project-registry/index.ts`. See
 * `proslync.ts` in this folder for the parity contract.
 */

import { Proslync } from "./proslync";
import type { ActiveBuild, ProjectRegistryEntry, Surface } from "./proslync";

export type { ActiveBuild, ProjectRegistryEntry, Surface };
export { Proslync };

const REGISTRY: readonly ProjectRegistryEntry[] = [Proslync];

export function getRegistryForProject(slug: string | null | undefined): ProjectRegistryEntry | null {
	if (!slug) return null;
	for (const entry of REGISTRY) {
		if (entry.projectSlug === slug) return entry;
		if (entry.projectId === slug) return entry;
	}
	return null;
}

export function listRegisteredProjects(): readonly ProjectRegistryEntry[] {
	return REGISTRY;
}
