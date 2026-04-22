# Fleet-Wide Mistakes — Agent-Learnings

Cross-agent failure patterns. Read on startup to avoid repeating known mistakes.

## coder.failed cluster (2026-03-19)
9 tasks failed in one batch. Pattern: all involved OpenClaw-internal infrastructure or self-improvement tasks.
Root cause suspected: tasks passed without architectural context about OpenClaw internals.
Prevention: Always inject architecture context + file paths before dispatch to coding agents.
Added: 2026-04-04

## Thin task specification → failure
Multi-agent coordination research (arXiv 2603.24284) shows success rate collapses 58%→25% without rich specs.
Prevention: Every task sent to Codex/Coder must include: file paths, architecture note, success criteria, known constraints.
Added: 2026-04-04

## Silent failure mode: no .learnings logging
Agents fail silently when they have no .learnings/ directory and no instruction to log failures.
Prevention: Every agent workspace needs .learnings/LEARNINGS.md. Append failure notes on BLOCKED status.
Added: 2026-04-04

## Model-only substitution (Codex)
Codex agent answered from model reasoning without invoking `codex exec` CLI.
Prevention: Mandatory execution rule must be in BOTH CLAUDE.md and SOUL.md. Check: result must cite working directory + result excerpt.
Added: 2026-04-04

## Vault Agent-Learnings missing mistakes.md
Only patterns.md existed. Agents reading mistakes.md on startup would silently skip or error.
Prevention: Both mistakes.md and patterns.md must exist before agents reference them.
Added: 2026-04-04
