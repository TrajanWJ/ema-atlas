/**
 * TF-IDF Engine — real semantic search without API keys.
 *
 * Ported from Superman's similarity.js, adapted for TypeScript.
 * Tokenizes code-aware (camelCase, stopwords), builds sparse IDF-weighted
 * vectors, and supports cosine similarity search.
 */

import { log } from '../logger.js';

// ── Stopwords (JS/TS keywords + common noise) ──

const STOPWORDS = new Set([
  // JS
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
  'extends', 'super', 'import', 'export', 'default', 'from', 'require',
  'module', 'exports', 'async', 'await', 'try', 'catch', 'throw', 'finally',
  'typeof', 'instanceof', 'void', 'delete', 'in', 'of', 'with', 'yield',
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  // TS
  'type', 'interface', 'enum', 'readonly', 'abstract', 'implements',
  'declare', 'namespace', 'as', 'is', 'keyof', 'infer', 'extends',
  'override', 'satisfies', 'any', 'unknown', 'never', 'string', 'number',
  'boolean', 'object', 'symbol', 'bigint',
  // Common noise
  'the', 'a', 'an', 'and', 'or', 'not', 'be', 'to', 'of', 'it', 'that',
  'has', 'was', 'are', 'been', 'have', 'had', 'get', 'set', 'use',
]);

// ── Tokenizer ──

export function tokenize(text: string): string[] {
  // Strip string literals and comments
  let cleaned = text
    .replace(/\/\/[^\n]*/g, '')           // line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')     // block comments
    .replace(/'[^']*'/g, '')              // single-quoted strings
    .replace(/"[^"]*"/g, '')              // double-quoted strings
    .replace(/`[^`]*`/g, '');             // template literals

  // Split camelCase and snake_case
  cleaned = cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → camel Case
    .replace(/_/g, ' ');                    // snake_case → snake case

  // Extract words
  const words = cleaned.toLowerCase().match(/[a-z]{2,}/g) || [];

  // Remove stopwords
  return words.filter((w) => !STOPWORDS.has(w) && w.length > 1);
}

// ── TF-IDF Index ──

export class TFIDFIndex {
  private docs = new Map<string, Map<string, number>>(); // docId → term → tf-idf weight
  private idf = new Map<string, number>();                // term → idf
  private docCount = 0;

  /**
   * Build the index from a set of documents.
   */
  build(documents: Array<{ id: string; text: string }>): void {
    this.docs.clear();
    this.idf.clear();
    this.docCount = documents.length;

    if (documents.length === 0) return;

    // Compute document frequency per term
    const df = new Map<string, number>();
    const tokenized = new Map<string, string[]>();

    for (const doc of documents) {
      const tokens = tokenize(doc.text);
      tokenized.set(doc.id, tokens);

      const unique = new Set(tokens);
      for (const term of unique) {
        df.set(term, (df.get(term) || 0) + 1);
      }
    }

    // Compute IDF: log(N / df)
    for (const [term, count] of df) {
      this.idf.set(term, Math.log(this.docCount / count));
    }

    // Compute TF-IDF per document
    for (const doc of documents) {
      const tokens = tokenized.get(doc.id)!;
      const tf = new Map<string, number>();

      for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
      }

      const tfidf = new Map<string, number>();
      const maxTf = Math.max(...tf.values(), 1);

      for (const [term, count] of tf) {
        const normalizedTf = count / maxTf;
        const idfWeight = this.idf.get(term) || 0;
        tfidf.set(term, normalizedTf * idfWeight);
      }

      this.docs.set(doc.id, tfidf);
    }

    log('embed', `TF-IDF index built: ${documents.length} docs, ${this.idf.size} terms`);
  }

  /**
   * Query the index and return ranked results.
   */
  querySimilar(queryText: string, limit: number = 10): Array<{ id: string; score: number }> {
    const queryTokens = tokenize(queryText);
    if (queryTokens.length === 0) return [];

    // Build query TF-IDF vector
    const queryTf = new Map<string, number>();
    for (const t of queryTokens) queryTf.set(t, (queryTf.get(t) || 0) + 1);

    const maxTf = Math.max(...queryTf.values(), 1);
    const queryVec = new Map<string, number>();
    for (const [term, count] of queryTf) {
      const idf = this.idf.get(term) || 0;
      queryVec.set(term, (count / maxTf) * idf);
    }

    // Score each document
    const results: Array<{ id: string; score: number }> = [];
    for (const [docId, docVec] of this.docs) {
      const score = cosineSparse(queryVec, docVec);
      if (score > 0.01) {
        results.push({ id: docId, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Get the sparse vector for a document.
   */
  getVector(docId: string): Map<string, number> | undefined {
    return this.docs.get(docId);
  }

  /**
   * Pairwise similarity between two indexed documents.
   */
  similarity(idA: string, idB: string): number {
    const a = this.docs.get(idA);
    const b = this.docs.get(idB);
    if (!a || !b) return 0;
    return cosineSparse(a, b);
  }

  get size(): number {
    return this.docs.size;
  }

  get termCount(): number {
    return this.idf.size;
  }
}

// ── Sparse Cosine Similarity ──

export function cosineSparse(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  // Only iterate the smaller map
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];

  for (const [term, weight] of small) {
    const otherWeight = large.get(term);
    if (otherWeight !== undefined) {
      dot += weight * otherWeight;
    }
    magA += weight * weight;
  }

  for (const weight of large.values()) {
    magB += weight * weight;
  }

  // Need full magA if we used the small map
  if (a.size > b.size) {
    magA = 0;
    for (const w of a.values()) magA += w * w;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Project a sparse TF-IDF vector into a dense vector using seeded random projection.
 * This allows TF-IDF to be used anywhere that expects dense number[] embeddings.
 */
export function projectToDense(sparse: Map<string, number>, dim: number = 1536, seed: number = 42): number[] {
  const dense = new Array(dim).fill(0);

  for (const [term, weight] of sparse) {
    // Deterministic hash of term → random projection indices
    let h = seed;
    for (let i = 0; i < term.length; i++) {
      h = ((h << 5) - h + term.charCodeAt(i)) | 0;
    }

    // Project into multiple dimensions (3 per term for better coverage)
    for (let k = 0; k < 3; k++) {
      h = ((h * 1103515245 + 12345) | 0) >>> 0;
      const idx = h % dim;
      const sign = (h >> 16) & 1 ? 1 : -1;
      dense[idx] += weight * sign;
    }
  }

  // Normalize
  let mag = 0;
  for (let i = 0; i < dim; i++) mag += dense[i] * dense[i];
  mag = Math.sqrt(mag);
  if (mag > 0) {
    for (let i = 0; i < dim; i++) dense[i] /= mag;
  }

  return dense;
}
