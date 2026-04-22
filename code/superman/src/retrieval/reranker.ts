/**
 * Re-ranker — scores candidates using multiple signals.
 *
 * Combines TF-IDF similarity, keyword coverage, graph centrality
 * within the candidate set, and a multi-retriever source bonus.
 *
 * The interface is designed for a future cross-encoder swap:
 * replace the implementation of rerank() without changing the pipeline.
 */

import { log } from '../logger.js';
import { tokenize } from '../semantic/tfidf.js';
import type { BM25Index } from '../semantic/bm25.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { ScoredCandidate } from './types.js';
import { crossEncoderRerank, hasCrossEncoderFailed } from './cross-encoder.js';

// ── Signal weights ──

const W_BM25 = 0.35;
const W_KEYWORD = 0.20;
const W_CENTRALITY = 0.20;
const W_SOURCE = 0.25;

/**
 * Re-rank candidates against the original query.
 * Returns sorted candidates, limited to `maxResults`.
 */
export function rerank(
  query: string,
  candidates: ScoredCandidate[],
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  maxResults: number = 15,
): ScoredCandidate[] {
  if (candidates.length === 0) return [];
  const start = Date.now();

  const queryTokens = tokenize(query);
  const candidateIdSet = new Set(candidates.map((c) => c.id));

  // Pre-compute centrality: how many other candidates link to each candidate
  const centralityMap = computeCentrality(candidates, candidateIdSet, graph);

  // Score each candidate
  const scored = candidates.map((candidate) => {
    const bm25Score = computeBM25Score(candidate.id, query, bm25Index);
    const keywordScore = computeKeywordCoverage(queryTokens, candidate);
    const centrality = centralityMap.get(candidate.id) ?? 0;
    const sourceScore = computeSourceBonus(candidate);

    const combined =
      W_BM25 * bm25Score +
      W_KEYWORD * keywordScore +
      W_CENTRALITY * centrality +
      W_SOURCE * sourceScore;

    return { ...candidate, score: combined };
  });

  scored.sort((a, b) => b.score - a.score);

  const result = scored.slice(0, maxResults);

  log('query', 'Re-ranking complete', {
    input: candidates.length,
    output: result.length,
    topScore: result[0]?.score ?? 0,
    ms: Date.now() - start,
  });

  return result;
}

// ── Signal computations ──

/**
 * BM25 similarity between the query and a candidate document.
 */
function computeBM25Score(
  candidateId: string,
  query: string,
  bm25Index: BM25Index | null,
): number {
  if (!bm25Index) return 0;
  const results = bm25Index.search(query, 100);
  const match = results.find((r) => r.id === candidateId);
  if (!match) return 0;
  const maxScore = results[0]?.score ?? 1;
  return maxScore > 0 ? match.score / maxScore : 0;
}

/**
 * What percentage of query keywords appear in the candidate's name/content.
 */
function computeKeywordCoverage(
  queryTokens: string[],
  candidate: ScoredCandidate,
): number {
  if (queryTokens.length === 0) return 0;

  const candidateText = candidate.text.toLowerCase();
  const candidateName = (candidate.node?.name ?? '').toLowerCase();

  let hits = 0;
  for (const token of queryTokens) {
    if (candidateName.includes(token) || candidateText.includes(token)) {
      hits++;
    }
  }

  return hits / queryTokens.length;
}

/**
 * How many other candidates in the result set link to this candidate.
 * Normalized to [0, 1].
 */
function computeCentrality(
  candidates: ScoredCandidate[],
  candidateIdSet: Set<string>,
  graph: KnowledgeGraph,
): Map<string, number> {
  const linkCounts = new Map<string, number>();

  for (const candidate of candidates) {
    const edges = graph.getEdgesFor(candidate.id, 'both');
    for (const edge of edges) {
      const otherId = edge.source === candidate.id ? edge.target : edge.source;
      if (candidateIdSet.has(otherId) && otherId !== candidate.id) {
        linkCounts.set(otherId, (linkCounts.get(otherId) ?? 0) + 1);
      }
    }
  }

  // Normalize: divide by max link count
  const maxLinks = Math.max(...linkCounts.values(), 1);
  const normalized = new Map<string, number>();
  for (const [id, count] of linkCounts) {
    normalized.set(id, count / maxLinks);
  }

  return normalized;
}

/**
 * Bonus for candidates found by multiple retrievers or by OpenAI.
 * - Found by 3 retrievers: 1.0
 * - Found by 2 retrievers: 0.7
 * - Found by OpenAI: +0.2 bonus
 * - Found by 1 retriever: 0.3
 */
function computeSourceBonus(candidate: ScoredCandidate): number {
  const count = candidate.sources.length;
  let score = 0;

  if (count >= 3) score = 1.0;
  else if (count >= 2) score = 0.7;
  else score = 0.3;

  // OpenAI embeddings are higher quality — give a bonus
  if (candidate.sources.includes('openai')) {
    score = Math.min(1.0, score + 0.2);
  }

  return score;
}

/**
 * Optional cross-encoder pass. Runs after multi-signal reranking.
 * If model not loaded, returns candidates unchanged.
 */
export async function rerankWithCrossEncoder(
  query: string,
  candidates: ScoredCandidate[],
  maxResults: number = 15,
): Promise<ScoredCandidate[]> {
  if (candidates.length === 0) return [];
  if (hasCrossEncoderFailed()) return candidates.slice(0, maxResults);

  const inputs = candidates.map((c) => ({
    id: c.id,
    text: c.node
      ? `${c.node.type} ${c.node.name} in ${c.node.filePath}:\n${c.node.content.slice(0, 400)}`
      : c.text.slice(0, 400),
  }));

  const ranked = await crossEncoderRerank(query, inputs, maxResults);
  if (ranked.length === 0) {
    // Cross-encoder not available — return multi-signal results
    return candidates.slice(0, maxResults);
  }

  // Map cross-encoder scores back to candidates
  const scoreMap = new Map(ranked.map((r) => [r.id, r.score]));
  const result = candidates
    .filter((c) => scoreMap.has(c.id))
    .map((c) => ({ ...c, score: scoreMap.get(c.id)! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return result;
}

// ── LLM Reranking (selective, second stage) ──

const LLM_RERANK_TIMEOUT = 3000;
const INTENT_WORDS = /\b(how does|why does|why is|explain|what happens when|trace|walk through)\b/i;

/**
 * Determine if LLM reranking should trigger.
 * Triggers when: top 3 candidates score within 0.1, query has 3+ concepts,
 * or query contains intent words.
 */
export function shouldTriggerLLMRerank(
  query: string,
  candidates: ScoredCandidate[],
  conceptCount: number = 0,
): boolean {
  // Condition 1: top 3 candidates score within 0.1 (ambiguous ranking)
  if (candidates.length >= 3) {
    const top3 = candidates.slice(0, 3);
    const spread = top3[0].score - top3[2].score;
    if (spread < 0.1) return true;
  }

  // Condition 2: query has 3+ concepts
  if (conceptCount >= 3) return true;

  // Condition 3: query contains intent words
  if (INTENT_WORDS.test(query)) return true;

  return false;
}

/**
 * LLM-powered reranking — uses Claude to evaluate candidate relevance.
 * Only called selectively. Falls back to cross-encoder on timeout.
 */
export async function rerankWithLLM(
  query: string,
  candidates: ScoredCandidate[],
  maxResults: number = 15,
): Promise<ScoredCandidate[]> {
  if (candidates.length === 0) return [];
  if (candidates.length <= 3) return candidates; // Not worth LLM call for few candidates

  try {
    const result = await Promise.race([
      llmRerankCall(query, candidates, maxResults),
      llmRerankTimeout(LLM_RERANK_TIMEOUT),
    ]);

    if (result) return result;
  } catch (err) {
    log('query', `LLM reranking failed, using cross-encoder fallback: ${err}`);
  }

  // Fallback to existing cross-encoder
  return rerankWithCrossEncoder(query, candidates, maxResults);
}

async function llmRerankCall(
  query: string,
  candidates: ScoredCandidate[],
  maxResults: number,
): Promise<ScoredCandidate[]> {
  const { callClaude, safeParseJSON } = await import('../ai/claude-client.js');

  // Build compact candidate list for LLM
  const top = candidates.slice(0, 15);
  const candidateList = top
    .map((c, i) => {
      const name = c.node?.name ?? c.id;
      const file = c.node?.filePath ?? '';
      const snippet = (c.node?.content ?? c.text).slice(0, 200);
      return `[${i}] ${name} (${file}): ${snippet}`;
    })
    .join('\n');

  const prompt = `Given this search query about a codebase:
"${query}"

Rank these code candidates by relevance (most relevant first). Return ONLY a JSON array of indices.

Candidates:
${candidateList}

Respond with a JSON array of indices, e.g. [3, 0, 7, 1, 2]. Most relevant first. Include up to ${maxResults} indices.`;

  const response = await callClaude(prompt, 'query');
  const parsed = safeParseJSON<number[]>(response);

  if (!parsed.ok || !Array.isArray(parsed.data)) {
    return candidates.slice(0, maxResults);
  }

  // Reorder candidates based on LLM ranking
  const reranked: ScoredCandidate[] = [];
  const used = new Set<number>();

  for (const idx of parsed.data) {
    if (typeof idx === 'number' && idx >= 0 && idx < top.length && !used.has(idx)) {
      used.add(idx);
      reranked.push({
        ...top[idx],
        score: 1.0 - (reranked.length * 0.05), // Descending scores
      });
    }
  }

  // Add any candidates not in LLM response
  for (let i = 0; i < top.length; i++) {
    if (!used.has(i)) {
      reranked.push({ ...top[i], score: 0.1 });
    }
  }

  log('query', 'LLM reranking complete', {
    query: query.slice(0, 60),
    reranked: reranked.length,
  });

  return reranked.slice(0, maxResults);
}

function llmRerankTimeout(ms: number): Promise<ScoredCandidate[] | null> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(null), ms),
  );
}
