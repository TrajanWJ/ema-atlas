# Playbook — run a swarm wave

Use this when you are orchestrating or joining an active EMA swarm wave and
need to keep continuous progress legible across humans, agents, and possibly
another orchestrator.

## Read first

Before claiming work, read:

1. [`../content/swarm/README.md`](../content/swarm/README.md)
2. [`../content/swarm/continuous-progress-protocol.md`](../content/swarm/continuous-progress-protocol.md)
3. [`../content/swarm/orchestrator-alignment.md`](../content/swarm/orchestrator-alignment.md)
4. [`../content/swarm/object-model.md`](../content/swarm/object-model.md)
5. [`../OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md) for unresolved swarm-adjacent decisions

If the wave is part of the current EMA 0.0.3 reconstruction pass, also read:

- [`/Users/tawj/Desktop/ema 0.0.3/ema-003-workboard.md`](/Users/tawj/Desktop/ema 0.0.3/ema-003-workboard.md)
- [`/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-swarm-source-pack.md`](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-swarm-source-pack.md)
- [`/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md`](/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md)

## When to use a swarm wave

Run a swarm wave when:

- the task naturally splits into bounded lanes
- multiple agents can move in parallel without sharing a write scope
- the work benefits from evidence gathering, implementation, verification, and integration happening at once
- the next step would otherwise bottleneck on one agent doing everything serially

Do not use a swarm wave when:

- the task is tiny and one lane can finish it faster than dispatch overhead
- the write scope is too small to split safely
- the core ambiguity is unresolved enough that parallel implementation would create noise instead of progress

## Minimal loop

1. Read the current workspace state.
2. Split work into narrow lanes with explicit ownership.
3. Publish claims before edits.
4. Keep each worker inside its lane.
5. Refresh claims and handoffs as work moves.
6. Reconcile outputs into the shared record.
7. Close or hand off each lane explicitly.

## Lane design rules

- Each lane should have one primary owner.
- Each lane should name exact files, folders, docs, or artifacts in scope.
- Each lane should have a visible done-when.
- Each lane should be small enough that another worker can understand it from the claim and handoff alone.
- Keep discovery, implementation, verification, and reconciliation distinct unless the task is too small to justify splitting them.

## Claims and handoffs

- Claims should say owner, lane, scope, goal, next step, and refresh window.
- Handoffs should say what changed, what remains open, what to verify, and any risk that still matters.
- If another orchestrator is active, do not assume silence means permission. Treat visible movement as real and publish your own movement before touching shared coordination artifacts.

## Multi-orchestrator rule

When another orchestrator is active:

- do not fork a private truth model
- do not race on the same lane without an explicit split or handoff
- do not resolve conflicts by resetting or deleting their work
- reconcile forward using the shared record

## Verification

```bash
./scripts/check-graph.sh
./scripts/index.sh
npx next build
```

Expected result:

- the graph remains consistent
- the repo index includes the new or updated swarm docs
- the atlas still builds cleanly

## Commit message template

```text
docs(swarm): harden swarm workspace contract for active wave
```
