# LCM Summary sum_56ffc92ef7f717a4

Created: 2026-03-25 17:57:19
Kind: leaf
Depth: 0
Conversation: 1272
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T23:47:32.000Z
Latest: 2026-03-24T23:49:50.000Z

## Content

[2026-03-24 23:47 UTC]
/**
 * Pattern Learner
 *
 * Implements pattern extraction, matching, and evolution for
 * continuous learning from agent experiences.
 *
 * Performance Targets:
 * - Pattern matching: <1ms
 * - Pattern extraction: <5ms
 * - Evolution step: <2ms
 */

import type {
  Pattern,
  PatternMatch,
  PatternEvolution,
  Trajectory,
  DistilledMemory,
  NeuralEvent,
  NeuralEventListener,
} from './types.js';

/**
 * Configuration for Pattern Learner
 */
export interface PatternLearnerConfig {
  /** Maximum number of patterns to store */
  maxPatterns: number;

  /** Similarity threshold for matching */
  matchThreshold: number;

  /** Minimum usages before pattern is stable */
  minUsagesForStable: number;

  /** Quality threshold for pattern inclusion */
  qualityThreshold: number;

  /** Enable pattern clustering */
  enableClustering: boolean;

  /** Number of clusters (if clustering enabled) */
  numClusters: number;

  /** Evolution learning rate */
  evolutionLearningRate: number;
}

/**
 * Default Pattern Learner configuration
 */
const DEFAULT_CONFIG: PatternLearnerConfig = {
  maxPatterns: 1000,
  matchThreshold: 0.7,
  minUsagesForStable: 5,
  qualityThreshold: 0.5,
  enableClustering: true,
  numClusters: 50,
  evolutionLearningRate: 0.1,
};

/**
 * Cluster representation for fast pattern lookup
 */
interface PatternCluster {
  clusterId: number;
  centroid: Float32Array;
  patternIds: Set<string>;
}

/**
 * Pattern Learner - Manages pattern extraction, matching, and evolution
 */
export class PatternLearner {
  private config: PatternLearnerConfig;
  private patterns: Map<string, Pattern> = new Map();
  private clusters: PatternCluster[] = [];
  private patternToCluster: Map<string, number> = new Map();

  // Performance tracking
  private matchCount = 0;
  private totalMatchTime = 0;
  private extractionCount = 0;
  private totalExtractionTime = 0;
  private evolutionCount = 0;
  private totalEvolutionTime = 0;

  // Event listeners
  private eventListeners: Set<NeuralEventListener> = new Set();

  constructor(config: Partial<PatternLearnerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Pattern Matching
  // ==========================================================================

  /**
   * Find matching patterns for a query embedding
   * Target: <1ms
   */
  findMatches(queryEmbedding: Float32Array, k: number = 3): PatternMatch[] {
    const startTime = performance.now();

    if (this.patterns.size === 0) {
      return [];
    }

    let candidates: Pattern[];

    // Use clustering for faster search if enabled and clusters exist
    if (this.config.enableClustering && this.clusters.length > 0) {
      candidates = this.getCandidatesFromClusters(queryEmbedding);
    } else {
      candidates = Array.from(this.patterns.values());
    }

    // Compute similarities
    const matches: PatternMatch[] = [];

    for (const pattern of candidates) {
      const similarity = this.cosineSimilarity(queryEmbedding, pattern.embedding);

      if (similarity >= this.config.matchThreshold) {
        matches.push({
          pattern,
          similarity,
          confidence: this.computeMatchConfidence(pattern, similarity),
          latencyMs: 0,
        });
      }
    }

    // Sort by similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    const result = matches.slice(0, k);

    // Track performance
    const elapsed = performance.now() - startTime;
    this.matchCount++;
    this.totalMatchTime += elapsed;

    // Warn if over target
    if (elapsed > 1) {
      console.warn(`Pattern matching exceeded target: ${elapsed.toFixed(2)}ms > 1ms`);
    }

    return result;
  }

  /**
   * Find best single match
   */
  findBestMatch(queryEmbedding: Float32Array): PatternMatch | null {
    const matches = this.findMatches(queryEmbedding, 1);
    return matches.length > 0 ? matches[0] : null;
  }

  // ==========================================================================
  // Pattern Extraction
  // ==========================================================================

  /**
   * Extract a pattern from a trajectory
   * Target: <5ms
   */
  extractPattern(trajectory: Trajectory, memory?: DistilledMemory): Pattern | null {
    const startTime = performance.now();

    // Validate trajectory
    if (!trajectory.isComplete || trajectory.qualityScore < this.config.qualityThreshold) {
      return null;
    }

    // Check for duplicates
    const embedding = this.computePatternEmbedding(trajectory);
    const existing = this.findSimilarPattern(embedding, 0.95);

    if (existing) {
      // Update existing pattern instead
      this.updatePatternFromTrajectory(e
[LCM fallback summary; truncated for context management]
