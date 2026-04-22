---
title: mistakes
created: '2026-03-16'
updated: '2026-03-16'
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
tags:
  - agents
  - obsidian
  - prompts
  - research
  - security
  - skills
summary: >-
  Things that failed so no agent repeats them. Read on startup, append after
  tasks.
wiki_id: agents/mistakes
imported_from: vault/Agents/mistakes.md
imported_at: '2026-04-04T00:23:56.724Z'
---
# Mistakes — Cross-Agent Shared Memory

Things that failed so no agent repeats them. Read on startup, append after tasks.

---

## 2026-03-16 | System | Initial Setup

Cross-agent mistake log initialized. Agents should append failures and anti-patterns here — things that didn't work and should be avoided.

## 2026-03-16 | Main | Docs Drifted From Reality

Vault docs described agents and workflows that no longer existed. The Architecture page referenced System-era agents that were archived months ago. After any structural change, update docs in the same session — never defer it.

## 2026-03-16 | Main | Shallow "Next Steps" Without Analysis

Trajan flagged that suggesting surface-level next steps wastes time. Don't list obvious follow-ups — do deeper analysis of what actually matters, prioritize ruthlessly, and only suggest actions you'd stake reputation on.

## 2026-03-16 | Ops | Kept Building Instead of Fixing

Across 4 rounds of work, the pattern was: build new thing → find existing thing broken → build another new thing instead of fixing. Break the cycle: fix what's broken before adding anything new.

## 2026-03-16 | Prompt-Engineer | Thin SOUL.md = Weak Agent

The Security agent's original SOUL.md was a generic template — no severity framework, no tool-specific commands, no agent-security section. Thin SOULs produce generic outputs. Every SOUL.md needs: domain-specific tool preferences with actual commands, a severity/priority framework, and stolen patterns from production use.

## 2026-03-16 | Right Hand | Symlink rm -rf disaster
**Never run `rm -rf` on a directory containing symlinks to real data.** The workspace/skills/ directory contained symlinks to ~/skills/ — deleting the symlinks followed them and destroyed all 36 original skill directories. Cost: 30 minutes of recovery, reinstalling everything from ClawHub + rebuilding custom skills. **Fix:** Use `find -type l -delete` to remove only symlinks, or `unlink` individual entries.

## Related

- [[README]]
- [[project-obsidian-vault]]
- [[patterns]]
