# Discord Lane Activation Table

Updated: 2026-04-14 UTC

## Purpose

Convert the registry/spec into an actionable operating table for the currently important lanes.

Fields:
- `lane`
- `status now`
- `mode`
- `source of truth`
- `self-nudge`
- `cooldown`
- `promotion target`
- `done means`

---

## Canonical operator lanes

| lane | status now | mode | source of truth | self-nudge | cooldown | promotion target | done means |
|---|---|---|---|---|---|---|---|
| `command` | active | human-command | human directives | yes, only on real blocker or waiting decision | 2h unless critical | none | clear command handling surface |
| `orchestrator-control` | active | human-command + session-bound | orchestration decisions | yes | 2h unless new blocker | `command` if executive visibility needed | explicit operator choices surfaced |
| `orchestrator-ema` | active | session-bound + event-fed | EMA/runtime truth | yes | 60m | `command` or `babysitter-sprint` depending blast radius | EMA issue surfaced with next move |
| `orchestrator-implementation` | active | session-bound | active workstreams | yes | 60m | `agent-results` / `decisions-log` | current build state legible |
| `babysitter-sprint` | active | human-command + digest-fed | babysitter control truth | yes | 60m | `command` for major operator decision | canonical babysitter control stays clean |
| `babysitter-live` | active | digest-fed | babysitter implementation activity | yes, but summary-only | 30-60m | `babysitter-digest` | rollup lane stays useful |
| `agent-dispatch` | active | event-fed | dispatch events | no autonomous keepalive; event-fed only | event-driven | `agent-results` / `command-queue` | dispatches visible without spam |
| `agent-results` | warm | digest-fed | promoted completions | yes | 30-60m | `decisions-log` if durable decision | useful synthesized outputs arrive |
| `command-queue` | warm | digest-fed + session-bound | queued work state | yes | 30-60m | `command` if blocked | queue state visible |
| `decisions-log` | warm | digest-fed | extracted decisions | yes, low frequency | 2h+ | none | only meaningful decisions land |
| `ema-runtime-recovery` | warm | session-bound | EMA runtime recovery threads | yes | 60m | `orchestrator-ema` | recovery progress is legible |
| `ema-impl-spine` | warm | session-bound | EMA implementation spine | yes | 60m | `agent-results` | current implementation spine visible |
| `ema-ui-surface` | warm | session-bound | UI/operator workstream truth | yes | 60m | `agent-results` | UI work has real updates |
| `orchestrator-alpha` | unclear | session-bound | active operator pairing if staffed | only if actually staffed | 60m | `orchestrator-control` | should either be staffed or demoted |
| `orchestrator-beta` | active | session-bound | active operator pairing | yes | 60m | `orchestrator-control` | useful pair lane |
| `orchestrator-gamma` | unclear | session-bound | active operator pairing if staffed | only if actually staffed | 60m | `orchestrator-control` | should either be staffed or demoted |

---

## Stream and telemetry lanes

| lane | status now | mode | source of truth | self-nudge | cooldown | promotion target | done means |
|---|---|---|---|---|---|---|---|
| `system-heartbeat` | stream | event-fed | heartbeat/health source | no timer keepalive | event-driven | `babysitter-digest` | only real heartbeat events |
| `pipeline-flow` | stream | event-fed | pipeline transitions | no timer keepalive | event-driven | `babysitter-digest` / `agent-results` | execution transitions visible |
| `memory-writes` | stream | event-fed | memory/index writes | no timer keepalive | event-driven | `babysitter-digest` | meaningful writes only |
| `intelligence-layer` | stream | event-fed | model/router/system overlays | no timer keepalive | event-driven | `babysitter-digest` | concise high-signal overlays |
| `intent-stream` | stream | event-fed | raw intent routing | no timer keepalive | event-driven | `intent-review` / `intent-babysitter` | raw routing visible |
| `babysitter-stream` | stream | event-fed | babysitter tick source | no timer keepalive | event-driven | `babysitter-live` / `babysitter-digest` | raw feed only if real source exists |
| `bridge-dispatch` | stream | event-fed | bridge/provider telemetry | no timer keepalive | event-driven | `orchestrator-ema` | bridge state visible |

---

## Digest / summary lanes

| lane | status now | mode | source of truth | self-nudge | cooldown | promotion target | done means |
|---|---|---|---|---|---|---|---|
| `babysitter-digest` | useful but underused | digest-fed | stream rollups | yes | 30-60m | `babysitter-sprint` if human action needed | one digest can replace many feed reads |
| `agent-results` | warm | digest-fed | promoted outputs | yes | 30-60m | `decisions-log` | outputs are readable |
| `command-queue` | warm | digest-fed | queued work | yes | 30-60m | `command` | queue health is clear |
| `decisions-log` | warm | digest-fed | durable decision extraction | yes, low frequency | 2h+ | none | no filler |

---

## Temporary or special cases

| lane | status now | mode | source of truth | self-nudge | cooldown | promotion target | done means |
|---|---|---|---|---|---|---|---|
| `babysitter-repair-log` | active incident lane | temporary-repair | current repair work | yes while incident active | 15-60m | `babysitter-sprint` | repaired issue summarized then archived |
| new `TJ_RE_*` / `tj_*` lanes | newly created / experimental | experimental/unbound | not yet consistently bound | no autonomous nudges until bound | disabled initially | `tj_re_hq` or parent HQ lane | activation model exists first |

---

## Immediate implementation priorities

1. Add metadata for the canonical operator lanes first.
2. Enable self-nudge only on control/session/digest lanes first.
3. Keep stream lanes event-only initially.
4. Keep newly created RE lane families in bootstrap/manual mode until they have source bindings.
5. Add archive/demotion review for unclear or unstaffed lanes.
