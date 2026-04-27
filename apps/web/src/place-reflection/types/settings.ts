/**
 * Bridge file — minimal donor SettingsState shape.
 *
 * Exposes only the fields donor components actually read. Extend as
 * additional donor components are mounted in later waves.
 *
 * All of these are local-only user preferences; they never become canon.
 */

export type DockSize = "small" | "medium" | "large";

export interface SettingsState {
  readonly dockSize: DockSize;
  readonly dockMagnification: boolean;
  readonly virtualDesktopsEnabled: boolean;
  readonly reducedMotion: boolean;
  readonly soundEnabled: boolean;
  readonly wallpaperFit: "fill" | "fit" | "stretch" | "center";
  readonly wallpaperTint: string;
  readonly windowRadius: number;
  readonly windowShadows: boolean;
  readonly inactiveWindowOpacity: number;
}

export const DEFAULT_SETTINGS: SettingsState = {
  dockSize: "medium",
  dockMagnification: true,
  virtualDesktopsEnabled: false,
  reducedMotion: false,
  soundEnabled: false,
  wallpaperFit: "fill",
  wallpaperTint: "#0b0e14",
  windowRadius: 12,
  windowShadows: true,
  inactiveWindowOpacity: 0.9,
};
