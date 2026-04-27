/**
 * Bridge file — owns the `AppId` union as EMA surface ids.
 *
 * Donor imports (`@/src/types/window`) are redirected here via
 * tsconfig.paths so donor components see EMA surfaces, not place.org's
 * brain-dump / focus / journal set.
 *
 * Same export shape as place-donor/place-org/types/window.ts.
 */

export type AppId =
  | "launchpad"
  | "braindump"
  | "hq"
  | "blueprint"
  | "git-ema"
  | "agent-work"
  | "wiki"
  | "threads"
  | "settings";

export interface WindowPosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ProcessWindow {
  readonly id: string;
  readonly appId: AppId;
  readonly position: WindowPosition;
  readonly zIndex: number;
  readonly minimized: boolean;
  readonly maximized: boolean;
}
