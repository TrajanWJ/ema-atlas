/**
 * Bridge for donor's `userKey`. Scopes localStorage keys under the
 * current project so a future daemon migration can rewrite them as
 * workspace artifacts without collisions.
 */
import { EMA_SCOPE } from "../../app/mock-projections";

export function userKey(base: string): string {
  return `ema:workspace:${EMA_SCOPE.projectId}:${base}`;
}
