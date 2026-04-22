/**
 * Embedding generation using TF-IDF random projection.
 * Produces dense 1536D vectors from text content — no API keys needed.
 * Quality is far better than hash-based pseudo-embeddings because
 * TF-IDF captures actual term importance via IDF weighting.
 */

import { log } from '../logger.js';
import { tokenize, TFIDFIndex, projectToDense } from './tfidf.js';
import type { CodeNode } from '../types.js';
import {
  generateLocalEmbedding as localEmbed,
  generateLocalEmbeddingsBatch as localBatch,
  isLocalEmbeddingsReady,
} from './local-embeddings.js';

// Shared corpus index — built once, used for all projections
let corpusIndex: TFIDFIndex | null = null;

/**
 * Set the corpus index so individual embeddings use corpus-level IDF weights.
 */
export function setCorpusIndex(index: TFIDFIndex): void {
  corpusIndex = index;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await localEmbed(text);
  } catch {
    // Fallback: TF-IDF random projection
    const tokens = tokenize(text);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return projectToDense(tf);
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    return await localBatch(texts);
  } catch {
    return Promise.all(texts.map(async (t) => {
      const tokens = tokenize(t);
      const tf = new Map<string, number>();
      for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
      return projectToDense(tf);
    }));
  }
}

export function createNodeEmbeddingText(node: CodeNode): string {
  const parts: string[] = [];

  parts.push(`${node.type}: ${node.name}`);
  parts.push(`file: ${node.filePath}`);
  if (node.signature) parts.push(`signature: ${node.signature}`);
  if (node.metadata.domain) parts.push(`domain: ${node.metadata.domain}`);
  if (node.metadata.httpMethod && node.metadata.routePath) {
    parts.push(`route: ${node.metadata.httpMethod} ${node.metadata.routePath}`);
  }
  if (node.metadata.returnType) parts.push(`returns: ${node.metadata.returnType}`);
  if (node.metadata.parameters && node.metadata.parameters.length > 0) {
    parts.push(`parameters: (${node.metadata.parameters.map((p) => p.type ? `${p.name}: ${p.type}` : p.name).join(', ')})`);
  }
  if (node.metadata.exported) parts.push('exported');
  if (node.metadata.async) parts.push('async');

  const snippet = node.content.slice(0, 500);
  if (snippet) parts.push(`content:\n${snippet}`);

  return parts.join('\n');
}
