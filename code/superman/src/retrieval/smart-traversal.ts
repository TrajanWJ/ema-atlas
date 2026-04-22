/**
 * Smart Graph Traversal — query-aware edge prioritization.
 *
 * Instead of blindly expanding 1-hop with uniform decay,
 * this traversal:
 * 1. Prioritizes edges by query intent (auth → middleware, DB → model, UI → render)
 * 2. Allows selective 2-hop traversal only for high-relevance first-hop nodes
 * 3. Uses dynamic decay based on edge type (calls=0.8, config=0.3)
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { ScoredCandidate } from './types.js';
import type { EdgeType, ExpandedQuery } from '../types.js';

// ── Edge Priority by Query Intent ──

type QueryIntent = 'auth' | 'data' | 'ui' | 'api' | 'general';

const INTENT_EDGE_PRIORITY: Record<QueryIntent, EdgeType[]> = {
  auth: ['calls', 'imports', 'uses'],
  data: ['uses', 'calls', 'imports'],
  ui: ['renders', 'contains', 'calls'],
  api: ['calls', 'imports', 'uses'],
  general: ['calls', 'imports', 'uses', 'contains'],
};

// ── Dynamic Decay by Edge Type ──

const EDGE_DECAY: Record<EdgeType, number> = {
  calls: 0.8,
  imports: 0.5,
  extends: 0.7,
  implements: 0.7,
  contains: 0.6,
  exports: 0.3,
  uses: 0.6,
  type_reference: 0.3,
  renders: 0.7,
};

// ── Config ──

const MAX_EXPAND = 20;
const MAX_NEIGHBORS_PER_EDGE = 4;
const TWO_HOP_THRESHOLD = 0.7; // Only 2-hop if first-hop node scores above this
const MAX_TWO_HOP_NODES = 3;
const SKIP_TYPES = new Set(['import', 'export']);

/**
 * Detect query intent from expanded query or raw text.
 */
export function detectQueryIntent(query: string, expanded?: ExpandedQuery): QueryIntent {
  const q = query.toLowerCase();
  const concepts = expanded?.concepts ?? [];

  if (concepts.includes('auth') || /\b(auth\w*|login|token|session|permission|jwt|middleware)\b/.test(q)) return 'auth';
  if (concepts.includes('database') || /\b(database|model|schema|query|table|migration|prisma)\b/.test(q)) return 'data';
  if (concepts.includes('ui') || /\b(component|render|page|layout|jsx|tsx|hook|form)\b/.test(q)) return 'ui';
  if (concepts.includes('api') || /\b(api|route|endpoint|handler|controller|request)\b/.test(q)) return 'api';

  return 'general';
}

/**
 * Smart graph expansion — query-aware, with dynamic decay and selective 2-hop.
 */
export function smartExpand(
  candidates: ScoredCandidate[],
  graph: KnowledgeGraph,
  query: string,
  expanded?: ExpandedQuery,
): ScoredCandidate[] {
  const start = Date.now();
  const intent = detectQueryIntent(query, expanded);
  const prioritizedEdges = INTENT_EDGE_PRIORITY[intent];

  // Sort by score descending, expand only top N
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const toExpand = sorted.slice(0, MAX_EXPAND);

  const existingIds = new Set(candidates.map((c) => c.id));
  const expandedCandidates: ScoredCandidate[] = [];
  const firstHopHighRelevance: ScoredCandidate[] = [];

  // First hop: prioritized edges
  for (const candidate of toExpand) {
    if (!candidate.node) continue;

    const edges = graph.getEdgesFor(candidate.id, 'both');
    const edgeCounts = new Map<string, number>();

    // Sort edges by priority for this intent
    const sortedEdges = [...edges].sort((a, b) => {
      const aIdx = prioritizedEdges.indexOf(a.type as EdgeType);
      const bIdx = prioritizedEdges.indexOf(b.type as EdgeType);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

    for (const edge of sortedEdges) {
      const edgeType = edge.type as EdgeType;
      const count = edgeCounts.get(edgeType) ?? 0;
      if (count >= MAX_NEIGHBORS_PER_EDGE) continue;

      const neighborId = edge.source === candidate.id ? edge.target : edge.source;
      if (existingIds.has(neighborId)) continue;

      const neighborNode = graph.getNode(neighborId);
      if (!neighborNode) continue;
      if (SKIP_TYPES.has(neighborNode.type)) continue;

      const decay = EDGE_DECAY[edgeType] ?? 0.5;
      const score = candidate.score * decay;

      edgeCounts.set(edgeType, count + 1);
      existingIds.add(neighborId);

      const newCandidate: ScoredCandidate = {
        id: neighborId,
        node: neighborNode,
        text: `${neighborNode.type} ${neighborNode.name} in ${neighborNode.filePath}:\n${neighborNode.content.slice(0, 500)}`,
        score,
        sources: ['graph-expansion'],
        type: 'code',
      };

      expandedCandidates.push(newCandidate);

      // Track high-relevance first-hop nodes for 2-hop expansion
      if (score >= TWO_HOP_THRESHOLD) {
        firstHopHighRelevance.push(newCandidate);
      }
    }
  }

  // Second hop: only for high-relevance first-hop nodes
  let twoHopCount = 0;
  for (const hop1 of firstHopHighRelevance) {
    if (twoHopCount >= MAX_TWO_HOP_NODES) break;
    if (!hop1.node) continue;

    const edges = graph.getEdgesFor(hop1.id, 'forward');

    for (const edge of edges) {
      if (twoHopCount >= MAX_TWO_HOP_NODES) break;

      const edgeType = edge.type as EdgeType;
      if (!prioritizedEdges.includes(edgeType)) continue;

      const neighborId = edge.target;
      if (existingIds.has(neighborId)) continue;

      const neighborNode = graph.getNode(neighborId);
      if (!neighborNode) continue;
      if (SKIP_TYPES.has(neighborNode.type)) continue;

      const decay = (EDGE_DECAY[edgeType] ?? 0.5) * 0.5; // Extra decay for 2-hop
      const score = hop1.score * decay;

      existingIds.add(neighborId);
      twoHopCount++;

      expandedCandidates.push({
        id: neighborId,
        node: neighborNode,
        text: `${neighborNode.type} ${neighborNode.name} in ${neighborNode.filePath}:\n${neighborNode.content.slice(0, 500)}`,
        score,
        sources: ['graph-expansion'],
        type: 'code',
      });
    }
  }

  log('query', 'Smart graph expansion complete', {
    intent,
    inputCandidates: candidates.length,
    expanded: expandedCandidates.length,
    twoHopExpanded: twoHopCount,
    total: candidates.length + expandedCandidates.length,
    ms: Date.now() - start,
  });

  return [...candidates, ...expandedCandidates];
}
