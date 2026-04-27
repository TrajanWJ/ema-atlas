/**
 * Popout launcher — honest-mock.
 *
 * Donor Window.tsx dragdrop-outside-viewport flow calls
 * `getPopoutLauncher().detach(id, appId, position)` to open a
 * transparent native window via the place.org companion. EMA has no
 * companion yet; this mock returns null so the shell behaves as if the
 * detach was rejected (the window stays in place).
 *
 * `isTouchDevice()` is consumed by WindowTitleBar to hide the detach
 * button on touch surfaces — safe to answer `false` on the desktop web.
 *
 * RIP: place.org src/lib/popout-launcher.ts (honest-mock — companion
 *      bridge lives at `place-reflection/lib/companion-bridge.ts`,
 *      already no-op).
 */

import type { WindowPosition, AppId } from "../types/window";

export interface PopoutLauncher {
  readonly detach: (id: string, appId: AppId, position: WindowPosition) => Window | null;
}

const NOOP_LAUNCHER: PopoutLauncher = {
  detach: () => null,
};

export function getPopoutLauncher(): PopoutLauncher {
  return NOOP_LAUNCHER;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
  );
}
