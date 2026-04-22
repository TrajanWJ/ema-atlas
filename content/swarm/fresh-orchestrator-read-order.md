# Fresh Orchestrator Read Order

For a new orchestrator joining active EMA work in drift-aware mode:

1. Read `README.md` first for the swarm pack framing.
2. Read `continuous-progress-protocol.md` next to understand claims, lanes, and handoffs.
3. Read `orchestrator-alignment.md` for the active coordination rules.
4. Read `object-model.md` only as needed to avoid inventing new objects or boundaries.
5. Read `repo-integration-map.md` when you need to place work in the repo.

Skip or defer:

- deep archive content unless a live task points to it
- broad historical context that does not affect the current lane
- speculative design notes when the lane is already clear

Rule of thumb:

- start with the live coordination docs
- claim one narrow lane
- follow the current workboard or task thread
- stop reading when you can act without guessing

If you feel pulled into the archive, return to the current lane scope and ask:

- what must be true right now
- what file or route changes next
- what can wait until handoff
