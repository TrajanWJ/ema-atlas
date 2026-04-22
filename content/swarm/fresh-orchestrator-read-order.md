# Fresh Orchestrator Read Order

For a new orchestrator joining active EMA work in drift-aware mode:

1. Read `orchestration-kernel.md` first for the one-objective / one-main-lane model.
2. Read `active-wave-current.md` next so you know the live lane shape before touching anything.
3. Read `README.md` for the swarm pack framing and linked support docs.
4. Read `continuous-progress-protocol.md` for claims, lanes, handoffs, and drift checks.
5. Read `orchestrator-alignment.md` for multi-orchestrator rules.
6. Read `no-drift-rules.md` if the lane already feels muddy or too large.
7. Read `object-model.md` only as needed to avoid inventing new objects or boundaries.
8. Read `repo-integration-map.md` when you need to place work in the repo.

Skip or defer:

- deep archive content unless a live task points to it
- broad historical context that does not affect the current lane
- speculative design notes when the lane is already clear

Rule of thumb:

- start with the control model, then the live wave
- claim one narrow lane
- follow the current workboard or task thread
- stop reading when you can act without guessing

If you feel pulled into the archive, return to the current lane scope and ask:

- what must be true right now
- what file or route changes next
- what can wait until handoff
