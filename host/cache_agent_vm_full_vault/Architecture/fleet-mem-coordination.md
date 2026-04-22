---
title: Fleet-Mem Coordination Pattern
type: system
domain: agent-architecture
tags: [multi-agent, context-sharing, file-locks, AST, git-concurrent]
created: 2026-03-19
confidence: 0.75
source: agent:coder
summary: fleet-mem provides AST-aware shared code intelligence, multi-agent file locks, and git-concurrent coordination for agent fleets.
---

# Fleet-Mem Coordination Pattern

## What Is fleet-mem?

`sam-ent/fleet-mem` is a shared code intelligence layer for multi-agent fleets. It solves the problem of multiple agents working on the same codebase simultaneously without awareness of each other.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **AST-aware search** | Semantic code search across the repo — find symbol definitions, call sites, dependencies |
| **Multi-agent file locks** | Agents claim files before editing; lock prevents concurrent edits to same file |
| **git-concurrent coordination** | Merge strategy layer: stages, commits, and rebases without conflicts |
| **Discovery sharing** | Agent A discovers X about the codebase → fleet-mem records it → Agent B reads it before starting |

### Architecture

```
Agent A                  Agent B                  Agent C
   │                        │                        │
   ├─ claim lock on auth.py  │                        │
   │  (fleet-mem issues lock) │                        │
   │                        ├─ query: "who touches auth.py?" 
   │                        │  ← fleet-mem: "Agent A has a lock"
   │                        │  ← wait or work on other files
   │                        │                        │
   ├─ write discovery:       │                        │
   │  "auth.py: JWT decode   │                        │
   │   on line 47, not       │                        │
   │   verified against DB"  │                        │
   │                        │                        ├─ query discoveries
   │                        │                        │  ← fleet-mem returns Agent A's note
   │                        │                        │  Agent C avoids duplicate finding
   ├─ release lock           │                        │
                             │ ← Agent B can now claim lock
```

## How It Solves Our Multi-Agent Context Problem

Our current approach to multi-agent context sharing:
- **Vault** — write findings to vault, other agents `qmd search` for them
- **Handoff envelopes** — structured JSON passed between dispatch stages
- **TASKS.md** — shared task state file

Problems with current approach:
1. **Race conditions** — two agents can edit the same file without knowing
2. **Stale discoveries** — Agent B may re-discover what Agent A already found (wasted tokens)
3. **No AST awareness** — vault search is text-based; misses structural relationships
4. **No conflict prevention** — git conflicts happen after the fact, require resolution

Fleet-mem fixes all four.

## Comparison: fleet-mem vs Vault + Handoff Envelopes

| Dimension | Our Vault + Handoffs | fleet-mem |
|-----------|---------------------|-----------|
| **Knowledge persistence** | ✅ Permanent (vault) | ❌ Session-scoped (resets per run) |
| **Semantic search** | ✅ QMD embeddings | ✅ AST-aware (better for code) |
| **File lock coordination** | ❌ Not implemented | ✅ Native |
| **git coordination** | ❌ Manual | ✅ Automated |
| **Non-code content** | ✅ Any markdown | ❌ Code-focused |
| **Cross-project** | ✅ Single vault | ❌ Per-repo |
| **Setup overhead** | Low (already built) | Medium (needs integration) |

## Recommended Integration

Don't replace vault — **layer fleet-mem on top** for coding tasks:

```
Vault + Handoffs          fleet-mem
      │                       │
  persistent               ephemeral
  knowledge                session state
  (research,               (who has what
   decisions,               file locked,
   architecture)            what was found
                             in this run)
```

Concretely:
1. When gh-issues spawns multiple Coder agents for parallel issues
2. Start a fleet-mem session for the batch
3. Agents use fleet-mem for file locks and in-session discoveries
4. When done, significant discoveries get written to vault (permanent)
5. fleet-mem session discarded

## Implementation Sketch

```bash
# Start fleet-mem session for a batch
fleet-mem init --repo ~/worktrees/repo

# In each Coder spawn prompt:
"Before editing any file, check: fleet-mem lock status <file>
 If unlocked, acquire lock: fleet-mem lock acquire <file>
 Write discoveries: fleet-mem discover '<finding>'
 On exit: fleet-mem lock release --all"
```

## What to Watch

`sam-ent/fleet-mem` is new — watch repo for:
- Stability (agent-grade reliability needed)
- Integration patterns (does it have a Claude Code plugin?)
- Lock timeout behavior (what happens if agent dies holding a lock?)

Don't adopt until we've run a test on a non-critical repo.

## Related
- [[consensus-loop-pattern]]
- [[spec-driven-dev-patterns]]
- [[Agent Roster]]
- [[context-compression-patterns]]
