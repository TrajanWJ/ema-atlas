---
name: ema-mode
description: How to use EMA effectively — daemon API, vault, intents, brain dumps, and the operator surface that connects them.
triggers:
  - ema
  - daemon
  - brain dump
  - vault
  - intent
  - ema cli
---

# Goal

Use EMA's surfaces in the right order so context is captured, retrieved, and acted on without duplication or loss.

## Inputs

- The current activity (planning, coding, reviewing, capturing)
- The current actor and project
- The relevant intent (if any)

## Workflow

1. **Start with context, not action.** Before acting, run `ema now` (what should I do next?), `ema status` (daemon health), and check the active project's intent tree with `ema intent tree -p <slug>`.
2. **Capture to the right surface:**
   - Quick thought, link, idea → `ema dump "..."` (lands in BrainDump inbox)
   - Strategic goal or sub-goal → `ema intent create` or edit `vault/wiki/Intents/`
   - Decision or learning → `vault/wiki/User/Learnings-Gotchas.md` or typed memory entry
   - Long-form note → vault file with `[[wikilinks]]`
3. **Search before creating.** Use `ema wiki search "topic"` (keyword) or `ema wiki search --semantic "topic"` (vector). Duplicates pollute the graph.
4. **Use the daemon, not the file.** REST at `localhost:4488` is the source of truth. The vault is a projection. Edit via API when possible; edit files only when the vault is the canonical surface (intents, learnings).
5. **Let the engine work.** Approve / redirect / kill proposals with `ema proposal ...`. Do not bypass the pipeline by creating tasks directly when a proposal would do.
6. **Close the loop at session end.** Write a session log (`Session Log/YYYY-MM-DD - Title.md`) and update the project note in `Trajan's Projects/`. Sessions end abruptly; do this proactively.

## Output Contract

After an EMA session, the operator should be able to ask a fresh agent "what happened?" and get the answer from EMA without rereading the chat. If the answer is not in EMA, the loop was not closed.

## Common Failure Modes

- **Capturing in chat.** Anything you say to the agent and not to EMA is lost on session end.
- **Creating tasks directly.** Bypassing the proposal pipeline loses the cross-pollination and review steps.
- **Editing the vault by hand when the API exists.** The daemon will overwrite or get out of sync.
- **No intent linkage.** Tasks and proposals without an intent cannot be prioritized against goals.
- **Skipping the session log.** Future-you cannot recover the context.
- **Treating the wiki as documentation.** It is operational state. Read it before acting; write to it after.

## See Also

- `wiki/Operations/EMA-Best-Practices.md` (when present)
- `wiki/Operations/Quick-Reference.md`
- `daemon/lib/ema/cli/cli.ex`
- `~/Projects/ema/CLAUDE.md`
