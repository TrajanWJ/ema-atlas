# EMA Memory Sync

This document is the shared memory policy for EMA-related work across EMA itself, OpenClaw, Claude Code, and Codex.

## Goal

Keep one durable source of operator/project memory instead of letting every tool drift into its own private summary.

## Durable vs Transient

### Durable memory
Write here when the information should survive sessions and be reused:

- architecture decisions
- current runtime truths
- operator preferences that affect implementation
- project conventions
- environment topology / important paths
- workflow rules that multiple tools should follow

Preferred durable homes:

1. `~/.local/share/ema/vault/wiki/` for knowledge-base/wiki content
2. `~/.local/share/ema/operator-memory/` for operator memory and short durable notes
3. repo docs when the memory is repo-specific and should travel with the codebase

### Transient memory
Do **not** promote these unless they matter later:

- scratch notes
- one-off debugging output
- temporary plans
- ephemeral session summaries
- stale branch-specific context

## Shared Source For EMA Repo Work

For work inside `~/Projects/ema`, the read-first shared memory sources are:

1. `docs/OPERATING-REALITY.md`
2. `docs/CANON-PLANNING-BOUNDARY.md`
3. `docs/MEMORY-SYNC.md`
4. `CLAUDE.md`
5. `AGENTS.md`
6. `docs/backend/*`
7. `docs/GROUND-TRUTH.md`
8. `ema-genesis/*` canon docs when architectural intent matters

## Tool Rules

### OpenClaw
- Use repo `AGENTS.md` and `docs/MEMORY-SYNC.md` as the default EMA handoff.
- Do not invent a separate EMA-specific memory blob if a repo doc can hold it.
- When a long-lived lesson is learned, promote it into repo docs or EMA durable storage.

### Claude Code
- Read repo `CLAUDE.md` first.
- Then read `docs/MEMORY-SYNC.md` for durable/transient memory policy.
- Capture durable findings into the EMA wiki or repo docs, not only Claude-local session history.

### Codex
- Read repo `AGENTS.md` first when present.
- Use `docs/MEMORY-SYNC.md` as the durable-memory policy for EMA work.
- Do not rely on Codex local history as the only memory source.

## Concrete Paths

- EMA repo: `~/Projects/ema`
- Shared memory policy: `~/Projects/ema/docs/MEMORY-SYNC.md`
- Operating reality: `~/Projects/ema/docs/OPERATING-REALITY.md`
- Claude repo instructions: `~/Projects/ema/CLAUDE.md`
- Codex/OpenClaw repo instructions: `~/Projects/ema/AGENTS.md`
- EMA durable wiki: `~/.local/share/ema/vault/wiki/`
- Optional operator-memory folder: `~/.local/share/ema/operator-memory/`

## Update Policy

When reality changes:

1. update `docs/OPERATING-REALITY.md`
2. update `docs/MEMORY-SYNC.md` if the memory rules changed
3. update repo `CLAUDE.md` / `AGENTS.md` only if the handoff contract changed
4. promote durable knowledge into the EMA wiki when it belongs there

That keeps all tools pointed at the same source instead of drifting.
