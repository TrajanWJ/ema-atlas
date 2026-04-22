---
title: "Context Management Patterns"
type: reference
created: 2026-04-06
tags: [architecture, context, compression, tokens]
summary: "Context compression and management patterns for LLM agent operations"
---

# Context Management Patterns

## Wet Proxy Pattern

**Problem:** MCP tool results return full JSON payloads that bloat context windows. A single tool call can consume thousands of tokens of which only a fraction is relevant.

**Solution:** Intercept tool results via a proxy layer that compresses responses before they enter the context window. Strip metadata, truncate arrays, summarize large objects.

**Result:** 82% bloat reduction measured across typical tool call patterns.

**Key insight:** The proxy is "wet" (Write Everything Twice) intentionally -- it re-serializes tool output in a compressed format rather than passing through raw responses.

## RLM Compact-Hook

**Problem:** Context compaction events are disruptive. The model loses working memory at unpredictable points.

**Solution:** Hook into the compaction lifecycle (RLM = Runtime Lifecycle Management). Before compaction, persist critical working state to files. After compaction, reload from those files.

**Implementation:** The compact-hook triggers automatically, writing session state to disk so the post-compaction agent can reconstruct context without user intervention.

## 7 Layers of Context Weaving

A defense-in-depth approach to context management, ordered from proactive to reactive:

1. **Overflow prevention** -- Budget allocation before work begins. Estimate token cost of planned operations and refuse work that would exceed budget.

2. **Compression** -- Active compression of tool results, code blocks, and conversation history. Strip whitespace, abbreviate, summarize.

3. **Filesystem offloading** -- Move large content (code, data, analysis) to files. Reference by path instead of holding in context. Read back only the relevant sections.

4. **Compaction recovery** -- CONTINUE.md protocol and compact-hooks to survive forced compaction events without losing critical state.

5. **Runtime monitoring** -- Track token usage in real-time. Warn at thresholds. Trigger preemptive offloading before hitting limits.

6. **Session health auto-reset** -- At 80% context usage, automatically trigger cleanup: summarize conversation, offload to files, compact non-essential history.

7. **Graceful degradation** -- When all else fails, preserve the most critical context (current task, key decisions, blockers) and shed everything else.

## Token-Optimized Retrieval via qmd-context.sh

**Problem:** Vault searches return full documents when only a few paragraphs are relevant. Each retrieval consumes tokens disproportionate to its information value.

**Solution:** `qmd-context.sh` wraps QMD search with token-aware extraction. It returns only the relevant sections of matched documents, with surrounding context trimmed to a budget.

**Result:** ~90% token savings compared to naive full-document retrieval.

## Session Health Auto-Reset

**Trigger:** Context usage exceeds 80%.

**Actions:**
1. Summarize current conversation state to a checkpoint file
2. Identify and offload large context items (code blocks, tool results) to disk
3. Compact conversation history to essential decisions and current task state
4. Log the reset event for session continuity

**Rationale:** 80% is chosen to leave headroom for the reset process itself and for continued work after reset.

## Agent Glyph Budget Pattern

**Problem:** Sub-agents return verbose results that flood the parent agent's context. A delegation that saves the parent work ends up costing more context than doing the work directly.

**Solution:** Enforce a "glyph budget" on agent output. Sub-agents must write detailed results to files and return only a brief summary (status, file paths, key findings) to the parent.

**Rule:** File-only output for detailed results. Context-resident output limited to structured status envelopes.

**Effect:** Prevents context flood from delegation while preserving full detail in accessible files.
