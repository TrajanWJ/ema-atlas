# Discord Lane Registry

Updated: 2026-04-14 UTC

## Purpose

Classify current Discord lanes by operational role so we stop reviving everything blindly.

Each lane should have one primary operating mode:
- `human-command`
- `session-bound`
- `event-fed`
- `digest-fed`
- `knowledge/reference`
- `intake`
- `temporary-repair`
- `archive`
- `experimental/unbound`

A lane is only considered truly "running" if it has a real source of activity and a reason to stay alive.

---

## A. Canonical live operator lanes

These should stay active and visible.

| lane | mode | intent | notes |
|---|---|---|---|
| `command` | human-command | primary human command lane | canonical human interface |
| `orchestrator-control` | human-command + session-bound | operator directives and orchestration decisions | should accept explicit control nudges |
| `orchestrator-ema` | session-bound + event-fed | EMA/runtime/control-plane ops | canonical EMA ops lane |
| `orchestrator-implementation` | session-bound | active implementation queue | should surface current work, blockers, next actions |
| `command-queue` | digest-fed + session-bound | explicit queued tasks | should summarize queue state, not chatter constantly |
| `agent-dispatch` | event-fed | raw dispatch visibility | active when dispatching is real |
| `agent-results` | digest-fed | synthesized outputs | should receive completions/promotions, not raw noise |
| `decisions-log` | digest-fed | durable decisions | promote only meaningful decisions |
| `babysitter-sprint` | human-command + digest-fed | canonical babysitter control lane | temporary/repair items should point back here |
| `babysitter-live` | digest-fed | babysitter implementation rollup | not a raw ticker |
| `ema-runtime-recovery` | session-bound | EMA runtime recovery work | active when recovery is in motion |
| `ema-impl-spine` | session-bound | implementation spine for EMA | should stay bound to actual workstreams |
| `ema-ui-surface` | session-bound | UI/operator surface work | currently important but layout priority should be controlled |
| `orchestrator-alpha` | session-bound | active operator pair/work lane | only if still actually staffed |
| `orchestrator-beta` | session-bound | active operator pair/work lane | currently high priority |
| `orchestrator-gamma` | session-bound | active operator pair/work lane | only if still actually staffed |

---

## B. Canonical stream / telemetry lanes

These are useful, but should be event-fed rather than self-chatty.

| lane | mode | intent | notes |
|---|---|---|---|
| `system-heartbeat` | event-fed | health/vitals stream | high-chatter allowed if signal is real |
| `pipeline-flow` | event-fed | proposal→execution pipeline transitions | canonical execution stream |
| `memory-writes` | event-fed | memory/knowledge write stream | low-noise structured entries only |
| `intelligence-layer` | event-fed | internal reasoning/decision overlays | should stay concise and structured |
| `intent-stream` | event-fed | raw intent classifications/routing | should not become control lane |
| `babysitter-stream` | event-fed | babysitter tick feed | only if still backed by real tick source |
| `bridge-dispatch` | event-fed | bridge/provider/session dispatch telemetry | useful feed lane |
| `research-feed` | event-fed | research ingestion/events | feed, not discussion |
| `research-lab` | digest-fed + session-bound | research work outputs | can be more analytical than feed channels |

---

## C. Digest / promotion lanes

| lane | mode | intent | notes |
|---|---|---|---|
| `babysitter-digest` | digest-fed | adaptive summary across streams | if one stream digest survives, this is it |
| `agent-results` | digest-fed | promoted agent outputs | also listed above as live operator-adjacent |
| `command-queue` | digest-fed | queue health and pending asks | concise status only |
| `decisions-log` | digest-fed | important decisions | no filler posts |

---

## D. Intake / knowledge / durable reference

| lane | mode | intent | notes |
|---|---|---|---|
| `concierge` | intake | conversational intake | may overlap with `command`; watch duplication |
| `proposals` | intake | proposal pipeline intake | useful if still actively consumed |
| `brain-dump` | intake | raw capture | should feed structured downstream lanes |
| `intention-farmer` | intake | goal/intention capture | only keep if actually used |
| `wiki-vault` | knowledge/reference | durable wiki/vault entrypoint | reference lane |
| `specs-designs` | knowledge/reference | design/spec docs | reference lane |
| `architecture-log` | knowledge/reference | architecture decisions/docs | reference lane |
| `babysitter-digest` | knowledge-facing digest | summary surface | bridge between streams and readers |

---

## E. Temporary repair / incident lanes

| lane | mode | intent | notes |
|---|---|---|---|
| `babysitter-repair-log` | temporary-repair | active triage / audit lane | should archive when repair cycle ends |
| `orchestrator-incidents` | temporary-repair or archive | incidents/debug follow-up | currently looks archival |
| `orchestrator-recovery` | temporary-repair or session-bound | recovered/stalled work notes | likely archive-adjacent now |

---

## F. Archive / cold historical lanes

These should not be revived unless explicitly reactivated.

Examples:
- most `z-*` channels
- `dispatch-board-old`
- `wiki-vault-old`
- `pipes-engine-live`
- `tick-fast`, `tick-medium`, `tick-slow`
- `exec-*` historical execution lanes unless explicitly restaffed
- older W7/W8 sprint/implementation channels
- dormant v1.1 track channels unless tied to active sessions again

Rule: historical context is not the same as a running lane.

---

## G. Newly created / currently unbound external project lanes

Observed categories/lane families now exist for new real-estate work (e.g. `TJ_RE_*`, `RE *`, `tj_*`, `re-hq`, etc.).

Current status:
- structurally created
- some already have recent messages
- most are still **unbound** from durable session / routing rules

Treat these as:
- `experimental/unbound` until their activation model is defined
- candidates for self-nudge design once source systems and expected cadence are known

They should not be treated as fully running just because they exist.

---

## Activation standard

A lane moves from "exists" to "running" only when it has:
1. a canonical purpose
2. a source of truth
3. an activation mode
4. a nudge/cooldown policy
5. an archive or dormancy rule

Without those five, the lane is scaffolding.
