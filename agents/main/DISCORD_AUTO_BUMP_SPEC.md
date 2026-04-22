# Spec: Auto-bump recent channels in Discord bot

Updated: 2026-04-14 UTC

## Objective

Make the Discord bot maintain the `🛠 WORK NOW` category automatically so the most recently active useful channels stay near the top without manual cleanup.

## Desired behavior

When a message lands in a tracked `WORK NOW` channel:
- the bot records activity time for that channel
- the channel is eligible to move upward within `🛠 WORK NOW`
- the category is periodically re-sorted according to policy

This should feel stable, not jittery.

## Important constraints

### 1. Do not reorder on every message
That will create noisy churn and Discord API spam.

Instead:
- debounce moves
- coalesce activity events
- apply reordering on an interval or after a quiet period

Recommended:
- minimum 60-120s debounce per channel
- category reorder pass every 5-10 minutes
- skip no-op moves

### 2. Use priority bands, not pure recency
Pure recency is too chaotic.

Use three bands:

#### Band A — pinned operator channels
Always stay above the rest unless explicitly changed by config.

Suggested defaults:
- `command`
- `orchestrator-beta`
- `orchestrator-ema`
- `orchestrator-implementation`
- `ema-ui-surface`

#### Band B — recency-sorted active channels
Sort by most recent meaningful activity.

Suggested members:
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

#### Band C — demotion/archive candidates
If a tracked channel remains cold for long enough, flag it for archive review rather than endlessly leaving it in the hot zone.

## Scope of implementation

### Trigger events
Listen to:
- Discord message create
- optionally thread activity if thread parents should count toward channel heat

### State to keep
For each tracked channel:
- channel id
- last activity timestamp
- last reorder timestamp
- priority band
- pinned rank within band A if applicable
- archive eligibility flag

This state can live in transient/persistent bot runtime state, but should not become a new hidden source of truth.

## Reordering algorithm

### Inputs
- tracked channels for `WORK NOW`
- priority band assignment
- most recent activity timestamp
- cooldown/debounce windows

### Output order
1. Band A channels in configured pinned order
2. Band B channels sorted by descending last activity
3. Band C channels sorted by descending last activity or removed from `WORK NOW`

### Safety rules
- only reorder channels inside the target category
- do not move channels across categories automatically unless archive mode is explicitly enabled
- rate-limit Discord edits
- skip reorder if the computed order matches current order
- emit one concise log entry per applied reorder pass

## Archive automation (optional second phase)

After the stable sorter exists, add optional archive assistance:
- if a Band B/C channel has no meaningful activity for N days
- and is not on a protected list
- mark it as `archive_candidate`
- optionally notify in a control channel
- optionally move it to archive during a scheduled cleanup pass

Suggested thresholds:
- candidate after 7-14 days idle
- auto-archive only after explicit enablement

## Control/config surface

Add bot config like:

```yaml
discord:
  layout:
    enabled: true
    guildId: "1482230800916287710"
    workNowCategoryId: "1493432529926094858"
    archiveCategoryIds:
      - "1484014919904002170"
      - "1493439073552171048"
    reorderEverySeconds: 300
    channelDebounceSeconds: 90
    pinnedChannels:
      - "1489815803023851682" # command
      - "1490438830921355345" # orchestrator-beta
      - "1490610033954914325" # orchestrator-ema
      - "1490610977736097792" # orchestrator-implementation
      - "1493170812432158831" # ema-ui-surface
    recencyChannels:
      - "1489820718236438559"
      - "1484267485476946112"
      - "1489815808120062134"
      - "1490610026145124402"
      - "1489815795293749258"
      - "1489786483970936933"
      - "1493170812738601000"
      - "1493170812428095519"
      - "1489820714608623687"
      - "1490438829855736000"
      - "1490438832162607286"
```

## Logging / observability

Emit compact structured logs for:
- activity observed
- reorder pass started
- reorder pass applied / skipped
- channel move failures
- archive candidates flagged

Do not spam Discord with every internal reorder event.

## Failure handling

If reorder fails:
- log the failure with channel/category ids
- back off
- retry on next scheduled pass
- never loop tightly on Discord API errors

If the category or channel disappears:
- disable the sorter for that guild until config is repaired

## Implementation shape

Recommended design:
- small Discord layout manager component/service
- isolated from core command handling
- policy-driven config
- testable pure function for `computeDesiredOrder(channels, config, activity)`
- thin Discord adapter for applying the resulting positions

## Rollout plan

### Phase 1
- track activity
- reorder only within `WORK NOW`
- no auto-archive

### Phase 2
- add archive candidate detection
- send review notices to control channel

### Phase 3
- optional auto-archive for explicitly allowed channels
- keep strong allowlist/protected list

## Non-goals

- not a universal auto-organizer for all channels
- not a replacement for category-level information architecture
- not a justification to keep too many active channels

The point is to keep the active work area sharp, not to preserve complexity forever.
