import { describe, it, expect, beforeEach } from 'vitest';
import { applyHierarchicalRetrieval } from '../retrieval/hierarchical';
import { KnowledgeGraph } from '../graph/knowledge-graph';
import type { ScoredCandidate } from '../retrieval/types';
import type { CodeNode, CodeEdge } from '../types';

function makeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    id: overrides.id ?? 'node-1',
    type: overrides.type ?? 'function',
    name: overrides.name ?? 'testFunction',
    filePath: overrides.filePath ?? 'src/test.ts',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: overrides.content ?? 'function testFunction() { return true; }',
    language: 'typescript',
    metadata: overrides.metadata ?? {},
  };
}

function makeCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    id: overrides.id ?? 'c-1',
    text: overrides.text ?? 'function testFunction',
    score: overrides.score ?? 0.5,
    sources: overrides.sources ?? ['bm25'],
    type: overrides.type ?? 'code',
    node: overrides.node,
  };
}

function buildTestGraph(): KnowledgeGraph {
  const graph = new KnowledgeGraph();
  const nodes: CodeNode[] = [
    makeNode({ id: 'fn-1', name: 'fn1', filePath: 'src/auth.ts', content: 'function fn1() { do_something(); }' }),
    makeNode({ id: 'fn-2', name: 'fn2', filePath: 'src/auth.ts', content: 'function fn2() { do_more(); }' }),
    makeNode({ id: 'fn-3', name: 'fn3', filePath: 'src/auth.ts', content: 'function fn3() { do_yet_more(); }' }),
    makeNode({ id: 'fn-4', name: 'fn4', filePath: 'src/auth.ts', content: 'function fn4() { and_more(); }' }),
    makeNode({ id: 'fn-5', name: 'fn5', filePath: 'src/db.ts', content: 'function fn5() { database_query(); }' }),
    makeNode({ id: 'fn-6', name: 'fn6', filePath: 'src/routes/login.ts', content: 'function fn6() { handle_login(); }', type: 'route' }),
    makeNode({ id: 'type-1', name: 'UserModel', filePath: 'src/models/user.ts', type: 'interface', content: 'interface UserModel { id: string; name: string; }' }),
  ];
  graph.build(nodes, []);
  return graph;
}

describe('hierarchical retrieval', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = buildTestGraph();
  });

  it('limits max nodes from same file to 3', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-1', node: graph.getNode('fn-1')!, score: 0.9 }),
      makeCandidate({ id: 'fn-2', node: graph.getNode('fn-2')!, score: 0.8 }),
      makeCandidate({ id: 'fn-3', node: graph.getNode('fn-3')!, score: 0.7 }),
      makeCandidate({ id: 'fn-4', node: graph.getNode('fn-4')!, score: 0.6 }),
    ];

    const result = applyHierarchicalRetrieval(candidates, graph, 'auth');
    const authNodes = result.filter(c => c.node?.filePath === 'src/auth.ts');
    expect(authNodes.length).toBeLessThanOrEqual(3);
  });

  it('preserves high-scoring candidates', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-1', node: graph.getNode('fn-1')!, score: 0.95 }),
      makeCandidate({ id: 'fn-5', node: graph.getNode('fn-5')!, score: 0.80 }),
    ];

    const result = applyHierarchicalRetrieval(candidates, graph, 'test query');
    expect(result.length).toBe(2);
    expect(result.map(c => c.id)).toContain('fn-1');
    expect(result.map(c => c.id)).toContain('fn-5');
  });

  it('handles empty candidates', () => {
    const result = applyHierarchicalRetrieval([], graph, 'test');
    expect(result).toEqual([]);
  });

  it('respects maxResults', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-1', node: graph.getNode('fn-1')!, score: 0.9 }),
      makeCandidate({ id: 'fn-5', node: graph.getNode('fn-5')!, score: 0.8 }),
      makeCandidate({ id: 'fn-6', node: graph.getNode('fn-6')!, score: 0.7 }),
      makeCandidate({ id: 'type-1', node: graph.getNode('type-1')!, score: 0.6 }),
    ];

    const result = applyHierarchicalRetrieval(candidates, graph, 'test', undefined, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('includes entry points for flow queries', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-1', node: graph.getNode('fn-1')!, score: 0.9 }),
      makeCandidate({ id: 'fn-6', node: graph.getNode('fn-6')!, score: 0.4 }),
    ];

    const result = applyHierarchicalRetrieval(candidates, graph, 'how does the login flow work');
    const ids = result.map(c => c.id);
    expect(ids).toContain('fn-6'); // Route/entry point included
  });

  it('includes data model for model queries', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-1', node: graph.getNode('fn-1')!, score: 0.9 }),
      makeCandidate({ id: 'type-1', node: graph.getNode('type-1')!, score: 0.3 }),
    ];

    const result = applyHierarchicalRetrieval(candidates, graph, 'what does the user model look like');
    const ids = result.map(c => c.id);
    expect(ids).toContain('type-1');
  });

  it('ensures diversity across files', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'fn-1', node: graph.getNode('fn-1')!, score: 0.95 }),
      makeCandidate({ id: 'fn-2', node: graph.getNode('fn-2')!, score: 0.90 }),
      makeCandidate({ id: 'fn-3', node: graph.getNode('fn-3')!, score: 0.85 }),
      makeCandidate({ id: 'fn-4', node: graph.getNode('fn-4')!, score: 0.80 }),
      makeCandidate({ id: 'fn-5', node: graph.getNode('fn-5')!, score: 0.50 }),
    ];

    const result = applyHierarchicalRetrieval(candidates, graph, 'show me everything');
    const filePaths = result.map(c => c.node?.filePath);
    // fn-5 from db.ts should be included despite lower score (diversity)
    expect(filePaths).toContain('src/db.ts');
    // At most 3 from auth.ts
    expect(filePaths.filter(f => f === 'src/auth.ts').length).toBeLessThanOrEqual(3);
  });
});
