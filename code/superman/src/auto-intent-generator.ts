import { callClaude, safeParseJSON, buildPrompt } from './ai/claude-client.js';
import { log, logError } from './logger.js';
import { IntentGraph } from './intent-graph.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { getCallChain } from './graph/traversal.js';
import { generateFlowIntentGraph, updateFlowIntentGraph } from './flow-generator.js';
import type { ProjectModel, CodeNode, IntentStatus } from './types.js';

/**
 * Generate a flow-first intent graph.
 * Delegates to flow-generator.ts which detects user flows,
 * NOT code structure.
 */
export async function generateIntentGraph(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
): Promise<IntentGraph> {
  return generateFlowIntentGraph(model, codeGraph);
}

/**
 * Update the intent graph after code changes.
 */
export function updateIntentGraph(
  intentGraph: IntentGraph,
  codeGraph: KnowledgeGraph,
): void {
  updateFlowIntentGraph(intentGraph, codeGraph);
}

// ── Legacy code-structure generator (kept for reference, not used) ──

async function _legacyGenerateIntentGraph(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
): Promise<IntentGraph> {
  log('intent', 'Generating multi-level intent graph (legacy)');
  const graph = new IntentGraph();

  // ── Level 0: Product purpose ──
  const productNode = await generateProductLevel(model, codeGraph, graph);

  // ── Level 1: Systems ──
  const systemNodes = generateSystemLevel(model, codeGraph, graph, productNode);

  // ── Level 2: Features ──
  for (const systemId of systemNodes) {
    generateFeatureLevel(model, codeGraph, graph, systemId);
  }

  // ── Level 3+: Implementation + Code ──
  generateImplementationLevel(codeGraph, graph);

  // ── Compute statuses bottom-up ──
  computeStatuses(graph, codeGraph);

  const stats = graph.getStats();
  log('intent', 'Intent graph generated', stats as unknown as Record<string, unknown>);

  return graph;
}

// ── Level 0: Product ──

async function generateProductLevel(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
  graph: IntentGraph,
): Promise<string> {
  const stats = codeGraph.getStats();
  const systemNames = model.systems.map((s) => s.name);
  const routeCount = model.stats.routes;
  const entityNames = model.entities.map((e) => e.name);

  let appPurpose = 'Application';

  try {
    const prompt = `In 5-10 words, what is this application?
Systems: ${systemNames.join(', ')}
Routes: ${routeCount}
Entities: ${entityNames.join(', ')}
Languages: ${Object.keys(stats.nodesByType).join(', ')}
Respond with ONLY the description, no quotes or punctuation.`;
    const response = await callClaude(prompt, 'intent');
    appPurpose = response.trim() || 'Application';
  } catch (error) {
    logError('intent', 'LLM product detection failed, using fallback', error);
    if (routeCount > 0 && entityNames.length > 0) appPurpose = 'Backend API service';
    else if (routeCount > 0) appPurpose = 'Web API';
    else appPurpose = 'Software application';
  }

  const id = 'product::root';
  graph.createNode(id, 0, appPurpose, 'product', {
    description: `${model.stats.files} files, ${model.stats.functions} functions, ${model.stats.classes} classes, ${model.stats.routes} routes`,
    status: 'partial',
  });

  log('intent', `Level 0: ${appPurpose}`);
  return id;
}

// ── Level 1: Systems ──

function generateSystemLevel(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
  graph: IntentGraph,
  productId: string,
): string[] {
  const systemIds: string[] = [];

  for (const system of model.systems) {
    const id = `system::${system.domain}`;
    graph.createNode(id, 1, system.name, 'system', {
      description: `${system.nodeIds.length} nodes, ${Math.round(system.completeness * 100)}% complete`,
      parent: productId,
      linkedCode: system.nodeIds,
      status: system.completeness >= 0.8 ? 'complete' : system.completeness > 0.3 ? 'partial' : 'planned',
    });
    graph.addChild(productId, id);
    systemIds.push(id);
  }

  // Infer missing systems that should exist
  const existingDomains = new Set(model.systems.map((s) => s.domain));
  const expectedSystems = inferExpectedSystems(model, codeGraph);

  for (const expected of expectedSystems) {
    if (!existingDomains.has(expected.domain)) {
      const id = `system::${expected.domain}`;
      graph.createNode(id, 1, expected.name, 'system', {
        description: expected.reason,
        parent: productId,
        status: 'planned',
      });
      graph.addChild(productId, id);
      systemIds.push(id);
    }
  }

  log('intent', `Level 1: ${systemIds.length} systems`);
  return systemIds;
}

function inferExpectedSystems(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
): Array<{ domain: string; name: string; reason: string }> {
  const expected: Array<{ domain: string; name: string; reason: string }> = [];
  const existingDomains = new Set(model.systems.map((s) => s.domain));

  // If there are routes but no validation → need validation
  if (model.stats.routes > 0 && !existingDomains.has('validation')) {
    expected.push({ domain: 'validation', name: 'validation', reason: 'API routes need input validation' });
  }
  // If there are routes but no error handling system
  if (model.stats.routes > 0 && !existingDomains.has('error-handling')) {
    expected.push({ domain: 'error-handling', name: 'error-handling', reason: 'API needs centralized error handling' });
  }
  // If there's auth but no rate limiting
  if (existingDomains.has('auth') && !existingDomains.has('rate-limiting')) {
    expected.push({ domain: 'rate-limiting', name: 'rate-limiting', reason: 'Auth system implies rate limiting' });
  }
  // If there are models but no database
  if (existingDomains.has('models') && !existingDomains.has('database')) {
    expected.push({ domain: 'database', name: 'database', reason: 'Models exist without database layer' });
  }
  // If there's anything but no testing
  if (model.stats.functions > 5 && !existingDomains.has('testing')) {
    expected.push({ domain: 'testing', name: 'testing', reason: 'Project needs test coverage' });
  }
  // If there's a backend but no logging
  if (model.stats.routes > 0 && !existingDomains.has('logging')) {
    expected.push({ domain: 'logging', name: 'logging', reason: 'Backend needs structured logging' });
  }

  return expected;
}

// ── Level 2: Features ──

function generateFeatureLevel(
  model: ProjectModel,
  codeGraph: KnowledgeGraph,
  graph: IntentGraph,
  systemId: string,
): void {
  const systemNode = graph.getNode(systemId);
  if (!systemNode) return;

  const domain = systemId.replace('system::', '');

  // Find code nodes belonging to this system
  const system = model.systems.find((s) => s.domain === domain);
  if (!system) {
    // This is an inferred missing system — generate expected features
    generateExpectedFeatures(graph, systemId, domain);
    return;
  }

  // Group system's code nodes by feature
  const features = groupNodesByFeature(system.nodeIds, codeGraph);

  for (const [featureName, nodeIds] of features) {
    const featureId = `feature::${domain}::${featureName}`;
    const nodes = nodeIds.map((id) => codeGraph.getNode(id)).filter(Boolean) as CodeNode[];
    const hasContent = nodes.length > 0;

    graph.createNode(featureId, 2, featureName, 'feature', {
      description: `${nodeIds.length} code nodes`,
      parent: systemId,
      linkedCode: nodeIds,
      status: hasContent ? 'partial' : 'planned',
    });
    graph.addChild(systemId, featureId);
  }

  // Also add flow-based features
  const systemFlows = model.flows.filter((f) => {
    const entryNode = codeGraph.getNode(f.entryPoint);
    if (!entryNode) return false;
    const nodeDomain = entryNode.metadata.domain || '';
    return nodeDomain === domain || system.nodeIds.includes(f.entryPoint);
  });

  for (const flow of systemFlows) {
    const featureId = `feature::${domain}::flow::${flow.name}`;
    if (graph.getNode(featureId)) continue; // avoid duplicates

    graph.createNode(featureId, 2, flow.name, 'feature', {
      description: `${flow.steps.length} steps, ${flow.complete ? 'complete' : 'incomplete'}`,
      parent: systemId,
      linkedCode: flow.steps,
      status: flow.complete ? 'complete' : flow.gaps.length > 0 ? 'partial' : 'planned',
    });
    graph.addChild(systemId, featureId);
  }
}

function groupNodesByFeature(
  nodeIds: string[],
  codeGraph: KnowledgeGraph,
): Map<string, string[]> {
  const features = new Map<string, string[]>();

  for (const nodeId of nodeIds) {
    const node = codeGraph.getNode(nodeId);
    if (!node) continue;
    if (node.type === 'import' || node.type === 'export' || node.type === 'file') continue;

    // Determine feature from the node's file and type
    let feature: string;
    if (node.type === 'route') {
      feature = `${node.metadata.httpMethod || 'GET'} ${node.metadata.routePath || node.name}`;
    } else if (node.type === 'class' || node.type === 'interface') {
      feature = node.name;
    } else {
      // Group functions by their containing file's basename
      const parts = node.filePath.split('/');
      const fileName = parts[parts.length - 1].replace(/\.\w+$/, '');
      feature = fileName;
    }

    if (!features.has(feature)) features.set(feature, []);
    features.get(feature)!.push(nodeId);
  }

  return features;
}

function generateExpectedFeatures(
  graph: IntentGraph,
  systemId: string,
  domain: string,
): void {
  const expectedFeatures: Record<string, string[]> = {
    validation: ['Input schema definitions', 'Request validation middleware', 'Error response formatting'],
    'error-handling': ['Error types/classes', 'Global error handler', 'Error logging'],
    'rate-limiting': ['Rate limiter middleware', 'Rate limit configuration', 'Rate limit storage'],
    database: ['Database connection', 'Migration system', 'Query helpers'],
    testing: ['Unit test setup', 'Integration test setup', 'Test utilities'],
    logging: ['Logger configuration', 'Request logging middleware', 'Structured log format'],
  };

  const features = expectedFeatures[domain] || [`${domain} core`];
  for (const feature of features) {
    const featureId = `feature::${domain}::${feature.toLowerCase().replace(/\s+/g, '-')}`;
    graph.createNode(featureId, 2, feature, 'feature', {
      description: `Expected feature for ${domain} system`,
      parent: systemId,
      status: 'planned',
    });
    graph.addChild(systemId, featureId);
  }
}

// ── Level 3+: Implementation + Code ──

function generateImplementationLevel(
  codeGraph: KnowledgeGraph,
  graph: IntentGraph,
): void {
  // For each feature node, create implementation-level children
  // from linked code nodes
  const featureNodes = graph.getNodesByLevel(2);

  for (const feature of featureNodes) {
    if (!feature.linkedCode || feature.linkedCode.length === 0) continue;

    for (const codeId of feature.linkedCode) {
      const codeNode = codeGraph.getNode(codeId);
      if (!codeNode) continue;
      if (codeNode.type === 'import' || codeNode.type === 'export') continue;

      // Level 3: implementation detail
      const implId = `impl::${codeId}`;
      if (graph.getNode(implId)) continue;

      graph.createNode(implId, 3, codeNode.name, 'implementation', {
        description: `${codeNode.type} in ${codeNode.filePath.split('/').pop()}`,
        parent: feature.id,
        status: 'complete', // exists in code, so it's implemented
      });
      graph.addChild(feature.id, implId);

      // Level 4: code-level — trace calls from this node
      const chain = getCallChain(codeGraph, codeId);
      for (const called of chain.slice(1, 4)) { // max 3 deep
        const codeRefId = `code::${codeId}::${called.id}`;
        if (graph.getNode(codeRefId)) continue;

        graph.createNode(codeRefId, 4, `calls ${called.name}`, 'code', {
          description: `${called.type} in ${called.filePath.split('/').pop()}`,
          parent: implId,
          linkedCode: [called.id],
          status: 'complete',
        });
        graph.addChild(implId, codeRefId);
      }
    }
  }
}

// ── Status Computation ──

function computeStatuses(graph: IntentGraph, codeGraph: KnowledgeGraph): void {
  // Bottom-up: start from leaves and propagate up
  const allNodes = graph.allNodes();

  // Sort by level descending so we process leaves first
  const sorted = [...allNodes].sort((a, b) => b.level - a.level);

  for (const node of sorted) {
    if (node.children.length === 0) {
      // Leaf node — status based on linked code
      if (node.linkedCode && node.linkedCode.length > 0) {
        const existingCode = node.linkedCode.filter((id) => codeGraph.getNode(id));
        if (existingCode.length === node.linkedCode.length) {
          node.status = 'complete';
        } else if (existingCode.length > 0) {
          node.status = 'partial';
        } else {
          node.status = 'planned';
        }
      }
      // If no linked code, keep current status (could be 'planned' for expected features)
    } else {
      // Non-leaf — derive from children
      graph.updateStatus(node.id);
    }
  }
}

// updateIntentGraph is now re-exported from flow-generator.ts above
