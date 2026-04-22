import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmbeddingCache,
  clearLocalEmbeddingStore,
  getLocalEmbeddingStore,
} from '../retrieval/cache';

describe('embedding-quality', () => {
  describe('clearEmbeddingCache', () => {
    it('clears all stores without throwing', () => {
      expect(() => clearEmbeddingCache()).not.toThrow();
    });

    it('empties the local embedding store', () => {
      const store = getLocalEmbeddingStore();
      store.set('test-node', [0.1, 0.2, 0.3]);
      expect(store.size).toBe(1);

      clearEmbeddingCache();
      expect(store.size).toBe(0);
    });
  });

  describe('clearLocalEmbeddingStore', () => {
    it('clears only local embeddings', () => {
      const store = getLocalEmbeddingStore();
      store.set('node-1', [0.1, 0.2]);
      store.set('node-2', [0.3, 0.4]);
      expect(store.size).toBe(2);

      clearLocalEmbeddingStore();
      expect(store.size).toBe(0);
    });
  });

  describe('embedding model config', () => {
    it('imports LOCAL_EMBEDDING_DIM correctly', async () => {
      const { LOCAL_EMBEDDING_DIM } = await import('../semantic/local-embeddings');
      expect([384, 768]).toContain(LOCAL_EMBEDDING_DIM);
    });

    it('exports getActiveModelName function', async () => {
      const { getActiveModelName } = await import('../semantic/local-embeddings');
      expect(typeof getActiveModelName).toBe('function');
      const name = getActiveModelName();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });
});
