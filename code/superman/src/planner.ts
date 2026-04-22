import fs from 'fs';
import { callClaude, safeParseJSON, buildPrompt } from './ai/claude-client.js';
import { log, logError } from './logger.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { getReverseDependencies } from './graph/traversal.js';
import { findSimilarExperiences, buildExperienceContext, buildPlanningContext } from './experience-store.js';
import type {
  ProjectModel,
  GapAnalysis,
  Gap,
  PlanStep,
  ExecutionPlan,
  CodeNode,
  Experience,
} from './types.js';

// System build order — foundational first
const SYSTEM_PRIORITY: Record<string, number> = {
  database: 1,
  models: 1,
  config: 1,
  auth: 2,
  middleware: 2,
  validation: 3,
  api: 3,
  routes: 3,
  services: 4,
  frontend: 5,
  testing: 6,
  logging: 2,
  'error-handling': 2,
  monitoring: 6,
  deployment: 7,
};

/**
 * Turn gaps into an ordered, dependency-aware execution plan.
 * Searches experience store before planning to reuse successful patterns
 * and avoid failed approaches. Flags NEEDS_HUMAN_REVIEW after 3 consecutive failures.
 */
export async function createPlan(
  analysis: GapAnalysis,
  model: ProjectModel,
  graph: KnowledgeGraph,
): Promise<ExecutionPlan> {
  log('plan', 'Creating execution plan', {
    gaps: analysis.gaps.length,
    health: analysis.overallHealth,
  });

  if (analysis.gaps.length === 0) {
    log('plan', 'No gaps to address — project is healthy');
    return { steps: [], estimatedComplexity: 'small', systemOrder: [], needsHumanReview: false };
  }

  // 0. Search experience store for relevant past work
  const gapSummary = analysis.gaps.slice(0, 5).map(g => g.description).join('; ');
  const relevantExperiences = await findSimilarExperiences(gapSummary, 5);
  const { needsHumanReview } = buildPlanningContext(relevantExperiences, gapSummary);

  if (needsHumanReview) {
    log('plan', 'NEEDS_HUMAN_REVIEW: 3+ consecutive failures detected for this pattern');
  }

  // 1. Group gaps by system
  const systemGaps = groupBySystem(analysis.gaps);

  // 2. Order systems by priority (foundational first)
  const orderedSystems = orderSystems(Object.keys(systemGaps));

  // 3. Generate steps for each system's gaps
  const steps = await generateSteps(systemGaps, orderedSystems, model, graph);

  // 4. Reorder steps by file dependency (leaf files first, core files last)
  const orderedSteps = orderStepsByFileDependency(steps, graph);

  // 5. Resolve cross-step dependencies
  resolveDependencies(orderedSteps, orderedSystems);

  // 6. Estimate complexity
  const complexity = estimateComplexity(orderedSteps);

  log('plan', 'Execution plan ready', {
    steps: orderedSteps.length,
    systems: orderedSystems.length,
    complexity,
    needsHumanReview,
  });

  return { steps: orderedSteps, estimatedComplexity: complexity, systemOrder: orderedSystems, needsHumanReview };
}

function groupBySystem(gaps: Gap[]): Record<string, Gap[]> {
  const groups: Record<string, Gap[]> = {};
  for (const gap of gaps) {
    const system = gap.system.toLowerCase();
    if (!groups[system]) groups[system] = [];
    groups[system].push(gap);
  }
  return groups;
}

function orderSystems(systems: string[]): string[] {
  return systems.sort((a, b) => {
    const pa = SYSTEM_PRIORITY[a.toLowerCase()] ?? 4;
    const pb = SYSTEM_PRIORITY[b.toLowerCase()] ?? 4;
    return pa - pb;
  });
}

async function generateSteps(
  systemGaps: Record<string, Gap[]>,
  orderedSystems: string[],
  model: ProjectModel,
  graph: KnowledgeGraph,
): Promise<PlanStep[]> {
  const steps: PlanStep[] = [];
  let stepId = 1;

  for (const system of orderedSystems) {
    const gaps = systemGaps[system];
    if (!gaps || gaps.length === 0) continue;

    // Sort gaps within system: critical → high → medium → low
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    gaps.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

    // Generate steps for this system's gaps
    const systemSteps = await generateSystemSteps(system, gaps, model, graph, stepId);
    steps.push(...systemSteps);
    stepId += systemSteps.length;
  }

  return steps;
}

async function generateSystemSteps(
  system: string,
  gaps: Gap[],
  model: ProjectModel,
  graph: KnowledgeGraph,
  startId: number,
): Promise<PlanStep[]> {
  // Gather context about affected files (validate they exist on disk)
  const affectedNodeIds = gaps.flatMap((g) => g.affectedNodes);
  const candidateFiles = [
    ...new Set(
      affectedNodeIds
        .map((id) => graph.getNode(id))
        .filter(Boolean)
        .map((n) => (n as CodeNode).filePath),
    ),
  ];
  const affectedFiles = candidateFiles.filter((f) => {
    try {
      return fs.existsSync(f);
    } catch {
      return false;
    }
  });
  if (affectedFiles.length < candidateFiles.length) {
    log('plan', `Filtered out ${candidateFiles.length - affectedFiles.length} nonexistent file path(s) from plan targets`);
  }

  // Build rich context: function signatures, line numbers, dependencies
  const richContext = buildRichNodeContext(affectedNodeIds, graph);

  // Read relevant file content for context
  const fileContext = affectedFiles.length > 0
    ? `\nAffected files: ${affectedFiles.join(', ')}`
    : '';

  // Query experience store for similar past work
  const gapSummary = gaps.map((g) => g.description).join('; ');
  const pastExperiences = await findSimilarExperiences(`${system}: ${gapSummary}`, 5);
  const experienceContext = buildExperienceContext(pastExperiences);

  // Extract failed approaches to explicitly avoid
  const failedApproaches = pastExperiences
    .filter((e) => e.result === 'failure')
    .map((e) => `- FAILED: "${e.query}" → ${e.lesson}`)
    .join('\n');

  const gapDescriptions = gaps
    .map((g) => `- [${g.severity.toUpperCase()}] ${g.description}\n  Fix: ${g.suggestedFix}`)
    .join('\n');

  const prompt = `Generate concrete implementation steps for these gaps in the "${system}" system.
${fileContext}

## Code Context (exact signatures, line numbers, dependencies)
${richContext || 'No existing code nodes found for this system.'}

## Gaps
${gapDescriptions}
${experienceContext ? `\n${experienceContext}` : ''}
${failedApproaches ? `\n## APPROACHES THAT FAILED BEFORE — DO NOT REPEAT\n${failedApproaches}\nYou MUST use a different strategy than the failed ones listed above.\n` : ''}

Output 1-3 atomic steps per gap. Each step = ONE action (create file, modify function, add validation).

## Requirements for the "instruction" field
- Must be a COMPLETE, STANDALONE instruction that can be executed without other context
- Must start with an action verb ("Add error handling to X function in Y file")
- Must specify exact file paths relative to project root
- Must include EXACT function signatures (name, parameters, return type) for any function being modified
- Must include EXACT line numbers (e.g., "lines 15-30") for the code being changed
- Must specify expected inputs and outputs (e.g., "takes (req: Request, res: Response), should return 200 with {status: 'ok'}")
- Must list what adjacent code must stay compatible (e.g., "callers X and Y depend on this function's signature")
- Must be 3-8 sentences describing exactly what code to write/change
- Do NOT reference "the gap" or "as described above" — be self-contained

Respond ONLY with valid JSON (no markdown fences):
[
  {
    "action": "create file" | "add function" | "modify function" | "add validation" | "fix imports" | "add error handling",
    "description": "2-3 sentence explanation of what this achieves",
    "targetFiles": ["relative/path/to/file.ts"],
    "instruction": "Complete standalone instruction for the code modification engine. Start with action verb. Include file paths, exact function signatures, line numbers, expected I/O, and compatibility constraints.",
    "priority": "critical" | "high" | "medium" | "low"
  }
]

Return at most 5 steps. Skip low-value steps.`;

  try {
    const response = await callClaude(prompt, 'plan');
    const parsed = safeParseJSON<Array<{
      action: string;
      description: string;
      targetFiles: string[];
      instruction: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
    }>>(response);

    if (!parsed.ok) {
      throw new Error(`Failed to parse planner response: ${parsed.raw.slice(0, 200)}`);
    }

    return parsed.data.map((step, i) => ({
      id: startId + i,
      system,
      action: step.action,
      description: step.description,
      targetFiles: step.targetFiles,
      instruction: step.instruction,
      dependencies: [],
      priority: step.priority,
    }));
  } catch (error) {
    logError('plan', `Failed to generate steps for ${system}`, error);
    // Fallback: one step per gap
    return gaps.map((gap, i) => ({
      id: startId + i,
      system,
      action: `Fix: ${gap.description.slice(0, 60)}`,
      description: gap.description,
      targetFiles: affectedFiles,
      instruction: gap.suggestedFix,
      dependencies: [],
      priority: gap.severity === 'critical' ? 'critical' : gap.severity === 'high' ? 'high' : 'medium',
    }));
  }
}

function resolveDependencies(steps: PlanStep[], _systemOrder: string[]): void {
  // Only add intra-system dependencies: each step depends on the previous step
  // in the SAME system. Cross-system dependencies are removed — they cause
  // cascading failures where one failed step blocks all downstream systems.
  const lastStepBySystem = new Map<string, number>();

  for (const step of steps) {
    const prev = lastStepBySystem.get(step.system);
    if (prev !== undefined) {
      step.dependencies.push(prev);
    }
    lastStepBySystem.set(step.system, step.id);
  }
}

function estimateComplexity(steps: PlanStep[]): 'small' | 'medium' | 'large' {
  const criticalCount = steps.filter((s) => s.priority === 'critical').length;
  if (steps.length <= 3 && criticalCount === 0) return 'small';
  if (steps.length <= 8) return 'medium';
  return 'large';
}

/**
 * Build rich context for affected code nodes: exact function signatures,
 * line numbers, parameter types, return types, and dependency info.
 * This gives the LLM enough detail to generate correct-first-time instructions.
 */
export { buildRichNodeContext as buildRichNodeContextForTest };
function buildRichNodeContext(
  nodeIds: string[],
  graph: KnowledgeGraph,
): string {
  const seen = new Set<string>();
  const sections: string[] = [];

  for (const id of nodeIds) {
    if (seen.has(id)) continue;
    seen.add(id);

    const node = graph.getNode(id);
    if (!node) continue;

    const parts: string[] = [];

    // Basic identity
    parts.push(`### ${node.type} \`${node.name}\` in \`${node.filePath}\``);
    parts.push(`- Lines: ${node.range.start.line}-${node.range.end.line}`);

    // Signature
    if (node.signature) {
      parts.push(`- Signature: \`${node.signature}\``);
    }

    // Parameters
    if (node.metadata.parameters && node.metadata.parameters.length > 0) {
      const params = node.metadata.parameters
        .map((p) => `${p.name}${p.type ? ': ' + p.type : ''}${p.optional ? ' (optional)' : ''}`)
        .join(', ');
      parts.push(`- Parameters: (${params})`);
    }

    // Return type
    if (node.metadata.returnType) {
      parts.push(`- Returns: \`${node.metadata.returnType}\``);
    }

    // Export status
    if (node.metadata.exported) {
      parts.push(`- Exported: yes (changing signature will break callers)`);
    }

    // Route metadata
    if (node.metadata.httpMethod || node.metadata.routePath) {
      parts.push(`- Route: ${node.metadata.httpMethod || 'GET'} ${node.metadata.routePath || node.name}`);
    }

    // Reverse dependencies — who calls/uses this?
    const reverseDeps = getReverseDependencies(graph, id);
    if (reverseDeps.length > 0) {
      const depList = reverseDeps.slice(0, 5).map((d) =>
        `${d.name} (${d.filePath}:${d.range.start.line})`
      ).join(', ');
      parts.push(`- Depended on by: ${depList}${reverseDeps.length > 5 ? ` (+${reverseDeps.length - 5} more)` : ''}`);
    }

    sections.push(parts.join('\n'));
  }

  return sections.join('\n\n');
}

/**
 * Order multi-file plan steps by dependency: files that others depend on
 * get changed LAST to avoid breaking intermediate states.
 *
 * Strategy: build a file dependency graph from the plan's target files,
 * then topologically sort so leaf files (no dependents) are changed first
 * and heavily-depended-on files are changed last.
 */
export function orderStepsByFileDependency(
  steps: PlanStep[],
  graph: KnowledgeGraph,
): PlanStep[] {
  if (steps.length <= 1) return steps;

  // Collect all target files across steps
  const allFiles = new Set<string>();
  for (const step of steps) {
    for (const f of step.targetFiles) {
      allFiles.add(f);
    }
  }

  // Build a dependency count for each file: how many other target files depend on it
  const fileDependentCount = new Map<string, number>();
  for (const file of allFiles) {
    fileDependentCount.set(file, 0);
  }

  for (const file of allFiles) {
    const nodesInFile = graph.findByFile(file);
    for (const node of nodesInFile) {
      const reverseDeps = getReverseDependencies(graph, node.id);
      for (const dep of reverseDeps) {
        if (allFiles.has(dep.filePath) && dep.filePath !== file) {
          // dep.filePath depends on `file`, so `file` has one more dependent
          fileDependentCount.set(file, (fileDependentCount.get(file) || 0) + 1);
        }
      }
    }
  }

  // Score each step: sum of dependent counts for its target files
  // Higher score = more things depend on it = change it LAST
  const stepScores = new Map<number, number>();
  for (const step of steps) {
    const score = step.targetFiles.reduce(
      (sum, f) => sum + (fileDependentCount.get(f) || 0),
      0,
    );
    stepScores.set(step.id, score);
  }

  // Sort: lowest dependent count first (leaf files first, core files last)
  const sorted = [...steps].sort((a, b) => {
    const scoreA = stepScores.get(a.id) || 0;
    const scoreB = stepScores.get(b.id) || 0;
    if (scoreA !== scoreB) return scoreA - scoreB;
    // Tie-break: keep original priority order
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });

  log('plan', 'Steps reordered by file dependency', {
    order: sorted.map((s) => `step ${s.id}: score ${stepScores.get(s.id)}`),
  });

  return sorted;
}
