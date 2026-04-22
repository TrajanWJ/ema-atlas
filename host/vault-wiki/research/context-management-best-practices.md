---
type: research
wiki_id: research/context-management-best-practices
imported_from: vault/Research/context-management-best-practices.md
imported_at: '2026-04-04T00:23:57.160Z'
tags: []
summary: ''
---
# Context Management — Best Practices for AI Agent Systems

**Date:** 2026-03-20
**Source:** Internal research (Researcher agent)
**Confidence:** 0.80
**Tags:** #agent-architecture #context-management #memory

## 1. Hierarchical Context Summarization with Decay

Time-weighted compression: last hour verbatim, last day key facts, last week one-liners. Replaces binary keep/drop at the 2500-char MEMORY.md cap with graduated fidelity bands.

**Implementation:** `memory-compact.sh` on session startup, bucketing entries by timestamp.

## 2. Dispatch Context Fingerprinting

SHA-256 hash of context blocks sent to subagents, stored in outcome-tracker. Pre-dispatch comparison detects when identical (failing) context is being re-sent. Separates "same bad approach" from "same bad context."

## 3. Scoped Context Injection for Subagents

Add `CONTEXT_REFS` field to dispatch blocks listing specific vault paths/QMD queries. Pre-dispatch script resolves into trimmed context payload. Prevents both over-stuffing and under-providing context to subagents.

## 4. Cross-Session Context Bridging via Artifact Manifests

Structured manifest schema (task, status, findings[], artifacts[], decisions[]) replacing free-form subagent output. Enables programmatic querying of past agent findings.

## 5. Proactive Context Prefetch on Recurring Patterns

Log context accesses, identify co-access clusters, auto-prefetch frequently-needed notes on startup. Prevents the "forgot to check X" class of failures.

---

*Sources: Anthropic "Building Effective Agents" (2024), Lilian Weng "LLM Powered Autonomous Agents" (2023)*
