---
id: design.discovery-noun
status: draft
authors: trajan
seeded_by: campaign:01KQE5GCV300F8V5MM5TFJNJNS
seeded_lane: lane:01KQE5MNA300ZHHX55EEKF37Z6
mission: mission:01KQE5H64700K3GV06WAQ67QC7
last_updated: 2026-04-30
---

# Discovery (loose-ends) noun

A lightweight peer to `queue` for capturing things an agent notices off-path
during execution. The premise: the cost of capture has to be near-zero, or
loose ends get dropped. The cost of triage can be non-zero, because triage
happens in the review/handoff vCalendar phases when the agent is already
slowing down.

## Problem statement

Today the workspace gives an agent only three places to put a discovery:

1. `queue add` — requires `--title` and `--why`; meant for tracked follow-up.
2. `problem log` — for recurring blocker patterns; structurally heavier.
3. Free chat / scratch — invisible to the next agent.

Result: most loose ends end up in chat or get forgotten. Things like
"this test name is misleading", "this comment contradicts the doc",
"this branch is suspiciously slow on second run", "this enum has a typo"
are below the bar for `queue` but above zero in value.

We need a tier that:

- Costs almost nothing to capture (one required field: `--text`).
- Is auto-surfaced in the review/handoff phase so it doesn't rot.
- Has a TTL so unactioned items decay rather than accumulate.
- Promotes cleanly into `queue`, `problem`, or a fresh `lane` when a
  loose end deserves real follow-up.
- Is project-scoped, so a discovery noted in EMA does not bleed into
  `locked-in-ios-app` and vice versa.

## Event family

All envelopes carry `org_id`, `space_id`, `project_id`, `actor`. Optional
`lane_id` indicates the lane the agent was on when the discovery was made.

| Kind | Payload |
|---|---|
| `discovery.noted` | `discovery_id`, `text`, `source?`, `evidence?`, `tags[]?`, `confidence`, `lane_id?`, `ttl_at` |
| `discovery.tagged` | `discovery_id`, `add_tags[]`, `remove_tags[]` |
| `discovery.merged` | `discovery_id`, `into_discovery_id`, `reason?` |
| `discovery.promoted` | `discovery_id`, `target_kind` (`queue` \| `problem` \| `lane`), `target_id`, `notes?` |
| `discovery.archived` | `discovery_id`, `reason` |
| `discovery.expired` | `discovery_id`, `expired_at` (auto-emitted by supervisor) |
| `discovery.reviewed` | `discovery_id`, `reviewed_by`, `decision` (`keep` \| `extend_ttl` \| `archive`) |

`discovery.reviewed` exists so the handoff-phase warning can clear without
forcing premature archive — an agent can re-stamp the TTL with explicit
intent.

## Schema (projection `discovery.registry`)

```
discovery {
  id:               "discovery:<ulid>"
  noted_at:         ISO8601
  noted_by:         "actor:<id>"
  org_id, space_id, project_id     // required scope
  lane_id:          "lane:<id>" | null
  text:             string         // ≤500 chars (advisory)
  source:           string | null  // file path, event_id, URL, command
  evidence:         string | null  // ≤2KB snippet
  tags:             string[]       // ["test-flake", "perf", "doc-gap", ...]
  confidence:       "low" | "medium" | "high"   // default low
  status:           "noted" | "promoted" | "archived" | "merged" | "expired"
  promoted_to:      string | null  // "queue_item:<id>" | "problem:<id>" | "lane:<id>"
  merged_into:      "discovery:<id>" | null
  ttl_at:           ISO8601
  reviewed_at:      ISO8601 | null
  reviewed_by:      "actor:<id>" | null
  updated_at:       ISO8601
}
```

### TTL defaults by confidence

| confidence | default TTL | rationale |
|---|---|---|
| low | 14d | bulk of casual notes; auto-decay if untouched |
| medium | 28d | the agent thought twice; longer leash |
| high | infinite | the agent flagged it deliberately; needs a human |

`high` should be rare. CLI emits a warning when used (`use a queue item or
problem node instead unless you genuinely cannot frame done_when yet`).

## CLI grammar

```
ema discovery note --text "..."
                  [--source "..."] [--evidence "..."]
                  [--tag <t>]... [--confidence low|medium|high]
                  [--lane <lane:id>] [--project <id-or-name>]

ema discovery list [--project ...] [--all-projects]
                   [--status noted|promoted|archived|merged|expired]
                   [--tag <t>] [--confidence ...] [--since <duration>]
                   [--lane <lane:id>] [--actor <actor:id>]

ema discovery show --discovery discovery:<id>

ema discovery tag --discovery <id> [--add <t>]... [--remove <t>]...

ema discovery promote --discovery <id> --to queue|problem|lane
                      [--title "..."] [--why "..."] [--done-when "..."]
                      // queue: reuses queue add fields
                      // problem: reuses problem log fields
                      // lane: reuses lane open fields

ema discovery archive --discovery <id> --reason "..."

ema discovery merge --discovery <id> --into discovery:<id> [--reason "..."]

ema discovery review [--project ...] [--lane <id>] [--json]
                     // triage view; lists noted + expiring-soon, ranked
                     // by tag/lane/age; the canonical review-phase command

ema discovery extend --discovery <id> --by <duration> --reason "..."
                     // re-stamps ttl_at; emits discovery.reviewed{decision: extend_ttl}
```

### Required vs optional

The minimum-viable capture is exactly one flag:

```
ema discovery note --text "build hangs ~20s on second invocation under bun 1.2"
```

Everything else is optional. Project resolves from cwd or `--project`.
`actor_id` resolves from caller. `tags` and `confidence` default sensibly.

## Promotion semantics

Promoting writes two events as one transaction:

1. The target writer's normal create event (`queue.add`, `problem.log`,
   `lane.open`).
2. A `discovery.promoted` event linking back: `target_kind`, `target_id`,
   plus a `from_discovery` field stamped on the target's `source` (so the
   queue/problem/lane shows where it came from).

The discovery transitions to `status: promoted`; it stays in the registry
for audit but disappears from `discovery list --status noted` and from
review-phase triage.

## Merge semantics

When two discoveries describe the same loose end, `merge --into <id>`
writes `discovery.merged` and transitions the source to `status: merged`.
Tags from the merged-out discovery union into the target. Triage views
hide merged items.

## TTL & supervisor

The same supervised periodic actor that handles phase auto-rollover (M5)
scans discoveries with `status: noted` and `ttl_at <= now`, emitting
`discovery.expired`. Expired discoveries:

- drop out of triage views by default
- remain in the registry (audit)
- can be revived by `extend --by ...` (writes a fresh `ttl_at` and resets
  status to `noted` via a small reducer rule)

## Integration with vCalendar

### `vcalendar tick` output gains:

```json
"discoveries": {
  "noted_in_scope": 7,
  "expiring_in_24h": 2,
  "untriaged_older_than_7d": 1,
  "by_tag": { "test-flake": 3, "doc-gap": 2, "perf": 1 }
}
```

### Phase instructions:

- **planning and lane claim**: surface `expiring_in_24h` in instructions
  so the planner can promote-or-archive *before* committing to new scope.
- **review and checkup**: append `Run ema discovery review and triage at
  least the discoveries noted this block.`
- **handoff and next-day queue**: append `Promote, archive, or extend
  every discovery older than 7 days that is still status=noted; handoff
  warning fires otherwise.`

### `should_triage` flag:

New boolean on tick output: `should_triage = (mode in {review, handoff})`.
Mirrors `should_checkup` and `should_handoff`.

## Integration with `agent orient`

New top-level block in `agent orient --json`:

```json
"discoveries": {
  "recent": [ { "id": "...", "text": "...", "noted_at": "...", "tags": [...] } ],   // up to 5
  "expiring_soon": [ ... ],
  "untriaged_by_lane": { "lane:<id>": 3 }
}
```

The orientation prose instructs:

> When you find something off-path that is below the bar for a queue item
> but worth not losing, run `ema discovery note --text "..."`. Triage in
> review or handoff. Promote when it earns a `done_when`.

## Integration with `lane`

When a lane closes (`lane close`), discoveries with that `lane_id` and
`status: noted` get auto-bumped to a daily handoff prompt: "this lane
closed and these 3 loose ends were noted on it — promote, archive, or
extend."

Avoids the situation where a closed lane's loose ends silently expire
without anyone deciding what to do.

## Integration with `queue` and `problem`

- `queue show` gains a `from_discovery` field when the queue item was
  promoted from one. Same for `problem show`.
- `queue list --from-discovery true` filters to promoted-from-discovery
  items, so an agent can audit the discovery → queue conversion rate.
- `problem log` from a discovery merges the discovery's `source` and
  `evidence` into the problem's first observation.

## Cross-project view (under M8)

`vcalendar overview --space "Personal Workspace"` surfaces a column:

| project | phase | blocks today | checkups due | discoveries to triage | oldest stale lane |
|---|---|---|---|---|---|
| EMA | execution | 1 | 0 | 7 | 16h (T3.2v1 actor demo) |
| locked-in-ios-app | planning | 0 | 0 | 0 | — |

That column is the strategic value of the noun: it makes "what off-path
debt is each project carrying right now" answerable in one command.

## Why not just use queue?

| concern | queue | discovery |
|---|---|---|
| cost to capture | `--title` + `--why` required; tracked with `done_when` | `--text` only |
| TTL | none; ready/blocked/closed indefinite | auto-decay by confidence |
| triage cadence | implicit (you check `--status ready`) | explicit in review/handoff phase |
| promotion | terminal | bidirectional: promotes to queue/problem/lane |
| polluting "ready" list | yes, every casual note becomes a ready item | no, separate registry |

Queue is for tracked follow-up; discovery is for low-cost capture with
deliberate triage. Both should exist.

## Open design questions

1. **Bulk capture.** Should `ema discovery note` accept stdin / multi-line
   so an agent can paste 5 things at once? (Probably yes, NDJSON in.)
2. **Auto-tagging from source.** If `--source` matches `*.test.ts`, auto-add
   `test-flake`? Heuristic, opt-out via `--no-auto-tag`. Defer to a later
   lane.
3. **Discovery → queue: what about `--why`?** Promote-to-queue could
   require an explicit `--why` (forces the agent to articulate); or default
   `--why` to `promoted from discovery:<id> on <date> by <actor>` and let
   the agent override. Default to the latter; require for high-confidence
   only.
4. **Per-actor private discoveries.** Out of scope for v0. All discoveries
   are project-visible.
5. **Web vApp surface.** A "loose ends" panel in HQ vApp / agent-work vApp.
   Defer to M8 follow-up.

## Implementation slicing

| Lane | Scope | Done-when |
|---|---|---|
| L4 (this doc) | Spec + ADR + catalog deltas | This file lands; catalog updated; CLI grammar registered in help.ts |
| L5 | `note` / `list` / `show` + projection | minimum-viable capture works end-to-end |
| L6 | `promote` / `archive` / `merge` / `review` / `tag` / `extend` | full lifecycle |
| (queue) | TTL supervisor in M5 | `discovery.expired` auto-emitted |
| (queue) | `agent orient` integration in M7 | discoveries panel surfaces |
| (queue) | vcalendar tick integration in M7 | `should_triage` + phase instructions |
| (queue) | Cross-project column in M8 | `discovery.cross_project` projection |

## References

- Campaign: `campaign:01KQE5GCV300F8V5MM5TFJNJNS`
- Mission: `mission:01KQE5H64700K3GV06WAQ67QC7`
- Lanes: `lane:01KQE5MNA300ZHHX55EEKF37Z6` (spec),
  `lane:01KQE5NDPA0115JX1P3C670AS5` (impl reads + note)
- Existing nouns: `apps/cli/src/commands/queue.ts`,
  `apps/cli/src/commands/problem.ts`, `apps/cli/src/commands/lane.ts`
