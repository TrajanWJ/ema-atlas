---
id: "0006e387-26dd-4d9c-a480-3a1c1fbdc5da"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Knowledge Compilation Patterns
tags: [research, knowledge, compilation, wiki, critical]
source: session-2026-04-07
---

# Knowledge Compilation — 24 Systems Analyzed

## Core Pattern (Karpathy)
'Compile your knowledge, don't search it.'
Instead of RAG on raw files, maintain structured wiki that LLM increments.
EMA is already doing this — needs compilation layer.

## Pipeline for EMA
1. Capture → daemon logs, sessions, notes (exists)
2. Extraction → find facts + knowledge gaps
3. Compilation → synthesize topics, generate concept articles
4. Quality scoring → credibility, freshness, verification count
5. Graph evolution → schema drift as knowledge changes (DIAL-KG)
6. Incremental updates → delta rules, process only changed nodes (DeepDive: 22x faster)
7. Retrieval → RAG + agentic retrieval for context assembly
8. Memory persistence → cross-session (Mem0/Recallium pattern)

## Top Tools to Study
- **llm-wiki-compiler** — topic synthesis, coverage indicators
- **DeepDive** — delta rules for incremental inference (7-112x speedup)
- **DIAL-KG** — schema-free incremental KG with evolution
- **Mem0** — graph-based persistent memory (26% quality improvement)
- **Recallium** — self-hosted MCP memory with 88% first-result precision
- **InfraNodus** — network science on text (gap detection, community detection)
- **QueryQuilt** — extract knowledge gaps from conversations (100% accuracy)

## Key Insight
Best systems combine:
- Persistent graph storage (not vector DB alone)
- Semantic deduplication
- Incremental updates (not batch recompilation)
- Quality/credibility scoring
- Multi-layer retrieval (search → timeline → details)
