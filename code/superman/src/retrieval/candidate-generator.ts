/**
 * Candidate generation — runs 3 retrievers in parallel, merges results.
 *
 * Retrievers:
 *   1. TF-IDF (always runs)
 *   2. FlowIndex cosine similarity (always runs)
 *   3. OpenAI embeddings (runs if OPENAI_API_KEY is set)
 *
 * Merge strategy: dedupe by node ID, keep max score per node.
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import { BM25Index } from '../semantic/bm25.js';
import { flowIndex } from '../semantic/flow-index.js';
import { generateEmbedding as generateLocalEmbedding } from '../semantic/embeddings.js';
import { generateOpenAIEmbedding, isOpenAIAvailable } from '../semantic/openai-embeddings.js';
import type { ScoredCandidate, RetrieverSource } from './types.js';

// ── BM25 Retriever ──

function retrieveBM25(
  query: string,
  bm25Index: BM25Index | null,
  graph: KnowledgeGraph,
  limit: number = 30,
): ScoredCandidate[] {
  if (!bm25Index) return [];

  const results = bm25Index.search(query, limit);
  const candidates: ScoredCandidate[] = [];

  for (const r of results) {
    const node = graph.getNode(r.id);
    if (!node) continue;
    if (node.type === 'import' || node.type === 'export') continue;

    candidates.push({
      id: r.id,
      node,
      text: `${node.type} ${node.name} in ${node.filePath}:\n${node.content.slice(0, 500)}`,
      score: r.score,
      sources: ['bm25'],
      type: 'code',
    });
  }

  return candidates;
}

// ── FlowIndex Retriever ──

async function retrieveFlowIndex(
  query: string,
  graph: KnowledgeGraph,
  limit: number = 15,
): Promise<ScoredCandidate[]> {
  if (flowIndex.size === 0) return [];

  // Generate embedding for the query and search via cosine similarity
  const queryEmbedding = await generateLocalEmbedding(query);
  const results = flowIndex.search(queryEmbedding, limit);
  const candidates: ScoredCandidate[] = [];

  for (const r of results) {
    const entry = r.entry;

    // For code-type entries, try to attach the graph node
    let node = undefined;
    if (entry.type === 'code') {
      node = graph.getNode(entry.id) ?? undefined;
    }

    candidates.push({
      id: entry.id,
      node,
      text: entry.text,
      score: r.score,
      sources: ['local-embeddings'],
      type: entry.type,
    });

    // For flow entries, also pull in linked code
    if (entry.type === 'flow' && entry.metadata.linkedCode) {
      for (const codeId of entry.metadata.linkedCode.slice(0, 5)) {
        const codeNode = graph.getNode(codeId);
        if (codeNode && codeNode.type !== 'import' && codeNode.type !== 'export') {
          candidates.push({
            id: codeId,
            node: codeNode,
            text: `${codeNode.type} ${codeNode.name} in ${codeNode.filePath}:\n${codeNode.content.slice(0, 500)}`,
            score: r.score * 0.6,
            sources: ['local-embeddings'],
            type: 'code',
          });
        }
      }
    }
  }

  return candidates;
}

// ── OpenAI Embeddings Retriever ──

/** In-memory store for OpenAI embeddings (populated at index time) */
const openaiEmbeddingStore = new Map<string, number[]>();

export function getOpenAIEmbeddingStore(): Map<string, number[]> {
  return openaiEmbeddingStore;
}

export function clearOpenAIEmbeddingStore(): void {
  openaiEmbeddingStore.clear();
}

async function retrieveOpenAI(
  query: string,
  graph: KnowledgeGraph,
  limit: number = 15,
): Promise<ScoredCandidate[]> {
  if (!isOpenAIAvailable() || openaiEmbeddingStore.size === 0) return [];

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateOpenAIEmbedding(query);
  } catch (err) {
    log('embed', 'OpenAI query embedding failed, skipping retriever', { error: String(err) });
    return [];
  }

  // Cosine similarity against all stored embeddings
  const scored: Array<{ id: string; score: number }> = [];
  for (const [nodeId, embedding] of openaiEmbeddingStore) {
    const score = cosineSimilarity(queryEmbedding, embedding);
    if (score > 0.1) {
      scored.push({ id: nodeId, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const candidates: ScoredCandidate[] = [];
  for (const r of scored.slice(0, limit)) {
    const node = graph.getNode(r.id);
    if (!node) continue;

    candidates.push({
      id: r.id,
      node,
      text: `${node.type} ${node.name} in ${node.filePath}:\n${node.content.slice(0, 500)}`,
      score: r.score,
      sources: ['openai'],
      type: 'code',
    });
  }

  return candidates;
}

// ── Merge ──

function mergeCandidates(groups: ScoredCandidate[][]): ScoredCandidate[] {
  const merged = new Map<string, ScoredCandidate>();

  for (const group of groups) {
    for (const candidate of group) {
      const existing = merged.get(candidate.id);
      if (existing) {
        // Keep max score, merge sources
        if (candidate.score > existing.score) {
          existing.score = candidate.score;
        }
        for (const src of candidate.sources) {
          if (!existing.sources.includes(src)) {
            existing.sources.push(src);
          }
        }
        // Prefer the version with a node attached
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

// ── Public API ──

export async function generateCandidates(
  query: string,
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  skipOpenAI: boolean = false,
): Promise<ScoredCandidate[]> {
  const start = Date.now();

  // Run retrievers in parallel
  const [bm25Results, flowResults, openaiResults] = await Promise.all([
    Promise.resolve(retrieveBM25(query, bm25Index, graph)),
    retrieveFlowIndex(query, graph),
    skipOpenAI ? Promise.resolve([]) : retrieveOpenAI(query, graph),
  ]);

  const merged = mergeCandidates([bm25Results, flowResults, openaiResults]);

  log('query', 'Candidate generation complete', {
    bm25: bm25Results.length,
    flowIndex: flowResults.length,
    openai: openaiResults.length,
    merged: merged.length,
    ms: Date.now() - start,
  });

  return merged;
}

// ── Helpers ──

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
