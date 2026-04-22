# AGENTS.md

If you are working in the EMA repo, read these first:

1. `docs/OPERATING-REALITY.md`
2. `docs/CANON-PLANNING-BOUNDARY.md`
3. `docs/INTENTION-BUILDING-SYSTEM.md`
4. `docs/GAP-LEDGER-SYSTEM.md`
5. `docs/INTENTION-AND-GAP-TOPOLOGY.md`
6. `docs/GRAPH-INTEGRATION-SPEC.md`
7. `docs/PROMOTION-FLOW-SPEC.md`
8. `docs/EMA-KNOWLEDGE-AND-ORCHESTRATION-ARCHITECTURE.md`
9. `docs/REVIEW-PROMOTION-PROVENANCE-ARCHITECTURE.md`
10. `docs/BLUEPRINT-PLANNER-CONVERGENCE.md`
11. `docs/HUMAN-OPS-INTEGRATION.md`
12. `docs/PLANNING-AND-GAP-TEMPLATES.md`
13. `docs/MEMORY-SYNC.md`
14. `CLAUDE.md`
15. `docs/backend/README.md`
16. `docs/GROUND-TRUTH.md`

## Runtime Truth

- EMA is a **TypeScript-first Electron monorepo**.
- The old Elixir/Phoenix/Tauri stack is archived under `IGNORE_OLD_TAURI_BUILD/`.
- Do not treat archived runtime docs or commands as current operating instructions.

## Memory Policy

- Durable repo/operator memory should be written into shared docs or EMA durable storage.
- Do not rely on tool-local chat/session history as the only memory source.
- Use `docs/MEMORY-SYNC.md` as the cross-tool memory contract.

## For Agents

- Prefer additive doc fixes over sprawling rewrites.
- If you find a stale doc, either fix it or clearly mark it as archival.
- Keep humans and other tools pointed at the same read-first files.


## Plane Discipline

When working in EMA, always distinguish between:
- canon
- planning / blueprint / intention-building
- implemented operational reality
- the gap between them

Do not write planning or aspiration material into canon files unless the task is explicitly a canon promotion.
Do not present planning docs as implemented truth.
Do not assume current implementation automatically rewrites canon.
