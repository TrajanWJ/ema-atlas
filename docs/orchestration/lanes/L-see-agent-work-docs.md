# L-see-agent-work-docs — See Agent Work Operational Runbook

**Status:** queued
**Owner:** unassigned (best fit: Product Surface Donor Orchestrator, since its Read First already points at the See Agent Work docs and the scope is doc-only).
**Wave:** W1 → W3 bridge (docs ship ahead of the real writers).

## Read first

1. `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`
2. `doctrine/planning/orchestrator-prompts/PRODUCT-SURFACE-DONOR-ORCHESTRATOR-PROMPT.md`
3. `runtime/EMA-0.0.5--4-24/docs/architecture/09-see-agent-work.md` (architecture of the vApp).
4. `runtime/EMA-0.0.5--4-24/docs/vapps/see-agent-work.md` (vApp spec).
5. Current state of `runtime/EMA-0.0.5--4-24/docs/cli/see-agent-work.md` (what's there, what's stubbed).
6. Current state of `runtime/EMA-0.0.5--4-24/docs/agents/see-agent-work-agent-usage.md` (if absent, create).
7. `runtime/EMA-0.0.5--4-24/apps/web/src/app/agent-work-page.tsx` — the current mock surface, to understand vocabulary (swarm, mission, lane) that the runbook must use consistently.

## Scope

Writable paths:

- `runtime/EMA-0.0.5--4-24/docs/cli/see-agent-work.md`
- `runtime/EMA-0.0.5--4-24/docs/agents/see-agent-work-agent-usage.md`
- Any supporting example scripts under `runtime/EMA-0.0.5--4-24/docs/cli/examples/see-agent-work/` (new subdir, if needed).

Out of scope for this lane:

- The `agent-work-page.tsx` surface itself (belongs to Product Surface Donor's See Agent Work lane).
- Daemon-side `swarm.start` / `lane.open` writers (separate W3 lane, not yet opened).
- Honest-mock labeling on the surface (handled in `L-honest-mocks`, already closed; doc-side language should mirror it).

## Dependencies

- Depends on: vApp spec and architecture docs as sources of vocabulary truth (already landed in W0).
- Parallelizable with: `L-ipc-client-finish`, `L-projections-topbar`, `L-writers-org-space`. No code coupling.
- Unblocks: external sessions joining See Agent Work work cold; future writer lanes (W3) get a runbook to validate against.

## Exit criteria

1. Every CLI command described in `docs/cli/see-agent-work.md` has a worked example: input args, expected output, and the underlying event family/command shape it maps to.
2. `docs/agents/see-agent-work-agent-usage.md` explains how an agent (human or Claude/Codex worker) should use See Agent Work from the worker's perspective — what to open, what to report, what to avoid.
3. Vocabulary (swarm, mission, lane, step, agent, dispatch) matches the vApp spec and the `agent-work-page.tsx` surface exactly. No drift.
4. Honest-mock discipline observed: any command that is still mock-only on the surface is marked `pending daemon writer` in the CLI doc, with a pointer to the future writer lane.
5. Runbook dry-run: a cold reader (no prior EMA context) can follow the runbook end to end without asking clarifying questions. This is verified by a second session reading and reporting the first point where they got stuck.
6. `bash scripts/contract-check.sh` still green — docs do not reference event kinds that do not exist in the catalog.

## Reporting template

```text
Lane: L-see-agent-work-docs
Status: closed <YYYY-MM-DD>
Files changed:
  - docs/cli/see-agent-work.md
  - docs/agents/see-agent-work-agent-usage.md
  - docs/cli/examples/see-agent-work/*.md (if added)
CLI commands covered: <count>
Worked examples added: <count>
Honest-mock tags in runbook: <count>
Cold-reader dry-run verified by: <session or reader>
Risks: <list>
```

## Ledger anchor

Report lane closure to `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`.
