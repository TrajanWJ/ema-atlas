---
title: "Syne Agent Framework"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [knowledge, mcp, obsidian, prompts, research, skills]
summary: "Standalone, open-source AI agent framework built in Python. Named after Mnemosyne (Greek goddess of memory). Core philosophy: I remember, therefore I"
---
# Syne Agent Framework

**Source:** https://github.com/riyogarta/syne
**Category:** Self-hosted AI Agent Framework
**Date:** 2026-03-14
**Status:** Evaluated

## What It Does

Standalone, open-source AI agent framework built in Python. Named after Mnemosyne (Greek goddess of memory). Core philosophy: "I remember, therefore I am." Memory is the first-class citizen, not an afterthought.

### Core Features

**[[Memory Architecture]] (the standout feature):**
- PostgreSQL-native with pgvector semantic search
- Knowledge graph for entity-relation traversal (1-hop relation queries)
- 3-layer anti-hallucination defense:
  1. Quick filter (no LLM call) — skips greetings, short messages, noise
  2. LLM evaluation (local Ollama model) — categorizes, scores importance (0.0-1.0)
  3. Similarity dedup (embedding model) — prevents duplicate memories
- **Only user-confirmed facts stored** — never assistant suggestions
- Memory decay engine — non-permanent memories fade over time
- Dual retrieval: semantic search (pgvector cosine similarity) + knowledge graph (entity traversal)

**No Config Files:**
- No SOUL.md, AGENTS.md, CONFIG.yaml at runtime
- All behavior lives in PostgreSQL tables (soul, rules, identity, config)
- Changed through natural conversation ("Be more casual and witty")

**Near-Zero Cost Stack:**
- Chat: Google Gemini OAuth (free) or any provider
- Embedding: Ollama local (qwen3-embedding, $0)
- Evaluator: Ollama local (qwen3:0.6b, $0)
- Full stack can run at $0/month

**Self-Evolution:**
- Can create new abilities for itself (with user permission)
- Linux-style 3-digit octal permissions for every tool/ability

**Remote Nodes:**
- Extend to multiple machines via WebSocket
- Each node has its own CLI, shared memory, controlled from one Telegram bot

### Hardware Requirements
- Minimal: 2 CPU, 2GB RAM (Ollama loads ~1.3GB per model)
- Recommended: 4+ CPU, 8-16GB RAM for better embedding quality

## Relevance

**HIGH — Their [[memory architecture]] has ideas worth stealing.**

### Key Insights for Our Stack

1. **3-Layer Memory Filter:** Our [[auto-knowledge]] approach captures too indiscriminately. Syne's quick filter → LLM evaluation → dedup pipeline is more intelligent. Could adapt this for vault writes.

2. **User-Confirmed Facts Only:** We store everything the agent decides is important. Syne only stores what the user confirms. This is a stronger anti-hallucination stance. Worth considering for critical vault sections.

3. **Knowledge Graph + Semantic Search:** Dual retrieval (embedding similarity + entity-relation graph) outperforms either alone. We have [[obsidian-ontology-sync]] and [[knowledge-graph]] skills but they're not integrated into retrieval.

4. **Memory Decay:** Memories fade if not reinforced. We don't have this — old daily notes just accumulate. Could implement for memory/ directory.

5. **Conversational Config:** "Change your name to Atlas" vs editing IDENTITY.md. More natural but less auditable. Our file-based approach is better for version control.

### Comparison
| Feature | Syne | Our Stack |
|---|---|---|
| Memory storage | PostgreSQL + pgvector | Flat files + BM25 |
| Anti-hallucination | 3-layer filter | None (trust the LLM) |
| Knowledge graph | Built-in entity extraction | Separate skill (not integrated) |
| Memory decay | Automatic | None |
| Config approach | Conversational (DB) | File-based |
| Cost | $0/month possible | Claude Max subscription |
| Multi-node | WebSocket remote nodes | Single VM |

## Notes

- The embedding model is permanent — changing requires resetting all memories. Important architectural decision.
- Their tiered server recommendations (Minimal → Beast) based on RAM are practical
- The async evaluator (never blocks chat) is clever — our [[auto-knowledge]] could learn from this
- Telegram-first design vs our Discord-first
