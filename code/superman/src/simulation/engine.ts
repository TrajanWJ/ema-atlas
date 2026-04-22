import { log } from '../logger.js';
import { getCallChain } from '../graph/traversal.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { StructuredFlow, FlowStep, CodeNode, CodeEdge } from '../types.js';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface FlowSimulation {
  flow: string;
  steps: SimulatedStep[];
  issues: SimulationIssue[];
  improvements: string[];
  overallValidity: number;
  /** Full chain traces for each step (new in v2) */
  chains: StepChain[];
}

export interface SimulatedStep {
  userAction: string;
  handlerFound: boolean;
  stateTransitionValid: boolean;
  systemResponseCorrect: boolean;
  codeRefs: string[];
}

/** A traced execution chain for a single flow step */
export interface StepChain {
  stepIndex: number;
  links: ChainLink[];
  complete: boolean;
  missingLayers: string[];
}

/** One link in an execution chain */
export interface ChainLink {
  layer: ChainLayer;
  nodeId: string;
  nodeName: string;
  filePath: string;
  line: number;
  evidence: string;
}

export type ChainLayer =
  | 'ui_handler'
  | 'api_call'
  | 'validation'
  | 'middleware'
  | 'database'
  | 'response'
  | 'state_update'
  | 'navigation'
  | 'error_handling';

export interface SimulationIssue {
  step: number;
  type: 'missing_handler' | 'broken_transition' | 'no_response' | 'dead_end' | 'redundant' | 'missing_chain_layer' | 'broken_chain';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_PATTERNS = /\b(fetch|axios|http|request|api\.|\.get\(|\.post\(|\.put\(|\.delete\(|\.patch\(|graphql|query\(|mutate\()/i;
const STATE_PATTERNS = /\b(setState|dispatch|set\(|\.set\(|commit|patchState|assign|produce|store\.)/i;
const NAV_PATTERNS = /\b(router\.push|router\.replace|navigate\(|redirect\(|history\.push|window\.location|href\s*=)/i;
const COMPLETION_PATTERNS = /\b(toast|notify|alert|modal|redirect|router\.push|navigate|onSuccess|onComplete|resetForm|reset\(|clearState)/i;

// Layer detection patterns for chain tracing
const LAYER_PATTERNS: Array<{ layer: ChainLayer; pattern: RegExp; evidence: string }> = [
  { layer: 'ui_handler', pattern: /\b(onClick|onSubmit|onChange|onPress|handleClick|handleSubmit|addEventListener|useCallback)\b/i, evidence: 'UI event handler' },
  { layer: 'api_call', pattern: /\b(fetch|axios|http|\.get\(|\.post\(|\.put\(|\.delete\(|\.patch\(|graphql|query\(|mutate\(|api\.|apiFetch|useSWR|useQuery|useMutation)/i, evidence: 'API/HTTP call' },
  { layer: 'validation', pattern: /\b(validate|schema|parse|safeParse|zod|joi|yup|z\.\w+|check\(|isValid|sanitize)/i, evidence: 'Input validation' },
  { layer: 'middleware', pattern: /\b(middleware|authenticate|authorize|requireAuth|protect|guard|interceptor|use\(|app\.use)/i, evidence: 'Middleware/auth' },
  { layer: 'database', pattern: /\b(prisma|sequelize|mongoose|knex|db\.|\.findMany|\.findFirst|\.create\(|\.update\(|\.delete\(|\.findUnique|query\(|\.save\(|\.insert|\.select|Model\.\w+)/i, evidence: 'Database operation' },
  { layer: 'response', pattern: /\b(res\.json|res\.send|res\.status|return\s+Response|NextResponse|json\(|res\.redirect)/i, evidence: 'HTTP response' },
  { layer: 'state_update', pattern: /\b(setState|dispatch|set\(|\.set\(|commit|patchState|store\.|revalidate|mutate\(|invalidate)/i, evidence: 'State update' },
  { layer: 'navigation', pattern: /\b(router\.push|router\.replace|navigate\(|redirect\(|history\.push|window\.location|href\s*=)/i, evidence: 'Navigation/redirect' },
  { layer: 'error_handling', pattern: /\b(try\s*\{|\.catch\(|catch\s*\(|throw\s+new|res\.status\(4|res\.status\(5|error\s*:|onError)/i, evidence: 'Error handling' },
];

function resolveNodes(ids: string[], graph: KnowledgeGraph): CodeNode[] {
  const nodes: CodeNode[] = [];
  for (const id of ids) {
    const node = graph.getNode(id);
    if (node) {
      nodes.push(node as CodeNode);
    }
  }
  return nodes;
}

function contentHasPattern(nodes: CodeNode[], pattern: RegExp): boolean {
  return nodes.some((n) => pattern.test(n.content));
}

function getNodeIds(nodes: CodeNode[]): Set<string> {
  const ids = new Set<string>();
  for (const n of nodes) {
    ids.add(n.id);
  }
  return ids;
}

/**
 * Classify which chain layer a code node belongs to based on its content.
 */
function classifyNodeLayers(node: CodeNode): ChainLink[] {
  const links: ChainLink[] = [];
  for (const { layer, pattern, evidence } of LAYER_PATTERNS) {
    if (pattern.test(node.content)) {
      links.push({
        layer,
        nodeId: node.id,
        nodeName: node.name,
        filePath: node.filePath,
        line: node.range.start.line,
        evidence,
      });
    }
  }
  return links;
}

/**
 * Trace a complete execution chain for a flow step.
 * Follows the call graph from entry-point nodes and classifies each node
 * into a chain layer, producing a connected trace like:
 *   ui_handler → api_call → validation → database → response → state_update
 */
function traceStepChain(
  entryNodes: CodeNode[],
  graph: KnowledgeGraph,
): StepChain {
  const links: ChainLink[] = [];
  const seenLayers = new Set<ChainLayer>();
  const seenNodes = new Set<string>();

  // Trace forward from each entry node through call chains
  for (const entry of entryNodes) {
    const chain = getCallChain(graph, entry.id);

    for (const node of chain) {
      if (seenNodes.has(node.id)) continue;
      seenNodes.add(node.id);

      const nodeLinks = classifyNodeLayers(node);
      for (const link of nodeLinks) {
        if (!seenLayers.has(link.layer)) {
          links.push(link);
          seenLayers.add(link.layer);
        }
      }
    }
  }

  // Determine which critical layers are missing
  // A complete flow typically needs at least: handler + (api or db) + (response or state)
  const missingLayers: string[] = [];
  const hasHandler = seenLayers.has('ui_handler');
  const hasApiOrDb = seenLayers.has('api_call') || seenLayers.has('database');
  const hasResponse = seenLayers.has('response') || seenLayers.has('state_update') || seenLayers.has('navigation');
  const hasErrorHandling = seenLayers.has('error_handling');

  if (!hasHandler && entryNodes.length > 0) missingLayers.push('ui_handler');
  if (!hasApiOrDb) missingLayers.push('api_call or database');
  if (!hasResponse) missingLayers.push('response or state_update');
  if (!hasErrorHandling) missingLayers.push('error_handling');

  return {
    stepIndex: -1, // Caller sets this
    links,
    complete: hasHandler && hasApiOrDb && hasResponse,
    missingLayers,
  };
}

/**
 * Check whether any node in setA has an edge (calls / imports) leading to any
 * node in setB, meaning there is a code-level transition between the two sets.
 */
function hasCodePath(
  nodesA: CodeNode[],
  nodesB: CodeNode[],
  graph: KnowledgeGraph,
): boolean {
  const targetIds = getNodeIds(nodesB);

  for (const nodeA of nodesA) {
    // Direct edges from nodeA
    const edges = graph.getEdgesFor(nodeA.id, 'forward');
    for (const edge of edges) {
      const edgeTarget: string =
        (edge as any).target ?? (edge as any).to ?? (edge as any).targetId ?? '';
      if (targetIds.has(edgeTarget)) {
        return true;
      }
    }

    // Also check neighbors
    const neighbors = graph.getNeighbors(nodeA.id, 'forward');
    for (const neighbor of neighbors) {
      const nId = typeof neighbor === 'string' ? neighbor : (neighbor as any).id;
      if (targetIds.has(nId)) {
        return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Core: simulateFlow
// ---------------------------------------------------------------------------

export function simulateFlow(
  flow: StructuredFlow,
  graph: KnowledgeGraph,
): FlowSimulation {
  log('simulate', `Simulating flow: ${flow.name}`);

  const simulatedSteps: SimulatedStep[] = [];
  const issues: SimulationIssue[] = [];
  const resolvedPerStep: CodeNode[][] = [];
  const chains: StepChain[] = [];

  // ---- Walk each step ----
  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const nodes = resolveNodes(step.relatedCode, graph);
    resolvedPerStep.push(nodes);

    const handlerFound = nodes.length > 0;
    const systemResponseCorrect = handlerFound && (
      contentHasPattern(nodes, API_PATTERNS) ||
      contentHasPattern(nodes, STATE_PATTERNS) ||
      contentHasPattern(nodes, NAV_PATTERNS)
    );
    const stateTransitionValid = handlerFound && (
      contentHasPattern(nodes, STATE_PATTERNS) ||
      contentHasPattern(nodes, NAV_PATTERNS)
    );

    simulatedSteps.push({
      userAction: step.userAction,
      handlerFound,
      stateTransitionValid,
      systemResponseCorrect,
      codeRefs: nodes.map((n) => n.id),
    });

    // ---- Chain tracing: trace full execution path from this step's handlers ----
    if (handlerFound) {
      const chain = traceStepChain(nodes, graph);
      chain.stepIndex = i;
      chains.push(chain);

      // Report missing chain layers as issues
      if (!chain.complete && chain.links.length > 0) {
        for (const missing of chain.missingLayers) {
          issues.push({
            step: i,
            type: 'missing_chain_layer',
            description: `Step ${i} ("${step.userAction}") chain is missing ${missing}. Traced layers: ${chain.links.map((l) => l.layer).join(' → ')}.`,
            severity: missing.includes('error_handling') ? 'medium' : 'high',
          });
        }
      }

      // Check for broken chain: handler exists but no downstream call chain at all
      if (chain.links.length <= 1 && nodes.length > 0) {
        const callChainLen = nodes.reduce((max, n) => {
          const chain = getCallChain(graph, n.id);
          return Math.max(max, chain.length);
        }, 0);
        if (callChainLen <= 1) {
          issues.push({
            step: i,
            type: 'broken_chain',
            description: `Step ${i} ("${step.userAction}") handler "${nodes[0].name}" has no downstream call chain — it's an isolated function.`,
            severity: 'medium',
          });
        }
      }
    }

    // --- Detect issues ---

    // missing_handler
    if (!handlerFound) {
      issues.push({
        step: i,
        type: 'missing_handler',
        description: `Step ${i} ("${step.userAction}") has no resolvable code handler.`,
        severity: 'high',
      });
    }

    // no_response
    if (handlerFound && !systemResponseCorrect) {
      issues.push({
        step: i,
        type: 'no_response',
        description: `Step ${i} ("${step.userAction}") has a handler but no API call, state update, or navigation.`,
        severity: 'medium',
      });
    }

    // redundant – adjacent steps call the same function
    if (i > 0) {
      const prevIds = getNodeIds(resolvedPerStep[i - 1]);
      const curIds = getNodeIds(nodes);
      const overlap = [...curIds].filter((id) => prevIds.has(id));
      if (overlap.length > 0 && curIds.size > 0 && prevIds.size > 0) {
        issues.push({
          step: i,
          type: 'redundant',
          description: `Steps ${i - 1} and ${i} both invoke the same function(s): ${overlap.join(', ')}.`,
          severity: 'low',
        });
      }
    }
  }

  // ---- Transition checks between consecutive steps ----
  for (let i = 0; i < flow.steps.length - 1; i++) {
    const nodesA = resolvedPerStep[i];
    const nodesB = resolvedPerStep[i + 1];

    if (nodesA.length === 0 || nodesB.length === 0) {
      // Already flagged as missing_handler; skip transition check.
      continue;
    }

    if (!hasCodePath(nodesA, nodesB, graph)) {
      issues.push({
        step: i,
        type: 'broken_transition',
        description: `No code path found from step ${i} to step ${i + 1}.`,
        severity: 'high',
      });
    }
  }

  // ---- Dead-end check on last step ----
  if (flow.steps.length > 0) {
    const lastNodes = resolvedPerStep[resolvedPerStep.length - 1];
    if (lastNodes.length > 0 && !contentHasPattern(lastNodes, COMPLETION_PATTERNS)) {
      issues.push({
        step: flow.steps.length - 1,
        type: 'dead_end',
        description: `Last step ("${flow.steps[flow.steps.length - 1].userAction}") has no completion action (redirect, toast, state reset).`,
        severity: 'medium',
      });
    }
  }

  // ---- Generate improvements ----
  const improvements: string[] = [];
  const issueTypes = new Set(issues.map((iss) => iss.type));

  if (issueTypes.has('missing_handler')) {
    improvements.push(
      'Add handler functions for steps that currently lack code references.',
    );
  }
  if (issueTypes.has('broken_transition')) {
    improvements.push(
      'Establish explicit code paths (calls or shared state) between consecutive steps to ensure flow continuity.',
    );
  }
  if (issueTypes.has('no_response')) {
    improvements.push(
      'Ensure every handler produces a visible system response: an API call, state update, or navigation action.',
    );
  }
  if (issueTypes.has('dead_end')) {
    improvements.push(
      'Add a completion action to the final step (e.g., success toast, redirect to dashboard, or form reset).',
    );
  }
  if (issueTypes.has('redundant')) {
    improvements.push(
      'Consolidate adjacent steps that invoke the same function to reduce redundancy.',
    );
  }
  if (issueTypes.has('missing_chain_layer')) {
    improvements.push(
      'Complete execution chains: ensure each step traces through handler → API/DB → response/state. Add missing layers.',
    );
  }
  if (issueTypes.has('broken_chain')) {
    improvements.push(
      'Connect isolated handler functions to downstream services via explicit calls (API routes, DB operations, state updates).',
    );
  }

  // ---- Overall validity (enhanced: factor in chain completeness) ----
  const validSteps = simulatedSteps.filter(
    (s) => s.handlerFound && s.systemResponseCorrect,
  ).length;
  const completeChains = chains.filter((c) => c.complete).length;
  const chainBonus = chains.length > 0 ? (completeChains / chains.length) * 0.2 : 0;
  const baseValidity = flow.steps.length > 0 ? validSteps / flow.steps.length : 0;
  const overallValidity = Math.min(1, baseValidity * 0.8 + chainBonus);

  const result: FlowSimulation = {
    flow: flow.name,
    steps: simulatedSteps,
    issues,
    improvements,
    overallValidity,
    chains,
  };

  log('simulate', `Flow "${flow.name}" simulated — validity: ${(overallValidity * 100).toFixed(1)}%, issues: ${issues.length}, chains: ${chains.length} (${completeChains} complete)`);
  return result;
}

// ---------------------------------------------------------------------------
// simulateAllFlows
// ---------------------------------------------------------------------------

export function simulateAllFlows(
  flows: StructuredFlow[],
  graph: KnowledgeGraph,
): FlowSimulation[] {
  log('simulate', `Simulating ${flows.length} flow(s)`);
  return flows.map((flow) => simulateFlow(flow, graph));
}

// ---------------------------------------------------------------------------
// validateTransition
// ---------------------------------------------------------------------------

export function validateTransition(
  stepA: FlowStep,
  stepB: FlowStep,
  graph: KnowledgeGraph,
): boolean {
  const nodesA = resolveNodes(stepA.relatedCode, graph);
  const nodesB = resolveNodes(stepB.relatedCode, graph);

  if (nodesA.length === 0 || nodesB.length === 0) {
    return false;
  }

  return hasCodePath(nodesA, nodesB, graph);
}

// ---------------------------------------------------------------------------
// Legacy wrappers
// ---------------------------------------------------------------------------

/**
 * @deprecated Use `simulateFlow` instead. This is a legacy wrapper retained
 * for backward compatibility.
 */
export function simulate(
  flow: StructuredFlow,
  graph: KnowledgeGraph,
): FlowSimulation {
  log('simulate', 'Legacy simulate() called — delegating to simulateFlow()');
  return simulateFlow(flow, graph);
}

/**
 * @deprecated Use `simulateFlow` instead. This is a legacy wrapper retained
 * for backward compatibility. The LLM parameter is ignored; the new engine
 * performs deterministic analysis only.
 */
export function simulateWithLLM(
  flow: StructuredFlow,
  graph: KnowledgeGraph,
  _llmOptions?: unknown,
): FlowSimulation {
  log('simulate', 'Legacy simulateWithLLM() called — delegating to simulateFlow()');
  return simulateFlow(flow, graph);
}
