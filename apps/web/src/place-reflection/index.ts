/**
 * place-reflection façade.
 *
 * Surfaces import from `@ema/web/place-reflection` — or, more commonly,
 * let tsconfig.paths redirect donor `@/src/...` imports here so donor
 * components mount unmodified.
 *
 * Layer ownership:
 * - `shell-state/` — zustand bridges backing the workspace-plane layout
 *   artifact (localStorage). Never talks to the daemon.
 * - `projections/` — React hooks over `@ema/web/lib/ipc`'s
 *   `useProjection`. Wave 4+ as projections land in contracts.
 * - `commands/` — React hooks over `useCommand`. Wave 5+.
 * - `lib/` — ids, constants, app registry, place-events bus.
 * - `icons/` — donor icon pass-through (pure chrome).
 * - `honest-mock/` — the visible label + single registry of components
 *   not yet backed by real daemon writers.
 *
 * RIP: place.org (donor — direct-rip with provenance)
 */

// shell-state
export { useWindowStore } from "./shell-state/window-store-bridge";
export { useDockStore } from "./shell-state/dock-store-bridge";
export { useLauncherStore } from "./shell-state/launcher-store-bridge";
export { useVirtualDesktopStore } from "./shell-state/virtual-desktop-store-bridge";
export { useDesktopStore } from "./shell-state/desktop-store-bridge";
export { useSettingsStore } from "./shell-state/settings-store-bridge";
export {
  useWidgetStore,
  type DesktopWidget,
  type WidgetType,
} from "./shell-state/widget-store-bridge";
export {
  useNotificationStore,
  type Notification,
  type NotificationKind,
} from "./shell-state/notification-store-bridge";

// lib
export { createId } from "./lib/id";
export { userKey } from "./lib/user-storage";
export { DEFAULT_WINDOW_SIZES, APP_LABELS } from "./lib/constants";
export { getApp, getAllApps, type App, type SearchResult } from "./lib/app-registry";
export { SPRINGS, getTransition, type SpringName } from "./lib/springs";
export { subscribeToPlaceEvents, emitPlaceEvent, type PlaceEvent } from "./lib/place-events";
export { companionBridge, type CompanionBridge } from "./lib/companion-bridge";

// types
export type { AppId, ProcessWindow, WindowPosition } from "./types/window";
export {
  DEFAULT_SETTINGS,
  type SettingsState,
  type DockSize,
} from "./types/settings";

// honest-mock
export { MockedLabel, type HonestMockKind, type MockedLabelProps } from "./honest-mock/label";
export {
  HONEST_MOCK_REGISTRY,
  entryFor,
  entriesByKind,
  type RegistryEntry,
} from "./honest-mock/registry";

// components (direct-rip with provenance — see components/dock/*)
export { Dock } from "./components/dock/Dock";
export { DockIcon } from "./components/dock/DockIcon";
export { DockContextMenu, useDockContextMenu } from "./components/dock/DockContextMenu";
export { DesktopSwitcher } from "./components/dock/DesktopSwitcher";
export { KickoffLauncher } from "./components/dock/KickoffLauncher";
export { Tooltip } from "./components/dock/Tooltip";

// components/window (direct-rip with provenance)
export { VappWindow as Window } from "./components/window/Window";
export { WindowTitleBar } from "./components/window/WindowTitleBar";
export { SnapZones } from "./components/window/SnapZones";

// components/desktop (direct-rip with provenance)
export { CommandPalette } from "./components/desktop/CommandPalette";
export { DotsBg } from "./components/desktop/DotsBg";
export { ParticlesBg } from "./components/desktop/ParticlesBg";
export { Screensaver } from "./components/desktop/Screensaver";
export { ActivityPulse } from "./components/desktop/ActivityPulse";

// hooks
export { useSound, type SoundApi } from "./hooks/use-sound";
export { useReducedMotion } from "./hooks/use-reduced-motion";
export { useDockAutohide } from "./hooks/use-dock-autohide";
export { useIdleDetection } from "./hooks/use-idle-detection";

// projections (daemon-bound hooks over useProjection)
export { useTopbar, type TopbarView, type TopbarScope } from "./projections/use-topbar";
export { useHqPulse, type HqPulseView } from "./projections/use-hq-pulse";
export {
  useSeeAgentWork,
  type SeeAgentWorkView,
} from "./projections/use-see-agent-work";
export {
  useBlueprintSections,
  type BlueprintSectionsView,
} from "./projections/use-blueprint-sections";
export { useConnectors, type ConnectorsView } from "./projections/use-connectors";
export { useWallpaper, type WallpaperView } from "./projections/use-wallpaper";
export { usePresence, type PresenceView } from "./projections/use-presence";

// commands (wrappers over useCommand)
export { useOrgCommands, type OrgCommands } from "./commands/use-org-commands";
export {
  useCommandPalette,
  type CommandPaletteView,
  type CommandResult,
} from "./commands/use-command-palette";
