"use client";

/**
 * use-ready-queue — subscribe to `queue.registry` and surface the top ready
 * item, scoped to the current project.
 *
 * Mirrors `ema next --json` behavior: filter by `status === "ready"`, scoped
 * to the active project, return the most-recently-added (or undefined when
 * no candidates).
 *
 * Returns `null` while the projection hasn't arrived yet (daemon offline or
 * still connecting). Callers should render the offline state instead of a
 * fake item.
 */

import { useMemo } from "react";

import type { QueueRegistryProjection } from "@ema/surface-core/adapter";

import { useProjection } from "@/src/lib/ipc";
import { useScope } from "@/src/projections/use-scope";

export type ReadyQueueItem = QueueRegistryProjection["queue_items"][number];

export type ReadyQueueView = {
	readonly top: ReadyQueueItem | null;
	readonly readyCount: number;
	readonly blockedCount: number;
	readonly hasProjection: boolean;
};

export function useReadyQueue(): ReadyQueueView {
	const projection = useProjection<QueueRegistryProjection>("queue.registry");
	const { scope } = useScope();
	const projectId = scope.project?.id ?? null;

	return useMemo(() => {
		if (!projection) {
			return { top: null, readyCount: 0, blockedCount: 0, hasProjection: false };
		}

		const all = projection.queue_items ?? [];
		const inScope = projectId
			? all.filter((item) => item.project_id == null || item.project_id === projectId)
			: all;

		const ready = inScope.filter((item) => item.status === "ready");
		const blocked = inScope.filter((item) => item.status === "blocked");

		// Newest-first by added_at; lexicographic ULID-prefixed string compare is fine.
		const sortedReady = ready.slice().sort((a, b) => {
			const aKey = a.added_at ?? a.id;
			const bKey = b.added_at ?? b.id;
			return bKey.localeCompare(aKey);
		});

		return {
			top: sortedReady[0] ?? null,
			readyCount: ready.length,
			blockedCount: blocked.length,
			hasProjection: true,
		};
	}, [projection, projectId]);
}
