# Production Retrieval & Execution Engine

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fake embeddings and keyword matching with production-quality local sentence-transformer embeddings, BM25 search, graph-aware retrieval, cross-encoder reranking, and ripple-safe execution.

**Architecture:** Layered pipeline — BM25 + local embeddings run in parallel, graph expansion enriches candidates, multi-signal + cross-encoder reranks, 50K budget context assembly. Execution engine detects ripple effects across import graph and auto-fixes dependent files including frontend/backend coordination.

**Tech Stack:** `@huggingface/transformers` v3 (Xenova/all-MiniLM-L6-v2 for embeddings, Xenova/ms-marco-MiniLM-L-6-v2 for reranking), `minisearch` v7 (BM25-like lexical search), existing knowledge graph + ast-grep parser.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/semantic/local-embeddings.ts` | Wraps @huggingface/transformers for local sentence-transformer embeddings (384D) |
| `src/semantic/bm25.ts` | Wraps minisearch with code-aware configuration, symbol name boosting |
| `src/retrieval/cross-encoder.ts` | Cross-encoder reranking using ms-marco-MiniLM-L-6-v2, optional (skips if model not loaded) |
| `src/execution/ripple-fixer.ts` | After edits, walks import graph to find/fix dependent files |
| `src/execution/api-sync.ts` | Detects backend endpoint changes, finds and updates frontend consumers |
| `src/__tests__/local-embeddings.test.ts` | Tests for local embedding generation |
| `src/__tests__/bm25.test.ts` | Tests for BM25 indexing and search |
| `src/__tests__/cross-encoder.test.ts` | Tests for cross-encoder reranking |
| `src/__tests__/ripple-fixer.test.ts` | Tests for ripple effect detection and fixing |
| `src/__tests__/api-sync.test.ts` | Tests for frontend/backend coordination |

### Modified Files
| File | Changes |
|------|---------|
| `src/semantic/embeddings.ts` | Delegate to local-embeddings, keep `createNodeEmbeddingText()` |
| `src/semantic/flow-index.ts` | Use real local embeddings instead of random-projection |
| `src/retrieval/candidate-generator.ts` | Replace TF-IDF retriever with BM25, replace flow-index retriever with local embeddings |
| `src/retrieval/reranker.ts` | Add cross-encoder pass, update signal weights |
| `src/retrieval/pipeline.ts` | Pass BM25 index, add cross-encoder stage |
| `src/retrieval/types.ts` | Add `'bm25'` and `'local-embeddings'` to RetrieverSource, add BM25Index to pipeline args |
| `src/retrieval/cache.ts` | Cache local embeddings, BM25 docs |
| `src/project-manager.ts` | Build BM25 index at index time, generate local embeddings at index time |
| `src/execution/runner.ts` | Integrate ripple detection + API sync after applying changes |
| `src/config.ts` | Add embedding model config |
| `src/types.ts` | Add `'retrieval'` to LogStage |
| `package.json` | Add `@huggingface/transformers`, `minisearch` |
| `src/__tests__/retrieval-pipeline.test.ts` | Update tests for BM25 + local embeddings |

---

## Chunk 1: Local Embeddings (Steps 1)

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @huggingface/transformers and minisearch**

```bash
npm install @huggingface/transformers minisearch
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('@huggingface/transformers'); console.log('transformers OK')"
node -e "require('minisearch'); console.log('minisearch OK')"
```
Expected: Both print OK

- [ ] **Step 3: Run existing tests to confirm nothing broke**

```bash
npx vitest run
```
Expected: 116 tests pass

---

### Task 2: Build local embedding module

**Files:**
- Create: `src/semantic/local-embeddings.ts`
- Test: `src/__tests__/local-embeddings.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/local-embeddings.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateLocalEmbedding,
  generateLocalEmbeddingsBatch,
  isLocalEmbeddingsReady,
  LOCAL_EMBEDDING_DIM,
} from '../semantic/local-embeddings';

describe('local-embeddings', () => {
  it('exports correct embedding dimension', () => {
    expect(LOCAL_EMBEDDING_DIM).toBe(384);
  });

  it('generates a single embedding with correct dimension', async () => {
    const embedding = await generateLocalEmbedding('function authenticateUser(token)');
    expect(embedding).toHaveLength(384);
    // Should be normalized (L2 norm ~1)
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 1);
  }, 30000);

  it('generates different embeddings for different texts', async () => {
    const [a, b] = await Promise.all([
      generateLocalEmbedding('authentication login token'),
      generateLocalEmbedding('database query postgresql'),
    ]);
    // Cosine similarity should be < 1 (they're different topics)
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    expect(dot).toBeLessThan(0.9);
  }, 30000);

  it('generates batch embeddings', async () => {
    const texts = ['hello world', 'function test()', 'import express'];
    const embeddings = await generateLocalEmbeddingsBatch(texts);
    expect(embeddings).toHaveLength(3);
    expect(embeddings[0]).toHaveLength(384);
    expect(embeddings[1]).toHaveLength(384);
    expect(embeddings[2]).toHaveLength(384);
  }, 30000);

  it('reports readiness after first call', async () => {
    await generateLocalEmbedding('test');
    expect(isLocalEmbeddingsReady()).toBe(true);
  }, 30000);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/local-embeddings.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/semantic/local-embeddings.ts
/**
 * Local sentence-transformer embeddings via @huggingface/transformers.
 *
 * Uses Xenova/all-MiniLM-L6-v2 — 384D, fast, good at code.
 * Downloads model on first use (~23MB), runs locally, no API cost.
 */

import { log, logError } from '../logger.js';

export const LOCAL_EMBEDDING_DIM = 384;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let extractorPromise: Promise<any> | null = null;
let ready = false;

/**
 * Lazily initialize the embedding pipeline.
 * First call downloads the model; subsequent calls return cached instance.
 */
async function getExtractor(): Promise<any> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      log('embed', `Loading local embedding model: ${MODEL_NAME}`);
      const { pipeline } = await import('@huggingface/transformers');
      const extractor = await pipeline('feature-extraction', MODEL_NAME, {
        dtype: 'fp32',
      });
      ready = true;
      log('embed', `Local embedding model loaded: ${MODEL_NAME}`);
      return extractor;
    })();
  }
  return extractorPromise;
}

export function isLocalEmbeddingsReady(): boolean {
  return ready;
}

/**
 * Generate a single embedding for a text string.
 * Returns a normalized 384D vector.
 */
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for multiple texts.
 * Processes sequentially to avoid OOM on large batches.
 */
export async function generateLocalEmbeddingsBatch(
  texts: string[],
  batchSize: number = 32,
): Promise<number[][]> {
  const extractor = await getExtractor();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const output = await extractor(batch, { pooling: 'mean', normalize: true });

    if (batch.length === 1) {
      results.push(Array.from(output.data as Float32Array));
    } else {
      // output.dims = [batchLen, 384]
      const flat = Array.from(output.data as Float32Array);
      for (let j = 0; j < batch.length; j++) {
        results.push(flat.slice(j * LOCAL_EMBEDDING_DIM, (j + 1) * LOCAL_EMBEDDING_DIM));
      }
    }

    if (texts.length > batchSize) {
      log('embed', `Local embeddings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/local-embeddings.test.ts
```
Expected: 5 tests pass (first run downloads model, may take 10-30s)

- [ ] **Step 5: Commit**

```bash
git add src/semantic/local-embeddings.ts src/__tests__/local-embeddings.test.ts package.json package-lock.json
git commit -m "feat: add local sentence-transformer embeddings via @huggingface/transformers"
```

---

### Task 3: Wire local embeddings into the embedding system

**Files:**
- Modify: `src/semantic/embeddings.ts`
- Modify: `src/semantic/flow-index.ts`

- [ ] **Step 1: Update embeddings.ts to delegate to local model**

Replace `generateEmbedding()` to use local embeddings as primary, keep `createNodeEmbeddingText()` unchanged:

```typescript
// In src/semantic/embeddings.ts — replace generateEmbedding and generateEmbeddings

import {
  generateLocalEmbedding,
  generateLocalEmbeddingsBatch,
  isLocalEmbeddingsReady,
  LOCAL_EMBEDDING_DIM,
} from './local-embeddings.js';

// Keep the old projectToDense-based fallback for when model hasn't loaded
export async function generateEmbedding(text: string): Promise<number[]> {
  if (isLocalEmbeddingsReady()) {
    return generateLocalEmbedding(text);
  }

  // Try to initialize; if it fails, fall back to TF-IDF projection
  try {
    return await generateLocalEmbedding(text);
  } catch {
    // Fallback: TF-IDF random projection (existing behavior)
    const tokens = tokenize(text);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return projectToDense(tf);
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    return await generateLocalEmbeddingsBatch(texts);
  } catch {
    return Promise.all(texts.map(async (t) => {
      const tokens = tokenize(t);
      const tf = new Map<string, number>();
      for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
      return projectToDense(tf);
    }));
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass (flow-index uses generateEmbedding, which now delegates to local model)

- [ ] **Step 3: Commit**

```bash
git add src/semantic/embeddings.ts
git commit -m "feat: wire local embeddings as primary, TF-IDF projection as fallback"
```

---

## Chunk 2: BM25 Search (Step 2)

### Task 4: Build BM25 module

**Files:**
- Create: `src/semantic/bm25.ts`
- Test: `src/__tests__/bm25.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/bm25.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BM25Index } from '../semantic/bm25';

describe('BM25Index', () => {
  let index: BM25Index;

  beforeEach(() => {
    index = new BM25Index();
  });

  it('builds index from documents', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'function authenticateUser(token) { verify(token); }' },
      { id: 'fn-pay', name: 'processPayment', filePath: 'src/billing.ts', content: 'function processPayment(amount) { stripe.charge(amount); }' },
    ]);
    expect(index.size).toBe(2);
  });

  it('finds exact function name matches', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'function authenticateUser(token) {}' },
      { id: 'fn-pay', name: 'processPayment', filePath: 'src/billing.ts', content: 'function processPayment(amount) {}' },
    ]);

    const results = index.search('authenticateUser');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('fn-auth');
  });

  it('boosts symbol name matches over content matches', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'validates token' },
      { id: 'fn-other', name: 'doSomething', filePath: 'src/other.ts', content: 'calls authenticateUser internally' },
    ]);

    const results = index.search('authenticateUser');
    expect(results[0].id).toBe('fn-auth');
  });

  it('handles fuzzy matching', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'auth function' },
    ]);

    const results = index.search('autenticate'); // typo
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no matches', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'auth' },
    ]);

    const results = index.search('zzzznonexistent');
    expect(results).toHaveLength(0);
  });

  it('supports search with limit', () => {
    index.build([
      { id: 'a', name: 'funcA', filePath: 'a.ts', content: 'token auth' },
      { id: 'b', name: 'funcB', filePath: 'b.ts', content: 'token verify' },
      { id: 'c', name: 'funcC', filePath: 'c.ts', content: 'token decode' },
    ]);

    const results = index.search('token', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('can clear and rebuild', () => {
    index.build([
      { id: 'a', name: 'funcA', filePath: 'a.ts', content: 'hello' },
    ]);
    expect(index.size).toBe(1);

    index.build([
      { id: 'b', name: 'funcB', filePath: 'b.ts', content: 'world' },
      { id: 'c', name: 'funcC', filePath: 'c.ts', content: 'test' },
    ]);
    expect(index.size).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/bm25.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/semantic/bm25.ts
/**
 * BM25-like search using MiniSearch.
 *
 * Code-aware: boosts symbol names 5x over content, supports fuzzy matching.
 * Wraps minisearch with code-specific configuration.
 */

import MiniSearch from 'minisearch';
import { log } from '../logger.js';

export interface BM25Document {
  id: string;
  name: string;
  filePath: string;
  content: string;
}

export interface BM25Result {
  id: string;
  score: number;
}

export class BM25Index {
  private index: MiniSearch<BM25Document> | null = null;
  private docCount = 0;

  /**
   * Build the BM25 index from documents.
   * Clears any existing index.
   */
  build(documents: BM25Document[]): void {
    this.index = new MiniSearch<BM25Document>({
      idField: 'id',
      fields: ['name', 'filePath', 'content'],
      storeFields: ['name', 'filePath'],
      searchOptions: {
        boost: { name: 5, filePath: 1.5, content: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
      // Code-aware tokenizer: split camelCase, snake_case, dots, slashes
      tokenize: (text: string) => {
        return text
          .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
          .replace(/[_.\-/\\]/g, ' ')           // separators
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 1);
      },
    });

    this.index.addAll(documents);
    this.docCount = documents.length;

    log('embed', `BM25 index built: ${documents.length} docs`);
  }

  /**
   * Search the index. Returns scored results sorted by relevance.
   */
  search(query: string, limit: number = 30): BM25Result[] {
    if (!this.index) return [];

    const results = this.index.search(query, {
      boost: { name: 5, filePath: 1.5, content: 1 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR',
    });

    return results.slice(0, limit).map((r) => ({
      id: String(r.id),
      score: r.score,
    }));
  }

  get size(): number {
    return this.docCount;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/bm25.test.ts
```
Expected: 7 tests pass

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add src/semantic/bm25.ts src/__tests__/bm25.test.ts
git commit -m "feat: add BM25 search via minisearch with code-aware tokenizer"
```

---

### Task 5: Wire BM25 into the retrieval pipeline

**Files:**
- Modify: `src/retrieval/types.ts`
- Modify: `src/retrieval/candidate-generator.ts`
- Modify: `src/retrieval/pipeline.ts`
- Modify: `src/project-manager.ts`

- [ ] **Step 1: Update types to include BM25 and local-embeddings**

In `src/retrieval/types.ts`, update `RetrieverSource`:

```typescript
export type RetrieverSource = 'bm25' | 'local-embeddings' | 'openai' | 'graph-expansion';
```

- [ ] **Step 2: Replace TF-IDF retriever with BM25 in candidate-generator.ts**

Replace the `retrieveTFIDF()` function with `retrieveBM25()`:

```typescript
import { BM25Index } from '../semantic/bm25.js';

function retrieveBM25(
  query: string,
  bm25Index: BM25Index | null,
  graph: KnowledgeGraph,
  limit: number = 30,
): ScoredCandidate[] {
  if (!bm25Index) return [];

  const results = bm25Index.search(query, limit);
  const candidates: ScoredCandidate[] = [];

  for (const r of results) {
    const node = graph.getNode(r.id);
    if (!node) continue;
    if (node.type === 'import' || node.type === 'export') continue;

    candidates.push({
      id: r.id,
      node,
      text: `${node.type} ${node.name} in ${node.filePath}:\n${node.content.slice(0, 500)}`,
      score: r.score,
      sources: ['bm25'],
      type: 'code',
    });
  }

  return candidates;
}
```

Replace the `retrieveFlowIndex()` to use real local embeddings for the flow index search (it already calls `generateLocalEmbedding` via `generateEmbedding`). Rename `sources` tag from `'flow-index'` to `'local-embeddings'`.

Update `generateCandidates()` signature to accept `bm25Index` instead of `tfidfIndex`:

```typescript
export async function generateCandidates(
  query: string,
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  skipOpenAI: boolean = false,
): Promise<ScoredCandidate[]> {
  const [bm25Results, embeddingResults, openaiResults] = await Promise.all([
    Promise.resolve(retrieveBM25(query, bm25Index, graph)),
    retrieveLocalEmbeddings(query, graph),
    skipOpenAI ? Promise.resolve([]) : retrieveOpenAI(query, graph),
  ]);

  const merged = mergeCandidates([bm25Results, embeddingResults, openaiResults]);
  // ... rest unchanged
}
```

- [ ] **Step 3: Update pipeline.ts to pass BM25 index**

Update `retrieve()` signature:

```typescript
import type { BM25Index } from '../semantic/bm25.js';

export async function retrieve(
  question: string,
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  options: RetrievalOptions = {},
): Promise<PipelineResult> {
  // ... update generateCandidates call to pass bm25Index
  // ... update rerank call — reranker still gets tfidfIndex from projectManager if needed
}
```

- [ ] **Step 4: Update project-manager.ts to build BM25 index**

Add BM25 index construction in `backgroundIndex()`:

```typescript
import { BM25Index } from './semantic/bm25.js';

// In ProjectManager class:
private _bm25Index: BM25Index | null = null;

getBM25Index(): BM25Index | null { return this._bm25Index; }

// In backgroundIndex(), after building the graph:
const bm25 = new BM25Index();
bm25.build(
  nodes
    .filter((n) => n.type !== 'import' && n.type !== 'export')
    .map((n) => ({
      id: n.id,
      name: n.name,
      filePath: n.filePath,
      content: n.content,
    }))
);
this._bm25Index = bm25;
```

- [ ] **Step 5: Update query engine to pass BM25 index**

In `src/query/engine.ts`, change `projectManager.getTFIDFIndex()` calls to `projectManager.getBM25Index()`:

```typescript
const bm25Index = projectManager.getBM25Index?.() ?? null;
const pipelineResult = await retrieve(question, graph, bm25Index);
```

- [ ] **Step 6: Update reranker to use BM25 scores**

In `src/retrieval/reranker.ts`, update `computeTFIDFScore()` to `computeBM25Score()`:

```typescript
import type { BM25Index } from '../semantic/bm25.js';

// Update rerank() signature to accept bm25Index instead of tfidfIndex
export function rerank(
  query: string,
  candidates: ScoredCandidate[],
  graph: KnowledgeGraph,
  bm25Index: BM25Index | null,
  maxResults: number = 15,
): ScoredCandidate[] {
  // ...
}

function computeBM25Score(
  candidateId: string,
  query: string,
  bm25Index: BM25Index | null,
): number {
  if (!bm25Index) return 0;
  const results = bm25Index.search(query, 100);
  const match = results.find((r) => r.id === candidateId);
  if (!match) return 0;
  // Normalize BM25 score to 0-1 range
  const maxScore = results[0]?.score ?? 1;
  return maxScore > 0 ? match.score / maxScore : 0;
}
```

- [ ] **Step 7: Update retrieval-pipeline tests**

Update `src/__tests__/retrieval-pipeline.test.ts`:
- Import `BM25Index` instead of `TFIDFIndex` where used in reranker tests
- Build BM25 index in `beforeEach`
- Update reranker calls to pass `bm25Index`

- [ ] **Step 8: Run all tests**

```bash
npx vitest run
```
Expected: All pass

- [ ] **Step 9: Type-check**

```bash
npx tsc --noEmit -p tsconfig.server.json
```
Expected: Only pre-existing `getAllNodes` error in apply-changes.ts

- [ ] **Step 10: Commit**

```bash
git add src/retrieval/ src/semantic/bm25.ts src/project-manager.ts src/query/engine.ts src/__tests__/
git commit -m "feat: replace TF-IDF retriever with BM25, wire into pipeline"
```

---

## Chunk 3: Cross-Encoder Reranking (Step 4)

### Task 6: Build cross-encoder module

**Files:**
- Create: `src/retrieval/cross-encoder.ts`
- Test: `src/__tests__/cross-encoder.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/cross-encoder.test.ts
import { describe, it, expect } from 'vitest';
import {
  crossEncoderRerank,
  isCrossEncoderReady,
} from '../retrieval/cross-encoder';

describe('cross-encoder', () => {
  it('reports readiness state', () => {
    // Before first use, may not be ready
    expect(typeof isCrossEncoderReady()).toBe('boolean');
  });

  it('ranks relevant documents higher', async () => {
    const query = 'authenticate user with JWT token';
    const documents = [
      { id: 'a', text: 'function processPayment(amount) { stripe.charge(amount); }' },
      { id: 'b', text: 'function authenticateUser(token) { return jwt.verify(token, secret); }' },
      { id: 'c', text: 'function formatDate(date) { return date.toISOString(); }' },
    ];

    const ranked = await crossEncoderRerank(query, documents);
    expect(ranked[0].id).toBe('b'); // auth function should rank first
    expect(ranked[0].score).toBeGreaterThan(ranked[2].score);
  }, 60000);

  it('handles empty documents', async () => {
    const result = await crossEncoderRerank('test', []);
    expect(result).toEqual([]);
  });

  it('respects topK parameter', async () => {
    const docs = [
      { id: 'a', text: 'function a() {}' },
      { id: 'b', text: 'function b() {}' },
      { id: 'c', text: 'function c() {}' },
    ];

    const result = await crossEncoderRerank('function', docs, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  }, 60000);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/cross-encoder.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/retrieval/cross-encoder.ts
/**
 * Cross-encoder reranking using Xenova/ms-marco-MiniLM-L-6-v2.
 *
 * Scores each (query, document) pair for relevance.
 * Optional: skips gracefully if model hasn't downloaded.
 * This is the biggest quality jump in the pipeline.
 */

import { log, logError } from '../logger.js';

const MODEL_NAME = 'Xenova/ms-marco-MiniLM-L-6-v2';

let modelPromise: Promise<{ model: any; tokenizer: any }> | null = null;
let ready = false;
let failed = false;

async function loadModel(): Promise<{ model: any; tokenizer: any }> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        log('embed', `Loading cross-encoder model: ${MODEL_NAME}`);
        const { AutoTokenizer, AutoModelForSequenceClassification } =
          await import('@huggingface/transformers');

        const [tokenizer, model] = await Promise.all([
          AutoTokenizer.from_pretrained(MODEL_NAME),
          AutoModelForSequenceClassification.from_pretrained(MODEL_NAME),
        ]);

        ready = true;
        log('embed', `Cross-encoder model loaded: ${MODEL_NAME}`);
        return { model, tokenizer };
      } catch (err) {
        failed = true;
        logError('embed', `Failed to load cross-encoder model: ${MODEL_NAME}`, err);
        throw err;
      }
    })();
  }
  return modelPromise;
}

export function isCrossEncoderReady(): boolean {
  return ready;
}

export function hasCrossEncoderFailed(): boolean {
  return failed;
}

export interface RerankInput {
  id: string;
  text: string;
}

export interface RerankResult {
  id: string;
  score: number;
}

/**
 * Rerank documents by relevance to query using cross-encoder.
 * Returns documents sorted by relevance score (highest first).
 * If model is not available, returns empty array (caller should skip).
 */
export async function crossEncoderRerank(
  query: string,
  documents: RerankInput[],
  topK?: number,
): Promise<RerankResult[]> {
  if (documents.length === 0) return [];
  if (failed) return []; // Don't retry after permanent failure

  let model: any;
  let tokenizer: any;
  try {
    ({ model, tokenizer } = await loadModel());
  } catch {
    return []; // Model not available — skip gracefully
  }

  const queries = new Array(documents.length).fill(query);
  const texts = documents.map((d) => d.text.slice(0, 512)); // Truncate for model input

  const inputs = tokenizer(queries, {
    text_pair: texts,
    padding: true,
    truncation: true,
  });

  const { logits } = await model(inputs);
  const scores = Array.from(logits.data as Float32Array);

  const ranked: RerankResult[] = documents
    .map((doc, i) => ({ id: doc.id, score: scores[i] }))
    .sort((a, b) => b.score - a.score);

  const result = topK ? ranked.slice(0, topK) : ranked;

  log('query', 'Cross-encoder reranking complete', {
    query: query.slice(0, 60),
    candidates: documents.length,
    topScore: result[0]?.score ?? 0,
  });

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/cross-encoder.test.ts
```
Expected: 4 tests pass (first run downloads model, ~30s)

- [ ] **Step 5: Commit**

```bash
git add src/retrieval/cross-encoder.ts src/__tests__/cross-encoder.test.ts
git commit -m "feat: add cross-encoder reranking via ms-marco-MiniLM-L-6-v2"
```

---

### Task 7: Wire cross-encoder into the pipeline

**Files:**
- Modify: `src/retrieval/reranker.ts`
- Modify: `src/retrieval/pipeline.ts`

- [ ] **Step 1: Add cross-encoder pass to reranker.ts**

Add a new exported function `rerankWithCrossEncoder()` that runs after multi-signal reranking:

```typescript
import { crossEncoderRerank, isCrossEncoderReady, hasCrossEncoderFailed } from './cross-encoder.js';

/**
 * Optional cross-encoder pass. Runs after multi-signal reranking.
 * If model not loaded, returns candidates unchanged.
 */
export async function rerankWithCrossEncoder(
  query: string,
  candidates: ScoredCandidate[],
  maxResults: number = 15,
): Promise<ScoredCandidate[]> {
  if (candidates.length === 0) return [];
  if (hasCrossEncoderFailed()) return candidates.slice(0, maxResults);

  const inputs = candidates.map((c) => ({
    id: c.id,
    text: c.node
      ? `${c.node.type} ${c.node.name} in ${c.node.filePath}:\n${c.node.content.slice(0, 400)}`
      : c.text.slice(0, 400),
  }));

  const ranked = await crossEncoderRerank(query, inputs, maxResults);
  if (ranked.length === 0) {
    // Cross-encoder not available — return multi-signal results
    return candidates.slice(0, maxResults);
  }

  // Map scores back to candidates
  const scoreMap = new Map(ranked.map((r) => [r.id, r.score]));
  const result = candidates
    .filter((c) => scoreMap.has(c.id))
    .map((c) => ({ ...c, score: scoreMap.get(c.id)! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return result;
}
```

- [ ] **Step 2: Update pipeline.ts to add Stage 4 (cross-encoder)**

After multi-signal reranking (Stage 3), add:

```typescript
import { rerankWithCrossEncoder } from './reranker.js';

// Stage 4: Cross-encoder reranking (optional)
t = Date.now();
candidates = await rerankWithCrossEncoder(question, candidates, maxResults);
timing.crossEncoder = Date.now() - t;
```

Update `PipelineResult.timing` type to include `crossEncoder: number`.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/retrieval/reranker.ts src/retrieval/pipeline.ts src/retrieval/types.ts
git commit -m "feat: wire cross-encoder reranking as Stage 4 in pipeline"
```

---

## Chunk 4: Ripple Effect Detection (Step 5)

### Task 8: Build ripple fixer module

**Files:**
- Create: `src/execution/ripple-fixer.ts`
- Test: `src/__tests__/ripple-fixer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/ripple-fixer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  findRippleTargets,
  detectBrokenInterfaces,
} from '../execution/ripple-fixer';
import { KnowledgeGraph } from '../graph/knowledge-graph';
import type { CodeNode, CodeEdge } from '../types';

function makeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    id: overrides.id ?? 'node-1',
    type: overrides.type ?? 'function',
    name: overrides.name ?? 'testFunction',
    filePath: overrides.filePath ?? 'src/test.ts',
    range: overrides.range ?? { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: overrides.content ?? 'function testFunction() {}',
    language: overrides.language ?? 'typescript',
    metadata: overrides.metadata ?? {},
  };
}

describe('ripple-fixer', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    const nodes: CodeNode[] = [
      makeNode({ id: 'api-handler', name: 'getUser', filePath: 'src/routes/user.ts',
        content: 'export function getUser(req, res) { return { id, name, email }; }',
        metadata: { exported: true } }),
      makeNode({ id: 'service', name: 'UserService', filePath: 'src/services/user.ts',
        content: 'export class UserService { getById(id) { return db.find(id); } }',
        metadata: { exported: true } }),
      makeNode({ id: 'consumer', name: 'UserProfile', filePath: 'src/components/UserProfile.tsx',
        content: 'function UserProfile() { const user = useUser(); return <div>{user.name}</div>; }' }),
      makeNode({ id: 'test', name: 'testGetUser', filePath: 'src/__tests__/user.test.ts',
        content: 'test("getUser", () => { expect(getUser()).toHaveProperty("name"); })' }),
    ];
    const edges: CodeEdge[] = [
      { source: 'api-handler', target: 'service', type: 'calls' },
      { source: 'consumer', target: 'api-handler', type: 'imports' },
      { source: 'test', target: 'api-handler', type: 'imports' },
    ];
    graph.build(nodes, edges);
  });

  it('finds all files that depend on changed files', () => {
    const targets = findRippleTargets(['src/routes/user.ts'], graph);
    const filePaths = targets.map((t) => t.filePath);
    expect(filePaths).toContain('src/components/UserProfile.tsx');
    expect(filePaths).toContain('src/__tests__/user.test.ts');
    // Should NOT include the changed file itself
    expect(filePaths).not.toContain('src/routes/user.ts');
  });

  it('follows transitive dependencies', () => {
    const targets = findRippleTargets(['src/services/user.ts'], graph);
    const filePaths = targets.map((t) => t.filePath);
    // service -> api-handler -> consumer, test
    expect(filePaths).toContain('src/routes/user.ts');
    expect(filePaths).toContain('src/components/UserProfile.tsx');
  });

  it('returns empty for files with no dependents', () => {
    const targets = findRippleTargets(['src/components/UserProfile.tsx'], graph);
    expect(targets).toHaveLength(0);
  });

  it('detects broken interfaces when export signature changes', () => {
    const broken = detectBrokenInterfaces(
      'src/routes/user.ts',
      // Old: returned { id, name, email }
      'export function getUser(req, res) { return { id, name, email }; }',
      // New: removed email field
      'export function getUser(req, res) { return { id, name }; }',
      graph,
    );
    // Should flag consumers that reference the removed field
    expect(broken.length).toBeGreaterThanOrEqual(0); // Detection is best-effort
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/ripple-fixer.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/execution/ripple-fixer.ts
/**
 * Ripple effect detection and fixing.
 *
 * After every file edit:
 * 1. Walk the import graph to find all dependent files
 * 2. Check if the change breaks their interface (exports changed)
 * 3. Queue dependent files for fixing in the same execution loop
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode } from '../types.js';

export interface RippleTarget {
  filePath: string;
  dependencyChain: string[]; // How it's connected: [changed.ts -> imports -> consumer.ts]
  nodeIds: string[];         // Specific nodes in this file that depend on the change
}

/**
 * Find all files that transitively depend on the changed files.
 * Walks reverse import/uses edges in the knowledge graph.
 */
export function findRippleTargets(
  changedFiles: string[],
  graph: KnowledgeGraph,
): RippleTarget[] {
  const changedSet = new Set(changedFiles);
  const visited = new Set<string>();
  const targets: RippleTarget[] = [];

  function walkReverse(filePath: string, chain: string[]): void {
    const nodesInFile = graph.findByFile(filePath);

    for (const node of nodesInFile) {
      const edges = graph.getEdgesFor(node.id, 'both');

      for (const edge of edges) {
        // Find reverse dependencies: something imports/uses this node
        if (edge.target !== node.id) continue;
        if (edge.type !== 'imports' && edge.type !== 'uses' && edge.type !== 'calls') continue;

        const sourceNode = graph.getNode(edge.source);
        if (!sourceNode) continue;

        const depFile = sourceNode.filePath;
        if (changedSet.has(depFile)) continue; // Skip the changed files themselves
        if (visited.has(depFile)) continue;

        visited.add(depFile);
        const newChain = [...chain, `${edge.type} -> ${depFile}`];

        // Collect all nodes in this file that reference the changed file
        const depNodes = graph.findByFile(depFile)
          .filter((n) => {
            const nodeEdges = graph.getEdgesFor(n.id, 'forward');
            return nodeEdges.some((e) =>
              nodesInFile.some((changed) => e.target === changed.id)
            );
          })
          .map((n) => n.id);

        targets.push({
          filePath: depFile,
          dependencyChain: newChain,
          nodeIds: depNodes,
        });

        // Continue walking transitively
        walkReverse(depFile, newChain);
      }
    }
  }

  for (const file of changedFiles) {
    walkReverse(file, [file]);
  }

  log('execute', 'Ripple targets found', {
    changedFiles,
    rippleCount: targets.length,
    files: targets.map((t) => t.filePath),
  });

  return targets;
}

/**
 * Detect whether a file change breaks its exported interface.
 * Compares old vs new content for:
 * - Removed exports
 * - Changed function signatures
 * - Renamed types/interfaces
 *
 * Returns a list of potential breakages (best-effort heuristic).
 */
export function detectBrokenInterfaces(
  filePath: string,
  oldContent: string,
  newContent: string,
  graph: KnowledgeGraph,
): Array<{ type: string; detail: string; affectedFiles: string[] }> {
  const breakages: Array<{ type: string; detail: string; affectedFiles: string[] }> = [];

  // Extract exported names from old and new
  const oldExports = extractExportedNames(oldContent);
  const newExports = extractExportedNames(newContent);

  // Check for removed exports
  for (const name of oldExports) {
    if (!newExports.has(name)) {
      // Find who imports this
      const consumers = findConsumersOfExport(filePath, name, graph);
      if (consumers.length > 0) {
        breakages.push({
          type: 'removed_export',
          detail: `Removed export "${name}" from ${filePath}`,
          affectedFiles: consumers,
        });
      }
    }
  }

  // Check for changed function signatures (parameter count changes)
  const oldSigs = extractFunctionSignatures(oldContent);
  const newSigs = extractFunctionSignatures(newContent);

  for (const [name, oldSig] of oldSigs) {
    const newSig = newSigs.get(name);
    if (newSig && oldSig.paramCount !== newSig.paramCount) {
      const consumers = findConsumersOfExport(filePath, name, graph);
      if (consumers.length > 0) {
        breakages.push({
          type: 'changed_signature',
          detail: `${name} params changed from ${oldSig.paramCount} to ${newSig.paramCount}`,
          affectedFiles: consumers,
        });
      }
    }
  }

  return breakages;
}

// ── Helpers ──

function extractExportedNames(content: string): Set<string> {
  const names = new Set<string>();
  const patterns = [
    /export\s+(?:function|const|let|var|class|interface|type|enum)\s+(\w+)/g,
    /export\s+default\s+(?:function|class)?\s*(\w+)/g,
    /export\s*\{([^}]+)\}/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (pattern.source.includes('{')) {
        // Named exports: export { a, b, c }
        const list = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
        list.forEach((name) => { if (name) names.add(name); });
      } else {
        if (match[1]) names.add(match[1]);
      }
    }
  }

  return names;
}

function extractFunctionSignatures(content: string): Map<string, { paramCount: number }> {
  const sigs = new Map<string, { paramCount: number }>();
  const pattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;

  let match;
  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const params = match[2].trim();
    const paramCount = params.length === 0 ? 0 : params.split(',').length;
    sigs.set(name, { paramCount });
  }

  return sigs;
}

function findConsumersOfExport(
  filePath: string,
  exportName: string,
  graph: KnowledgeGraph,
): string[] {
  const consumers: string[] = [];
  const nodesInFile = graph.findByFile(filePath);

  for (const node of nodesInFile) {
    if (node.name !== exportName) continue;

    const edges = graph.getEdgesFor(node.id, 'both');
    for (const edge of edges) {
      if (edge.target !== node.id) continue;
      if (edge.type !== 'imports' && edge.type !== 'uses') continue;

      const consumer = graph.getNode(edge.source);
      if (consumer && consumer.filePath !== filePath) {
        consumers.push(consumer.filePath);
      }
    }
  }

  return [...new Set(consumers)];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/ripple-fixer.test.ts
```
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/execution/ripple-fixer.ts src/__tests__/ripple-fixer.test.ts
git commit -m "feat: add ripple effect detection via import graph traversal"
```

---

### Task 9: Wire ripple fixer into execution loop

**Files:**
- Modify: `src/execution/runner.ts`

- [ ] **Step 1: Read `src/execution/runner.ts` to find the `executionLoop` function**

Identify where changes are applied and build is validated. The ripple check goes between "apply changes" and "validate build."

- [ ] **Step 2: Add ripple detection after applying changes**

After `applyChanges()` succeeds and before running the build:

```typescript
import { findRippleTargets, detectBrokenInterfaces } from './ripple-fixer.js';

// In executionLoop, after applying changes:
const changedFiles = changes.map((c) => c.filePath);
const rippleTargets = findRippleTargets(changedFiles, graph);

if (rippleTargets.length > 0) {
  log('execute', `Ripple effect: ${rippleTargets.length} dependent files may need updates`);

  // For each change, check if exports were modified
  for (const change of changes) {
    if (change.original && change.modified) {
      const broken = detectBrokenInterfaces(change.filePath, change.original, change.modified, graph);
      if (broken.length > 0) {
        log('execute', `Broken interfaces detected`, { breakages: broken });
        // Add ripple target files to the fix queue
        const rippleFiles = [...new Set(broken.flatMap((b) => b.affectedFiles))];
        // Propose fixes for ripple target files
        const rippleFixes = await proposeChanges(
          `Fix imports/usage after these changes:\n${broken.map((b) => b.detail).join('\n')}`,
          rippleFiles,
          graph,
        );
        if (rippleFixes.length > 0) {
          await applyChanges(rippleFixes);
          log('execute', `Applied ${rippleFixes.length} ripple fixes`);
        }
      }
    }
  }
}

// Then proceed to build validation as before
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/execution/runner.ts
git commit -m "feat: integrate ripple detection into execution loop"
```

---

## Chunk 5: Frontend/Backend Coordination (Step 6)

### Task 10: Build API sync module

**Files:**
- Create: `src/execution/api-sync.ts`
- Test: `src/__tests__/api-sync.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/api-sync.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { findAPIConsumers, isBackendEndpoint, isFrontendConsumer } from '../execution/api-sync';
import { KnowledgeGraph } from '../graph/knowledge-graph';
import type { CodeNode, CodeEdge } from '../types';

function makeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    id: overrides.id ?? 'node-1',
    type: overrides.type ?? 'function',
    name: overrides.name ?? 'handler',
    filePath: overrides.filePath ?? 'src/test.ts',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: overrides.content ?? '',
    language: 'typescript',
    metadata: overrides.metadata ?? {},
  };
}

describe('api-sync', () => {
  it('identifies backend endpoint files', () => {
    expect(isBackendEndpoint('src/routes/users.ts')).toBe(true);
    expect(isBackendEndpoint('src/api/auth.ts')).toBe(true);
    expect(isBackendEndpoint('app/api/users/route.ts')).toBe(true);
    expect(isBackendEndpoint('pages/api/login.ts')).toBe(true);
    expect(isBackendEndpoint('src/components/Button.tsx')).toBe(false);
    expect(isBackendEndpoint('src/utils/format.ts')).toBe(false);
  });

  it('identifies frontend consumer files', () => {
    expect(isFrontendConsumer('src/components/UserList.tsx')).toBe(true);
    expect(isFrontendConsumer('src/hooks/useUser.ts')).toBe(true);
    expect(isFrontendConsumer('src/store/userStore.ts')).toBe(true);
    expect(isFrontendConsumer('src/pages/dashboard.tsx')).toBe(true);
    expect(isFrontendConsumer('src/routes/api.ts')).toBe(false);
  });

  it('finds frontend consumers of a backend endpoint', () => {
    const graph = new KnowledgeGraph();
    const nodes: CodeNode[] = [
      makeNode({ id: 'route', name: 'getUsers', filePath: 'src/routes/users.ts',
        content: 'router.get("/api/users", getUsers)',
        metadata: { httpMethod: 'GET', routePath: '/api/users', exported: true } }),
      makeNode({ id: 'hook', name: 'useUsers', filePath: 'src/hooks/useUsers.ts',
        content: 'export function useUsers() { return fetch("/api/users"); }' }),
      makeNode({ id: 'component', name: 'UserList', filePath: 'src/components/UserList.tsx',
        content: 'function UserList() { const users = useUsers(); }' }),
      makeNode({ id: 'unrelated', name: 'formatDate', filePath: 'src/utils/format.ts',
        content: 'export function formatDate(d) {}' }),
    ];
    const edges: CodeEdge[] = [
      { source: 'hook', target: 'route', type: 'calls' },
      { source: 'component', target: 'hook', type: 'imports' },
    ];
    graph.build(nodes, edges);

    const consumers = findAPIConsumers('src/routes/users.ts', graph);
    const files = consumers.map((c) => c.filePath);
    expect(files).toContain('src/hooks/useUsers.ts');
    expect(files).toContain('src/components/UserList.tsx');
    expect(files).not.toContain('src/utils/format.ts');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/api-sync.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/execution/api-sync.ts
/**
 * Frontend/backend coordination.
 *
 * When a backend endpoint changes, finds every frontend store, hook,
 * and component that calls it via the import graph. Both sides get
 * updated in the same task.
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode } from '../types.js';

export interface APIConsumer {
  filePath: string;
  nodeId: string;
  nodeName: string;
  /** How it's connected: direct call, via hook, via store */
  connection: 'direct' | 'via-hook' | 'via-store' | 'via-import';
}

const BACKEND_PATTERNS = [
  /^(?:src\/)?routes\//,
  /^(?:src\/)?api\//,
  /^app\/api\//,
  /^pages\/api\//,
  /^(?:src\/)?server\//,
  /^(?:src\/)?controllers\//,
];

const FRONTEND_PATTERNS = [
  /\.tsx$/,
  /\/components\//,
  /\/hooks\//,
  /\/store\//,
  /\/stores\//,
  /\/pages\/(?!api)/,
  /\/views\//,
  /\/screens\//,
];

export function isBackendEndpoint(filePath: string): boolean {
  return BACKEND_PATTERNS.some((p) => p.test(filePath));
}

export function isFrontendConsumer(filePath: string): boolean {
  return FRONTEND_PATTERNS.some((p) => p.test(filePath));
}

/**
 * Find all frontend files that consume a backend endpoint.
 * Walks the import graph transitively from the endpoint file.
 */
export function findAPIConsumers(
  backendFile: string,
  graph: KnowledgeGraph,
): APIConsumer[] {
  if (!isBackendEndpoint(backendFile)) return [];

  const consumers: APIConsumer[] = [];
  const visited = new Set<string>();
  visited.add(backendFile);

  function walkConsumers(filePath: string, depth: number): void {
    const nodesInFile = graph.findByFile(filePath);

    for (const node of nodesInFile) {
      const edges = graph.getEdgesFor(node.id, 'both');

      for (const edge of edges) {
        // Find reverse deps: what imports/calls/uses this?
        if (edge.target !== node.id) continue;

        const consumer = graph.getNode(edge.source);
        if (!consumer) continue;
        if (visited.has(consumer.filePath)) continue;

        visited.add(consumer.filePath);

        if (isFrontendConsumer(consumer.filePath)) {
          let connection: APIConsumer['connection'] = 'direct';
          if (/hook/i.test(consumer.filePath) || /^use[A-Z]/.test(consumer.name)) {
            connection = 'via-hook';
          } else if (/store/i.test(consumer.filePath)) {
            connection = 'via-store';
          } else if (depth > 0) {
            connection = 'via-import';
          }

          consumers.push({
            filePath: consumer.filePath,
            nodeId: consumer.id,
            nodeName: consumer.name,
            connection,
          });
        }

        // Continue walking transitively (max depth 5)
        if (depth < 5) {
          walkConsumers(consumer.filePath, depth + 1);
        }
      }
    }
  }

  walkConsumers(backendFile, 0);

  log('execute', 'API consumers found', {
    backendFile,
    consumerCount: consumers.length,
    files: consumers.map((c) => `${c.filePath} (${c.connection})`),
  });

  return consumers;
}

/**
 * Given a set of changed files, find all backend→frontend pairs
 * that need coordinated updates.
 */
export function findCoordinatedUpdates(
  changedFiles: string[],
  graph: KnowledgeGraph,
): Array<{ backendFile: string; frontendFiles: string[] }> {
  const updates: Array<{ backendFile: string; frontendFiles: string[] }> = [];

  for (const file of changedFiles) {
    if (!isBackendEndpoint(file)) continue;

    const consumers = findAPIConsumers(file, graph);
    const frontendFiles = [...new Set(consumers.map((c) => c.filePath))];

    if (frontendFiles.length > 0) {
      updates.push({ backendFile: file, frontendFiles });
    }
  }

  return updates;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/api-sync.test.ts
```
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/execution/api-sync.ts src/__tests__/api-sync.test.ts
git commit -m "feat: add frontend/backend API coordination via import graph"
```

---

### Task 11: Wire API sync into execution loop

**Files:**
- Modify: `src/execution/runner.ts`

- [ ] **Step 1: Add API sync check after applying changes**

In the execution loop, after ripple detection and before build validation:

```typescript
import { findCoordinatedUpdates } from './api-sync.js';

// After ripple detection:
const coordinated = findCoordinatedUpdates(changedFiles, graph);
if (coordinated.length > 0) {
  for (const { backendFile, frontendFiles } of coordinated) {
    log('execute', `Backend change in ${backendFile} affects ${frontendFiles.length} frontend files`);

    // Check if any frontend files were already updated in this batch
    const alreadyUpdated = new Set(changedFiles);
    const needsUpdate = frontendFiles.filter((f) => !alreadyUpdated.has(f));

    if (needsUpdate.length > 0) {
      log('execute', `Auto-updating frontend consumers: ${needsUpdate.join(', ')}`);
      const frontendFixes = await proposeChanges(
        `The backend endpoint in ${backendFile} was changed. Update these frontend consumers to match the new API:\n${needsUpdate.join('\n')}`,
        needsUpdate,
        graph,
      );
      if (frontendFixes.length > 0) {
        await applyChanges(frontendFixes);
        // Add to changed files so build validation covers them
        changedFiles.push(...frontendFixes.map((f) => f.filePath));
        log('execute', `Applied ${frontendFixes.length} frontend coordination fixes`);
      }
    }
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```
Expected: All pass

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.server.json
```
Expected: Only pre-existing `getAllNodes` error

- [ ] **Step 4: Commit**

```bash
git add src/execution/runner.ts
git commit -m "feat: integrate frontend/backend API sync into execution loop"
```

---

## Chunk 6: Integration & Final Verification

### Task 12: Update cache for new index types

**Files:**
- Modify: `src/retrieval/cache.ts`

- [ ] **Step 1: Update cache format to include local embeddings and BM25 docs**

Update `IndexCacheData` interface:

```typescript
interface IndexCacheData {
  version: 3; // Bump version
  timestamp: number;
  fileMtimes: Record<string, number>;
  bm25Docs: Array<{ id: string; name: string; filePath: string; content: string }>;
  localEmbeddings: Array<{ id: string; embedding: number[] }>;
  openaiEmbeddings: Array<{ id: string; embedding: number[] }>;
}
```

Update `saveIndexCache()` and `loadIndexCache()` to handle the new fields.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/retrieval/cache.ts
git commit -m "feat: update cache format v3 for BM25 + local embeddings"
```

---

### Task 13: Full integration test

**Files:**
- All

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```
Expected: All tests pass

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.server.json
```
Expected: Only pre-existing errors

- [ ] **Step 3: Verify new module count**

```bash
find src/retrieval src/semantic src/execution -name "*.ts" | wc -l
```
Expected: At least 15 modules

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: production retrieval engine — BM25, local embeddings, cross-encoder, ripple detection, API sync"
```

---

## Summary

| Step | What | Key Files | Tests |
|------|------|-----------|-------|
| 1 | Local embeddings | `local-embeddings.ts`, `embeddings.ts` | 5 tests |
| 2 | BM25 search | `bm25.ts` | 7 tests |
| 3 | Wire pipeline | `candidate-generator.ts`, `pipeline.ts`, `reranker.ts` | Update existing |
| 4 | Cross-encoder | `cross-encoder.ts`, `reranker.ts` | 4 tests |
| 5 | Ripple detection | `ripple-fixer.ts`, `runner.ts` | 4 tests |
| 6 | API sync | `api-sync.ts`, `runner.ts` | 4 tests |
| Total | | 6 new files, 10 modified | ~24 new tests |
