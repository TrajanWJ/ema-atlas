import { describe, it, expect } from 'vitest';
import {
  generateLocalEmbedding,
  generateLocalEmbeddingsBatch,
  isLocalEmbeddingsReady,
  LOCAL_EMBEDDING_DIM,
  getActiveModelName,
} from '../semantic/local-embeddings';

describe('local-embeddings', () => {
  it('exports a valid embedding dimension (384 or 768)', () => {
    // Before model load, default is 768 (code model)
    // After load, it may be 384 (fallback) or 768 (code model)
    expect([384, 768]).toContain(LOCAL_EMBEDDING_DIM);
  });

  it('generates a single embedding with correct dimension', async () => {
    const embedding = await generateLocalEmbedding('function authenticateUser(token)');
    expect(embedding).toHaveLength(LOCAL_EMBEDDING_DIM);
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 1);
  }, 60000);

  it('generates different embeddings for different texts', async () => {
    const [a, b] = await Promise.all([
      generateLocalEmbedding('authentication login token'),
      generateLocalEmbedding('database query postgresql'),
    ]);
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    expect(dot).toBeLessThan(0.9);
  }, 60000);

  it('generates batch embeddings', async () => {
    const texts = ['hello world', 'function test()', 'import express'];
    const embeddings = await generateLocalEmbeddingsBatch(texts);
    expect(embeddings).toHaveLength(3);
    expect(embeddings[0]).toHaveLength(LOCAL_EMBEDDING_DIM);
    expect(embeddings[1]).toHaveLength(LOCAL_EMBEDDING_DIM);
    expect(embeddings[2]).toHaveLength(LOCAL_EMBEDDING_DIM);
  }, 60000);

  it('reports readiness after first call', async () => {
    await generateLocalEmbedding('test');
    expect(isLocalEmbeddingsReady()).toBe(true);
  }, 60000);

  it('reports active model name', async () => {
    await generateLocalEmbedding('test');
    const modelName = getActiveModelName();
    expect(modelName).toBeTruthy();
    expect(typeof modelName).toBe('string');
  }, 60000);
});
