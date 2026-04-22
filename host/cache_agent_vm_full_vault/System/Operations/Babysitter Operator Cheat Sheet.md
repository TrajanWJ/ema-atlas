# Babysitter Operator Cheat Sheet

## Core split
- `#babysitter-sprint` = human control tower
- stream channels = machine overlays by lane
- `#babysitter-live` = operator rollup for active work

## `#babysitter-live` rule
Post only useful deltas:
- what changed
- why it matters
- what is blocked
- what happens next
- whether human attention is needed

## Tick template
```md
⚡ tick | HH:MM UTC
- **Changed:** ...
- **Impact:** ...
- **Blocked:** ...
- **Next:** ...
- **Attention needed:** none / decision / approval / unblock / incident
```

## Route updates correctly
- health facts → `#system-heartbeat`
- intent claims → `#intent-stream`
- state transitions → `#pipeline-flow`
- provisional reasoning → `#agent-thoughts`
- durable lessons → `#memory-writes`
- operator rollups → `#babysitter-live`

## Never post
- vibes without deltas
- duplicate heartbeat facts
- raw thought spam in `#babysitter-live`
- “all clear” before end-to-end confirmation

## Escalation minimum
```md
What is broken:
What lane owns it:
What system is doing now:
Next visible update:
```

## Severity
- P0 user-visible failure
- P1 degraded but responding
- P2 stale/noisy/drifting control plane
- P3 cosmetic
