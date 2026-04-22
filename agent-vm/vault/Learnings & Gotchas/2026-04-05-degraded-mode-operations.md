---
title: "Degraded Mode Operations Protocol"
type: reference
created: 2026-04-05
tags: [operations, gotcha, openclaw, incident-response, dispatch]
summary: "Do not launch new automation while in degraded state — stabilize first, automate second"
---

# Degraded Mode Operations Protocol

## Core Rule

**Do not launch new automation while in degraded state.** The instinct to "fix it by automating around it" makes things worse.

## Correct Sequence

1. **Stabilize**: Get coordination schema working first
2. **Verify**: Only automate routing rules after channel boundaries hold for one shift
3. **Resume**: Re-enable automation only after exit criteria met

## Exit Criteria (All Must Pass)

1. Auth confirmed valid (API key ping succeeds)
2. One real end-to-end dispatch succeeds (not a dry-run)
3. No cascading failures in task queue for 1 hour

## Status Communication During Incidents

Post only on state change. Minimum useful template:

```
What is broken:
What lane owns it:
What system is doing now:
Next visible update:
```

State changes worth posting:
- Incident opened / severity changed / owner changed
- Blocker identified / degraded mode entered or exited
- Retry window set / service restored
- Postmortem or repair logged

## Learned From

2026-04-04 → 2026-04-05 incident recovery: API key expiry + harvester starvation + recursive failure loop compounded because automation kept running in degraded state.

## Related

- [[Dispatch API Key Health Check]]
- [[Dispatch Recursive Failure Loop]]
- [[Harvester Seed Starvation Pattern]]
