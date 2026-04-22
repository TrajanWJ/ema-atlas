import { describe, it, expect, beforeEach } from 'vitest';
import { decompose } from '../retrieval/decomposer';
import { expandGraph } from '../retrieval/graph-expander';
import { rerank } from '../retrieval/reranker';
import {
  getCachedQuery,
  setCachedQuery,
  invalidateQueryCache,
} from '../retrieval/cache';
import type { ScoredCandidate } from '../retrieval/types';
import { KnowledgeGraph } from '../graph/knowledge-graph';
import { BM25Index } from '../semantic/bm25';
import type { CodeNode, CodeEdge } from '../types';

// ── Helpers ──

function makeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    id: overrides.id ?? 'node-1',
    type: overrides.type ?? 'function',
    name: overrides.name ?? 'testFunction',
    filePath: overrides.filePath ?? 'src/test.ts',
    range: overrides.range ?? { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: overrides.content ?? 'function testFunction() { return true; }',
    language: overrides.language ?? 'typescript',
    signature: overrides.signature,
    metadata: overrides.metadata ?? {},
  };
}

function makeCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    id: overrides.id ?? 'candidate-1',
    text: overrides.text ?? 'function testFunction in src/test.ts',
    score: overrides.score ?? 0.5,
    sources: overrides.sources ?? ['bm25'],
    type: overrides.type ?? 'code',
    node: overrides.node,
  };
}

function buildTestGraph(): KnowledgeGraph {
  const graph = new KnowledgeGraph();
  const nodes: CodeNode[] = [
    makeNode({ id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'function authenticateUser(token) { verify(token); }' }),
    makeNode({ id: 'fn-verify', name: 'verifyToken', filePath: 'src/auth.ts', content: 'function verifyToken(token) { return jwt.verify(token); }' }),
    makeNode({ id: 'fn-handler', name: 'handleLogin', filePath: 'src/routes/login.ts', content: 'function handleLogin(req, res) { authenticateUser(req.body.token); }', type: 'route' }),
    makeNode({ id: 'fn-db', name: 'findUserById', filePath: 'src/db/users.ts', content: 'function findUserById(id) { return db.users.findOne({ id }); }' }),
    makeNode({ id: 'fn-billing', name: 'processPayment', filePath: 'src/billing/stripe.ts', content: 'function processPayment(amount, customerId) { stripe.charges.create(); }' }),
    makeNode({ id: 'import-jwt', name: 'jwt', filePath: 'src/auth.ts', type: 'import', content: "import jwt from 'jsonwebtoken';" }),
  ];

  const edges: CodeEdge[] = [
    { source: 'fn-handler', target: 'fn-auth', type: 'calls' },
    { source: 'fn-auth', target: 'fn-verify', type: 'calls' },
    { source: 'fn-auth', target: 'fn-db', type: 'calls' },
    { source: 'fn-auth', target: 'import-jwt', type: 'imports' },
  ];

  graph.build(nodes, edges);
  return graph;
}

// ── Decomposer Tests ──

describe('decomposer', () => {
  it('returns single query for simple questions', () => {
    expect(decompose('what does the auth module do')).toEqual(['what does the auth module do']);
  });

  it('splits "how does X connect to Y" queries', () => {
    const result = decompose('how does auth connect to billing');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('auth');
    expect(result[1]).toBe('billing');
  });

  it('splits "relationship between X and Y"', () => {
    const result = decompose('relationship between authentication and payment processing');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('authentication');
    expect(result[1]).toBe('payment processing');
  });

  it('does not split related conjunctions', () => {
    expect(decompose('read and write operations')).toEqual(['read and write operations']);
  });

  it('does not split short "and" phrases', () => {
    // "add X and Y" — both parts are too short (< 2 words each)
    expect(decompose('fix auth and billing')).toEqual(['fix auth and billing']);
  });

  it('splits substantial "and" phrases', () => {
    const result = decompose('the authentication system and the payment processing pipeline');
    expect(result).toHaveLength(2);
  });

  it('handles "compare X with Y"', () => {
    const result = decompose('compare the old auth with the new auth');
    expect(result).toHaveLength(2);
  });
});

// ── Graph Expander Tests ──

describe('graph-expander', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = buildTestGraph();
  });

  it('expands candidates with graph neighbors', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({
        id: 'fn-auth',
        node: graph.getNode('fn-auth')!,
        score: 0.8,
        text: 'authenticateUser',
      }),
    ];

    const expanded = expandGraph(candidates, graph);
    expect(expanded.length).toBeGreaterThan(1);

    const expandedIds = expanded.map((c) => c.id);
    // Should include the original
    expect(expandedIds).toContain('fn-auth');
    // Should include neighbors (calls, imports)
    expect(expandedIds).toContain('fn-verify');
    expect(expandedIds).toContain('fn-handler');
  });

  it('applies score decay to expanded nodes', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({
        id: 'fn-auth',
        node: graph.getNode('fn-auth')!,
        score: 0.8,
      }),
    ];

    const expanded = expandGraph(candidates, graph);
    const expandedNode = expanded.find((c) => c.id === 'fn-verify');
    expect(expandedNode).toBeDefined();
    expect(expandedNode!.score).toBe(0.8 * 0.5);
  });

  it('skips import/export nodes', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({
        id: 'fn-auth',
        node: graph.getNode('fn-auth')!,
        score: 0.8,
      }),
    ];

    const expanded = expandGraph(candidates, graph);
    const importNode = expanded.find((c) => c.id === 'import-jwt');
    expect(importNode).toBeUndefined();
  });

  it('does not duplicate existing candidates', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.8 }),
      makeCandidate({ id: 'fn-verify', node: graph.getNode('fn-verify')!, score: 0.7 }),
    ];

    const expanded = expandGraph(candidates, graph);
    const verifyEntries = expanded.filter((c) => c.id === 'fn-verify');
    expect(verifyEntries).toHaveLength(1);
    // Original score should be kept (not overwritten with decayed)
    expect(verifyEntries[0].score).toBe(0.7);
  });

  it('tags expanded nodes with graph-expansion source', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.8 }),
    ];

    const expanded = expandGraph(candidates, graph);
    const newNodes = expanded.filter((c) => c.sources.includes('graph-expansion'));
    expect(newNodes.length).toBeGreaterThan(0);
  });
});

// ── Reranker Tests ──

describe('reranker', () => {
  let graph: KnowledgeGraph;
  let bm25Index: BM25Index;

  beforeEach(() => {
    graph = buildTestGraph();
    bm25Index = new BM25Index();
    bm25Index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'function authenticateUser token verify jwt' },
      { id: 'fn-verify', name: 'verifyToken', filePath: 'src/auth.ts', content: 'function verifyToken jwt decode validate' },
      { id: 'fn-handler', name: 'handleLogin', filePath: 'src/routes/login.ts', content: 'function handleLogin request response authenticate' },
      { id: 'fn-db', name: 'findUserById', filePath: 'src/db/users.ts', content: 'function findUserById database query users' },
      { id: 'fn-billing', name: 'processPayment', filePath: 'src/billing/stripe.ts', content: 'function processPayment stripe charges billing' },
    ]);
  });

  it('returns ranked candidates limited to maxResults', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.5 }),
      makeCandidate({ id: 'fn-verify', node: graph.getNode('fn-verify')!, score: 0.4 }),
      makeCandidate({ id: 'fn-handler', node: graph.getNode('fn-handler')!, score: 0.3 }),
      makeCandidate({ id: 'fn-db', node: graph.getNode('fn-db')!, score: 0.2 }),
      makeCandidate({ id: 'fn-billing', node: graph.getNode('fn-billing')!, score: 0.1 }),
    ];

    const result = rerank('authenticate user token', candidates, graph, bm25Index, 3);
    expect(result).toHaveLength(3);
  });

  it('ranks auth-related nodes higher for auth queries', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.5, text: 'authenticateUser' }),
      makeCandidate({ id: 'fn-billing', node: graph.getNode('fn-billing')!, score: 0.5, text: 'processPayment' }),
    ];

    const result = rerank('authentication', candidates, graph, bm25Index, 5);
    expect(result[0].id).toBe('fn-auth');
  });

  it('boosts candidates found by multiple retrievers', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.5, sources: ['bm25', 'openai', 'local-embeddings'] }),
      makeCandidate({ id: 'fn-billing', node: graph.getNode('fn-billing')!, score: 0.5, sources: ['bm25'] }),
    ];

    const result = rerank('function', candidates, graph, bm25Index, 5);
    // Multi-source candidate should rank higher due to source bonus
    const authRank = result.findIndex((c) => c.id === 'fn-auth');
    const billingRank = result.findIndex((c) => c.id === 'fn-billing');
    expect(authRank).toBeLessThan(billingRank);
  });

  it('handles empty candidates', () => {
    const result = rerank('test', [], graph, bm25Index);
    expect(result).toEqual([]);
  });

  it('handles null bm25Index', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.5 }),
    ];

    const result = rerank('authenticate', candidates, graph, null);
    expect(result).toHaveLength(1);
  });
});

// ── Cache Tests ──

describe('query cache', () => {
  beforeEach(() => {
    invalidateQueryCache();
  });

  it('returns null for uncached queries', () => {
    expect(getCachedQuery('test query')).toBeNull();
  });

  it('returns cached candidates for same query', () => {
    const candidates = [makeCandidate({ id: 'test-1', score: 0.9 })];
    setCachedQuery('test query', candidates);

    const result = getCachedQuery('test query');
    expect(result).toHaveLength(1);
    expect(result![0].id).toBe('test-1');
  });

  it('normalizes queries (case + whitespace)', () => {
    const candidates = [makeCandidate({ id: 'test-1' })];
    setCachedQuery('  Test   Query  ', candidates);

    expect(getCachedQuery('test query')).not.toBeNull();
    expect(getCachedQuery('TEST QUERY')).not.toBeNull();
  });

  it('invalidates all entries', () => {
    setCachedQuery('q1', [makeCandidate()]);
    setCachedQuery('q2', [makeCandidate()]);

    invalidateQueryCache();

    expect(getCachedQuery('q1')).toBeNull();
    expect(getCachedQuery('q2')).toBeNull();
  });

  it('evicts oldest entry when at capacity', () => {
    // Fill cache to capacity (50)
    for (let i = 0; i < 50; i++) {
      setCachedQuery(`query-${i}`, [makeCandidate({ id: `c-${i}` })]);
    }

    // Add one more — should evict the oldest
    setCachedQuery('query-new', [makeCandidate({ id: 'c-new' })]);

    expect(getCachedQuery('query-new')).not.toBeNull();
    // query-0 should have been evicted (it's the oldest)
    expect(getCachedQuery('query-0')).toBeNull();
  });
});
