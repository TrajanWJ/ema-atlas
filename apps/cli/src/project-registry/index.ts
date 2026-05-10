/**
 * Project registry barrel — single entry point for project metadata that the
 * cockpit, workpack, and projection routes consume.
 *
 * Today the only entry is Proslync. New entries (other clients, internal
 * projects, donor builds we still operate) should land here, mirrored to
 * `apps/web/src/lib/project-registry/` for the web side, and resolved through
 * `getRegistryForProject(slug)` rather than fresh inline constants.
 */

import { Proslync } from "./proslync.js";
import type { ActiveBuild, ProjectRegistryEntry, Surface } from "./proslync.js";

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
