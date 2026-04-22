---
title: Cross-Pollination Audit — 2026-04-04
type: agent-learnings
created: 2026-04-04
author: Researcher agent
tags: [audit, cross-pollination, agents, soul, learnings]
summary: Agent audit found 4 agents missing .learnings/, tools.md missing, researcher not reading vault/Agent-Learnings at startup. Action items ranked.
---

# Cross-Pollination Audit — 2026-04-04

*Agent fleet audit: who's learning, who's not, what should propagate where.*

---

## Current State

### .learnings/ Status

| Agent | Has .learnings/ | Files |
|---|---|---|
| main | ❌ | — |
| researcher | ✅ | ERRORS, FEATURES, LEARNINGS |
| coder | ✅ | ERRORS, FEATURES, LEARNINGS |
| codex | ✅ | LEARNINGS only |
| ops | ✅ | ERRORS, FEATURES, LEARNINGS |
| security | ❌ | — |
| strategist | ❌ | — |
| prompt-engineer | ❌ | — |
| vault-keeper | ✅ | ERRORS, FEATURES, LEARNINGS |

### Startup Reads of vault/Agent-Learnings

| Agent | patterns.md | mistakes.md | tools.md |
|---|---|---|---|
| main | ❌ | ❌ | ❌ |
| researcher | ❌ | ❌ | ❌ |
| coder | ✅ | ✅ | ✅ (file missing!) |
| codex | ✅ | ✅ | ❌ |
| ops | ✅ | ✅ | ✅ (file missing!) |
| security | ✅ | ✅ | ✅ (file missing!) |
| strategist | ❌ | ❌ | ❌ |
| prompt-engineer | ✅ | ✅ | ❌ |
| vault-keeper | ❌ | ❌ | ❌ |

---

## Action Items (Priority Order)

### P1: Create vault/Agent-Learnings/tools.md
**Why:** Referenced at startup by coder, ops, security. Silent failure when missing.
**What to put in it:** Tool-specific patterns — which tools are slow, which need workarounds, which produce unreliable output. Seed from coder's .learnings if content exists.

### P2: Create main agent .learnings/
**Why:** Most active agent. Zero persistent learning across sessions.
**Files needed:** `.learnings/LEARNINGS.md`, `.learnings/ERRORS.md`
**Also:** Add vault/Agent-Learnings reads to main SOUL.md startup protocol.

### P3: Add vault/Agent-Learnings reads to researcher SOUL.md
**Why:** Researcher produces knowledge but doesn't consume fleet learnings.
**Add to startup:**
```
3. `vault/Agent-Learnings/patterns.md` — reusable patterns from fleet
4. `vault/Agent-Learnings/mistakes.md` — failures to avoid
5. `vault/Agent-Learnings/tools.md` — tool tips from fleet
```

### P4: Create strategist .learnings/ + add startup reads
**Why:** Strategist makes high-stakes decisions, accumulates zero learning.
**Files needed:** `.learnings/LEARNINGS.md`
**Also:** Add vault/Agent-Learnings reads to startup (follows same pattern as coder/ops).

### P5: Create security .learnings/
**Why:** Security reads vault/Agent-Learnings but can't write findings back.
**Files needed:** `.learnings/LEARNINGS.md`, `.learnings/ERRORS.md`

### P6: Create prompt-engineer .learnings/
**Why:** Reads patterns+mistakes but has no mechanism to contribute findings.
**Files needed:** `.learnings/LEARNINGS.md`

### P7: Add vault/Agent-Learnings reads to vault-keeper SOUL.md
**Why:** Manages the knowledge base but doesn't read the agent-learnings section — their own domain.

### P8: Add ERRORS.md and FEATURE_REQUESTS.md to codex .learnings/
**Why:** Codex has LEARNINGS.md only. Error categorization and feature requests need separate tracking.

---

## What Should Be in tools.md (Seed Content)

Based on fleet patterns observed:

```markdown
# vault/Agent-Learnings/tools.md — Fleet Tool Patterns
_Append entries below. Format: date, agent, pattern._

## exec() with long-running commands
Use `yieldMs` parameter when commands might run >10s to avoid orphaned processes.
Agent: ops | Added: 2026-04-04

## web_search unavailable without Brave API key
Brave API key not configured → web_search returns `missing_brave_api_key`.
Fallback: web_fetch directly against known docs URLs.
Agent: researcher | Added: 2026-04-04

## gitmcp.io returns thin landing pages
gitmcp.io/owner/repo returns a GitMCP connector page, not docs.
Use raw.githubusercontent.com or docs sites directly.
Agent: researcher | Added: 2026-04-04

## qmd update needs flock
Always run: `flock -n /tmp/qmd.lock qmd update && flock -n /tmp/qmd.lock qmd embed`
Prevents concurrent index corruption.
Agent: vault-keeper | Added: 2026-04-04

## wiki API at :8093, not :8090
Wiki CRUD/FTS5 API is at localhost:8093. Port 8090 is Quartz read-only mirror.
Agent: researcher | Added: 2026-04-04
```

---

## Patterns That Should Propagate

### From coder SOUL.md → researcher SOUL.md
Coder reads vault/Agent-Learnings at startup (full pattern). Researcher doesn't. Researcher should adopt the same 3-file startup read.

### From ops patterns.md → all agents
Auto-retry pattern is in patterns.md but only ops implements it. Other agents receiving failed task re-dispatches could benefit from knowing "analyze → archive resolved → retry viable."

### From mistakes.md → all SOULs
Fleet mistake #1 (thin task spec) should be explicitly noted in coder, codex, and ops SOUL.md (not just read from mistakes.md — in-SOUL emphasis for highest-impact failures).

---

*Full research context: [[Research/ema-systems-research-2026-04-04]]*
