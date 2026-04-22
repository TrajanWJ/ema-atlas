# EMA v1.1 — Tier 0 Surface Matrix

Date: 2026-04-13
Plane: planning
Scope: 23 v1.1 tier-0 surfaces × renderer status × backing service × shared entity × first-slice exit criterion

## Legend

- **R-status**: `wired` / `stub` / `absent` / `scaffold`
- **Svc**: service that must back it (create if missing)
- **Entity**: primary shared schema it reads/writes
- **Exit**: minimum honest-use condition for v1.1

## Shell & operator surface (Track A)

| Surface | R-status | Svc | Entity | Exit |
|---|---|---|---|---|
| **Launchpad** | absent | `workspace` (exists) + new `layout` | `workstream`, `space` | launcher opens any tier-0 vApp, restores last layout, shows workstream indicator |
| **HQ** | wired (862 LOC) | multiple | aggregate read model | HQ reads the same workstream/trace a CLI invocation would — cross-surface convergence |
| **Spaces** | absent (service exists) | `spaces` | `space` | space switcher in shell; vApp contexts scoped to space |
| **Notifications** | absent | **new** `notifications` | `notification` | any chronicle entry with `severity >= warn` produces a notification row visible in shell tray |

## Control plane (Track B)

| Surface | R-status | Svc | Entity | Exit |
|---|---|---|---|---|
| **Chronicle** | absent renderer / service exists | `chronicle` | `chronicle.{session,entry}` | Chronicle vApp lists unified timeline of ingested sessions with source/machine filters |
| **Review** | absent renderer / service exists | `review` | `review-item`, `promotion-receipt` | Review queue accepts/rejects chronicle extractions into intents/proposals/canon with receipts |
| **Search / Recall / Trace** | absent | **new** `traces` + existing `chronicle` | `trace`, `chronicle.entry` | keyword + entity search across chronicle + intents + executions; click-through to trace detail |
| **Intentions** | wired (505 LOC) | `intents` | `intent` | no change required for v1.1; Track E adds tree/graph view |

## Agent ops (Track C)

| Surface | R-status | Svc | Entity | Exit |
|---|---|---|---|---|
| **Agent Hub** | wired (154 LOC `agents`) | `actors` + `runtime-fabric` | `actor`, `runtime-session` | Hub lists active sessions with status, can spawn/resume/kill |
| **Agent Live View** | absent | `runtime-fabric` (exists) | `runtime-session`, `runtime-event` | live tmux read-through with scroll-back in a BrowserWindow; events stream over WS |
| **Agent Plans / Status** | partial (HQ shows some) | aggregate over `executions` + `intents` | `execution`, `intent` | per-agent plan panel with next-step preview |
| **Agent Comms** | absent | **new** `comms` (thin) | `workstream`, `notification` | inbox of agent-to-operator and agent-to-agent messages; attached to workstream id |

## Host reality (Track D)

| Surface | R-status | Svc | Entity | Exit |
|---|---|---|---|---|
| **Terminal** | wired (1301 LOC) | `runtime-fabric` | `runtime-session` | no change required; Track D adds machine context strip |
| **Machine Manager** | absent | **new** `machines` | `machine` | lists reachable hosts (local, SSH-able); health ping; context strip in Terminal |
| **Services Manager** | absent | **new** `services-mgmt` | `service` | lists EMA daemon + workers + systemd units; start/stop/status |
| **Network / Peer Manager** | absent | **new** `peers` | `peer` | enumerate known peers (P2P future); currently local-only stub |
| **Permissions** | absent | **new** `permissions` | n/a | operator-facing allowlist for sudo-scoped agent actions; read-only v1.1 |

## Knowledge, planning, research (Track E)

| Surface | R-status | Svc | Entity | Exit |
|---|---|---|---|---|
| **Blueprint / Schematic Planner** | wired (462 LOC) | `blueprint` | `gac-card`, `planning-node` | add planning-node list view feeding off `ema-genesis/planning/*` |
| **Wiki Viewer** | stub (6 LOC) | **new** thin `wiki-read` service | n/a | Wiki vApp renders any markdown under `~/.local/share/ema/vault/wiki/` with `[[wikilink]]` resolution |
| **Graph Visualizer** | absent | new `graph` aggregation view | cross-entity | read-only force-directed view over `ema-genesis/` links + runtime entities |
| **Research Viewer** | absent | **new** `research` | `research-item` | browse `ema-genesis/research/**` with source/tag filters |
| **Feeds** | wired (1327 LOC) | `feeds` | feed item | no structural change; confirm "why am I seeing this?" hover is wired |

## Human productivity (Track F)

| Surface | R-status | Svc | Entity | Exit |
|---|---|---|---|---|
| **Tasks** | wired (239 LOC) | `tasks` | `task` | attach tasks to `workstream` |
| **Brain Dumps** | wired (66 LOC) | `brain-dump` | `inbox-item` | route new dumps into chronicle + review queue |
| **Notes** | wired | `workspace` (notes subsurface) | — | no change |
| **Journal / Log** | stub | reuse `brain-dump` or `human-ops` | `day-object` | journal entry writes a `human-ops` day-object row |
| **Schedule / Calendar** | absent renderer / service exists | `calendar` | `calendar-entry` | calendar renders + supports creating human/agent blocks |
| **Focus / Pomodoro** | stub | small local store | — | optional, tier 2 |
| **Responsibilities** | stub | reuse `goals` | `goal`, `intent` | responsibility list = high-level goals with owner |

## Priority order for absent surfaces

1. **Launchpad** (Track A) — unblocks multi-window UX persistence
2. **Chronicle + Review renderer** (Track B) — unlocks visible control-plane backbone already serving data
3. **Machine Manager** (Track D) — small, enables host-reality context everywhere
4. **Calendar renderer** (Track F) — service exists, low-cost win
5. **Notifications** (Track A cross-cutting) — cheap once `notification` schema lands
6. **Agent Live View** (Track C) — extends runtime-fabric, high operator value
7. **Search / Recall / Trace** (Track B) — needs `trace` entity first
8. **Research Viewer** + **Graph Visualizer** (Track E) — cross-reference intensive, last

## Cross-cutting dependencies that block multiple surfaces

- `workstream` schema — blocks Launchpad, Agent Comms, HQ cross-wiring, Tasks linkage
- `trace` schema — blocks Search/Recall/Trace, Agent Live View observation stream
- `machine` schema — blocks Machine Manager, Terminal context strip, Services Manager host indicator
- `notification` schema — blocks Notifications vApp, chronicle severity surfacing
- `planning-node` schema — blocks Blueprint planning-node list, Graph Visualizer planning overlay
