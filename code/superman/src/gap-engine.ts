import { callClaude, safeParseJSON, buildPrompt } from './ai/claude-client.js';
import { log, logError } from './logger.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { IntentGraph } from './intent-graph.js';
import { getCallChain, getReverseDependencies, findCycles } from './graph/traversal.js';
import { traceAllFlows } from './flow-engine.js';
import type { ProjectModel, ProjectIntent, Gap, GapAnalysis, CodeNode, IntentNode, CompleteFlow, BrokenStep } from './types.js';

/**
 * Compare the ProjectModel against intended capabilities
 * to identify missing systems, incomplete flows, and issues.
 */
export async function analyzeGaps(
  model: ProjectModel,
  intent: ProjectIntent,
  graph: KnowledgeGraph,
): Promise<GapAnalysis> {
  log('gap', 'Starting gap analysis', {
    systems: model.systems.length,
    intendedCapabilities: intent.intendedCapabilities.length,
    missingSystems: intent.missingSystems.length,
  });

  const gaps: Gap[] = [];

  // 1. Structural gap detection — doesn't need LLM
  gaps.push(...detectMissingSystems(model, intent));
  gaps.push(...detectIncompleteFlows(model, graph));
  gaps.push(...detectBrokenIntegrations(graph));
  gaps.push(...detectArchitecturalIssues(model, graph));
  gaps.push(...detectComponentGaps(graph));
  gaps.push(...detectFlowChainGaps(graph));

  // 2. LLM-enhanced gap analysis — deeper reasoning
  const llmGaps = await detectLLMGaps(model, intent, graph);
  gaps.push(...llmGaps);

  // Deduplicate by description similarity
  const dedupedGaps = deduplicateGaps(gaps);

  // Score overall health
  const overallHealth = computeHealth(dedupedGaps, model);
  const criticalIssues = dedupedGaps.filter((g) => g.severity === 'critical').length;

  log('gap', 'Gap analysis complete', {
    totalGaps: dedupedGaps.length,
    critical: criticalIssues,
    health: overallHealth,
  });

  return { gaps: dedupedGaps, overallHealth, criticalIssues };
}

function detectMissingSystems(model: ProjectModel, intent: ProjectIntent): Gap[] {
  const gaps: Gap[] = [];
  const existingDomains = new Set(model.systems.map((s) => s.domain.toLowerCase()));

  for (const missing of intent.missingSystems) {
    const normalized = missing.toLowerCase().replace(/[-_\s]/g, '');
    if (!existingDomains.has(normalized)) {
      gaps.push({
        type: 'missing_system',
        system: missing,
        description: `System "${missing}" is implied by the project structure but does not exist`,
        severity: 'high',
        suggestedFix: `Create the ${missing} module with the expected interfaces`,
        affectedNodes: [],
      });
    }
  }

  // Check systems with very low completeness
  for (const system of model.systems) {
    if (system.completeness < 0.3 && system.nodeIds.length > 0) {
      gaps.push({
        type: 'missing_system',
        system: system.name,
        description: `System "${system.name}" exists but is only ${Math.round(system.completeness * 100)}% complete`,
        severity: system.completeness < 0.1 ? 'critical' : 'high',
        suggestedFix: `Complete the ${system.name} system: ${system.issues.join('; ')}`,
        affectedNodes: system.nodeIds,
      });
    }
  }

  return gaps;
}

function detectIncompleteFlows(model: ProjectModel, graph: KnowledgeGraph): Gap[] {
  const gaps: Gap[] = [];

  for (const flow of model.flows) {
    if (!flow.complete) {
      gaps.push({
        type: 'incomplete_flow',
        system: flow.name,
        description: `Flow "${flow.name}" is incomplete: ${flow.gaps.join(', ')}`,
        severity: 'medium',
        suggestedFix: `Complete the ${flow.name} flow by addressing: ${flow.gaps.join(', ')}`,
        affectedNodes: flow.steps,
      });
    }

    // Check if flow has error handling
    if (flow.steps.length > 0) {
      const entryNode = graph.getNode(flow.entryPoint);
      if (entryNode) {
        const chain = getCallChain(graph, flow.entryPoint);
        const hasErrorHandling = chain.some(
          (n) => /try\s*\{|\.catch\(|catch\s*\(/s.test(n.content),
        );
        if (!hasErrorHandling && chain.length > 2) {
          gaps.push({
            type: 'incomplete_flow',
            system: flow.name,
            description: `Flow "${flow.name}" has no error handling across ${chain.length} steps`,
            severity: 'high',
            suggestedFix: `Add try/catch error handling to the ${flow.name} flow`,
            affectedNodes: chain.map((n) => n.id),
          });
        }
      }
    }
  }

  return gaps;
}

function detectBrokenIntegrations(graph: KnowledgeGraph): Gap[] {
  const gaps: Gap[] = [];

  // Check for circular dependencies
  const cycles = findCycles(graph);
  for (const cycle of cycles) {
    gaps.push({
      type: 'broken_integration',
      system: 'dependencies',
      description: `Circular dependency detected: ${cycle.map((id) => {
        const n = graph.getNode(id);
        return n?.name || id;
      }).join(' → ')}`,
      severity: 'medium',
      suggestedFix: 'Break the circular dependency by extracting shared logic into a separate module',
      affectedNodes: cycle,
    });
  }

  // Check for imports that point to non-existent targets
  const NODE_BUILTINS = new Set([
    'fs', 'path', 'child_process', 'os', 'http', 'https', 'url', 'util',
    'stream', 'crypto', 'buffer', 'events', 'net', 'dns', 'tls', 'zlib',
    'readline', 'cluster', 'worker_threads', 'assert', 'querystring',
    'fs/promises', 'path/posix', 'path/win32', 'stream/promises',
    'stream/web', 'stream/consumers', 'util/types', 'dns/promises',
  ]);

  const importNodes = graph.findByType('import');
  for (const imp of importNodes) {
    const edges = graph.getEdgesFor(imp.id, 'forward');
    const importEdges = edges.filter((e) => e.type === 'imports');
    if (importEdges.length === 0 && imp.metadata.importSource) {
      const src = imp.metadata.importSource;

      // Skip external packages (not relative imports and not src/ imports)
      if (!src.startsWith('.') && !src.startsWith('..') && !src.startsWith('src/')) continue;

      // Skip Node built-in modules (node: prefix or known built-in names)
      if (src.startsWith('node:')) continue;
      if (NODE_BUILTINS.has(src)) continue;

      // Import doesn't resolve to any known node
      gaps.push({
        type: 'broken_integration',
        system: 'imports',
        description: `Unresolved import "${imp.metadata.importSource}" in ${imp.filePath}`,
        severity: 'low',
        suggestedFix: `Verify the import source "${imp.metadata.importSource}" exists`,
        affectedNodes: [imp.id],
      });
    }
  }

  return gaps;
}

function detectArchitecturalIssues(model: ProjectModel, graph: KnowledgeGraph): Gap[] {
  const gaps: Gap[] = [];
  const stats = graph.getStats();

  // God files — files with too many functions
  const fileNodes = graph.findByType('file');
  for (const file of fileNodes) {
    const children = graph.getNeighbors(file.id, 'forward');
    const functions = children.filter((n) => n.type === 'function' || n.type === 'method');
    if (functions.length > 15) {
      gaps.push({
        type: 'architectural_issue',
        system: 'structure',
        description: `File "${file.name}" has ${functions.length} functions — consider splitting`,
        severity: 'low',
        suggestedFix: `Refactor ${file.name} into smaller, focused modules`,
        affectedNodes: [file.id, ...functions.map((f) => f.id)],
      });
    }
  }

  // Highly coupled nodes — too many dependents
  const allFunctions = graph.findByType('function');
  for (const fn of allFunctions) {
    const reverseDeps = getReverseDependencies(graph, fn.id);
    if (reverseDeps.length > 10) {
      gaps.push({
        type: 'architectural_issue',
        system: 'coupling',
        description: `Function "${fn.name}" has ${reverseDeps.length} dependents — high coupling risk`,
        severity: 'medium',
        suggestedFix: `Consider abstracting "${fn.name}" behind an interface to reduce coupling`,
        affectedNodes: [fn.id],
      });
    }
  }

  // Systems with no clear boundaries
  for (const system of model.systems) {
    if (system.nodeIds.length > 0) {
      const files = new Set(
        system.nodeIds
          .map((id) => graph.getNode(id))
          .filter(Boolean)
          .map((n) => (n as CodeNode).filePath),
      );
      // If system spans more than 5 files, check if they're in the same directory
      if (files.size > 5) {
        const dirs = new Set([...files].map((f) => f.split('/').slice(0, -1).join('/')));
        if (dirs.size > 3) {
          gaps.push({
            type: 'architectural_issue',
            system: system.name,
            description: `System "${system.name}" is scattered across ${dirs.size} directories`,
            severity: 'low',
            suggestedFix: `Consolidate ${system.name} logic into a dedicated directory`,
            affectedNodes: system.nodeIds,
          });
        }
      }
    }
  }

  return gaps;
}

function detectComponentGaps(graph: KnowledgeGraph): Gap[] {
  const gaps: Gap[] = [];
  const allFunctions = graph.findByType('function');

  for (const fn of allFunctions) {
    const comp = fn.metadata.component;
    if (!comp) continue;

    // MISSING_LOADING_STATE: Component with async operations but no loading state
    const hasAsyncHook = comp.hooks.some(
      (h) => h.name === 'useEffect' || h.name === 'useQuery' || h.name === 'useSWR',
    );
    if (hasAsyncHook && !comp.hasLoadingState) {
      gaps.push({
        type: 'architectural_issue',
        system: 'components',
        description: `Component "${fn.name}" has async operations but no loading state`,
        severity: 'medium',
        suggestedFix: `Add a loading state (useState) to "${fn.name}" to handle async operations`,
        affectedNodes: [fn.id],
      });
    }

    // UNTYPED_PROPS: Component function with parameters but no TypeScript typing
    if (comp.props.length === 0 && fn.metadata.parameters && fn.metadata.parameters.length > 0) {
      const hasUntypedParams = fn.metadata.parameters.some((p) => !p.type);
      if (hasUntypedParams) {
        gaps.push({
          type: 'architectural_issue',
          system: 'components',
          description: `Component "${fn.name}" has untyped props — define a TypeScript interface`,
          severity: 'low',
          suggestedFix: `Create a Props interface for "${fn.name}" with typed properties`,
          affectedNodes: [fn.id],
        });
      }
    }

    // MISSING_KEY_PROP: List rendering without key
    // This is detected during render tree analysis via hasMissingKeys
    // We check via source content for .map() without key=
    if (fn.content.includes('.map(') && !fn.content.includes('key=')) {
      gaps.push({
        type: 'architectural_issue',
        system: 'components',
        description: `Component "${fn.name}" may have list rendering without key props`,
        severity: 'medium',
        suggestedFix: `Add key props to all list-rendered elements in "${fn.name}"`,
        affectedNodes: [fn.id],
      });
    }

    // CONDITIONAL_HOOK: Hook inside conditional
    const hookAnalysis = comp.hooks;
    // We can detect this from source text patterns
    const sourceText = fn.content;
    if (/if\s*\(.*\)\s*\{[^}]*use[A-Z]/.test(sourceText)) {
      gaps.push({
        type: 'architectural_issue',
        system: 'components',
        description: `Component "${fn.name}" may call hooks inside conditionals (Rules of Hooks violation)`,
        severity: 'high',
        suggestedFix: `Move all hook calls to the top level of "${fn.name}"`,
        affectedNodes: [fn.id],
      });
    }
  }

  return gaps;
}

function detectFlowChainGaps(graph: KnowledgeGraph): Gap[] {
  const gaps: Gap[] = [];

  try {
    const completeFlows = traceAllFlows(graph);

    for (const flow of completeFlows) {
      for (const broken of flow.brokenSteps) {
        const gapType = brokenStepToGapType(broken);
        gaps.push({
          type: gapType,
          system: flow.name,
          description: `Flow "${flow.name}" — ${broken.name}: ${broken.reason}`,
          severity: broken.severity,
          suggestedFix: suggestFixForBrokenStep(broken, flow),
          affectedNodes: [broken.nodeId],
          flowId: flow.name,
        });
      }
    }
  } catch (err) {
    logError('gap', 'Flow chain gap detection failed', err);
  }

  return gaps;
}

function brokenStepToGapType(broken: BrokenStep): Gap['type'] {
  if (broken.reason.includes('error handling')) return 'unhandled_flow_error';
  if (broken.reason.includes('response')) return 'missing_flow_response';
  if (broken.reason.includes('validation')) return 'unvalidated_flow_input';
  return 'broken_flow_step';
}

function suggestFixForBrokenStep(broken: BrokenStep, flow: CompleteFlow): string {
  if (broken.reason.includes('error handling')) {
    return `Add try/catch error handling to "${broken.name}" in the "${flow.name}" flow`;
  }
  if (broken.reason.includes('response')) {
    return `Ensure "${broken.name}" sends a proper HTTP response in all code paths`;
  }
  if (broken.reason.includes('validation')) {
    return `Add input validation (e.g., Zod schema) to "${broken.name}" before processing req.body`;
  }
  if (broken.reason.includes('empty')) {
    return `Implement the "${broken.name}" function — currently empty/stub`;
  }
  return `Fix "${broken.name}" in flow "${flow.name}": ${broken.reason}`;
}

async function detectLLMGaps(
  model: ProjectModel,
  intent: ProjectIntent,
  graph: KnowledgeGraph,
): Promise<Gap[]> {
  const systemSummary = model.systems
    .map((s) => `${s.name} (${s.domain}): ${Math.round(s.completeness * 100)}% complete, ${s.nodeIds.length} nodes`)
    .join('\n');

  const flowSummary = model.flows
    .map((f) => `${f.name}: ${f.complete ? 'complete' : 'INCOMPLETE'}, ${f.steps.length} steps`)
    .join('\n');

  const prompt = `You are analyzing a ${intent.appType} for gaps.

Current capabilities: ${intent.currentCapabilities.join(', ')}
Intended capabilities: ${intent.intendedCapabilities.join(', ')}
Missing systems: ${intent.missingSystems.join(', ')}

## Systems
${systemSummary || '(none)'}

## Flows
${flowSummary || '(none)'}

## Entities
${model.entities.map((e) => `${e.name}: ${e.fields.join(', ')}`).join('\n') || '(none)'}

Identify SPECIFIC, ACTIONABLE gaps not already covered. Be concrete:
- NOT: "Missing auth"
- YES: "POST /api/users has no authentication check — any unauthenticated request can create users"

Focus on:
- Security: unprotected routes, missing input validation, unsanitized data
- Data integrity: missing required fields, no constraints, no validation
- Operational: unhandled errors, missing logging, no graceful degradation
- Integration: API contract mismatches, missing adapters, type mismatches

SEVERITY rules:
- critical: exploitable now or breaks core functionality
- high: causes data loss, unhandled errors, or major feature failures
- medium: affects some flows, needs improvement
- low: code quality, minor issues

Respond ONLY with valid JSON (no markdown fences):
[
  {
    "type": "missing_system" | "incomplete_flow" | "broken_integration" | "architectural_issue",
    "system": "primary affected system",
    "description": "specific issue with evidence from the code (1-2 sentences)",
    "severity": "low" | "medium" | "high" | "critical",
    "suggestedFix": "actionable fix naming specific functions or files"
  }
]

Return at most 10 gaps. Only include gaps with evidence from the provided code.`;

  try {
    const response = await callClaude(prompt, 'gap');
    const parsed = safeParseJSON<Array<Omit<Gap, 'affectedNodes'>>>(response);
    if (parsed.ok) {
      return parsed.data.map((g) => ({ ...g, affectedNodes: [] as string[] }));
    }
    logError('gap', 'Failed to parse gap detection response', parsed.raw);
    return [];
  } catch (error) {
    logError('gap', 'LLM gap detection failed', error);
    return [];
  }
}

function deduplicateGaps(gaps: Gap[]): Gap[] {
  // Semantic dedup: group gaps with overlapping keywords, keep highest severity
  const result: Gap[] = [];

  for (const gap of gaps) {
    const gapWords = new Set(gap.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

    // Check if a similar gap already exists
    const similar = result.find((existing) => {
      if (existing.type !== gap.type) return false;
      const existingWords = new Set(existing.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      // Count overlap
      let overlap = 0;
      for (const w of gapWords) {
        if (existingWords.has(w)) overlap++;
      }
      const similarity = overlap / Math.max(gapWords.size, existingWords.size, 1);
      return similarity > 0.5; // >50% word overlap = same gap
    });

    if (similar) {
      // Keep the higher severity version
      const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      if ((severityRank[gap.severity] || 0) > (severityRank[similar.severity] || 0)) {
        const idx = result.indexOf(similar);
        result[idx] = gap;
      }
      continue;
    }

    result.push(gap);
  }

  return result;
}

function computeHealth(gaps: Gap[], model: ProjectModel): number {
  // Scale penalty by codebase size — a 1000-function project with 10 gaps
  // should score higher than a 20-function project with 10 gaps
  const nodeCount = Math.max(model.functions.length + model.flows.length, 1);
  const scaleFactor = Math.max(1, Math.log2(nodeCount / 10));

  let penalty = 0;
  for (const gap of gaps) {
    switch (gap.severity) {
      case 'critical': penalty += 8; break;
      case 'high': penalty += 4; break;
      case 'medium': penalty += 2; break;
      case 'low': penalty += 0.5; break;
    }
  }

  // Normalize: penalty as a fraction of codebase, scaled
  const normalizedPenalty = Math.min(80, (penalty / scaleFactor));
  let score = 100 - normalizedPenalty;

  // Bonus for complete flows
  const completeFlows = model.flows.filter((f) => f.complete).length;
  if (model.flows.length > 0) {
    score += (completeFlows / model.flows.length) * 10;
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

// ── Intent Graph Gap Analysis ──

/**
 * Compare IntentGraph (what should exist) vs ProjectModel (what exists).
 * Walks every intent node and checks if corresponding code exists.
 */
export async function analyzeGapsFromIntentGraph(
  model: ProjectModel,
  intentGraph: IntentGraph,
  codeGraph: KnowledgeGraph,
): Promise<GapAnalysis> {
  log('gap', 'Starting intent-graph-based gap analysis');

  const gaps: Gap[] = [];

  // 1. Walk the intent graph — every 'planned' node is a gap
  intentGraph.traverseGraph((node) => {
    if (node.status === 'planned') {
      gaps.push(intentNodeToGap(node));
    } else if (node.status === 'partial') {
      gaps.push(intentNodeToPartialGap(node, codeGraph));
    }
  });

  // 2. Structural checks (same as before — independent of intent)
  gaps.push(...detectBrokenIntegrations(codeGraph));
  gaps.push(...detectArchitecturalIssues(model, codeGraph));

  // 3. Intent coverage check — systems in intent but absent in model
  const intentSystems = intentGraph.getNodesByLevel(1);
  const modelDomains = new Set(model.systems.map((s) => s.domain));
  for (const intentSys of intentSystems) {
    const domain = intentSys.id.replace('system::', '');
    if (!modelDomains.has(domain) && intentSys.status !== 'complete') {
      // Only add if not already covered by the planned-node walk
      const alreadyCovered = gaps.some(
        (g) => g.system === domain && g.type === 'missing_system',
      );
      if (!alreadyCovered) {
        gaps.push({
          type: 'missing_system',
          system: domain,
          description: `Intent graph expects "${intentSys.title}" system but it does not exist in codebase`,
          severity: 'high',
          suggestedFix: `Create the ${domain} system: ${intentSys.description || intentSys.title}`,
          affectedNodes: intentSys.linkedCode || [],
        });
      }
    }
  }

  // 4. Feature completeness — features in intent vs what model flows cover
  const intentFeatures = intentGraph.getNodesByLevel(2);
  for (const feature of intentFeatures) {
    if (feature.status === 'complete') continue;
    const linkedNodes = feature.linkedCode || [];
    const existingNodes = linkedNodes.filter((id) => codeGraph.getNode(id));

    if (linkedNodes.length > 0 && existingNodes.length < linkedNodes.length) {
      const missing = linkedNodes.length - existingNodes.length;
      const alreadyCovered = gaps.some(
        (g) => g.description.includes(feature.title),
      );
      if (!alreadyCovered) {
        gaps.push({
          type: 'incomplete_flow',
          system: feature.parent?.replace('system::', '') || 'unknown',
          description: `Feature "${feature.title}" has ${missing}/${linkedNodes.length} code nodes missing`,
          severity: missing > linkedNodes.length / 2 ? 'high' : 'medium',
          suggestedFix: `Complete the ${feature.title} feature implementation`,
          affectedNodes: linkedNodes,
        });
      }
    }
  }

  const dedupedGaps = deduplicateGaps(gaps);
  const overallHealth = computeHealthFromIntent(dedupedGaps, intentGraph);
  const criticalIssues = dedupedGaps.filter((g) => g.severity === 'critical').length;

  log('gap', 'Intent-graph gap analysis complete', {
    totalGaps: dedupedGaps.length,
    critical: criticalIssues,
    health: overallHealth,
  });

  return { gaps: dedupedGaps, overallHealth, criticalIssues };
}

function intentNodeToGap(node: IntentNode): Gap {
  const severityByType: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    product: 'critical',
    system: 'high',
    feature: 'medium',
    implementation: 'low',
    code: 'low',
  };

  const typeMapping: Record<string, Gap['type']> = {
    product: 'missing_system',
    system: 'missing_system',
    feature: 'incomplete_flow',
    implementation: 'incomplete_flow',
    code: 'incomplete_flow',
  };

  return {
    type: typeMapping[node.type] || 'missing_system',
    system: extractSystemFromId(node),
    description: `${node.type} "${node.title}" is planned but not implemented${node.description ? ': ' + node.description : ''}`,
    severity: severityByType[node.type] || 'medium',
    suggestedFix: `Implement ${node.title}`,
    affectedNodes: node.linkedCode || [],
  };
}

function intentNodeToPartialGap(node: IntentNode, codeGraph: KnowledgeGraph): Gap {
  const linked = node.linkedCode || [];
  const existing = linked.filter((id) => codeGraph.getNode(id)).length;

  return {
    type: 'incomplete_flow',
    system: extractSystemFromId(node),
    description: `${node.type} "${node.title}" is partially implemented (${existing}/${linked.length} code nodes)`,
    severity: 'medium',
    suggestedFix: `Complete the ${node.title} implementation`,
    affectedNodes: linked,
  };
}

function extractSystemFromId(node: IntentNode): string {
  // Walk up to find the system-level parent
  if (node.type === 'system') return node.id.replace('system::', '');
  if (node.parent) {
    const parentDomain = node.parent.replace('system::', '');
    if (node.parent.startsWith('system::')) return parentDomain;
    // For deeper nodes, extract from the ID pattern
    const match = node.id.match(/::(\w+)::/);
    if (match) return match[1];
  }
  return 'unknown';
}

function computeHealthFromIntent(gaps: Gap[], intentGraph: IntentGraph): number {
  const stats = intentGraph.getStats();
  const total = stats.totalNodes;
  if (total === 0) return 100;

  const completeCount = stats.byStatus['complete'] || 0;
  const baseScore = Math.round((completeCount / total) * 100);

  // Penalize for critical/high gaps
  let penalty = 0;
  for (const gap of gaps) {
    if (gap.severity === 'critical') penalty += 15;
    else if (gap.severity === 'high') penalty += 8;
    else if (gap.severity === 'medium') penalty += 3;
  }

  return Math.max(0, Math.min(100, baseScore - penalty));
}
