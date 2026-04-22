/**
 * Multi-signal similarity scoring.
 *
 * Combines 4 independent signals (TF-IDF cosine, import overlap,
 * signature shape, call-graph neighborhood) into a single weighted
 * score for better code-entity matching.
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { TFIDFIndex } from '../semantic/tfidf.js';
import type { CodeNode, CodeEdge } from '../types.js';

// ── Signal weights ──

const W_TFIDF = 0.40;
const W_IMPORT = 0.20;
const W_SIGNATURE = 0.20;
const W_CALL_GRAPH = 0.20;

// ── Public API ──

/**
 * Score the similarity between two nodes by combining 4 signals.
 * Returns a value in [0, 1].
 */
export function scorePair(
  nodeA: string,
  nodeB: string,
  graph: KnowledgeGraph,
  tfidfIndex?: TFIDFIndex | null,
): number {
  if (nodeA === nodeB) return 1;

  // Signal 1: TF-IDF cosine similarity
  const tfidfScore = tfidfIndex ? tfidfIndex.similarity(nodeA, nodeB) : 0;

  // Signal 2: Import overlap (Jaccard)
  const importsA = getImportedModules(nodeA, graph);
  const importsB = getImportedModules(nodeB, graph);
  const importScore = jaccardSimilarity(importsA, importsB);

  // Signal 3: Signature shape similarity
  const sigScore = signatureSimilarity(nodeA, nodeB, graph);

  // Signal 4: Call-graph neighborhood (Jaccard)
  const neighborsA = getCallNeighbors(nodeA, graph);
  const neighborsB = getCallNeighbors(nodeB, graph);
  const callGraphScore = jaccardSimilarity(neighborsA, neighborsB);

  const raw =
    W_TFIDF * tfidfScore +
    W_IMPORT * importScore +
    W_SIGNATURE * sigScore +
    W_CALL_GRAPH * callGraphScore;

  return Math.max(0, Math.min(1, raw));
}

/**
 * Find the most similar nodes to a given node.
 * Considers all functions, methods, and classes in the graph.
 */
export function findSimilar(
  nodeId: string,
  graph: KnowledgeGraph,
  tfidfIndex: TFIDFIndex | null,
  limit: number = 10,
): Array<{ id: string; score: number; name: string; file: string }> {
  // Gather candidate set: functions, methods, classes
  const candidates: CodeNode[] = [
    ...graph.findByType('function'),
    ...graph.findByType('method'),
    ...graph.findByType('class'),
  ];

  const results: Array<{ id: string; score: number; name: string; file: string }> = [];

  for (const candidate of candidates) {
    if (candidate.id === nodeId) continue;

    const score = scorePair(nodeId, candidate.id, graph, tfidfIndex);
    results.push({
      id: candidate.id,
      score,
      name: candidate.name,
      file: candidate.filePath,
    });
  }

  results.sort((a, b) => b.score - a.score);

  log('embed', 'Multi-signal similarity search', {
    nodeId,
    candidateCount: candidates.length,
    topScore: results[0]?.score ?? 0,
  });

  return results.slice(0, limit);
}

/**
 * Jaccard similarity between two string sets.
 * Returns |intersection| / |union|, or 0 if both sets are empty.
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersectionSize = 0;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;

  for (const item of smaller) {
    if (larger.has(item)) {
      intersectionSize++;
    }
  }

  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// ── Internal helpers ──

/**
 * Follow import edges from a node and return the set of imported module names.
 * Looks at forward edges of type 'imports' and collects the target node's
 * importSource metadata (the module specifier).
 */
function getImportedModules(nodeId: string, graph: KnowledgeGraph): Set<string> {
  const modules = new Set<string>();
  const edges = graph.getEdgesFor(nodeId, 'forward');

  for (const edge of edges) {
    if (edge.type === 'imports') {
      const targetNode = graph.getNode(edge.target);
      if (targetNode?.metadata.importSource) {
        modules.add(targetNode.metadata.importSource);
      } else if (targetNode) {
        // Fall back to the target node's file path as the module identifier
        modules.add(targetNode.filePath);
      }
    }
  }

  return modules;
}

/**
 * Get all callers and callees of a node from edges.
 * Returns a combined set of node IDs that are connected via
 * 'calls' or 'uses' edges in either direction.
 */
function getCallNeighbors(nodeId: string, graph: KnowledgeGraph): Set<string> {
  const neighbors = new Set<string>();
  const edges = graph.getEdgesFor(nodeId, 'both');

  for (const edge of edges) {
    if (edge.type === 'calls' || edge.type === 'uses') {
      const otherId = edge.source === nodeId ? edge.target : edge.source;
      neighbors.add(otherId);
    }
  }

  return neighbors;
}

/**
 * Compare the structural signature of two nodes.
 * Evaluates: parameter count, parameter names, async flag, return type.
 * Returns a score in [0, 1].
 */
function signatureSimilarity(
  nodeA: string,
  nodeB: string,
  graph: KnowledgeGraph,
): number {
  const a = graph.getNode(nodeA);
  const b = graph.getNode(nodeB);

  if (!a || !b) return 0;

  const metaA = a.metadata;
  const metaB = b.metadata;

  let matchCount = 0;
  let totalChecks = 0;

  // Check 1: Parameter count
  const paramsA = metaA.parameters ?? [];
  const paramsB = metaB.parameters ?? [];
  totalChecks++;
  if (paramsA.length === paramsB.length) {
    matchCount++;
  } else {
    // Partial credit for close parameter counts
    const maxLen = Math.max(paramsA.length, paramsB.length);
    if (maxLen > 0) {
      const minLen = Math.min(paramsA.length, paramsB.length);
      matchCount += minLen / maxLen;
    }
  }

  // Check 2: Parameter name overlap
  totalChecks++;
  if (paramsA.length > 0 && paramsB.length > 0) {
    const namesA = new Set(paramsA.map((p) => p.name));
    const namesB = new Set(paramsB.map((p) => p.name));
    matchCount += jaccardSimilarity(namesA, namesB);
  } else if (paramsA.length === 0 && paramsB.length === 0) {
    matchCount++; // Both have no params — they match
  }
  // else one has params and the other doesn't — 0 contribution

  // Check 3: Async flag
  totalChecks++;
  if ((metaA.async ?? false) === (metaB.async ?? false)) {
    matchCount++;
  }

  // Check 4: Return type
  totalChecks++;
  if (metaA.returnType && metaB.returnType) {
    if (metaA.returnType === metaB.returnType) {
      matchCount++;
    }
  } else if (!metaA.returnType && !metaB.returnType) {
    matchCount++; // Both unspecified — match
  }
  // else one specified, one not — 0 contribution

  return totalChecks === 0 ? 0 : matchCount / totalChecks;
}
