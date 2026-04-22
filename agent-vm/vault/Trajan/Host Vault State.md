---
title: "Host Vault State"
created: 2026-03-16
updated: 2026-03-16
type: personal
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: personal
tags: [code, knowledge, obsidian, ops, prompts, research]
summary: "```bash"
---
# Host Vault State

> Synced from host machine. Last updated: 2026-03-16 19:55 UTC
> Location: `~/Documents/obsidian_first_stuff/twj1/`

## Structure (~150 active files)

| Directory | Purpose |
|---|---|
| `Trajan's Projects/` | Per-project hub notes (10 active) |
| `Session Log/` | Work session summaries |
| `Learnings & Gotchas/` | Hard-won lessons |
| `AI Knowledge/` | AI tools, research, ecosystem knowledge |
| `Contacts & People/` | Client and collaborator profiles |
| `System Setup/` | Host system configuration |
| `Agent Context/` | Claude Code agent definitions (trimmed) |
| `Preferences & Tendencies/` | Personal patterns and preferences |
| `Archive/` | Dead weight moved here (90+ files cleaned 2026-03-13) |

## Key Learning (2026-03-13)

**"CLAUDE.md instructions don't self-enforce."** After 2 days, none of the "mandatory" vault behaviors were happening — no session logs, no gotchas, no agent dispatches. Root cause: instruction-following degrades under context pressure. Fix: fewer promises, manual habits, realistic expectations.

**This applies to us too.** Our SOUL.md/AGENTS.md are the same risk. We mitigate with:
- Cron-based enforcement (not just instructions)
- File-based state (MEMORY.md, daily notes)
- Auto-capture scripts (capture.sh, message-harvester)
- session-guardian.sh (detects when behavior fails)

## Cross-Vault Relationship

| VM Vault | Host Vault | Notes |
|---|---|---|
| `vault/Trajan/Projects.md` | `Trajan's Projects/` | VM mirrors host project index |
| `vault/Business/` | `Contacts & People/` | Client data lives in both |
| `vault/Research/` | `AI Knowledge/` | Research overlaps — VM is more agent-focused |
| — | `Session Log/` | Host-only, captures coding sessions |
| — | `Learnings & Gotchas/` | Host-only, captures dev lessons |

## Access Pattern
```bash
# Read host vault
ssh host-machine "cat ~/Documents/obsidian_first_stuff/twj1/PATH.md"

# Dispatch work on host
~/bin/host-claude.sh ~/Desktop/Coding/Projects/PROJECT "task"
```

## Related

- [[README]]
- [[projects]]
- [[System Setup]]
