import { log } from '../logger.js';
import { getReverseDependencies } from '../graph/traversal.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { StructuredFlow, CodeNode } from '../types.js';
import type { TFIDFIndex } from '../semantic/tfidf.js';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface ImpactResult {
  affectedFlows: Array<{
    flow: string;
    flowId: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    affectedSteps: number;
    totalSteps: number;
  }>;
  affectedFunctions: Array<{ name: string; file: string; id: string }>;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyRisk(ratio: number): 'low' | 'medium' | 'high' | 'critical' {
  if (ratio > 0.85) return 'critical';
  if (ratio > 0.70) return 'high';
  if (ratio > 0.50) return 'medium';
  return 'low';
}

/**
 * Build a set of keywords from a description string for naive matching
 * against code node names / content.
 */
function extractKeywords(description: string): string[] {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Check whether a code node matches any of the provided keywords by
 * looking at its name and content.
 */
function nodeMatchesKeywords(node: CodeNode, keywords: string[]): boolean {
  const haystack = `${node.name} ${node.content}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

/**
 * Determine whether a given node affects a flow.  A node affects a flow if:
 *   - its filePath appears in the flow's relatedFiles, OR
 *   - its id appears in any step's relatedCode
 */
function nodeAffectsFlow(node: CodeNode, flow: StructuredFlow): boolean {
  if (flow.relatedFiles.includes(node.filePath)) {
    return true;
  }
  for (const step of flow.steps) {
    if (step.relatedCode.includes(node.id)) {
      return true;
    }
  }
  return false;
}

/**
 * Count how many steps of a flow are touched by any of the affected node ids.
 */
function countAffectedSteps(
  flow: StructuredFlow,
  affectedIds: Set<string>,
  affectedFiles: Set<string>,
): number {
  let count = 0;
  for (const step of flow.steps) {
    const touched = step.relatedCode.some((ref) => affectedIds.has(ref)) ||
      affectedIds.size === 0 && affectedFiles.size > 0; // fallback: file-level match
    if (touched) {
      count++;
    }
  }
  return count;
}

/**
 * Check if the entry point (first step) of a flow is affected.
 */
function entryPointAffected(
  flow: StructuredFlow,
  affectedIds: Set<string>,
): boolean {
  if (flow.steps.length === 0) return false;
  return flow.steps[0].relatedCode.some((ref) => affectedIds.has(ref));
}

/**
 * Collect reverse dependencies up to a given depth and return all discovered
 * node ids.
 */
function collectReverseDeps(
  startIds: string[],
  graph: KnowledgeGraph,
  maxDepth: number,
): Set<string> {
  const visited = new Set<string>(startIds);
  let frontier = [...startIds];

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextFrontier: string[] = [];
    for (const id of frontier) {
      const deps = getReverseDependencies(graph, id);
      for (const dep of deps) {
        const depId = typeof dep === 'string' ? dep : (dep as any).id ?? '';
        if (!visited.has(depId)) {
          visited.add(depId);
          nextFrontier.push(depId);
        }
      }
    }
    frontier = nextFrontier;
    if (frontier.length === 0) break;
  }

  return visited;
}

/**
 * Produce a human-readable recommendation based on the overall risk and the
 * number of affected flows.
 */
function buildRecommendation(
  overallRisk: 'low' | 'medium' | 'high' | 'critical',
  affectedCount: number,
): string {
  switch (overallRisk) {
    case 'critical':
      return `Critical impact detected across ${affectedCount} flow(s). Full regression testing and careful code review are strongly recommended before merging.`;
    case 'high':
      return `High impact on ${affectedCount} flow(s). Targeted integration tests should be run for all affected flows.`;
    case 'medium':
      return `Moderate impact on ${affectedCount} flow(s). Review the affected steps and run related unit tests.`;
    case 'low':
      return affectedCount > 0
        ? `Low impact on ${affectedCount} flow(s). Standard testing should suffice.`
        : 'No user-facing flows appear to be affected. Standard testing should suffice.';
  }
}

// ---------------------------------------------------------------------------
// Core: predictImpact
// ---------------------------------------------------------------------------

export function predictImpact(
  description: string,
  graph: KnowledgeGraph,
  flows: StructuredFlow[],
  tfidfIndex?: TFIDFIndex | null,
): ImpactResult {
  log('auto', `Predicting impact for: "${description.slice(0, 80)}..."`);

  // ------ Step 1: Find affected code nodes ------
  const affectedNodeMap = new Map<string, CodeNode>();

  // 1a. Semantic search via TF-IDF
  if (tfidfIndex) {
    const semanticHits = tfidfIndex.querySimilar(description, 20);
    for (const hit of semanticHits) {
      const id = typeof hit === 'string' ? hit : (hit as any).id ?? (hit as any).docId ?? '';
      if (id) {
        const node = graph.getNode(id) as CodeNode | undefined;
        if (node) {
          affectedNodeMap.set(node.id, node);
        }
      }
    }
  }

  // 1b. Keyword matching against all function nodes
  const keywords = extractKeywords(description);
  if (keywords.length > 0) {
    const functionNodes = graph.findByType('function') as CodeNode[];
    for (const node of functionNodes) {
      if (!affectedNodeMap.has(node.id) && nodeMatchesKeywords(node, keywords)) {
        affectedNodeMap.set(node.id, node);
      }
    }
    // Also check other common node types
    for (const nodeType of ['component', 'class', 'method'] as const) {
      try {
        const nodes = graph.findByType(nodeType as any) as CodeNode[];
        for (const node of nodes) {
          if (!affectedNodeMap.has(node.id) && nodeMatchesKeywords(node, keywords)) {
            affectedNodeMap.set(node.id, node);
          }
        }
      } catch {
        // Type may not exist in this graph — ignore.
      }
    }
  }

  const directlyAffected = [...affectedNodeMap.values()];
  log('auto', `Found ${directlyAffected.length} directly affected node(s)`);

  // Build quick-access sets
  const directIds = new Set(directlyAffected.map((n) => n.id));
  const directFiles = new Set(directlyAffected.map((n) => n.filePath));

  // ------ Step 2 & 3: Map to flows, including reverse deps ------
  const allAffectedIds = collectReverseDeps([...directIds], graph, 2);

  // Resolve all affected ids to nodes (for the affectedFunctions list)
  const allAffectedNodes: CodeNode[] = [];
  for (const id of allAffectedIds) {
    const node = graph.getNode(id) as CodeNode | undefined;
    if (node) {
      allAffectedNodes.push(node);
    }
  }

  const allAffectedFiles = new Set(allAffectedNodes.map((n) => n.filePath));

  // ------ Step 4: Score each flow ------
  const affectedFlows: ImpactResult['affectedFlows'] = [];

  for (const flow of flows) {
    // Check direct relationship
    const directHit = directlyAffected.some((n) => nodeAffectsFlow(n, flow));
    // Check transitive relationship (reverse deps)
    const transitiveHit = !directHit && allAffectedNodes.some((n) => nodeAffectsFlow(n, flow));

    if (!directHit && !transitiveHit) continue;

    const stepsAffected = countAffectedSteps(flow, allAffectedIds, allAffectedFiles);
    const totalSteps = flow.steps.length;
    let ratio = totalSteps > 0 ? stepsAffected / totalSteps : 0;

    // Boost if the entry point is affected
    const entryHit = entryPointAffected(flow, allAffectedIds);
    if (entryHit && ratio < 1) {
      ratio = Math.min(1, ratio + 0.15);
    }

    const risk = classifyRisk(ratio);

    const reasons: string[] = [];
    if (directHit) reasons.push('directly affected code');
    if (transitiveHit) reasons.push('transitively affected via callers');
    if (entryHit) reasons.push('entry point impacted');
    if (stepsAffected > 0) reasons.push(`${stepsAffected}/${totalSteps} step(s) affected`);

    affectedFlows.push({
      flow: flow.name,
      flowId: flow.id,
      risk,
      reason: reasons.join('; '),
      affectedSteps: stepsAffected,
      totalSteps,
    });
  }

  // Sort affected flows by risk severity (critical first)
  const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  affectedFlows.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  // ------ Build affectedFunctions list ------
  const affectedFunctions = directlyAffected.map((n) => ({
    name: n.name,
    file: n.filePath,
    id: n.id,
  }));

  // ------ Overall risk ------
  let overallRisk: ImpactResult['overallRisk'] = 'low';
  if (affectedFlows.length > 0) {
    overallRisk = affectedFlows[0].risk; // highest risk flow (already sorted)
  }

  const recommendation = buildRecommendation(overallRisk, affectedFlows.length);

  const result: ImpactResult = {
    affectedFlows,
    affectedFunctions,
    overallRisk,
    recommendation,
  };

  log('auto', `Impact prediction complete — overall risk: ${overallRisk}, ${affectedFlows.length} flow(s) affected`);
  return result;
}

// ---------------------------------------------------------------------------
// predictImpactFromFiles
// ---------------------------------------------------------------------------

export function predictImpactFromFiles(
  files: string[],
  graph: KnowledgeGraph,
  flows: StructuredFlow[],
): ImpactResult {
  log('auto', `Predicting impact from ${files.length} file(s)`);

  // ------ Step 1: Resolve file paths to code nodes ------
  const affectedNodeMap = new Map<string, CodeNode>();

  for (const filePath of files) {
    const nodes = graph.findByFile(filePath) as CodeNode[];
    for (const node of nodes) {
      affectedNodeMap.set(node.id, node);
    }
  }

  const directlyAffected = [...affectedNodeMap.values()];
  log('auto', `Resolved ${directlyAffected.length} node(s) from ${files.length} file(s)`);

  const directIds = new Set(directlyAffected.map((n) => n.id));

  // ------ Step 2: Expand via reverse dependencies (depth 2) ------
  const allAffectedIds = collectReverseDeps([...directIds], graph, 2);

  const allAffectedNodes: CodeNode[] = [];
  for (const id of allAffectedIds) {
    const node = graph.getNode(id) as CodeNode | undefined;
    if (node) {
      allAffectedNodes.push(node);
    }
  }

  const allAffectedFiles = new Set(allAffectedNodes.map((n) => n.filePath));

  // ------ Step 3: Score each flow ------
  const affectedFlows: ImpactResult['affectedFlows'] = [];

  for (const flow of flows) {
    const directHit = directlyAffected.some((n) => nodeAffectsFlow(n, flow));
    const transitiveHit = !directHit && allAffectedNodes.some((n) => nodeAffectsFlow(n, flow));

    if (!directHit && !transitiveHit) continue;

    const stepsAffected = countAffectedSteps(flow, allAffectedIds, allAffectedFiles);
    const totalSteps = flow.steps.length;
    let ratio = totalSteps > 0 ? stepsAffected / totalSteps : 0;

    const entryHit = entryPointAffected(flow, allAffectedIds);
    if (entryHit && ratio < 1) {
      ratio = Math.min(1, ratio + 0.15);
    }

    const risk = classifyRisk(ratio);

    const reasons: string[] = [];
    if (directHit) reasons.push('directly affected code');
    if (transitiveHit) reasons.push('transitively affected via callers');
    if (entryHit) reasons.push('entry point impacted');
    if (stepsAffected > 0) reasons.push(`${stepsAffected}/${totalSteps} step(s) affected`);

    affectedFlows.push({
      flow: flow.name,
      flowId: flow.id,
      risk,
      reason: reasons.join('; '),
      affectedSteps: stepsAffected,
      totalSteps,
    });
  }

  const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  affectedFlows.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const affectedFunctions = directlyAffected.map((n) => ({
    name: n.name,
    file: n.filePath,
    id: n.id,
  }));

  let overallRisk: ImpactResult['overallRisk'] = 'low';
  if (affectedFlows.length > 0) {
    overallRisk = affectedFlows[0].risk;
  }

  const recommendation = buildRecommendation(overallRisk, affectedFlows.length);

  const result: ImpactResult = {
    affectedFlows,
    affectedFunctions,
    overallRisk,
    recommendation,
  };

  log('auto', `File-based impact prediction complete — overall risk: ${overallRisk}, ${affectedFlows.length} flow(s) affected`);
  return result;
}
