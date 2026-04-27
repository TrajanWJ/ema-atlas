# Surface → Runtime handoff — 2026-04-24

**From:** Product Surface Donor Orchestrator lane
**To:** Runtime Vertical Slice lane
**Plan:** `/Users/tawj/.claude/plans/this-project-current-state-jolly-lake.md`
**State at writing:** Waves 1–6 landed in Surface lane (2026-04-24). All projection hooks + command wrappers in place; donor chrome mounted. Runtime lane work unchanged — this packet still enumerates the writers Surface is waiting on.

---

## Why this packet exists

The Surface lane owns product shell wiring; it never writes to the daemon. Every projection the surfaces need must be delivered by the Runtime lane. This packet is the **authoritative list of writer work the surfaces are blocked on**, staged in the order the 6-wave plan consumes them.

All projection shapes are already declared in TypeScript in
`packages/surface-core/src/adapter/projection-types.ts`. The adapter is
a shared header — the Runtime writers must conform to the shapes named
here, not invent parallel ones.

Lane discipline: the Surface lane does not edit the daemon, the Runtime
lane does not edit `apps/web/src/**`. Ship writers, announce channel,
Surface lane flips the `useProjection` call from fallback to live.

---

## Wave 4 — `hq.pulse` projection

**Blocker for:** [`apps/web/src/app/hq-page.tsx`](../../../apps/web/src/app/hq-page.tsx) (`HqPage`) via [`apps/web/src/place-reflection/projections/use-hq-pulse.ts`](../../../apps/web/src/place-reflection/projections/use-hq-pulse.ts). Today `useHqPulse()` returns `{ data: null, offline: true }` and the page falls back to the staged `hqProjection` mock with a visible `staged projection` badge.

**Shape (authoritative):** `HqPulseProjection` in [`packages/surface-core/src/adapter/projection-types.ts`](../../../packages/surface-core/src/adapter/projection-types.ts).

```ts
export type HqPulseProjection = {
  project_id: string;
  pulse: Array<{ label: string; value: string; detail?: string }>;
  controls: Array<{
    label: string;
    state: "ok" | "warn" | "blocked";
    detail?: string;
    command?: string;
  }>;
  hubLinks: Array<{ label: string; surface: string; route?: string }>;
};
```

**Channel:** reuse `project.<id>.all` — no new contract. The projection composes over existing event families (`org.created`, `space.created`, `project.created`, `membership.granted`, plus the connector/attachment counts the `git_ema.*` projections already surface).

**Composition notes (guidance, not canon):**
- `pulse[]` cards today carry: org count, surface count, queued-controls count, daemon-seeded state. The writer can produce those from existing store counts; no new persistence.
- `controls[]` items map to commands that are not yet shipped (`promote projection`, `freeze event trail`, `invite surface owner`, `run doctrine check`). Writers may emit these as `state: "blocked"` with a `command` pointer until the corresponding command writers land — surfaces already render that state.
- `hubLinks[]` is purely navigational — static composition off project scope is fine.

**Acceptance:**
1. `useProjection<HqPulseProjection>("hq.pulse")` returns a non-null snapshot within 200ms of `IpcProvider` connect.
2. The `staged projection` badge on the HQ hero card disappears while online; reappears on disconnect.
3. Emitting `org.created` (any org.*) on `project.<id>.all` produces a new projection snapshot with an updated `pulse[0]` value.

---

## Wave 5 — command writers (See Agent Work + CommandPalette)

**Blocker for:** donor `Telescope` + `CommandPalette` + `AmbientBar`, mounted in Wave 5. Also for the HQ `controls[]` items once `hq.pulse` is live.

Event families already exist in the catalog; writers do not. Surface lane composes via `useCommand` (`apps/web/src/lib/ipc/use-command.ts`).

| Command                   | Purpose                                                       | Already-existing event family           |
| ------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `org.create`              | Create a new org from CommandPalette                          | `org.created`                           |
| `space.create`            | Create a new space under current org                          | `space.created`                         |
| `project.create`          | Create a new project under current space                      | `project.created`                       |
| `connector.connect`       | Begin OAuth dance for a git-ema connector                     | `connector.connected`/`connector.error` |
| `swarm.start`             | Transition a staged swarm to running                          | `swarm.started`                         |
| `swarm.pause`             | Pause an active swarm                                         | `swarm.paused`                          |
| `swarm.stop`              | Stop an active swarm                                          | `swarm.stopped`                         |
| `mission.create`          | Create a mission under a campaign                             | `mission.created`                       |
| `lane.item_add`           | Add an item to a lane backlog                                 | `lane.item_added`                       |
| `handoff.request`         | Request a handoff from one lane to another                    | `handoff.requested`                     |
| `checkup.schedule`        | Schedule a checkup for a lane/mission                         | `checkup.scheduled`                     |

**Shape (authoritative):** command signatures already mirrored in [`packages/surface-core/src/adapter/command-types.ts`](../../../packages/surface-core/src/adapter/command-types.ts). Writers conform; Surface lane does not redefine.

**Acceptance:** dispatching `org.create({name: "X"})` from the CommandPalette returns `event_ids` and the topbar projection updates within 200ms.

---

## Wave 6 — `desktop.wallpaper` + `desktop.presence`

**Blocker for:** [`apps/web/src/shell/wallpaper.tsx`](../../../apps/web/src/shell/wallpaper.tsx) and [`apps/web/src/shell/presence-layer.tsx`](../../../apps/web/src/shell/presence-layer.tsx).

**Surface-lane state (Wave 6 landed 2026-04-24):**
- `apps/web/src/place-reflection/projections/use-wallpaper.ts` subscribes to `desktop.wallpaper`. Falls back to a stable per-project scene key when offline — shell never shows a bare backdrop.
- `apps/web/src/place-reflection/projections/use-presence.ts` subscribes to `desktop.presence`. Returns empty cursors/outlines when offline.
- Donor chrome now mounted behind the wallpaper: `DotsBg` + `ParticlesBg` + `Screensaver` + `ActivityPulse` direct-ripped into `place-reflection/components/desktop/`. Pure visual; no daemon binding beyond the wallpaper key.
- Deferred to a later Surface-lane wave (not a Runtime ask): `WeatherBackground` + `WeatherParticles`. These require `use-weather` + `background-images` lib ports — Surface-lane work, listed in the honest-mock registry so the palette remains honest.

**Shapes:** `WallpaperProjection` and `PresenceProjection` in [`packages/surface-core/src/adapter/projection-types.ts`](../../../packages/surface-core/src/adapter/projection-types.ts).

```ts
export type WallpaperProjection = { project_id: string; wallpaper_key: string };
export type PresenceProjection = {
  project_id: string;
  cursors: Array<{ actor_id: string; x: number; y: number; color: string }>;
  window_outlines: Array<{ actor_id: string; window_id: string; color: string }>;
};
```

**Channels:** `project.<id>.all` for wallpaper (composed off project settings row). Presence can land on a new `project.<id>.presence` topic since it's high-frequency and ephemeral — Surface lane does not want presence cursors held on the same channel as canonical state.

**Note:** `apps/web/src/shell/presence-layer.tsx` currently uses a local `{ actors: [...] }` shape that pre-dates the adapter. Surface lane will port that component to consume `usePresence()` (cursors + window_outlines) before the daemon writer lands; no Runtime action required.

**Notifications:** the notification feed in Wave 6 reuses `project.<id>.all`; no new contract. The honest-mock notification store stays local-only until a writer chooses to annotate events into notifications.

---

## What Surface lane provides back

- Shapes are authoritative in `packages/surface-core/src/adapter/*`. Runtime writers should conform, not paraphrase.
- When a writer ships, Surface lane removes the corresponding entry from `apps/web/src/place-reflection/honest-mock/registry.ts`. The `staged projection` / `pending daemon writer` label vanishes automatically.
- A projection snapshot shape change is a cross-lane coordination — Surface opens an ADR under `docs/adr/` before bumping the adapter header.

## Out of scope for Runtime lane (window geometry lives workspace-plane forever)

- `ProcessWindow` + `DesktopLayout` geometry — maximized, snap, activeDesktopId, dockPinned — are **additive fields on the workspace-plane artifact (localStorage)**. Runtime lane does not need to ship any `window.*` event family. This is per the plan decision: "Window geometry stays workspace-plane forever." If a future product requirement needs geometry in the daemon, that becomes a new ADR.

## Retirement rules

Per [`apps/web/src/place-reflection/honest-mock/registry.ts`](../../../apps/web/src/place-reflection/honest-mock/registry.ts):

- Entry: `{ component, kind, cli, blocker }` where `kind ∈ { mocked, draft, local only, pending daemon writer }`.
- When Runtime ships the corresponding writer → Surface deletes the registry entry → label disappears → acceptance test passes.
- CI gate (scheduled for Wave 1 landing per plan; tracked by `todo` comment in the registry): vitest asserts every `useCommand` call either targets a shipped op or has a registry entry.
