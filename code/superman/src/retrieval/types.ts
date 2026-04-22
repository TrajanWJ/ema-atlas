/**
 * Shared types for the retrieval pipeline.
 */

import type { CodeNode, ExpandedQuery } from '../types.js';

export type RetrieverSource = 'bm25' | 'local-embeddings' | 'openai' | 'graph-expansion';

export interface ScoredCandidate {
  id: string;
  node?: CodeNode;
  text: string;
  score: number;
  sources: RetrieverSource[];
  /** Type from flow index layer (flow/system/code) or 'code' for graph nodes */
  type: 'flow' | 'system' | 'code';
}

export interface RetrievalOptions {
  /** Max final candidates after re-ranking (default: 15) */
  maxResults?: number;
  /** Skip OpenAI embeddings even if key is available */
  skipOpenAI?: boolean;
  /** Skip graph expansion */
  skipGraphExpansion?: boolean;
  /** Skip query decomposition */
  skipDecomposition?: boolean;
}

export interface PipelineResult {
  candidates: ScoredCandidate[];
  /** Sub-queries if decomposition was applied */
  subQueries: string[];
  /** Expanded query from query rewriter */
  expandedQuery?: ExpandedQuery;
  /** Timing info for debugging */
  timing: {
    decompose: number;
    candidateGen: number;
    graphExpansion: number;
    reranking: number;
    crossEncoder: number;
    total: number;
  };
}
