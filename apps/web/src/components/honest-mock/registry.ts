/**
 * Honest-mock registry — the single list of Surface lane components
 * that are not yet backed by a real daemon writer.
 *
 * When a Wave handoff lands in Runtime → delete the relevant entry here.
 * When a new donor component mounts without a real writer → add an
 * entry here BEFORE the PR ships.
 *
 * The CI gate (added in Wave 1) asserts:
 *   - every entry has a distinct `component` path
 *   - every entry's `cli` is non-empty
 *   - no `useCommand` op that isn't in SHIPPED_COMMAND_OPS appears without
 *     a registry entry mentioning it
 */

import type { HonestMockKind } from "./label";

export interface RegistryEntry {
  readonly component: string;
  readonly kind: HonestMockKind;
  readonly cli: string;
  readonly blocker: string;
  readonly op?: string;
}

export const HONEST_MOCK_REGISTRY: readonly RegistryEntry[] = [
  {
    component: "apps/web/src/place-reflection/lib/companion-bridge.ts",
    kind: "pending daemon writer",
    cli: "ema companion status",
    blocker: "companion app does not exist (Desktop Launcher Correction lane)",
  },
  {
    component: "apps/web/src/place-reflection/shell-state/widget-store-bridge.ts",
    kind: "pending daemon writer",
    cli: "ema widgets list",
    blocker: "no widget.* event family in contracts",
  },
  {
    component: "apps/web/src/place-reflection/shell-state/notification-store-bridge.ts",
    kind: "pending daemon writer",
    cli: "ema notifications tail",
    blocker: "notification stream maps to project.<id>.all in Wave 6 but surface isn't wired yet",
  },
  // CommandPalette pending-writer entries — each appears in the palette
  // with a `pending daemon writer` hint; dispatching returns an error from
  // the daemon until the corresponding writer ships (Wave 5 handoff).
  {
    component: "apps/web/src/place-reflection/commands/use-command-palette.ts#swarm.start",
    kind: "pending daemon writer",
    cli: "ema swarm start --swarm <id>",
    blocker: "no swarm.start writer in daemon (Runtime Vertical Slice lane)",
    op: "swarm.start",
  },
  {
    component: "apps/web/src/place-reflection/commands/use-command-palette.ts#swarm.pause",
    kind: "pending daemon writer",
    cli: "ema swarm pause --swarm <id>",
    blocker: "no swarm.pause writer in daemon",
    op: "swarm.pause",
  },
  {
    component: "apps/web/src/place-reflection/commands/use-command-palette.ts#swarm.stop",
    kind: "pending daemon writer",
    cli: "ema swarm stop --swarm <id>",
    blocker: "no swarm.stop writer in daemon",
    op: "swarm.stop",
  },
  {
    component: "apps/web/src/place-reflection/commands/use-command-palette.ts#mission.create",
    kind: "pending daemon writer",
    cli: "ema mission create --project <id> --title <title>",
    blocker: "no mission.create writer in daemon",
    op: "mission.create",
  },
  {
    component: "apps/web/src/place-reflection/commands/use-command-palette.ts#handoff.request",
    kind: "pending daemon writer",
    cli: "ema handoff request --from <lane> --to <lane> --title <title>",
    blocker: "no handoff.request writer in daemon",
    op: "handoff.request",
  },
  {
    component: "apps/web/src/place-reflection/commands/use-command-palette.ts#checkup.schedule",
    kind: "pending daemon writer",
    cli: "ema checkup schedule --project <id> --when <iso>",
    blocker: "no checkup.schedule writer in daemon",
    op: "checkup.schedule",
  },
  // Wave 6 wallpaper + presence — projections the shell subscribes to
  // but no writer has landed yet. `useWallpaper` falls back to a stable
  // per-project scene key; `usePresence` returns empty arrays.
  {
    component: "apps/web/src/place-reflection/projections/use-wallpaper.ts",
    kind: "pending daemon writer",
    cli: "ema desktop wallpaper --project <id>",
    blocker: "no desktop.wallpaper writer in daemon (Wave 6 handoff)",
  },
  {
    component: "apps/web/src/place-reflection/projections/use-presence.ts",
    kind: "pending daemon writer",
    cli: "ema desktop presence --project <id>",
    blocker: "no desktop.presence writer in daemon (deferred collab-plane)",
  },
  // Weather chrome deferred — Surface-lane work, not a Runtime ask.
  // WeatherBackground/WeatherParticles donor components require
  // `use-weather` + `background-images` lib ports that haven't landed in
  // place-reflection yet. The wallpaper still mounts DotsBg+ParticlesBg
  // behind `useWallpaper` in Wave 6; weather chrome comes with a later
  // surface-lane wave.
  {
    component: "apps/web/src/shell/wallpaper.tsx#weather",
    kind: "draft",
    cli: "—",
    blocker: "WeatherBackground + WeatherParticles need use-weather + background-images lib port (Surface-lane work, not Runtime)",
  },
];

export function entryFor(component: string): RegistryEntry | undefined {
  return HONEST_MOCK_REGISTRY.find((e) => e.component === component);
}

export function entriesByKind(kind: HonestMockKind): readonly RegistryEntry[] {
  return HONEST_MOCK_REGISTRY.filter((e) => e.kind === kind);
}
