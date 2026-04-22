import { describe, it, expect, beforeEach } from 'vitest';
import { traceCompleteFlow } from '../flow-engine';
import { KnowledgeGraph } from '../graph/knowledge-graph';
import type { CodeNode, CodeEdge, CompleteFlow, BrokenStep } from '../types';

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

function buildTestGraph(): KnowledgeGraph {
  const graph = new KnowledgeGraph();
  const nodes: CodeNode[] = [
    makeNode({
      id: 'route-handler',
      name: 'handleCreateLoad',
      type: 'route',
      filePath: 'src/routes/loads.ts',
      content: 'async function handleCreateLoad(req, res) { const data = req.body; const load = await createLoad(data); res.json(load); }',
      metadata: { httpMethod: 'POST', routePath: '/api/loads' },
    }),
    makeNode({
      id: 'fn-create',
      name: 'createLoad',
      filePath: 'src/services/loads.ts',
      content: 'async function createLoad(data) { const result = await prisma.load.create({ data }); return result; }',
    }),
    makeNode({
      id: 'fn-validate',
      name: 'validateLoad',
      filePath: 'src/validators/loads.ts',
      content: 'function validateLoad(data) { return zod.parse(data); }',
    }),
    makeNode({
      id: 'fn-stub',
      name: 'notifyCarriers',
      filePath: 'src/services/notifications.ts',
      content: '// TODO',
    }),
    makeNode({
      id: 'fn-external',
      name: 'sendEmail',
      filePath: 'src/services/email.ts',
      content: 'async function sendEmail(to, body) { await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST" }); }',
    }),
    makeNode({
      id: 'fn-noerror',
      name: 'processPayment',
      filePath: 'src/services/billing.ts',
      content: 'async function processPayment(amount) { const result = await stripe.charges.create({ amount }); return result; }',
    }),
  ];

  const edges: CodeEdge[] = [
    { source: 'route-handler', target: 'fn-create', type: 'calls' },
    { source: 'fn-create', target: 'fn-stub', type: 'calls' },
    { source: 'fn-create', target: 'fn-external', type: 'calls' },
    { source: 'fn-create', target: 'fn-noerror', type: 'calls' },
  ];

  graph.build(nodes, edges);
  return graph;
}

describe('traceCompleteFlow', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = buildTestGraph();
  });

  it('traces a complete flow from entry point', () => {
    const flow = traceCompleteFlow(graph, 'route-handler', 'Create Load');
    expect(flow.name).toBe('Create Load');
    expect(flow.entryPoint).toBe('route-handler');
    expect(flow.chain.length).toBeGreaterThan(0);
    expect(flow.chain[0].nodeId).toBe('route-handler');
  });

  it('detects broken steps (empty stubs)', () => {
    const flow = traceCompleteFlow(graph, 'route-handler', 'Create Load');
    const stubBreaks = flow.brokenSteps.filter(b => b.reason.includes('empty'));
    expect(stubBreaks.length).toBeGreaterThan(0);
    expect(stubBreaks[0].nodeId).toBe('fn-stub');
  });

  it('detects missing error handling on async calls', () => {
    const flow = traceCompleteFlow(graph, 'route-handler', 'Create Load');
    const errorBreaks = flow.brokenSteps.filter(b => b.reason.includes('error handling'));
    expect(errorBreaks.length).toBeGreaterThan(0);
  });

  it('detects external services', () => {
    const flow = traceCompleteFlow(graph, 'route-handler', 'Create Load');
    expect(flow.externalServices.length).toBeGreaterThan(0);
  });

  it('handles missing entry point', () => {
    const flow = traceCompleteFlow(graph, 'nonexistent-id', 'Missing Flow');
    expect(flow.isComplete).toBe(false);
    expect(flow.brokenSteps.length).toBeGreaterThan(0);
    expect(flow.brokenSteps[0].severity).toBe('critical');
  });

  it('records chain order', () => {
    const flow = traceCompleteFlow(graph, 'route-handler', 'Create Load');
    for (let i = 0; i < flow.chain.length; i++) {
      expect(flow.chain[i].order).toBe(i);
    }
  });

  it('detects unvalidated input on POST routes', () => {
    // Build a graph with a route that has req.body but no validation
    const g = new KnowledgeGraph();
    g.build([
      makeNode({
        id: 'unvalidated-route',
        name: 'handlePost',
        type: 'route',
        filePath: 'src/routes/api.ts',
        content: 'async function handlePost(req, res) { const data = req.body; await save(data); res.json({ ok: true }); }',
        metadata: { httpMethod: 'POST' },
      }),
    ], []);

    const flow = traceCompleteFlow(g, 'unvalidated-route', 'Unvalidated Post');
    const validationBreaks = flow.brokenSteps.filter(b => b.reason.includes('validation'));
    expect(validationBreaks.length).toBeGreaterThan(0);
  });

  it('marks flow as incomplete when broken steps exist', () => {
    const flow = traceCompleteFlow(graph, 'route-handler', 'Create Load');
    // Should have broken steps (stub, async without error handling)
    expect(flow.brokenSteps.length).toBeGreaterThan(0);
    expect(flow.isComplete).toBe(false);
  });

  it('marks flow as complete when no broken steps', () => {
    const g = new KnowledgeGraph();
    g.build([
      makeNode({
        id: 'clean-fn',
        name: 'healthCheck',
        filePath: 'src/routes/health.ts',
        content: 'function healthCheck(req, res) { res.json({ status: "ok" }); }',
      }),
    ], []);

    const flow = traceCompleteFlow(g, 'clean-fn', 'Health Check');
    expect(flow.isComplete).toBe(true);
    expect(flow.brokenSteps).toHaveLength(0);
  });
});
