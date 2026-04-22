# Next

What to do next, in priority order. Single source of "if you have one
hour to keep the current wave clean, do this." Refreshed when priorities
shift.

> Last refresh: **2026-04-22, live wave support pass.**
> Current main-lane owner: **Claude deliverables orchestrator**.
> Codex posture: **support lanes only**.
> Re-write this file on each significant push so it stays specific.

---

## If you have 15 minutes

**Pick one of:**

1. Read [`content/swarm/orchestration-kernel.md`](content/swarm/orchestration-kernel.md)
   and [`content/swarm/active-wave-current.md`](content/swarm/active-wave-current.md).
   Confirm the one objective, one main lane, and main-lane owner are still clear.
2. Check your current support-lane claims and handoffs for drift. Keep only
   alignment, context curation, repo hygiene, handoff packaging, and verification
   in scope.
3. Open [`PROJECT_STATUS.md`](PROJECT_STATUS.md) and this file, then trim any
   wording that makes the wave sound broader than it is.

## If you have an hour

**The single highest-value hour right now:**

> Keep the live wave legible: make sure every visible status note still reads
> as one objective, one main lane, one owner, and support lanes only.
> Use the kernel and active-wave docs as the source of truth, then clean up any
> stale phrasing in the swarm-facing docs you own.

**Or, runner-up:**

- Package a tight handoff note for the next support worker: objective,
  main-lane owner, current lane name, and what support work is safe.
- Remove stale references that imply multiple active objectives or a broader
  support mandate than the wave actually allows.

## If you have a day

**Three coherent slices, pick one:**

### Slice A — Tighten the swarm-facing docs

End state: the current wave reads cleanly to a fresh orchestrator or support
worker without extra backstory.

Path:
1. Review `content/swarm/orchestration-kernel.md` and
   `content/swarm/active-wave-current.md` side by side.
2. Update `PROJECT_STATUS.md` and `NEXT.md` so they say the same thing.
3. Trim stale cross-references that make the support posture sound like a
   second main lane.

### Slice B — Package the next handoff

End state: another worker can resume without re-reading everything.

Path:
1. Write a compact handoff note with objective, owner, lane name, and safe scope.
2. List only the support work that is still valid.
3. Call out any drift risks or scope collisions.

### Slice C — Verify consistency

End state: status docs, claims, and the live wave all agree.

Path:
1. Compare `PROJECT_STATUS.md` against `content/swarm/orchestration-kernel.md`.
2. Compare this file against `content/swarm/active-wave-current.md`.
3. Fix any mismatch before adding new guidance.

## If you have a week

The week's shape:

| Day | Focus |
|---|---|
| Mon | Reconcile swarm docs with the live wave |
| Tue | Remove stale wording from support-facing notes |
| Wed | Package a crisp handoff for the next support worker |
| Thu | Verify the current objective, owner, and lane names still match |
| Fri | Do one last drift check across swarm-facing docs |

End-of-week state:
- The current wave still reads as one objective, one main lane, one owner.
- Support lanes are clearly scoped and do not pretend to own the main artifact.
- A fresh worker can pick up the wave without re-deriving the control model.

---

## Standing rules

- **Don't make decisions on behalf of the user.**
- Keep the active wave narrowed to one objective and one main lane.
- Support work stays around the main lane, not inside it.
- **Update [`PROJECT_STATUS.md`](PROJECT_STATUS.md)** after any significant push.
- **Update this file (`NEXT.md`)** when the live wave changes shape or the
  wording starts drifting.

---

## Cross-references

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — current project and swarm snapshot
- [`content/swarm/orchestration-kernel.md`](content/swarm/orchestration-kernel.md) — control model
- [`content/swarm/active-wave-current.md`](content/swarm/active-wave-current.md) — live wave
