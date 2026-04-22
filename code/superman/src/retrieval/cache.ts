/**
 * Two-level caching for the retrieval pipeline.
 *
 * 1. Index cache (disk): serialized BM25 docs + local/OpenAI embeddings
 *    → saves full re-index cost on session restart
 *
 * 2. Query cache (in-memory LRU): caches final candidates for recent queries
 *    → avoids redundant retrieval for repeated/similar queries
 */

import fs from 'fs';
import path from 'path';
import { log, logError } from '../logger.js';
import { getOpenAIEmbeddingStore, clearOpenAIEmbeddingStore } from './candidate-generator.js';
import type { ScoredCandidate } from './types.js';

const CACHE_FILENAME = '.codevault-cache.json';
const MAX_QUERY_CACHE = 50;

// ── Index Cache (Disk) ──

interface IndexCacheData {
  version: 3;
  timestamp: number;
  fileMtimes: Record<string, number>;
  bm25Docs: Array<{ id: string; name: string; filePath: string; content: string }>;
  localEmbeddings: Array<{ id: string; embedding: number[] }>;
  openaiEmbeddings: Array<{ id: string; embedding: number[] }>;
}

/**
 * Save the current index state to disk.
 */
export function saveIndexCache(
  projectPath: string,
  bm25Docs: Array<{ id: string; name: string; filePath: string; content: string }>,
  fileMtimes: Record<string, number>,
): void {
  const cachePath = path.join(projectPath, CACHE_FILENAME);
  const openaiStore = getOpenAIEmbeddingStore();

  const data: IndexCacheData = {
    version: 3,
    timestamp: Date.now(),
    fileMtimes,
    bm25Docs,
    localEmbeddings: [...localEmbeddingStore.entries()].map(([id, embedding]) => ({ id, embedding })),
    openaiEmbeddings: [...openaiStore.entries()].map(([id, embedding]) => ({ id, embedding })),
  };

  try {
    fs.writeFileSync(cachePath, JSON.stringify(data), 'utf-8');
    log('cache', 'Index cache saved', {
      path: cachePath,
      bm25Docs: bm25Docs.length,
      localEmbeddings: localEmbeddingStore.size,
      openaiEmbeddings: openaiStore.size,
    });
  } catch (err) {
    logError('cache', 'Failed to save index cache', err);
  }
}

/**
 * Load index cache from disk. Returns null if cache is missing or stale.
 * Staleness: if any source file has a newer mtime than the cache records.
 */
export function loadIndexCache(
  projectPath: string,
  currentMtimes: Record<string, number>,
): {
  bm25Docs: Array<{ id: string; name: string; filePath: string; content: string }>;
  localEmbeddings: Array<{ id: string; embedding: number[] }>;
  openaiEmbeddings: Array<{ id: string; embedding: number[] }>;
} | null {
  const cachePath = path.join(projectPath, CACHE_FILENAME);

  try {
    if (!fs.existsSync(cachePath)) return null;

    const raw = fs.readFileSync(cachePath, 'utf-8');
    const data: IndexCacheData = JSON.parse(raw);

    if (data.version !== 3) {
      log('cache', 'Cache version mismatch, ignoring');
      return null;
    }

    // Check staleness: any file changed since cache was built?
    for (const [file, mtime] of Object.entries(currentMtimes)) {
      const cachedMtime = data.fileMtimes[file];
      if (!cachedMtime || mtime > cachedMtime) {
        log('cache', 'Cache stale — file changed', { file });
        return null;
      }
    }

    // Check for deleted files
    for (const file of Object.keys(data.fileMtimes)) {
      if (!(file in currentMtimes)) {
        log('cache', 'Cache stale — file deleted', { file });
        return null;
      }
    }

    log('cache', 'Index cache loaded', {
      bm25Docs: data.bm25Docs.length,
      localEmbeddings: data.localEmbeddings.length,
      openaiEmbeddings: data.openaiEmbeddings.length,
      age: `${Math.round((Date.now() - data.timestamp) / 1000)}s`,
    });

    return {
      bm25Docs: data.bm25Docs,
      localEmbeddings: data.localEmbeddings,
      openaiEmbeddings: data.openaiEmbeddings,
    };
  } catch (err) {
    logError('cache', 'Failed to load index cache', err);
    return null;
  }
}

// ── Local Embedding Store ──

/** In-memory store for local embeddings */
const localEmbeddingStore = new Map<string, number[]>();

export function getLocalEmbeddingStore(): Map<string, number[]> {
  return localEmbeddingStore;
}

export function clearLocalEmbeddingStore(): void {
  localEmbeddingStore.clear();
}

export function restoreLocalEmbeddings(
  embeddings: Array<{ id: string; embedding: number[] }>,
): void {
  localEmbeddingStore.clear();
  for (const { id, embedding } of embeddings) {
    localEmbeddingStore.set(id, embedding);
  }
  log('cache', 'Local embeddings restored from cache', { count: embeddings.length });
}

/**
 * Restore OpenAI embeddings from cache into the in-memory store.
 */
export function restoreOpenAIEmbeddings(
  embeddings: Array<{ id: string; embedding: number[] }>,
): void {
  const store = getOpenAIEmbeddingStore();
  clearOpenAIEmbeddingStore();
  for (const { id, embedding } of embeddings) {
    store.set(id, embedding);
  }
  log('cache', 'OpenAI embeddings restored from cache', { count: embeddings.length });
}

// ── Query Cache (In-Memory LRU) ──

interface QueryCacheEntry {
  candidates: ScoredCandidate[];
  timestamp: number;
}

const queryCache = new Map<string, QueryCacheEntry>();

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function getCachedQuery(query: string): ScoredCandidate[] | null {
  const key = normalizeQuery(query);
  const entry = queryCache.get(key);
  if (!entry) return null;

  log('cache', 'Query cache hit', { query: key });
  return entry.candidates;
}

export function setCachedQuery(query: string, candidates: ScoredCandidate[]): void {
  const key = normalizeQuery(query);

  // LRU eviction
  if (queryCache.size >= MAX_QUERY_CACHE) {
    // Remove oldest entry
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [k, v] of queryCache) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) queryCache.delete(oldestKey);
  }

  queryCache.set(key, { candidates, timestamp: Date.now() });
}

/**
 * Invalidate all query cache entries (call when index is rebuilt).
 */
export function invalidateQueryCache(): void {
  const size = queryCache.size;
  queryCache.clear();
  if (size > 0) {
    log('cache', 'Query cache invalidated', { evicted: size });
  }
}

/**
 * Clear all embedding caches (local + OpenAI + query).
 * Useful when switching embedding models or forcing a full re-embed.
 */
export function clearEmbeddingCache(): void {
  const localSize = localEmbeddingStore.size;
  const openaiStore = getOpenAIEmbeddingStore();
  const openaiSize = openaiStore.size;
  const querySize = queryCache.size;

  localEmbeddingStore.clear();
  openaiStore.clear();
  queryCache.clear();

  log('cache', 'All embedding caches cleared', {
    localEmbeddings: localSize,
    openaiEmbeddings: openaiSize,
    queryCache: querySize,
  });
}
