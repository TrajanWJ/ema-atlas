import { describe, it, expect, beforeEach } from 'vitest';
import { smartExpand, detectQueryIntent } from '../retrieval/smart-traversal';
import { KnowledgeGraph } from '../graph/knowledge-graph';
import type { ScoredCandidate } from '../retrieval/types';
import type { CodeNode, CodeEdge, ExpandedQuery } from '../types';

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
    makeNode({ id: 'fn-middleware', name: 'authMiddleware', filePath: 'src/middleware.ts', content: 'function authMiddleware(req, res, next) { authenticateUser(req.token); next(); }' }),
    makeNode({ id: 'fn-handler', name: 'handleLogin', filePath: 'src/routes/login.ts', content: 'function handleLogin(req, res) { authenticateUser(req.body.token); }', type: 'route' }),
    makeNode({ id: 'fn-db', name: 'findUserById', filePath: 'src/db/users.ts', content: 'function findUserById(id) { return db.users.findOne({ id }); }' }),
    makeNode({ id: 'fn-billing', name: 'processPayment', filePath: 'src/billing/stripe.ts', content: 'function processPayment(amount, customerId) { stripe.charges.create(); }' }),
    makeNode({ id: 'fn-render', name: 'LoginForm', filePath: 'src/components/LoginForm.tsx', content: 'function LoginForm() { return <form>...</form>; }' }),
    makeNode({ id: 'import-jwt', name: 'jwt', filePath: 'src/auth.ts', type: 'import', content: "import jwt from 'jsonwebtoken';" }),
  ];

  const edges: CodeEdge[] = [
    { source: 'fn-handler', target: 'fn-auth', type: 'calls' },
    { source: 'fn-auth', target: 'fn-verify', type: 'calls' },
    { source: 'fn-auth', target: 'fn-db', type: 'calls' },
    { source: 'fn-middleware', target: 'fn-auth', type: 'calls' },
    { source: 'fn-auth', target: 'import-jwt', type: 'imports' },
    { source: 'fn-render', target: 'fn-handler', type: 'calls' },
  ];

  graph.build(nodes, edges);
  return graph;
}

// ── Tests ──

describe('detectQueryIntent', () => {
  it('detects auth intent', () => {
    expect(detectQueryIntent('how does authentication work')).toBe('auth');
    expect(detectQueryIntent('show me the login middleware')).toBe('auth');
  });

  it('detects data intent', () => {
    expect(detectQueryIntent('what database models exist')).toBe('data');
    expect(detectQueryIntent('show the prisma schema')).toBe('data');
  });

  it('detects UI intent', () => {
    expect(detectQueryIntent('show the dashboard component')).toBe('ui');
    expect(detectQueryIntent('what does this page render')).toBe('ui');
  });

  it('detects API intent', () => {
    expect(detectQueryIntent('list all API endpoints')).toBe('api');
    expect(detectQueryIntent('show the route handler')).toBe('api');
  });

  it('falls back to general', () => {
    expect(detectQueryIntent('explain the architecture')).toBe('general');
  });

  it('uses expanded query concepts', () => {
    const expanded: ExpandedQuery = {
      original: 'how does it work',
      concepts: ['auth'],
      actions: ['understand'],
      components: ['middleware'],
      fileTypes: ['.ts'],
    };
    expect(detectQueryIntent('how does it work', expanded)).toBe('auth');
  });
});

describe('smartExpand', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = buildTestGraph();
  });

  it('expands candidates with query-aware edge prioritization', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({
        id: 'fn-auth',
        node: graph.getNode('fn-auth')!,
        score: 0.9,
        text: 'authenticateUser',
      }),
    ];

    const expanded = smartExpand(candidates, graph, 'how does auth work');
    expect(expanded.length).toBeGreaterThan(1);

    const expandedIds = expanded.map((c) => c.id);
    expect(expandedIds).toContain('fn-auth');
    // Should include call neighbors
    expect(expandedIds).toContain('fn-verify');
  });

  it('uses dynamic decay based on edge type', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({
        id: 'fn-auth',
        node: graph.getNode('fn-auth')!,
        score: 1.0,
      }),
    ];

    const expanded = smartExpand(candidates, graph, 'auth');
    const callNeighbor = expanded.find((c) => c.id === 'fn-verify');
    const handler = expanded.find((c) => c.id === 'fn-handler');

    // calls edges get 0.8 decay
    expect(callNeighbor).toBeDefined();
    expect(callNeighbor!.score).toBeCloseTo(0.8, 1);
  });

  it('skips import/export nodes', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({
        id: 'fn-auth',
        node: graph.getNode('fn-auth')!,
        score: 0.8,
      }),
    ];

    const expanded = smartExpand(candidates, graph, 'auth');
    const importNode = expanded.find((c) => c.id === 'import-jwt');
    expect(importNode).toBeUndefined();
  });

  it('does not duplicate existing candidates', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.8 }),
      makeCandidate({ id: 'fn-verify', node: graph.getNode('fn-verify')!, score: 0.7 }),
    ];

    const expanded = smartExpand(candidates, graph, 'auth');
    const verifyEntries = expanded.filter((c) => c.id === 'fn-verify');
    expect(verifyEntries).toHaveLength(1);
    expect(verifyEntries[0].score).toBe(0.7); // Original score preserved
  });

  it('tags expanded nodes with graph-expansion source', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-auth', node: graph.getNode('fn-auth')!, score: 0.8 }),
    ];

    const expanded = smartExpand(candidates, graph, 'auth');
    const newNodes = expanded.filter((c) => c.sources.includes('graph-expansion'));
    expect(newNodes.length).toBeGreaterThan(0);
  });

  it('handles empty candidates', () => {
    const result = smartExpand([], graph, 'test');
    expect(result).toEqual([]);
  });

  it('handles candidates without nodes', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'no-node', score: 0.5 }),
    ];
    const result = smartExpand(candidates, graph, 'test');
    expect(result).toHaveLength(1); // Only the original
  });
});
