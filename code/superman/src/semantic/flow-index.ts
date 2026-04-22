/**
 * In-memory multi-layer vector index.
 *
 * Three layers:
 *   flow   — user-facing flows (login, assign carrier, deliver load)
 *   system — system behaviors (API calls, state changes, validations)
 *   code   — raw code nodes (functions, classes, files)
 *
 * No external DB required. Uses cosine similarity on pseudo-embeddings.
 */

import { generateEmbedding } from './embeddings.js';
import { log } from '../logger.js';
import type { IntentNode } from '../types.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import { getCallChain } from '../graph/traversal.js';

// ── Types ──

export type VectorType = 'flow' | 'system' | 'code';

export interface VectorEntry {
  id: string;
  type: VectorType;
  text: string;
  embedding: number[];
  metadata: {
    flowId?: string;
    level: number;
    file?: string;
    relatedEntities?: string[];
    linkedCode?: string[];
    title?: string;
    status?: string;
  };
}

export interface SearchResult {
  entry: VectorEntry;
  score: number;
}

// ── Index ──

class FlowVectorIndex {
  private entries: VectorEntry[] = [];

  clear(): void {
    this.entries = [];
  }

  add(entry: VectorEntry): void {
    this.entries.push(entry);
  }

  get size(): number {
    return this.entries.length;
  }

  /**
   * Search within a specific layer (or all layers).
   */
  search(queryEmbedding: number[], limit: number, typeFilter?: VectorType): SearchResult[] {
    const candidates = typeFilter
      ? this.entries.filter((e) => e.type === typeFilter)
      : this.entries;

    const scored: SearchResult[] = candidates.map((entry) => ({
      entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Get all entries of a specific type.
   */
  getByType(type: VectorType): VectorEntry[] {
    return this.entries.filter((e) => e.type === type);
  }

  getStats(): Record<VectorType, number> {
    const stats: Record<string, number> = { flow: 0, system: 0, code: 0 };
    for (const e of this.entries) stats[e.type]++;
    return stats as Record<VectorType, number>;
  }
}

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

// ── Singleton ──

export const flowIndex = new FlowVectorIndex();

// ── Index Builder ──

/**
 * Build the multi-layer vector index from the intent graph and code graph.
 */
export async function buildFlowIndex(
  intentNodes: IntentNode[],
  codeGraph: KnowledgeGraph,
): Promise<void> {
  log('embed', 'Building multi-layer flow index');
  flowIndex.clear();

  // ── Layer 1: Flow embeddings ──
  const flowNodes = intentNodes.filter((n) => n.type === 'flow');
  for (const flow of flowNodes) {
    // Build a rich description of the flow
    const children = intentNodes.filter((n) => n.parent === flow.id);
    const steps = children
      .filter((c) => c.type === 'action')
      .map((c) => c.title);

    const description = buildFlowDescription(flow, steps, codeGraph);
    const embedding = await generateEmbedding(description);

    // Collect related files from linked code
    const files = new Set<string>();
    const entities: string[] = [];
    for (const codeId of flow.linkedCode || []) {
      const node = codeGraph.getNode(codeId);
      if (node) {
        files.add(node.filePath);
        if (node.type === 'class' || node.type === 'interface') {
          entities.push(node.name);
        }
      }
    }

    flowIndex.add({
      id: flow.id,
      type: 'flow',
      text: description,
      embedding,
      metadata: {
        flowId: flow.id,
        level: flow.level,
        title: flow.title,
        status: flow.status,
        linkedCode: flow.linkedCode,
        relatedEntities: entities,
        file: [...files].join(', '),
      },
    });
  }

  // ── Layer 2: System/action embeddings ──
  const systemNodes = intentNodes.filter(
    (n) => n.type === 'action' || n.type === 'system',
  );
  for (const node of systemNodes) {
    const parentFlow = intentNodes.find((n) => n.id === node.parent && n.type === 'flow');
    const text = `${node.title}: ${node.description || ''} (part of ${parentFlow?.title || 'unknown flow'})`;
    const embedding = await generateEmbedding(text);

    flowIndex.add({
      id: node.id,
      type: 'system',
      text,
      embedding,
      metadata: {
        flowId: parentFlow?.id,
        level: node.level,
        title: node.title,
        status: node.status,
        linkedCode: node.linkedCode,
      },
    });
  }

  // ── Layer 3: Code embeddings (only important nodes) ──
  const codeTypes: Array<'function' | 'class' | 'route' | 'method'> = [
    'function', 'class', 'route', 'method',
  ];
  for (const type of codeTypes) {
    const nodes = codeGraph.findByType(type);
    for (const node of nodes.slice(0, 200)) { // cap for performance
      const text = `${node.type} ${node.name} in ${node.filePath}: ${node.content.slice(0, 300)}`;
      const embedding = await generateEmbedding(text);

      flowIndex.add({
        id: node.id,
        type: 'code',
        text,
        embedding,
        metadata: {
          level: 4,
          file: node.filePath,
          title: node.name,
        },
      });
    }
  }

  const stats = flowIndex.getStats();
  log('embed', 'Flow index built', stats as unknown as Record<string, unknown>);
}

// ── Flow Description Builder ──

function buildFlowDescription(
  flow: IntentNode,
  steps: string[],
  codeGraph?: KnowledgeGraph,
): string {
  const parts: string[] = [];

  parts.push(`User flow: ${flow.title}`);

  if (flow.description) {
    parts.push(flow.description);
  }

  if (steps.length > 0) {
    parts.push('User actions: ' + steps.join(', '));
  }

  // Enrich with content from linked code — function names, handler names, key terms
  if (codeGraph && flow.linkedCode && flow.linkedCode.length > 0) {
    const terms = new Set<string>();
    for (const codeId of flow.linkedCode.slice(0, 20)) {
      const node = codeGraph.getNode(codeId);
      if (!node) continue;
      // Add function/handler names as searchable terms
      terms.add(node.name);
      // Extract key domain words from content (first 500 chars)
      const content = node.content.slice(0, 500).toLowerCase();
      for (const word of ['load', 'carrier', 'ticket', 'dispatch', 'assign', 'book', 'deliver', 'offer', 'rate', 'route', 'shipment', 'driver', 'broker', 'pickup', 'status', 'track', 'template', 'automation', 'document', 'pod', 'ratecon', 'shift', 'queue', 'call', 'negotiate']) {
        if (content.includes(word)) terms.add(word);
      }
    }
    if (terms.size > 0) {
      parts.push('Related concepts: ' + [...terms].join(', '));
    }
  }

  parts.push(`Status: ${flow.status || 'unknown'}`);

  return parts.join('\n');
}
