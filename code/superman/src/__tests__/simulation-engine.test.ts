import { describe, it, expect } from 'vitest';
import { simulateFlow, simulateAllFlows } from '../simulation/engine.js';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge, StructuredFlow, FlowStep } from '../types.js';

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

function makeFlowStep(nodeId: string, action: string = 'User action'): FlowStep {
  return {
    id: nodeId,
    userAction: action,
    systemResponse: 'Response',
    relatedCode: [nodeId],
    status: 'implemented',
  };
}

function makeFlow(name: string, steps: FlowStep[]): StructuredFlow {
  return {
    name,
    id: name.toLowerCase().replace(/\s/g, '-'),
    description: `${name} flow`,
    entryPoint: steps[0]?.id || '',
    steps,
    completeness: 0.5,
    confidence: 0.8,
    relatedFiles: [],
  };
}

describe('simulateFlow', () => {
  it('returns simulation result', () => {
    const graph = makeGraph([{
      id: 'login-handler',
      name: 'handleLogin',
      content: 'function handleLogin() { setState(true); }',
    }]);
    const flow = makeFlow('Login', [makeFlowStep('login-handler', 'User clicks login')]);
    const result = simulateFlow(flow, graph);
    expect(result).toBeDefined();
    expect(result.flow).toBe('Login');
    expect(result.steps).toHaveLength(1);
  });

  it('detects missing handler', () => {
    const graph = makeGraph([]);
    const flow = makeFlow('Missing', [makeFlowStep('nonexistent', 'Click button')]);
    const result = simulateFlow(flow, graph);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.type === 'missing_handler')).toBe(true);
  });

  it('returns chains array in result', () => {
    const graph = makeGraph([{
      id: 'btn-handler',
      name: 'handleClick',
      content: 'function handleClick() { fetch("/api/data"); }',
    }]);
    const flow = makeFlow('Click', [makeFlowStep('btn-handler', 'User clicks button')]);
    const result = simulateFlow(flow, graph);
    expect(result.chains).toBeDefined();
    expect(Array.isArray(result.chains)).toBe(true);
  });

  it('traces chain layers for a complete flow', () => {
    // Build a chain: UI handler -> API call -> DB -> response
    const graph = makeGraph([
      { id: 'ui', name: 'handleSubmit', content: 'function handleSubmit() { onSubmit(); callApi(); }' },
      { id: 'api', name: 'callApi', content: 'async function callApi() { const resp = await fetch("/api/users"); validate(resp); }' },
      { id: 'val', name: 'validate', content: 'function validate(data) { const schema = z.object({}); schema.safeParse(data); saveToDb(); }' },
      { id: 'db', name: 'saveToDb', content: 'async function saveToDb() { await prisma.user.create({}); sendResponse(); }' },
      { id: 'resp', name: 'sendResponse', content: 'function sendResponse() { res.json({ ok: true }); }' },
    ], [
      { source: 'ui', target: 'api', type: 'calls' },
      { source: 'api', target: 'val', type: 'calls' },
      { source: 'val', target: 'db', type: 'calls' },
      { source: 'db', target: 'resp', type: 'calls' },
    ]);

    const flow = makeFlow('Submit', [makeFlowStep('ui', 'User submits form')]);
    const result = simulateFlow(flow, graph);

    expect(result.chains).toHaveLength(1);
    const chain = result.chains[0];
    expect(chain.stepIndex).toBe(0);

    // Should find multiple layers
    const layers = chain.links.map((l) => l.layer);
    expect(layers).toContain('ui_handler');
    expect(layers).toContain('api_call');
    expect(layers).toContain('validation');
    expect(layers).toContain('database');
    expect(layers).toContain('response');
  });

  it('detects missing chain layers', () => {
    // Handler with no downstream calls — only UI handler, no API/DB/response
    const graph = makeGraph([{
      id: 'lonely',
      name: 'handleClick',
      content: 'function handleClick() { onClick(); console.log("clicked"); }',
    }]);

    const flow = makeFlow('Lonely', [makeFlowStep('lonely', 'User clicks')]);
    const result = simulateFlow(flow, graph);

    // Should have missing_chain_layer issues
    const chainIssues = result.issues.filter((i) => i.type === 'missing_chain_layer');
    expect(chainIssues.length).toBeGreaterThan(0);

    // Should report missing api/db and response
    const descriptions = chainIssues.map((i) => i.description).join(' ');
    expect(descriptions).toContain('api_call or database');
    expect(descriptions).toContain('response or state_update');
  });

  it('detects broken chain (isolated handler)', () => {
    const graph = makeGraph([{
      id: 'isolated',
      name: 'handleAction',
      content: 'function handleAction() { onClick(); }',
    }]);

    const flow = makeFlow('Isolated', [makeFlowStep('isolated', 'User acts')]);
    const result = simulateFlow(flow, graph);

    expect(result.issues.some((i) => i.type === 'broken_chain')).toBe(true);
  });

  it('marks chain as complete when all critical layers present', () => {
    const graph = makeGraph([
      { id: 'handler', name: 'handleForm', content: 'function handleForm() { onSubmit(); callApi(); }' },
      { id: 'api', name: 'callApi', content: 'async function callApi() { await fetch("/api"); try { handleErr(); } catch(e) {} }' },
      { id: 'db', name: 'handleErr', content: 'async function handleErr() { await prisma.item.create({}); setState({ done: true }); }' },
    ], [
      { source: 'handler', target: 'api', type: 'calls' },
      { source: 'api', target: 'db', type: 'calls' },
    ]);

    const flow = makeFlow('Complete', [makeFlowStep('handler', 'Submit form')]);
    const result = simulateFlow(flow, graph);

    expect(result.chains).toHaveLength(1);
    expect(result.chains[0].complete).toBe(true);
    expect(result.chains[0].missingLayers).toHaveLength(0);
  });

  it('chain links include file path and line number', () => {
    const graph = makeGraph([{
      id: 'handler',
      name: 'processOrder',
      filePath: 'src/orders.ts',
      content: 'function processOrder() { onSubmit(); fetch("/api/orders"); }',
    }]);

    const flow = makeFlow('Order', [makeFlowStep('handler', 'Process order')]);
    const result = simulateFlow(flow, graph);

    if (result.chains.length > 0 && result.chains[0].links.length > 0) {
      const link = result.chains[0].links[0];
      expect(link.filePath).toBe('src/orders.ts');
      expect(typeof link.line).toBe('number');
      expect(link.nodeName).toBe('processOrder');
    }
  });

  it('generates improvement suggestions for missing chain layers', () => {
    const graph = makeGraph([{
      id: 'btn',
      name: 'handleBtn',
      content: 'function handleBtn() { onClick(); }',
    }]);

    const flow = makeFlow('Btn', [makeFlowStep('btn', 'Click')]);
    const result = simulateFlow(flow, graph);

    expect(result.improvements.some((i) => i.includes('execution chains'))).toBe(true);
  });
});

describe('simulateAllFlows', () => {
  it('simulates multiple flows', () => {
    const graph = makeGraph([
      { id: 'h1', name: 'handler1', content: '' },
      { id: 'h2', name: 'handler2', content: '' },
    ]);
    const flows = [
      makeFlow('Flow A', [makeFlowStep('h1', 'Step 1')]),
      makeFlow('Flow B', [makeFlowStep('h2', 'Step 1')]),
    ];
    const results = simulateAllFlows(flows, graph);
    expect(results).toHaveLength(2);
  });

  it('all results include chains', () => {
    const graph = makeGraph([
      { id: 'h1', name: 'handler1', content: 'function handler1() { fetch("/api"); }' },
      { id: 'h2', name: 'handler2', content: 'function handler2() { setState({}); }' },
    ]);
    const flows = [
      makeFlow('Flow A', [makeFlowStep('h1', 'Step 1')]),
      makeFlow('Flow B', [makeFlowStep('h2', 'Step 1')]),
    ];
    const results = simulateAllFlows(flows, graph);
    for (const result of results) {
      expect(result.chains).toBeDefined();
    }
  });
});
