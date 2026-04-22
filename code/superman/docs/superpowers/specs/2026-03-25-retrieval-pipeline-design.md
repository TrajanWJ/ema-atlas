# Retrieval Pipeline Overhaul

## Summary

Replace the keyword-matching `retrieveContext()` in `src/query/engine.ts` with a staged retrieval pipeline that combines TF-IDF, vector search, graph traversal, and multi-signal re-ranking.

## Architecture

```
Query
  → Stage 0: Decompose (split compound queries)
  → Stage 1: Candidate Generation (TF-IDF + FlowIndex + OpenAI embeddings)
  → Stage 2: Graph Expansion (1-hop neighbors)
  → Stage 3: Re-ranking (multi-signal scorer)
  → Stage 4: Context Assembly (50K budget, smart chunking)
```

## New Files

- `src/retrieval/types.ts` — shared types
- `src/retrieval/decomposer.ts` — query decomposition
- `src/retrieval/candidate-generator.ts` — 3 parallel retrievers
- `src/retrieval/graph-expander.ts` — graph neighbor expansion
- `src/retrieval/reranker.ts` — multi-signal re-ranking (cross-encoder slot)
- `src/retrieval/cache.ts` — disk index cache + in-memory query cache
- `src/retrieval/pipeline.ts` — orchestrator

## Modified Files

- `src/config.ts` — add OPENAI_API_KEY
- `src/semantic/embeddings.ts` — add real OpenAI embedding path
- `src/context/assembler.ts` — bump budget to 50K, smart chunking
- `src/query/engine.ts` — replace retrieveContext() with pipeline
- `src/project-manager.ts` — integrate caching, OpenAI embeddings at index time

## Key Decisions

- In-memory by default, Qdrant optional when available
- OpenAI embeddings optional — graceful skip if no API key
- Merge strategy: max score (not average) across retrievers
- Graph expansion: top 20 candidates, 1-hop, 3 neighbors per edge type, 0.5 decay
- Re-ranker interface designed for future cross-encoder swap
- Index cache on disk (.codevault-cache.json), query cache in-memory LRU (50 entries)
- OpenAI embedding batches: 100 nodes per API call
