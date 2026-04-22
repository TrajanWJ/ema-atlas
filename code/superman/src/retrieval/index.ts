/**
 * Retrieval pipeline — public API.
 *
 * Usage:
 *   import { retrieve } from './retrieval/index.js';
 *   const result = await retrieve(question, graph, tfidfIndex);
 *   // result.candidates is ready for context assembly
 */

export { retrieve } from './pipeline.js';
export { generateCandidates, getOpenAIEmbeddingStore, clearOpenAIEmbeddingStore } from './candidate-generator.js';
export { expandGraph } from './graph-expander.js';
export { rerank } from './reranker.js';
export { decompose } from './decomposer.js';
export {
  saveIndexCache,
  loadIndexCache,
  restoreOpenAIEmbeddings,
  restoreLocalEmbeddings,
  getLocalEmbeddingStore,
  clearLocalEmbeddingStore,
  getCachedQuery,
  setCachedQuery,
  invalidateQueryCache,
} from './cache.js';
export type { ScoredCandidate, RetrieverSource, RetrievalOptions, PipelineResult } from './types.js';
