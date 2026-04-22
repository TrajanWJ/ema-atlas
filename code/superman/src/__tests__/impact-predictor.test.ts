import { describe, it, expect } from 'vitest';
import { predictImpact, predictImpactFromFiles } from '../impact/predictor.js';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge, StructuredFlow } from '../types.js';

function buildTestGraph(): KnowledgeGraph {
  const graph = new KnowledgeGraph();
  const nodes: CodeNode[] = [
    {
      id: 'auth',
      name: 'authenticate',
      type: 'function',
      filePath: 'auth.ts',
      language: 'typescript',
      range: { start: { line: 1, column: 0 }, end: { line: 20, column: 0 } },
      content: 'function authenticate() {}',
      metadata: {},
    },
    {
      id: 'login',
      name: 'loginHandler',
      type: 'function',
      filePath: 'login.ts',
      language: 'typescript',
      range: { start: { line: 1, column: 0 }, end: { line: 15, column: 0 } },
      content: 'function loginHandler() { authenticate(); }',
      metadata: {},
    },
  ];
  const edges: CodeEdge[] = [
    { source: 'login', target: 'auth', type: 'calls' },
  ];
  graph.build(nodes, edges);
  return graph;
}

function buildTestFlows(): StructuredFlow[] {
  return [{
    name: 'Login Flow',
    id: 'login-flow',
    description: 'User login flow',
    entryPoint: 'login',
    steps: [{
      id: 'step-1',
      userAction: 'User logs in',
      systemResponse: 'Authenticated',
      relatedCode: ['login'],
      status: 'implemented',
    }],
    completeness: 1,
    confidence: 0.9,
    relatedFiles: ['login.ts'],
  }];
}

describe('predictImpact', () => {
  it('returns impact result with overall risk', () => {
    const result = predictImpact('change authentication logic', buildTestGraph(), buildTestFlows());
    expect(result).toBeDefined();
    expect(result.overallRisk).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(result.overallRisk);
    expect(result.recommendation).toBeDefined();
  });
});

describe('predictImpactFromFiles', () => {
  it('analyzes impact from file paths', () => {
    const result = predictImpactFromFiles(['auth.ts'], buildTestGraph(), buildTestFlows());
    expect(result).toBeDefined();
    expect(result.overallRisk).toBeDefined();
  });
});
