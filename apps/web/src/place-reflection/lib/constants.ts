/**
 * Bridge for donor's `DEFAULT_WINDOW_SIZES` and `APP_LABELS`.
 *
 * Sizes are per-EMA-surface, not per-donor-app. Edit here to change the
 * default geometry a vApp opens at.
 */

import type { AppId, WindowPosition } from "../types/window";

type WindowDefaults = Pick<WindowPosition, "width" | "height"> & {
  readonly x: number;
  readonly y: number;
};

export const DEFAULT_WINDOW_SIZES: Record<AppId, WindowDefaults> = {
  launchpad: { x: 76, y: 72, width: 760, height: 540 },
  braindump: { x: 108, y: 84, width: 720, height: 520 },
  hq: { x: 36, y: 50, width: 840, height: 520 },
  blueprint: { x: 84, y: 52, width: 860, height: 500 },
  "git-ema": { x: 120, y: 88, width: 840, height: 560 },
  "agent-work": { x: 48, y: 60, width: 920, height: 600 },
  wiki: { x: 140, y: 104, width: 760, height: 540 },
  threads: { x: 160, y: 120, width: 760, height: 540 },
  settings: { x: 220, y: 140, width: 760, height: 540 },
};

export const APP_LABELS: Record<AppId, string> = {
  launchpad: "Launchpad",
  braindump: "Brain Dump",
  hq: "HQ",
  blueprint: "Blueprint",
  "git-ema": "git-ema",
  "agent-work": "See Agent Work",
  wiki: "Wiki",
  threads: "Threads",
  settings: "Settings",
};
