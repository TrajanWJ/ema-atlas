/**
 * OpenAI embeddings — real dense vectors via text-embedding-3-small.
 *
 * Optional: only runs if OPENAI_API_KEY is set.
 * Batches 100 texts per API call to minimize latency and cost.
 */

import { log, logError } from '../logger.js';
import type { CodeNode } from '../types.js';
import { createNodeEmbeddingText } from './embeddings.js';

const MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 100;

let openaiKey: string | null = null;

/**
 * Check if OpenAI embeddings are available.
 */
export function isOpenAIAvailable(): boolean {
  if (openaiKey === null) {
    openaiKey = process.env.OPENAI_API_KEY ?? '';
  }
  return openaiKey.length > 0;
}

/**
 * Generate a single embedding for a text query.
 */
export async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  if (!isOpenAIAvailable()) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const response = await callEmbeddingAPI([text]);
  return response[0];
}

/**
 * Generate embeddings for multiple code nodes in batches.
 * Returns a Map of nodeId → embedding.
 */
export async function generateOpenAIEmbeddingsBatch(
  nodes: CodeNode[],
): Promise<Map<string, number[]>> {
  if (!isOpenAIAvailable()) {
    log('embed', 'OpenAI embeddings skipped — no API key');
    return new Map();
  }

  const results = new Map<string, number[]>();
  const texts: Array<{ id: string; text: string }> = nodes.map((node) => ({
    id: node.id,
    text: createNodeEmbeddingText(node),
  }));

  log('embed', `Generating OpenAI embeddings for ${texts.length} nodes (batch size: ${BATCH_SIZE})`);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((t) => t.text);

    try {
      const embeddings = await callEmbeddingAPI(batchTexts);

      for (let j = 0; j < batch.length; j++) {
        results.set(batch[j].id, embeddings[j]);
      }

      log('embed', 'OpenAI embedding batch complete', {
        batch: Math.floor(i / BATCH_SIZE) + 1,
        totalBatches: Math.ceil(texts.length / BATCH_SIZE),
        nodesInBatch: batch.length,
      });
    } catch (err) {
      logError('embed', `OpenAI embedding batch ${Math.floor(i / BATCH_SIZE) + 1} failed`, err);
      // Continue with remaining batches — partial results are fine
    }
  }

  log('embed', 'OpenAI embeddings complete', {
    requested: texts.length,
    generated: results.size,
  });

  return results;
}

// ── API Call ──

async function callEmbeddingAPI(texts: string[]): Promise<number[][]> {
  // Truncate texts to 8191 tokens (~32K chars as rough estimate)
  const truncated = texts.map((t) => t.slice(0, 30000));

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: truncated,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embedding API error ${response.status}: ${body}`);
  }

  const data = await response.json() as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  // Sort by index to maintain order
  const sorted = data.data.sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}
