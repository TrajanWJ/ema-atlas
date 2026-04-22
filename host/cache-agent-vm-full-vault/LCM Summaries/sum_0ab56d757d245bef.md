# LCM Summary sum_0ab56d757d245bef

Created: 2026-03-18 02:00:29
Kind: leaf
Depth: 0
Conversation: 258
Tokens: 1215
Descendants: 0
Earliest: 2026-03-18T02:00:28.000Z
Latest: 2026-03-18T02:00:29.000Z

## Content

[2026-03-18 02:00 UTC]
[Wed 2026-03-18 01:53 UTC] [Subagent Context] You are running as a subagent (depth 1/1). Results auto-announce to your requester; do not busy-poll for status.

[Subagent Task]: You are the Coder agent. PHASE 2: Rebuild the mirror system's best features in our architecture.

**⚠️ SECURITY: Do NOT clone any external repos. Build everything from scratch. Read the analysis file for the design concepts.**

Read this file first — it contains the full analysis of the mirror system: /home/trajan/vault/Research/Three-Tier Memory Architecture.md

Based on that analysis, implement these 4 features into our system:

### 1. Token-Optimized Retrieval — `qmd context` command
Create a script at /home/trajan/bin/qmd-context.sh that:
- Takes a search query
- Calls `qmd search` to find matching vault notes
- For each result, extracts ONLY: title, frontmatter summary, key_topics, tags, file path
- Outputs a compact summary list (NOT full file content)
- Agent reviews this list, then does `qmd get` only for relevant notes
- This is the #1 anti-context-drift measure

### 2. Auto-Classification Hook
Create a script at /home/trajan/bin/vault-classify.sh that:
- Finds vault notes that lack a `summary` field in frontmatter
- For each (batch of up to 10), generates summary + key_topics using a lightweight prompt
- Writes the generated metadata back into the note's YAML frontmatter
- Can be hooked into the ontology-sync cron
- For now, make it callable standalone: `vault-classify.sh [--limit 10] [--dry-run]`

### 3. Structured Session Capture
Create a template at /home/trajan/vault/Templates/Session Capture.md with fields:
- Date, Agent, Task Description
- Goal
- Commands/Steps That Worked
- Commands/Steps That Failed  
- Root Cause (if debugging)
- Fix Applied
- Lessons Learned
- Related Notes (wikilinks)

Also create /home/trajan/vault/Sessions/ directory.

Update /home/trajan/.openclaw/agents/main/workspace/AGENTS.md dispatch protocol to include: "After any significant debugging/troubleshooting task, write a structured session note to vault/Sessions/ using the Session Capture template."

### 4. Weekly Synthesis Prompt
Create a script at /home/trajan/bin/weekly-synthesis.sh that:
- Reads the last 7 days of daily notes from /home/trajan/.openclaw/agents/main/workspace/memory/
- Reads new vault notes from the past week
- Outputs a structured prompt for synthesis (themes, contradictions, opportunities, patterns)
- Writes result to /home/trajan/vault/Trajan/weekly-synthesis/YYYY-WW.md

### After building all 4:
- Test each script actually runs
- Write a summary of what was built to /home/trajan/vault/Research/Mirror System - Our Rebuild.md

Read existing files before editing. Never blind-write. Make scripts executable (chmod +x).

Report status as DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT when finished.

[2026-03-18 02:00 UTC]


[2026-03-18 02:00 UTC]
---
title: "Three-Tier Memory Architecture Analysis"
type: research
created: "2026-03-18"
updated: "2026-03-18"
tags: [memory-architecture, knowledge-management, agent-infrastructure, context-drift]
project: openclaw
status: active
---

# Three-Tier Memory Architecture Analysis

Study of two repos by Shawn Daniel (willynikes2) that implement a persistent knowledge layer for AI agents with Obsidian integration.

**Repos studied:**
- [knowledge-base-server](https://github.com/willynikes2/knowledge-base-server) — SQLite FTS5 knowledge base with MCP + REST interface
- [agent-orchestrator](https://github.com/willynikes2/agent-orchestrator) — Multi-agent CLI wrapper with failover (Claude → Codex → Gemini)

---

## 1. The Three-Tier Storage Model

The three tiers are **conceptual categories enforced through retrieval ranking**, not separate storage backends. Everything lives in a single SQLite database with FTS5 and embeddings tables. The tiering happens through document types, recency, and the retrieval pipeline.

### Hot Tier — Active Context
- **What:** Current project decisions, recent session findings, active bug fixes, in-progress architecture changes
- **How it works:** Retrieved FIRST in every query. Documents classified as `decision`, `fix`, `session` with recent `indexed_at` timestamps. The `kb_context` tool returns summaries (not full content) to save tokens — agent reads full doc only when summary looks relevant.
- **Decay:** Moves to warm after 7-14 days of inactivity (conceptual — no automated decay mechanism in the code)
- **Key insight:** Hot tier is really just "recent + high-value doc types get boosted in BM25 ranking"

### Warm Tier — Accumulated Knowledge
- **What:** Proven patterns, validated lessons, stable workflows, research summaries, synthesized insights
- **How it works:** Documents that have been **promoted** from raw captures into structured kno
[LCM fallback summary; truncated for context management]
