---
type: knowledge
wiki_id: >-
  system/Intelligence_Notes/kairos-always-on-background-agent-cross-session-memory-distillation
imported_from: >-
  vault/System/Intelligence
  Notes/kairos-always-on-background-agent-cross-session-memory-distillation.md
imported_at: '2026-04-04T00:23:57.247Z'
tags: []
summary: ''
---
# KAIROS: Always-On Background Agent with Cross-Session Memory Distillation

- **Category:** design-pattern
- **Source:** 1c922b73.txt (Claude Code source leak)
- **Extracted:** 2026-04-02
- **Status:** 📋 proposed
- **Project:** Auto Delegator Layer / OpenClaw Agent Setup
- **Impact:** 4/5

## Pattern Description

KAIROS is a persistent background agent pattern extracted from the Claude Code source leak. It operates as an always-on companion agent with two core behaviors:

1. **Always-on**: Runs continuously in the background, not invoked per-task
2. **Cross-session memory distillation**: After each session ends, it summarizes and compresses the session's key knowledge into a structured store — rather than relying on in-context recall or raw transcript archives

The memory distillation step is the key innovation: instead of accumulating raw logs, KAIROS actively compresses sessions into actionable knowledge units, reducing context bloat while preserving signal.

## Relevance to Trajan's Stack

This maps directly onto existing OpenClaw infrastructure:

| KAIROS Component | Current Analog | Gap |
|---|---|---|
| Always-on agent | Right Hand (heartbeat cron) | No cross-session distillation step |
| Memory distillation | LCM summaries + vault notes | No automated post-session compression |
| Structured knowledge store | `/home/trajan/vault/` + engram | Populated manually or by scan, not by distillation |

The missing piece: after each significant agent session, a distillation step should extract key decisions, patterns, and learnings into the vault — automatically, not just when explicitly requested.

## Implementation Ideas

**Option A — Post-session cron hook:**  
After each session ends (or on a daily schedule), run a distillation job that reads recent LCM summaries and writes structured vault notes covering: decisions made, tools used, patterns observed, open questions.

**Option B — Heartbeat-integrated distillation:**  
Add a distillation phase to the existing heartbeat cron. Every N heartbeats, summarize the session's activity since last distillation and commit a vault note.

**Option C — Auto-knowledge trigger:**  
Extend the auto-knowledge capture pipeline to also pull from LCM/session transcript summaries, not just the external scanner queue.

## Related Patterns

- [[Three-Man-Team Agent Pipeline]] — Architect→Builder→Reviewer with context files (also from same source, proposed status)
- [[Two-Agent Harness for Long-Running Claude Code]] — state management across sessions
- [[SSGM Memory Governance]] — graph memory failure modes (topology leakage, semantic drift)

## Next Steps

- [ ] Decide which implementation option fits current stack
- [ ] Prototype post-session distillation script
- [ ] Wire into heartbeat or daily cron
- [ ] Evaluate whether engram or vault is the better distillation target (or both)

---
Tags: #intelligence #design-pattern #memory #agent-architecture #kairos
