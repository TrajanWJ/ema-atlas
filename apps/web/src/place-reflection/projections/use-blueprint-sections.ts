/**
 * use-blueprint-sections — subscribe to the daemon's
 * `blueprint.sections` projection.
 *
 * Shape: `BlueprintSectionsProjection` in `@ema/surface-core/adapter`.
 * Channel: `project.<id>.all`.
 */

import { useMemo } from "react";
import type { BlueprintSectionsProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../../lib/ipc";

export type BlueprintSectionsView = {
  data: BlueprintSectionsProjection | null;
  offline: boolean;
};

export function useBlueprintSections(): BlueprintSectionsView {
  const data = useProjection<BlueprintSectionsProjection>("blueprint.sections");
  return useMemo(() => ({ data, offline: data == null }), [data]);
}
