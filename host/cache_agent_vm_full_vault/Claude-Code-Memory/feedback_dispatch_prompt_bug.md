---
name: dispatch engine prompt passing bug
description: claude_with_retry was passing prompts as CLI args — prompts starting with --- were parsed as unknown options. Fixed to use stdin pipe.
type: feedback
---

`claude_with_retry` in `~/bin/rate-limit-handler.sh` passed prompts as positional arguments to `claude --print`. Prompts starting with `---` (from PAST LEARNINGS injection) were parsed as CLI option flags, causing instant exit with "unknown option" error. The stale-task-cleanup then zombie-recovered these as "done" without actual work.

**Fix:** Changed to pipe prompt via stdin: `echo "$1" | claude --print -p -`

**Why:** The dispatch engine injects `--- PAST LEARNINGS ---` block at the start of every prompt. This is a dash-prefixed string that CLI argument parsers interpret as a flag.

**How to apply:** Any time the dispatch engine or rate-limit-handler is modified, ensure prompts are always piped via stdin, never passed as positional args. Also: the stale-task-cleanup should verify result files contain actual work output, not just error messages, before marking tasks as "done."
