/**
 * useReducedMotion — reads the settings bridge `reducedMotion` field. Donor
 * exposes a hook of the same name; we mirror the signature so direct-rip
 * components (DockIcon etc.) keep their call sites.
 */

import { useSettingsStore } from "../shell-state/settings-store-bridge";

export function useReducedMotion(): boolean {
  return useSettingsStore((s) => s.reducedMotion);
}
