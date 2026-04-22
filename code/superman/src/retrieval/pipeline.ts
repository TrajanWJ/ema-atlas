/**
 * Retrieval pipeline — orchestrates all stages.
 *
 * Stage 0: Decompose query (split compound queries)
 * Stage 1: Candidate generation (TF-IDF + FlowIndex + OpenAI)
 * Stage 2: Graph expansion (1-hop neighbors)
 * Stage 3: Re-ranking (multi-signal)
 *
 * Returns ranked candidates ready for context assembly.
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { BM25Index } from '../semantic/bm25.js';
import { decompose } from './decomposer.js';
import { generateCandidates } from './candidate-generator.js';
import { expandGraph } from './graph-expander.js';
import { smartExpand } from './smart-traversal.js';
import { rerank, rerankWithCrossEncoder } from './reranker.js';
import { applyHierarchicalRetrieval } from './hierarchical.js';
import { getCachedQuery, setCachedQuery } from './cache.js';
import { rewriteQuery } from './query-rewriter.js';
import type { ScoredCandidate, RetrievalOptions, PipelineResult } from './types.js';
import type { ExpandedQuery } from '../types.js';

const DEFAULT_MAX_RESULTS = 15;

export async function retrieve(
  question: string,
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  options: RetrievalOptions = {},
): Promise<PipelineResult> {
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
  const totalStart = Date.now();
  const timing = { decompose: 0, candidateGen: 0, graphExpansion: 0, reranking: 0, crossEncoder: 0, total: 0 };

  // Check query cache
  const cached = getCachedQuery(question);
  if (cached) {
    return {
      candidates: cached,
      subQueries: [question],
      expandedQuery: undefined,
      timing: { ...timing, total: Date.now() - totalStart },
    };
  }

  // Stage 0a: Query rewriting (LLM-powered expansion)
  let expandedQuery: ExpandedQuery | undefined;
  if (!options.skipDecomposition) {
    try {
      expandedQuery = await rewriteQuery(question);
    } catch {
      // Silent fallback — query rewriting is best-effort
    }
  }

  // Stage 0b: Decompose
  let t = Date.now();
  const subQueries = options.skipDecomposition ? [question] : decompose(question);
  timing.decompose = Date.now() - t;

  // Stage 1: Candidate generation (run sub-queries in parallel, merge)
  t = Date.now();
  const allCandidates: ScoredCandidate[][] = await Promise.all(
    subQueries.map((q) => generateCandidates(q, graph, bm25Index, options.skipOpenAI)),
  );

  // Merge results from sub-queries
  let candidates = mergeScoredCandidates(allCandidates);

  // Boost candidates that appear in multiple sub-queries (connective tissue)
  if (subQueries.length > 1) {
    candidates = boostSharedCandidates(candidates, allCandidates);
  }
  timing.candidateGen = Date.now() - t;

  // Stage 2: Graph expansion (smart traversal with query awareness)
  t = Date.now();
  if (!options.skipGraphExpansion) {
    candidates = smartExpand(candidates, graph, question, expandedQuery);
  }
  timing.graphExpansion = Date.now() - t;

  // Stage 3: Re-ranking
  t = Date.now();
  candidates = rerank(question, candidates, graph, bm25Index, maxResults);
  timing.reranking = Date.now() - t;

  // Stage 4: Cross-encoder reranking (optional)
  t = Date.now();
  candidates = await rerankWithCrossEncoder(question, candidates, maxResults);
  timing.crossEncoder = Date.now() - t;

  // Stage 5: Hierarchical retrieval (diversity enforcement)
  candidates = applyHierarchicalRetrieval(candidates, graph, question, expandedQuery, maxResults);

  timing.total = Date.now() - totalStart;

  // Cache the result
  setCachedQuery(question, candidates);

  log('query', 'Retrieval pipeline complete', {
    question: question.slice(0, 80),
    subQueries: subQueries.length,
    finalCandidates: candidates.length,
    timing,
  });

  return { candidates, subQueries, expandedQuery, timing };
}

// ── Helpers ──

/**
 * Merge candidates from multiple sub-queries. Keep max score per node.
 */
function mergeScoredCandidates(groups: ScoredCandidate[][]): ScoredCandidate[] {
  const merged = new Map<string, ScoredCandidate>();

  for (const group of groups) {
    for (const candidate of group) {
      const existing = merged.get(candidate.id);
      if (existing) {
        if (candidate.score > existing.score) {
          existing.score = candidate.score;
        }
        for (const src of candidate.sources) {
          if (!existing.sources.includes(src)) {
            existing.sources.push(src);
          }
        }
        if (!existing.node && candidate.node) {
          existing.node = candidate.node;
        }
      } else {
        merged.set(candidate.id, { ...candidate, sources: [...candidate.sources] });
      }
    }
  }

  return [...merged.values()];
}

/**
 * Boost candidates found in multiple sub-query results.
 * These are likely the connective tissue between the sub-topics.
 */
function boostSharedCandidates(
  merged: ScoredCandidate[],
  groups: ScoredCandidate[][],
): ScoredCandidate[] {
  if (groups.length < 2) return merged;

  // Build ID sets per group
  const idSets = groups.map((g) => new Set(g.map((c) => c.id)));

  for (const candidate of merged) {
    let groupCount = 0;
    for (const idSet of idSets) {
      if (idSet.has(candidate.id)) groupCount++;
    }
    // Boost by 30% for each additional sub-query match
    if (groupCount > 1) {
      candidate.score *= 1 + 0.3 * (groupCount - 1);
    }
  }

  return merged;
}
