# Config Change: Claude Code --system-prompt flag overrides the default system prompt layer above CLAUDE.md — enables per-task instruction injection without modifying CLAUDE.md or using env vars

- **Source:** 02ba8e4a.txt
- **Suggested:** 2026-04-15T05:07:02Z
- **Impact:** 3/5

## Change Details

Update dispatch-engine.sh and any claude CLI invocations to use --system-prompt for per-agent role injection instead of relying solely on CLAUDE.md context. This gives cleaner separation between global instructions and task-specific system prompts. Test with one agent type (e.g., researcher) first.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
