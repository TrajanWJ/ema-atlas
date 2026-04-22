# Discord Layout Policy

Updated: 2026-04-14 UTC

## Goal

Keep the Discord server operationally tight:
- active work channels clustered together
- stale implementation/sprint lanes archived instead of cluttering the live view
- only a small number of top-level categories visible day to day
- most recently active channels in the active work cluster floated toward the top

## Intended steady-state category model

Keep only these as day-to-day categories:

1. `🛠 WORK NOW`
   - primary active execution lanes
   - human command lanes
   - currently live orchestration / EMA / babysitter work

2. `🤝 MISSION CONTROL`
   - desk / decisions / review / synthesis / roster
   - higher-level coordination surfaces

3. `📥 INTAKE`
   - raw intake, proposals, concierge, brain dumps

4. `📚 KNOWLEDGE BASE`
   - durable docs, wiki/vault, specs, digests, research that is still useful

5. `🗃 ARCHIVE` (or two archive buckets if channel count requires it)
   - dead sprint lanes
   - stale implementation waves
   - old streams / experiments / one-off recovery channels
   - preserved for reference, not day-to-day work

## Work Now ordering rule

Within `🛠 WORK NOW`:
- the most recently active channels should rise toward the top
- human-facing command lanes should stay near the top even if temporarily quiet
- stream/noise channels should never displace primary operator channels

### Priority bands inside `🛠 WORK NOW`

#### Band A — pinned operator lanes
These stay near the top regardless of short-term recency:
- `command`
- `orchestrator-beta`
- `orchestrator-ema`
- `orchestrator-implementation`
- `ema-ui-surface`

#### Band B — recency-sorted active work lanes
Sort descending by recent activity:
- `agent-dispatch`
- `command-queue`
- `decisions-log`
- `orchestrator-control`
- `babysitter-sprint`
- `babysitter-live`
- `ema-runtime-recovery`
- `ema-impl-spine`
- `agent-results`
- `orchestrator-alpha`
- `orchestrator-gamma`

#### Band C — archive candidates
If a channel in `WORK NOW` stays quiet long enough and is not clearly canonical, move it to archive.

## Archive rule of thumb

Archive a channel when **all** of the following are true:
- not part of the core operator workflow
- not a canonical knowledge channel
- not currently under active implementation
- mostly historical, experimental, or superseded

Prefer **archive over delete** unless the channel is obviously disposable.

## Streams / telemetry rule

High-chatter feeds should not dominate the main layout.
If they still matter, they should either:
- live in archive,
- be consolidated into a digest channel, or
- be demoted behind the main operator surfaces.

## Manual cleanup checklist

When the server gets messy again:
1. move active execution lanes into `🛠 WORK NOW`
2. move durable docs/reference lanes into `📚 KNOWLEDGE BASE`
3. move intake/proposals/brain-dumps into `📥 INTAKE`
4. move stale sprint/impl/stream channels into archive
5. delete empty categories
6. re-sort `WORK NOW` by recency, while preserving pinned operator lanes at top

## Notes

A second archive category is acceptable if Discord category/channel limits make a single archive bucket impractical. The spirit still holds: very few live categories, lots of preserved history out of the way.
