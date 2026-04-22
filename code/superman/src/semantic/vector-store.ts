import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import { log, logError } from '../logger.js';
import type { CodeNode } from '../types.js';

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({ url: config.qdrantUrl });
    log('embed', 'Qdrant client initialized', { url: config.qdrantUrl });
  }
  return client;
}

/**
 * Simple string hash that produces a positive integer suitable for Qdrant point IDs.
 * Uses FNV-1a 32-bit and coerces to unsigned.
 */
function stringHash(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) | 0; // FNV prime, keep 32-bit
  }
  return hash >>> 0; // unsigned
}

export async function initCollection(): Promise<void> {
  const qdrant = getClient();
  const collectionName = config.qdrantCollection;

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
      log('embed', `Created Qdrant collection "${collectionName}"`, {
        dimensions: 1536,
      });
    } else {
      log('embed', `Qdrant collection "${collectionName}" already exists`);
    }
  } catch (error) {
    logError('embed', 'Failed to initialize Qdrant collection', error);
    throw error;
  }
}

export async function upsertNodes(
  nodes: CodeNode[],
  embeddings: number[][],
): Promise<void> {
  if (nodes.length === 0) {
    return;
  }

  const qdrant = getClient();
  const collectionName = config.qdrantCollection;
  const batchSize = 100;

  try {
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batchNodes = nodes.slice(i, i + batchSize);
      const batchEmbeddings = embeddings.slice(i, i + batchSize);

      const points = batchNodes.map((node, idx) => ({
        id: stringHash(node.id),
        vector: batchEmbeddings[idx],
        payload: {
          id: node.id,
          type: node.type,
          name: node.name,
          filePath: node.filePath,
          language: node.language,
          content: node.content.slice(0, 1000),
          signature: node.signature ?? null,
          domain: node.metadata.domain ?? null,
          exported: node.metadata.exported ?? false,
        },
      }));

      await qdrant.upsert(collectionName, { points });

      log('embed', 'Upserted batch to Qdrant', {
        batch: Math.floor(i / batchSize) + 1,
        totalBatches: Math.ceil(nodes.length / batchSize),
        pointsInBatch: points.length,
      });
    }

    log('embed', 'Upsert complete', { totalNodes: nodes.length });
  } catch (error) {
    logError('embed', 'Failed to upsert nodes to Qdrant', error);
    throw error;
  }
}

export async function searchSimilar(
  embedding: number[],
  limit: number = 10,
  filter?: object,
): Promise<Array<{ id: string; score: number; payload: Record<string, unknown> }>> {
  const qdrant = getClient();
  const collectionName = config.qdrantCollection;

  try {
    const results = await qdrant.search(collectionName, {
      vector: embedding,
      limit,
      with_payload: true,
      ...(filter ? { filter } : {}),
    });

    log('embed', 'Vector search complete', { resultsCount: results.length, limit });

    return results.map((result) => ({
      id: (result.payload as Record<string, unknown>)?.id as string,
      score: result.score,
      payload: (result.payload as Record<string, unknown>) ?? {},
    }));
  } catch (error) {
    logError('embed', 'Vector search failed', error);
    throw error;
  }
}

export async function deleteByFile(filePath: string): Promise<void> {
  const qdrant = getClient();
  const collectionName = config.qdrantCollection;

  try {
    await qdrant.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'filePath',
            match: { value: filePath },
          },
        ],
      },
    });

    log('embed', 'Deleted points by file', { filePath });
  } catch (error) {
    logError('embed', 'Failed to delete points by file', error);
    throw error;
  }
}

export async function getCollectionInfo(): Promise<{ pointsCount: number }> {
  const qdrant = getClient();
  const collectionName = config.qdrantCollection;

  try {
    const info = await qdrant.getCollection(collectionName);
    const pointsCount =
      typeof info.points_count === 'number' ? info.points_count : 0;

    log('embed', 'Collection info retrieved', { pointsCount });
    return { pointsCount };
  } catch (error) {
    logError('embed', 'Failed to get collection info', error);
    throw error;
  }
}
