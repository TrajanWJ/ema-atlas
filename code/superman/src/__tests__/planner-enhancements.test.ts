import { describe, it, expect } from 'vitest';
import { orderStepsByFileDependency, buildRichNodeContextForTest } from '../planner.js';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge, PlanStep } from '../types.js';

function makeGraph(nodes: Partial<CodeNode>[], edges: Partial<CodeEdge>[] = []): KnowledgeGraph {
  const graph = new KnowledgeGraph();
  const fullNodes: CodeNode[] = nodes.map((n) => ({
    id: n.id || 'n1',
    name: n.name || 'test',
    type: (n.type as any) || 'function',
    filePath: n.filePath || 'test.ts',
    language: 'typescript',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: n.content || '',
    metadata: n.metadata || {},
  }));
  const fullEdges: CodeEdge[] = edges.map((e) => ({
    source: e.source || '',
    target: e.target || '',
    type: (e.type as any) || 'calls',
  }));
  graph.build(fullNodes, fullEdges);
  return graph;
}

function makeStep(id: number, system: string, files: string[], priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'): PlanStep {
  return {
    id,
    system,
    action: `action-${id}`,
    description: `Step ${id}`,
    targetFiles: files,
    instruction: `Do something to ${files.join(', ')}`,
    dependencies: [],
    priority,
  };
}

describe('buildRichNodeContext', () => {
  it('includes function name, file path, and line numbers', () => {
    const graph = makeGraph([{
      id: 'fn1',
      name: 'getUser',
      type: 'function',
      filePath: 'src/users.ts',
    }]);

    const result = buildRichNodeContextForTest(['fn1'], graph);
    expect(result).toContain('getUser');
    expect(result).toContain('src/users.ts');
    expect(result).toContain('Lines: 1-10');
  });

  it('includes parameter info when available', () => {
    const graph = makeGraph([{
      id: 'fn1',
      name: 'createUser',
      type: 'function',
      filePath: 'src/users.ts',
      metadata: {
        parameters: [
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' },
          { name: 'age', type: 'number', optional: true },
        ],
      },
    }]);

    const result = buildRichNodeContextForTest(['fn1'], graph);
    expect(result).toContain('name: string');
    expect(result).toContain('email: string');
    expect(result).toContain('age: number (optional)');
  });

  it('includes return type when available', () => {
    const graph = makeGraph([{
      id: 'fn1',
      name: 'getUser',
      metadata: { returnType: 'Promise<User>' },
    }]);

    const result = buildRichNodeContextForTest(['fn1'], graph);
    expect(result).toContain('Returns: `Promise<User>`');
  });

  it('includes signature when available', () => {
    const graph = makeGraph([{
      id: 'fn1',
      name: 'getUser',
      metadata: {},
    }]);
    // Manually set signature
    graph.getNode('fn1')!.signature = 'getUser(id: string): Promise<User>';
    const result = buildRichNodeContextForTest(['fn1'], graph);
    expect(result).toContain('Signature: `getUser(id: string): Promise<User>`');
  });

  it('warns about exported functions', () => {
    const graph = makeGraph([{
      id: 'fn1',
      name: 'helperFn',
      metadata: { exported: true },
    }]);

    const result = buildRichNodeContextForTest(['fn1'], graph);
    expect(result).toContain('Exported: yes');
    expect(result).toContain('break callers');
  });

  it('shows reverse dependencies', () => {
    const graph = makeGraph([
      { id: 'target', name: 'validateInput', filePath: 'src/validation.ts' },
      { id: 'caller1', name: 'createUser', filePath: 'src/users.ts' },
      { id: 'caller2', name: 'updateUser', filePath: 'src/users.ts' },
    ], [
      { source: 'caller1', target: 'target', type: 'calls' },
      { source: 'caller2', target: 'target', type: 'calls' },
    ]);

    const result = buildRichNodeContextForTest(['target'], graph);
    expect(result).toContain('Depended on by');
    expect(result).toContain('createUser');
    expect(result).toContain('updateUser');
  });

  it('includes route metadata', () => {
    const graph = makeGraph([{
      id: 'route1',
      name: 'getUserRoute',
      type: 'route',
      metadata: { httpMethod: 'GET', routePath: '/api/users/:id' },
    }]);

    const result = buildRichNodeContextForTest(['route1'], graph);
    expect(result).toContain('Route: GET /api/users/:id');
  });

  it('skips unknown node IDs', () => {
    const graph = makeGraph([]);
    const result = buildRichNodeContextForTest(['nonexistent'], graph);
    expect(result).toBe('');
  });

  it('deduplicates node IDs', () => {
    const graph = makeGraph([{
      id: 'fn1',
      name: 'getUser',
    }]);

    const result = buildRichNodeContextForTest(['fn1', 'fn1', 'fn1'], graph);
    // Should only appear once
    const matches = result.match(/getUser/g);
    expect(matches).toHaveLength(1);
  });
});

describe('orderStepsByFileDependency', () => {
  it('returns single step unchanged', () => {
    const graph = makeGraph([]);
    const steps = [makeStep(1, 'api', ['src/routes.ts'])];
    const result = orderStepsByFileDependency(steps, graph);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('returns empty array unchanged', () => {
    const graph = makeGraph([]);
    const result = orderStepsByFileDependency([], graph);
    expect(result).toHaveLength(0);
  });

  it('orders leaf files before core files', () => {
    // Setup: route.ts depends on service.ts depends on db.ts
    // db.ts has the most dependents → should be changed LAST
    const graph = makeGraph([
      { id: 'route-fn', name: 'getUsers', filePath: 'src/route.ts', content: '' },
      { id: 'service-fn', name: 'userService', filePath: 'src/service.ts', content: '' },
      { id: 'db-fn', name: 'dbQuery', filePath: 'src/db.ts', content: '' },
    ], [
      { source: 'route-fn', target: 'service-fn', type: 'calls' },
      { source: 'service-fn', target: 'db-fn', type: 'calls' },
    ]);

    const steps = [
      makeStep(1, 'database', ['src/db.ts']),       // most depended on
      makeStep(2, 'services', ['src/service.ts']),   // middle
      makeStep(3, 'api', ['src/route.ts']),          // leaf
    ];

    const result = orderStepsByFileDependency(steps, graph);

    // route.ts (leaf, 0 dependents) should come first
    // db.ts (core, 2 dependents) should come last
    const routeIdx = result.findIndex((s) => s.targetFiles.includes('src/route.ts'));
    const dbIdx = result.findIndex((s) => s.targetFiles.includes('src/db.ts'));
    expect(routeIdx).toBeLessThan(dbIdx);
  });

  it('preserves priority order for equal dependency scores', () => {
    const graph = makeGraph([
      { id: 'a-fn', name: 'a', filePath: 'src/a.ts', content: '' },
      { id: 'b-fn', name: 'b', filePath: 'src/b.ts', content: '' },
    ]);

    const steps = [
      makeStep(1, 'api', ['src/a.ts'], 'low'),
      makeStep(2, 'api', ['src/b.ts'], 'critical'),
    ];

    const result = orderStepsByFileDependency(steps, graph);
    // Both have 0 dependents, so critical should come before low
    expect(result[0].priority).toBe('critical');
    expect(result[1].priority).toBe('low');
  });

  it('handles steps with multiple target files', () => {
    const graph = makeGraph([
      { id: 'core-fn', name: 'core', filePath: 'src/core.ts', content: '' },
      { id: 'leaf-fn', name: 'leaf', filePath: 'src/leaf.ts', content: '' },
      { id: 'dep-fn', name: 'dep', filePath: 'src/dep.ts', content: '' },
    ], [
      { source: 'leaf-fn', target: 'core-fn', type: 'imports' },
      { source: 'dep-fn', target: 'core-fn', type: 'uses' },
    ]);

    const steps = [
      makeStep(1, 'core', ['src/core.ts', 'src/dep.ts']),  // core has 2 dependents
      makeStep(2, 'leaf', ['src/leaf.ts']),                  // leaf has 0 dependents
    ];

    const result = orderStepsByFileDependency(steps, graph);
    // Step touching leaf.ts should come first
    expect(result[0].targetFiles).toContain('src/leaf.ts');
  });

  it('handles files not in graph gracefully', () => {
    const graph = makeGraph([]);
    const steps = [
      makeStep(1, 'api', ['src/new-file.ts']),
      makeStep(2, 'api', ['src/other-file.ts']),
    ];
    const result = orderStepsByFileDependency(steps, graph);
    expect(result).toHaveLength(2);
  });
});
