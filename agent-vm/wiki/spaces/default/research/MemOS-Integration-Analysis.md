---
type: research
wiki_id: research/MemOS-Integration-Analysis
imported_from: vault/Research/MemOS-Integration-Analysis.md
imported_at: '2026-04-04T00:23:57.093Z'
tags: []
summary: ''
---
# MemOS Integration Analysis

**Created:** 2026-03-19  
**Source:** MemTensor/MemOS (7,446 stars as of 2026-03-19)  
**Repo:** https://github.com/MemTensor/MemOS  
**Package:** `pip install MemoryOS`  
**Replaces:** cyqlelabs/smrti (removed)  

---

## What Is MemOS?

MemOS (Memory Operating System) is a unified memory layer for LLMs and AI agents. It abstracts store/retrieve/manage into a single OS-style API. Two deployment modes:

- **Cloud Plugin** — hosted API, 72% token reduction, multi-agent sharing
- **Local Plugin** — 100% on-device SQLite, FTS5 + vector hybrid search, Memory Viewer dashboard

OpenClaw is explicitly listed in the repo description and has official plugins. Topics include `openclaw`, `clawdbot`, `moltbot`.

---

## Key Technical Patterns

### 1. Hybrid Search: FTS5 + Vector

The local plugin uses **SQLite FTS5** for full-text search combined with **vector embeddings** for semantic retrieval. This hybrid approach:

- FTS5 covers exact/keyword matches (fast, zero-cost inference)
- Vector covers semantic similarity (catches paraphrased or conceptually related memories)
- Results are merged and re-ranked before returning to the agent

**Why this matters:** Pure vector search misses exact phrases. Pure FTS misses semantic variants. Hybrid beats both in retrieval accuracy — MemOS claims +43.70% accuracy vs. OpenAI Memory.

**Reimplement pattern:**
```sql
-- FTS5 table
CREATE VIRTUAL TABLE memories_fts USING fts5(content, user_id, tags);

-- Vector table (store embedding as BLOB)
CREATE TABLE memories_vec (id TEXT, user_id TEXT, embedding BLOB, content TEXT);

-- Hybrid query: FTS candidates + vector rerank
WITH fts_candidates AS (
  SELECT rowid, content FROM memories_fts WHERE memories_fts MATCH ?
)
SELECT m.*, vec_cosine_sim(m.embedding, ?) AS score
FROM memories_vec m
JOIN fts_candidates f ON m.id = f.rowid
ORDER BY score DESC LIMIT 10;
```

### 2. Multi-Agent Memory Sharing via user_id

MemOS isolates memory by `user_id`. Multiple agent instances sharing the same `user_id` automatically share memory context. This enables:

- **Context handoff** — agent A stores findings, agent B continues seamlessly
- **Skill sharing** — reusable skills stored in shared namespace, evolved by any agent
- **Memory isolation** — agents with different `user_id` values are fully sandboxed

**For OpenClaw multi-agent setup:**
- Use `user_id = "trajan"` for all agents sharing global context
- Use `user_id = "trajan-scout"` etc. for agent-scoped private memory
- Cross-agent handoffs: store summary to shared `user_id`, downstream reads it

### 3. Task Summarization & Skill Evolution

MemOS auto-summarizes task completions and stores them as reusable "skills" that self-upgrade over time. Each skill has:
- Input/output pattern
- Confidence score from prior executions
- Upgrade history

This is the evolution model for our agent skills — rather than static SKILL.md files, skills could carry execution metadata and improve.

### 4. Async Memory via MemScheduler

Production-grade: memory operations are async via Redis Streams with:
- Millisecond-level latency on writes
- Queue isolation per agent
- Auto-recovery on failure
- Quota-based scheduling

For our scale (single-user, single VM), the local SQLite mode skips Redis entirely.

---

## OpenClaw Plugin Specifics

### Cloud Plugin
- Package: [MemOS-Cloud-OpenClaw-Plugin](https://github.com/MemTensor/MemOS-Cloud-OpenClaw-Plugin)
- API key from [MemOS Dashboard](https://memos-dashboard.openmem.net)
- 72% token reduction (intelligent retrieval vs. full history load)
- Multi-agent sharing via `user_id`

### Local Plugin
- Package: `@memtensor/memos-local-openclaw-plugin` (npm)
- 100% on-device, SQLite storage
- FTS5 + vector hybrid search
- 7-page Memory Viewer dashboard
- Task summarization, skill evolution
- Multi-agent collaboration with memory isolation

---

## Patterns to Reimplement in Our Memory Layer

### Priority 1: Hybrid Search
Current memory (post-smrti): unclear. Next memory layer should use FTS5 + vector.

Implementation path:
1. Set up SQLite with FTS5 extension (built-in on most Python/Node SQLite)
2. Add embedding column (use local model or OpenAI embeddings)
3. Implement hybrid query function with cosine rerank
4. Wrap in MCP tool: `memory_search(query, user_id, top_k=10)`

### Priority 2: user_id Namespacing
Every memory write/read should carry `user_id`. Map:
- `trajan` — global Trajan context (all agents can read)
- `trajan-{agent_name}` — agent-scoped private memory

### Priority 3: Confidence-Scored Memory
Each stored memory should have:
- `created_at`, `last_accessed`, `access_count`
- `confidence` (0.0–1.0) — degrades over time without reinforcement
- `source_agent` — which agent wrote it

This feeds the Agent Handoff Envelope spec (see [[agent-handoff-envelope]]).

### Priority 4: Skill Memory
Store successful task patterns as reusable skills. After 3+ similar task completions, promote pattern to skill.

---

## Recommended Implementation Path

### Option A: Use MemOS Local Plugin Directly (Fastest)
- Install `@memtensor/memos-local-openclaw-plugin`
- Configure OpenClaw to load it
- Immediate FTS5 + vector + Memory Viewer
- **Pros:** zero implementation, battle-tested, OpenClaw-native
- **Cons:** npm dependency, potential version churn, less control

### Option B: Build Custom Layer Inspired by MemOS (More Control)
- Implement hybrid SQLite FTS5 + vector in Python
- Expose as MCP server
- Full control over schema, no external deps
- **Pros:** tailored to our agent patterns, no upstream dependency
- **Cons:** 2-4 weeks of implementation

### Option C: Hybrid — Use MemOS Cloud for Now, Build Local Later
- Get API key, use Cloud Plugin immediately
- 72% token reduction, zero infra
- Build local layer when patterns are clear
- **Pros:** instant win, real-world data to inform custom build
- **Cons:** cloud dependency, data leaves machine

**Recommendation: Option A (Local Plugin)** — install and test immediately. MemOS explicitly targets OpenClaw, the local plugin is on-device, and it unblocks multi-agent memory sharing which is a current gap.

---

## Quick Install Path

```bash
# Local Plugin (npm)
npm install -g @memtensor/memos-local-openclaw-plugin

# Configure OpenClaw to load plugin
# (see MemOS docs: https://memos-claw.openmem.net/docs/index.html)

# Or Cloud Plugin
# 1. Get API key at https://memos-dashboard.openmem.net
# 2. Follow: https://github.com/MemTensor/MemOS-Cloud-OpenClaw-Plugin
```

---

## Related

- [[agent-handoff-envelope]] — uses confidence scores from memory layer
- [[Deep-Research-Sweep-2026-03-19]] — source sweep that surfaced MemOS
- [[HEARTBEAT]] — memory promotion step uses memory system
