/**
 * use-blueprint-sections — subscribe to the daemon's
 * `blueprint.sections` projection.
 *
 * When the daemon writer is offline (e.g. bundled .app shell), this hook
 * returns the staged `blueprintProjection` mock with `offline: true` so
 * the Blueprint vApp renders coherent content instead of blanking.
 *
 * Shape: `BlueprintSectionsProjection` in `@ema/surface-core/adapter`.
 * Channel: `project.<id>.all`.
 */

import { useMemo } from "react";
import type { BlueprintSectionsProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../lib/ipc";
import { blueprintProjection } from "../app/mock-projections";

export type BlueprintSectionsView = {
	data: BlueprintSectionsProjection | null;
	offline: boolean;
};

const MOCK_BLUEPRINT_SECTIONS = blueprintProjection as unknown as BlueprintSectionsProjection;

export function useBlueprintSections(): BlueprintSectionsView {
	const data = useProjection<BlueprintSectionsProjection>("blueprint.sections");
	return useMemo(
		() =>
			data ? { data, offline: false } : { data: MOCK_BLUEPRINT_SECTIONS, offline: true },
		[data],
	);
}
