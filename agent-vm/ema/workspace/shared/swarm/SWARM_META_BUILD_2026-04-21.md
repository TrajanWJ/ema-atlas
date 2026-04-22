# Swarm Dispatch — Meta-build EMA Itself

**Created:** 2026-04-21T04:41:02Z
**Workspace root:** `/home/trajan/Projects/ema/workspace/shared/`
**Repo root:** `/home/trajan/Projects/ema`
**Objective:** Meta-build the EMA architecture and working surface so agents can collaborate without drift.

## Shared instructions for all agents

1. Start by reading:
   - `workspace/shared/README.md`
   - `workspace/shared/WORKSPACE_CONTRACT.md`
   - `docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`
2. Use the shared workspace as the collaboration surface.
3. Write your output to `workspace/shared/actors/<agent-id>.md`.
4. If you produce something another agent needs, also add a short note in `workspace/shared/handoffs/<agent-id>--handoff.md`.
5. Do not wander into random VM folders.
6. Focus on architecture, coordination, and next-build artifacts. Avoid giant speculative rewrites.

## Agent assignments

### claude-a1 — canonical graph v1
Harness: Claude Code
Task: Propose the minimal BEAM-native canonical graph v1 folder/entity model for EMA. Focus on markdown/frontmatter entities, git as store, ETS index assumptions, and promotion boundaries from workspace -> canon.
Output: `workspace/shared/actors/claude-a1.md`

### claude-a2 — temporal engine v1
Harness: Claude Code
Task: Draft the minimal temporal frontmatter and CLI surface for v1. Focus on `scheduled_window`, `phase`, `cadence_ref`, and commands like `ema block`, `ema schedule`, `ema agenda`.
Output: `workspace/shared/actors/claude-a2.md`

### claude-a3 — OTP supervision sketch
Harness: Claude Code
Task: Draft the OTP supervision sketch for Clock, Session supervisors, cadence workers, and how the shared workspace can be watched/indexed without becoming canonical truth.
Output: `workspace/shared/actors/claude-a3.md`

### hermes-a4 — agent workspace UX from daemon side
Harness: Hermes
Task: Define the daemon/CLI-facing agent workspace experience: how an agent discovers tasks, schedules, handoffs, current agenda, and active sessions from the shared workspace plus canonical EMA structures.
Output: `workspace/shared/actors/hermes-a4.md`

### hermes-a5 — swarm coordination contract
Harness: Hermes
Task: Draft the minimal swarm coordination contract for v1. Focus on actor registry, assignments, handoffs, channels, and what stays local vs future distributed.
Output: `workspace/shared/actors/hermes-a5.md`

### codex-a6 — workspace folder hardening
Harness: Codex
Task: Audit the new `workspace/shared/` structure and propose missing folders/files/templates that would make it actually usable by 10+ agents immediately.
Output: `workspace/shared/actors/codex-a6.md`

### codex-a7 — tasks/computed views design
Harness: Codex
Task: Define how tasks/todos/boards/agendas stay computed views over canonical entities rather than becoming duplicate stores. Be specific.
Output: `workspace/shared/actors/codex-a7.md`

### codex-a8 — session breadcrumb model
Harness: Codex
Task: Design the active session breadcrumb model for `workspace/shared/sessions/`: what files should exist, what fields they need, and how to link PTY/tmux/Execution records cleanly.
Output: `workspace/shared/actors/codex-a8.md`

### claude-a9 — anti-drift mechanisms
Harness: Claude Code
Task: Propose concrete anti-drift rules/mechanisms so EMA’s shared workspace, canonical graph, and runtime state do not diverge over time.
Output: `workspace/shared/actors/claude-a9.md`

### codex-a10 — v1 build order
Harness: Codex
Task: Produce a sharply-scoped build order for the first real implementation slice after this swarm. Focus on what should land first in BEAM/CLI/workspace.
Output: `workspace/shared/actors/codex-a10.md`

## Expected collaboration files

- actor outputs: `workspace/shared/actors/*.md`
- handoffs: `workspace/shared/handoffs/*.md`
- optional synthesized summary later: `workspace/shared/swarm/SWARM_SYNTHESIS_2026-04-21.md`
