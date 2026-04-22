/**
 * Graph expansion — enriches candidates with structural neighbors.
 *
 * For the top N candidates, walk 1-hop edges (calls, imports, contains, uses)
 * and add neighbors as candidates with decayed scores.
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { ScoredCandidate } from './types.js';

/** Max candidates to expand (don't waste work on low-scoring ones) */
const MAX_EXPAND = 20;

/** Max neighbors per edge type per node */
const MAX_NEIGHBORS_PER_EDGE = 3;

/** Score decay for expanded nodes */
const DECAY_FACTOR = 0.5;

/** Edge types to traverse */
const EXPAND_EDGE_TYPES = ['calls', 'imports', 'contains', 'uses'] as const;

/** Node types to skip */
const SKIP_TYPES = new Set(['import', 'export']);

/** @deprecated Use smartExpand from smart-traversal.ts for query-aware expansion */
export function expandNodesLegacy(
  candidates: ScoredCandidate[],
  graph: KnowledgeGraph,
): ScoredCandidate[] {
  return expandGraph(candidates, graph);
}

export function expandGraph(
  candidates: ScoredCandidate[],
  graph: KnowledgeGraph,
): ScoredCandidate[] {
  const start = Date.now();

  // Sort by score descending, expand only top N
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const toExpand = sorted.slice(0, MAX_EXPAND);

  // Track existing candidate IDs to avoid duplicates
  const existingIds = new Set(candidates.map((c) => c.id));
  const expanded: ScoredCandidate[] = [];

  for (const candidate of toExpand) {
    if (!candidate.node) continue;

    const edges = graph.getEdgesFor(candidate.id, 'both');

    // Group edges by type, cap per type
    const edgeCounts = new Map<string, number>();

    for (const edge of edges) {
      const edgeType = edge.type;
      if (!EXPAND_EDGE_TYPES.includes(edgeType as typeof EXPAND_EDGE_TYPES[number])) continue;

      const count = edgeCounts.get(edgeType) ?? 0;
      if (count >= MAX_NEIGHBORS_PER_EDGE) continue;

      const neighborId = edge.source === candidate.id ? edge.target : edge.source;

      // Skip if already a candidate (existing one keeps its higher score)
      if (existingIds.has(neighborId)) continue;

      const neighborNode = graph.getNode(neighborId);
      if (!neighborNode) continue;
      if (SKIP_TYPES.has(neighborNode.type)) continue;

      edgeCounts.set(edgeType, count + 1);
      existingIds.add(neighborId);

      expanded.push({
        id: neighborId,
        node: neighborNode,
        text: `${neighborNode.type} ${neighborNode.name} in ${neighborNode.filePath}:\n${neighborNode.content.slice(0, 500)}`,
        score: candidate.score * DECAY_FACTOR,
        sources: ['graph-expansion'],
        type: 'code',
      });
    }
  }

  log('query', 'Graph expansion complete', {
    inputCandidates: candidates.length,
    expanded: expanded.length,
    total: candidates.length + expanded.length,
    ms: Date.now() - start,
  });

  return [...candidates, ...expanded];
}
