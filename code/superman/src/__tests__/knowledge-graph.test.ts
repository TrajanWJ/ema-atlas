import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge } from '../types.js';

function makeNode(id: string, name: string, type: string = 'function', file: string = 'test.ts'): CodeNode {
  return {
    id,
    name,
    type: type as any,
    filePath: file,
    language: 'typescript',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: `function ${name}() {}`,
    metadata: {},
  };
}

function makeEdge(source: string, target: string, type: string = 'calls'): CodeEdge {
  return { source, target, type: type as any };
}

describe('KnowledgeGraph', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it('builds from nodes and edges', () => {
    graph.build([makeNode('a', 'funcA'), makeNode('b', 'funcB')], [makeEdge('a', 'b')]);
    const stats = graph.getStats();
    expect(stats.nodeCount).toBe(2);
    expect(stats.edgeCount).toBe(1);
  });

  it('finds nodes by name', () => {
    graph.build([makeNode('a', 'getUserProfile')], []);
    const found = graph.findByName('user');
    expect(found).toHaveLength(1);
  });

  it('finds nodes by file', () => {
    graph.build([makeNode('a', 'funcA', 'function', 'auth.ts'), makeNode('b', 'funcB', 'function', 'payment.ts')], []);
    expect(graph.findByFile('auth.ts')).toHaveLength(1);
  });

  it('gets forward neighbors', () => {
    graph.build([makeNode('a', 'caller'), makeNode('b', 'callee')], [makeEdge('a', 'b')]);
    const neighbors = graph.getNeighbors('a', 'forward');
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].id).toBe('b');
  });

  it('gets reverse neighbors', () => {
    graph.build([makeNode('a', 'caller'), makeNode('b', 'callee')], [makeEdge('a', 'b')]);
    const neighbors = graph.getNeighbors('b', 'reverse');
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].id).toBe('a');
  });

  it('removes nodes by file', () => {
    graph.build([makeNode('a', 'funcA', 'function', 'old.ts'), makeNode('b', 'funcB', 'function', 'keep.ts')], [makeEdge('a', 'b')]);
    graph.removeByFile('old.ts');
    expect(graph.getNode('a')).toBeUndefined();
    expect(graph.getNode('b')).toBeDefined();
  });

  it('gets subgraph', () => {
    graph.build([makeNode('a', 'A'), makeNode('b', 'B'), makeNode('c', 'C')], [makeEdge('a', 'b'), makeEdge('b', 'c')]);
    const sub = graph.getSubgraph(['a'], 1);
    expect(sub.nodes.length).toBeGreaterThanOrEqual(1);
  });
});
