# PubSub Topology

Authoritative inventory of every Phoenix.PubSub topic in EMA, every module that broadcasts on it, and every module/process that subscribes. Maintained alongside `daemon/lib/ema/application.ex`.

If you add a new broadcast, add the topic here. If you add a new subscriber, add it here. The orphan-topic audit script greps this file and the codebase to make sure they agree.

## How to read this

Each topic block lists:
- **Broadcasters** — modules that call `Phoenix.PubSub.broadcast(Ema.PubSub, "<topic>", _)`
- **Subscribers** — modules that call `Phoenix.PubSub.subscribe(Ema.PubSub, "<topic>")`
- **Message shapes** — the tuples actually sent on this topic
- **Notes** — quirks, gotchas, intentional fan-out

A topic with zero subscribers is an "orphan" and is broadcasting to the void. The 2026-04 audit found 5+ orphans; this page documents the wire-up that closed them.

---

## governance:sycophancy

| Direction | Module |
|---|---|
| Broadcaster | `Ema.Governance.Sycophancy.audit_and_alert/1` |
| Subscriber  | `Ema.Governance.SycophancySubscriber` |

**Messages:** `{:sycophancy_alert, %{verdict, pi, approved, modified, rejected, total, lookback_days, computed_at}}`

**Notes:** SycophancySubscriber converts each `:watch` / `:alert` into a `guideline` Memory entry so the next proposal cycle picks it up via `Ema.Memory.get_context/2`. Sycophancy also re-broadcasts on `intelligence:outcomes` for fan-out.

---

## system:alerts

| Direction | Module |
|---|---|
| Broadcaster | `Ema.Intelligence.CostGovernor.handle_tier_change/2` |
| Subscriber  | `Ema.Intelligence.CostAlertHandler` |
| Subscriber  | `Ema.Babysitter.VisibilityHub` |

**Messages:** `{:cost_tier_changed, %{old_tier, new_tier, label, message, daily_spend, daily_budget}}`

**Notes:** CostGovernor still owns mitigation (auto-pausing the proposal engine, downgrading to haiku). CostAlertHandler is observability-only — it writes a `guideline` Memory entry, an `audit_logs` row, and re-broadcasts on `intelligence:outcomes`. Duplicating mitigation in the handler would race with the governor.

---

## loops:lobby

| Direction | Module |
|---|---|
| Broadcaster | `Ema.Loops` (4 events) |
| Subscriber  | `Ema.Loops.LoopEventHandler` |
| Subscriber  | `Ema.Babysitter.VisibilityHub` |

**Messages:**
- `{:loop_opened, %Loop{}}`
- `{:loop_touched, %Loop{}}`  *(not persisted to memory — too noisy)*
- `{:loop_closed, %Loop{}}`
- `{:loop_escalated, %Loop{}}`

**Notes:** LoopEventHandler maps lifecycle to typed memory entries:
- `:loop_opened` → `context` entry, importance 0.4
- `:loop_closed` → `decision` entry, importance 0.6
- `:loop_escalated` (level ≥ 2) → `error_pattern` entry, importance 0.8 (level 3 → 0.95)
- `:loop_escalated` (level 0/1) → rebroadcast only

All four also fan out to `intelligence:outcomes` for the live dashboards.

---

## proposals:events

| Direction | Module |
|---|---|
| Broadcaster | `Ema.ProposalEngine.AutoDecomposer.broadcast_decomposition/2` |
| Broadcaster | (other proposal lifecycle events from controllers / tagger) |
| Subscriber  | `Ema.Evolution.SignalScanner` |
| Subscriber  | `Ema.Babysitter.VisibilityHub` |

**Messages used by SignalScanner:**
- `{"proposal_approved", proposal}`
- `{"proposal_killed", proposal}`
- `{"proposal_decomposed", %{proposal_id, task_count, strategy?}}`

**Notes:** The decomposed-event branch was added when the audit found AutoDecomposer broadcasting to nothing. SignalScanner now infers a strategy from `task_count` (`minimal` ≤2, `balanced` ≤4, `granular` ≥5), emits an `:evolution_signal`, and rebroadcasts on `intelligence:outcomes` so downstream effectiveness scoring can pick it up.

---

## intelligence:outcomes

| Direction | Module |
|---|---|
| Broadcaster | `EmaWeb.IntelligenceController` |
| Broadcaster | `Ema.Governance.Sycophancy` (audit fan-out) |
| Broadcaster | `Ema.Intelligence.CostAlertHandler` (cost-tier fan-out) |
| Broadcaster | `Ema.Loops.LoopEventHandler` (loop fan-out) |
| Broadcaster | `Ema.Evolution.SignalScanner` (decomposition fan-out) |
| Subscriber  | `Ema.Intelligence.OutcomeSubscriber` |
| Subscriber  | `Ema.Babysitter.VisibilityHub` |

**Messages:** `{:outcome_logged, %{kind, importance, ...}}`

**Notes:** `Ema.Claude.ContextManager` is **stateless** — it does not subscribe to PubSub. OutcomeSubscriber bridges the gap by persisting every `:outcome_logged` event into `Ema.Memory.Entry` so ContextManager surfaces it on the next prompt build. Memory type is derived from `payload.kind`:

| `kind` | memory_type |
|---|---|
| `cost_tier_change`, `sycophancy_audit` | `guideline` |
| `loop_escalated` | `error_pattern` |
| `loop_closed`, `proposal_decomposed`, fallback | `decision` |
| `loop_opened`, `loop_touched` | `context` |

---

## Other live topics (sanity grid)

These were healthy at audit time. Re-grep before assuming.

| Topic | Broadcasters | Subscribers |
|---|---|---|
| `proposals:pipeline` | proposal_engine stages | (canvas channel — currently commented) |
| `executions` | execution lifecycle | `execution_channel`, `dispatch_board_channel`, `VisibilityHub` |
| `executions:dispatch` | dispatcher | `Ema.Executions.Dispatcher` |
| `executions:<id>:stream` | per-execution stream | `execution_channel` |
| `task_events` | tasks context | `canvas_channel`, `VisibilityHub` |
| `intents` | intents context | `intent_channel`, `intents_channel`, `VisibilityHub` |
| `claude_sessions` | session_manager / watcher | `session_channel`, `claude_session_channel`, `VisibilityHub` |
| `intelligence:tokens` | TokenTracker, CostGovernor | `intelligence_channel` |
| `intelligence:vm` | VmMonitor | `intelligence_channel` |
| `intelligence:trust` | TrustScorer | `intelligence_channel` |
| `intelligence:route` | UCBRouter | `intelligence_channel` |
| `evolution:signals` | SignalScanner, Proposer | `evolution_channel` (`evolution:events`/`evolution:updates`) |
| `agent_network` | NetworkMonitor | `agent_network_channel` |
| `babysitter:sessions` | SessionObserver | `StreamChannels` |
| `pipes:monitor`, `pipes:config`, `pipes:runs` | pipes runtime | `pipes_channel`, `VisibilityHub` |
| `goals:updates` | goals context | `goal_channel`, `VisibilityHub` |
| `focus:updates`, `focus:timer` | focus runtime | `focus_channel` |
| `vault:changes` | vault watcher | `vault_channel` |
| `notes` | notes context | `notes_channel` |
| `channels:messages`, `channels:health`, `channels:chat:<id>` | channels runtime | `channels_channel` |
| `canvas:data:<id>` | canvas data refresher | `canvas_channel` |
| `metamind:pipeline` | metamind | `metamind_channel` |
| `cli_manager:*` | cli_manager runtime | `cli_manager_channel` |
| `prompts:*` | prompts runtime | `prompts_channel` |
| `dispatch:*` | dispatch runtime | `dispatch_board_channel` |
| `workspace:commands` | voice_controller | (consumed by Tauri shell over WS) |

## Verification script

Quick orphan-finder, run from `daemon/`. The naive version misses subscribers that use `@topic` module attributes — be ready to grep for the attribute name too:

```bash
# every literal topic that gets broadcast, with no matching literal subscribe
comm -23 \
  <(grep -rEho 'PubSub\.broadcast\([^,]+,\s*"[^"]+"' lib | grep -oE '"[^"]+"' | sort -u) \
  <(grep -rEho 'PubSub\.subscribe\([^,]+,\s*"[^"]+"' lib | grep -oE '"[^"]+"' | sort -u)
```

For each topic the script flags, also check:

1. `grep -rE '@topic\s+"<topic>"' lib` — module-attribute subscribers (e.g. CostAlertHandler, OutcomeSubscriber, LoopEventHandler all use `@topic`)
2. `grep -rE '@active_topics' lib` — `Ema.Babysitter.VisibilityHub` subscribes via a list literal
3. The list above — if a topic is documented here it is **not** an orphan

If a topic isn't covered by any of those, file it as a real orphan.

---

**Last audited:** 2026-04-07 — closed `governance:sycophancy`, `system:alerts`, `loops:lobby`, `proposals:events#proposal_decomposed`, `intelligence:outcomes` orphans.
