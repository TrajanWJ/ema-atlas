/**
 * use-connectors — subscribe to the daemon's `git_ema.user_connectors`
 * projection.
 *
 * Shape: `UserConnectorsProjection` in `@ema/surface-core/adapter`.
 */

import { useMemo } from "react";
import type { UserConnectorsProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../../lib/ipc";

export type ConnectorsView = {
  data: UserConnectorsProjection | null;
  offline: boolean;
};

export function useConnectors(): ConnectorsView {
  const data = useProjection<UserConnectorsProjection>("git_ema.user_connectors");
  return useMemo(() => ({ data, offline: data == null }), [data]);
}
