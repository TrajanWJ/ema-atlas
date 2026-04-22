---
date: 2026-03-13
tags: [session-log, vault-maintenance, cleanup]
status: completed
---

# 2026-03-13 — Vault Cleanup and Honest Assessment

## What Happened

Trajan asked how the vault-to-Claude-Code connection actually works, then pointed out that nothing was functioning as promised: no session logs being written, no gotchas captured, no project docs updated, agent dispatch not firing, prompt/role libraries gathering dust, and LetMeScale grossly over-documented compared to every other project.

## What We Did

### Archived ~90 files of dead weight
- **LetMeScale docs** (55 files) → `Archive/LetMeScale-docs/` — design system, plans, testimonial analyses, V2 experiment. Belongs in the project repo, not a personal knowledge vault.
- **Agent Context/Prompts/** (19 files) → `Archive/Dead Weight/` — duplicated what Superpowers skills and `.claude/agents/` already provide.
- **Agent Context/Roles/** (6 files) → `Archive/Dead Weight/` — same duplication.
- **Workflows/** (7 files) → `Archive/Dead Weight/` — aspirational checklists nobody followed. 5 of 6 were empty TBD placeholders.
- **Architecture Blueprints/** (3 files) → `Archive/Dead Weight/` — just redirected to My Stack Decisions.

### Rewrote both CLAUDE.md files
- **`~/.claude/CLAUDE.md`**: Removed "Forced Agent Dispatches" section entirely (never worked), removed references to archived folders, added realistic note about session logging ("proactively offer, don't wait for signal"), kept coding conventions.
- **`CLAUDE.md` (vault)**: Updated structure diagram, removed dead folders from autonomy zones, simplified.

### Updated MOCs
- Welcome.md, Agent Context MOC, AI Knowledge Hub, Projects MOC — all updated to reflect new reality.

## Key Decisions

1. **No forced agent dispatch in CLAUDE.md** — It's text-based instruction that gets ignored under context pressure. Superpowers skills handle some of this already. Pretending it's mandatory when it isn't is worse than not having it.
2. **Keep `.claude/agents/` as-is** — 16 agent definitions, small files, don't clutter Obsidian. ~8 are unused but could work if dispatch improves.
3. **LetMeScale docs don't belong here** — A project's design system and 20+ plan iterations should live in the project repo or a project-specific vault, not a personal knowledge base.

## Root Cause Analysis

The vault was set up on 2026-03-11 with comprehensive infrastructure but no feedback loop that actually fires. The system assumes Claude will:
- Write session logs (but sessions end abruptly)
- Capture gotchas (but context pressure skips it)
- Dispatch agents (but instruction-following degrades over long sessions)
- Update project notes (but coding happens in project dirs, not the vault)

**The fix isn't more instructions. It's fewer promises and manual habits.**

## Next Steps

- [ ] Move `Archive/LetMeScale-docs/` into the LetMeScale project repo (manual — drag from Obsidian)
- [ ] Start actually writing gotchas when bugs cost >5 min
- [ ] Consider a session-end hook or `/push` habit to trigger log writing
- [ ] After a week of real use, assess what's still dead weight

## Vault State After This Session

~150 active markdown files (down from ~244). Leaner structure, no aspirational filler.

#vault-maintenance #cleanup
