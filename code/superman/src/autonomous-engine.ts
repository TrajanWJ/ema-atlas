import { log, logError } from './logger.js';
import { parseRepository } from './parser/index.js';
import { buildDependencyGraph } from './structural/graph-builder.js';
import { generateEmbeddings, createNodeEmbeddingText } from './semantic/embeddings.js';
import { initCollection, upsertNodes } from './semantic/vector-store.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { getCallChain, getReverseDependencies } from './graph/traversal.js';
import { simulateFlow } from './simulation/engine.js';
import { proposeChanges, applyChanges } from './modification/engine.js';
import { runCommand, parseStructuredErrors, formatErrorsForPrompt, extractErrorFiles, rollbackChanges, classifyEnvironmentErrors, captureBaseline, diffErrors } from './execution/runner.js';
import { IntentGraph } from './intent-graph.js';
import { generateIntentGraph, updateIntentGraph } from './auto-intent-generator.js';
import { analyzeGapsFromIntentGraph } from './gap-engine.js';
import { createPlan } from './planner.js';
import { WorkingMemory } from './working-memory.js';
import { detectFlows } from './flow-engine.js';
import { getRecommendedFocus } from './focus-engine.js';
import { buildFlowIndex } from './semantic/flow-index.js';
import type {
  CodeNode,
  ProjectModel,
  System,
  Flow,
  Entity,
  PlanStep,
  IterationResult,
  AutonomousResult,
  Gap,
} from './types.js';

const MAX_ITERATIONS = 5;

/**
 * Goal-driven autonomous engine with persistent working memory.
 *
 * Key difference from a stateless loop: the engine loads prior reasoning,
 * refines incrementally (gaps, plan, decisions), and never discards
 * what it learned in previous iterations.
 */
export async function runAutonomous(repoPath: string): Promise<AutonomousResult> {
  log('auto', `Starting autonomous engine on ${repoPath}`);

  // ── Load persistent working memory ──
  const memory = new WorkingMemory(repoPath);
  const hadPriorState = await memory.load();

  if (hadPriorState) {
    log('auto', `Resuming from iteration ${memory.iteration}, health ${memory.health}/100, ${memory.decisions.length} prior decisions`);
  }

  const iterations: IterationResult[] = [];
  let totalChanges = 0;
  let graph = new KnowledgeGraph();
  let intentGraph: IntentGraph | null = null;
  let model: ProjectModel;

  const seenGapSignatures = new Map<string, number>();

  function gapSignature(gaps: Gap[]): string {
    return gaps.map(g => `${g.type}:${g.description}`).sort().join('|');
  }

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    memory.nextIteration();
    log('auto', `═══ Iteration ${memory.iteration} (loop ${i}/${MAX_ITERATIONS}) ═══`);

    // ── Phase 1: Update world model (incremental if possible) ──
    log('auto', 'Phase 1: Updating world model');
    await indexRepository(repoPath, graph);
    model = buildProjectModel(graph);
    memory.updateIntent(model);

    // ── Phase 2: Detect structured user flows ──
    log('auto', 'Phase 2: Detecting user flows');
    const structuredFlows = detectFlows(graph);
    memory.updateFlows(structuredFlows);
    log('auto', `Detected ${structuredFlows.length} flows with ${structuredFlows.reduce((s, f) => s + f.steps.length, 0)} steps`);

    // ── Phase 2.5: Intent graph ──
    if (!intentGraph) {
      intentGraph = await generateIntentGraph(model, graph);
    } else {
      updateIntentGraph(intentGraph, graph);
    }

    // Build flow index for retrieval
    try {
      await buildFlowIndex(intentGraph.allNodes(), graph);
    } catch (err) {
      log('auto', 'Failed to build flow index, continuing without it', { source: 'flow-index', error: String(err) });
    }

    // ── Phase 3: Gap analysis + focus ranking ──
    log('auto', 'Phase 3: Analyzing gaps');
    const rawAnalysis = await analyzeGapsFromIntentGraph(model, intentGraph, graph);

    // Link gaps to flows
    for (const gap of rawAnalysis.gaps) {
      if (!gap.flowId) {
        const matchingFlow = structuredFlows.find((f) =>
          f.name.toLowerCase().includes(gap.system.toLowerCase()) ||
          gap.description.toLowerCase().includes(f.name.toLowerCase()),
        );
        if (matchingFlow) gap.flowId = matchingFlow.id;
      }
    }

    const refinedGaps = memory.refineGaps(rawAnalysis.gaps, rawAnalysis.overallHealth);

    // Convergence detection: break early if same gaps keep appearing
    const sig = gapSignature(refinedGaps);
    const count = (seenGapSignatures.get(sig) || 0) + 1;
    seenGapSignatures.set(sig, count);

    if (count >= 3) {
      log('auto', 'Convergence failed: same gaps detected 3 times, stopping', {
        source: 'autonomous',
        iteration: i,
        gapCount: refinedGaps.length,
      });
      iterations.push({
        iteration: i,
        stepsExecuted: 0,
        stepsSucceeded: 0,
        stepsFailed: 0,
        remainingGaps: refinedGaps.length,
        buildPassed: false,
      });
      break;
    }

    // Get recommended focus
    const focus = getRecommendedFocus(structuredFlows, refinedGaps, intentGraph.allNodes(), 5);
    log('auto', `Focus: ${focus.map((f) => `${f.name}(${f.score})`).join(', ')}`);

    memory.recordDecision(
      'Analysis complete',
      'success',
      `${refinedGaps.length} gaps, ${structuredFlows.length} flows, top focus: ${focus[0]?.name || 'none'}`,
    );

    // Check convergence
    if (refinedGaps.length === 0 || memory.health >= 95) {
      log('auto', 'Project is healthy — no actionable gaps remain');
      memory.recordDecision('Convergence reached', 'success', `Health ${memory.health}/100`);
      iterations.push({
        iteration: memory.iteration,
        stepsExecuted: 0,
        stepsSucceeded: 0,
        stepsFailed: 0,
        remainingGaps: 0,
        buildPassed: true,
      });
      await memory.save();
      break;
    }

    // ── Phase 3.5: Consult past experiences ──
    const gapSummary = refinedGaps.map((g) => g.description).join('; ');
    const pastExperiences = await memory.findRelevantExperiences(gapSummary, 5);
    if (pastExperiences.length > 0) {
      const successfulPatterns = pastExperiences.filter((e) => e.result === 'success');
      const failedPatterns = pastExperiences.filter((e) => e.result === 'failure');
      log('auto', `Found ${pastExperiences.length} relevant past experiences (${successfulPatterns.length} successes, ${failedPatterns.length} failures)`);
    }

    // ── Phase 4: Incremental plan refinement ──
    log('auto', 'Phase 4: Refining execution plan');
    const rawPlan = await createPlan(
      { gaps: refinedGaps, overallHealth: memory.health, criticalIssues: refinedGaps.filter((g) => g.severity === 'critical').length },
      model,
      graph,
    );

    // Filter plan steps based on past failed experiences
    const relevantExperiences = await memory.findRelevantExperiences(
      refinedGaps.map(g => g.description).join(', '),
    );

    const failedPatterns = relevantExperiences
      .filter(e => e.result === 'failure' && e.confidence > 0.5)
      .map(e => e.plan)
      .flat();

    if (failedPatterns.length > 0) {
      log('auto', `Filtering plan based on ${failedPatterns.length} known failed patterns`);
      rawPlan.steps = rawPlan.steps.filter(step => {
        const matchesFailure = failedPatterns.some(fp =>
          fp.toLowerCase().includes(step.action.toLowerCase()) ||
          step.action.toLowerCase().includes(fp.toLowerCase())
        );
        if (matchesFailure) {
          log('auto', `Skipping step "${step.action}" - similar approach failed before`);
        }
        return !matchesFailure;
      });
    }

    // Refine: filter out steps for resolved gaps, carry forward unexecuted steps
    const refinedSteps = memory.refinePlan(rawPlan.steps);
    log('auto', `Plan: ${refinedSteps.length} steps (${rawPlan.steps.length} new, ${refinedSteps.length - rawPlan.steps.length} carried)`);

    // Capture baseline build errors BEFORE executing any changes
    log('auto', 'Capturing baseline build errors');
    const baselineBuild = runCommand('npm run build 2>&1 || true', repoPath);
    const iterationBaseline = captureBaseline(baselineBuild);
    if (baselineBuild.exitCode !== 0) {
      const baseAll = parseStructuredErrors(baselineBuild.stderr || baselineBuild.stdout);
      const { envErrors } = classifyEnvironmentErrors(baseAll);
      log('auto', `Baseline: ${baseAll.length} errors (${envErrors.length} environment), will ignore these`);
    } else {
      log('auto', 'Baseline: clean build');
    }

    if (refinedSteps.length === 0) {
      log('auto', 'No actionable steps — stopping');
      memory.recordDecision('No steps available', 'skipped', 'All gaps either resolved or unfixable');
      iterations.push({
        iteration: memory.iteration,
        stepsExecuted: 0,
        stepsSucceeded: 0,
        stepsFailed: 0,
        remainingGaps: refinedGaps.length,
        buildPassed: true,
      });
      await memory.save();
      break;
    }

    // ── Phase 5: Execute with decision tracking ──
    log('auto', 'Phase 5: Executing plan');
    const execResult = await executePlanWithMemory(refinedSteps, graph, repoPath, memory);
    totalChanges += execResult.succeeded;

    // ── Phase 6: Validate ──
    log('auto', 'Phase 6: Validating changes');
    const affectedFilesForValidation = [...new Set(refinedSteps.flatMap((s) => s.targetFiles))];
    const buildPassed = await validate(repoPath, graph, affectedFilesForValidation, iterationBaseline);
    memory.recordDecision(
      'Validation',
      buildPassed ? 'success' : 'failure',
      buildPassed ? 'Build passed' : 'Build failed',
    );

    iterations.push({
      iteration: memory.iteration,
      stepsExecuted: execResult.executed,
      stepsSucceeded: execResult.succeeded,
      stepsFailed: execResult.failed,
      remainingGaps: refinedGaps.length - execResult.succeeded,
      buildPassed,
    });

    // ── Phase 6.5: Record experience ──
    const overallResult = buildPassed && execResult.failed === 0 ? 'success'
      : execResult.succeeded > 0 ? 'partial' : 'failure';

    const executedSteps = refinedSteps.filter((s) => !memory.failedStepIds.includes(s.id));
    const affectedFiles = [...new Set(executedSteps.flatMap((s) => s.targetFiles))];

    await memory.recordExperience(
      gapSummary.slice(0, 200),
      refinedGaps[0]?.system || 'unknown',
      'system',
      refinedSteps.map((s) => s.action),
      executedSteps.map((s) => `${s.system}: ${s.action}`),
      overallResult as 'success' | 'failure' | 'partial',
      affectedFiles,
      buildPassed
        ? `Iteration ${memory.iteration}: ${execResult.succeeded} changes applied successfully`
        : `Iteration ${memory.iteration}: ${execResult.failed} failures, build ${buildPassed ? 'passed' : 'failed'}`,
    );

    // Adjust confidence of past experiences
    for (const pastExp of pastExperiences) {
      const similar = pastExp.detectedFlow === (refinedGaps[0]?.system || '');
      if (similar) {
        memory.adjustExperienceConfidence(pastExp.id, overallResult === 'success');
      }
    }

    // Track changed files for incremental reassessment
    memory.addChangedFiles(affectedFiles);

    // ── Phase 7: Save memory, prepare for next iteration ──
    await memory.save();

    // Incremental re-index: don't throw away the graph, rebuild it
    log('auto', 'Phase 7: Incremental re-index');
    graph = new KnowledgeGraph();

    if (buildPassed && execResult.failed === 0) {
      log('auto', `Iteration ${memory.iteration} complete — all steps succeeded`);
    } else {
      log('auto', `Iteration ${memory.iteration} complete — ${execResult.failed} failures, will refine`);
    }
  }

  // Final save
  model = buildProjectModel(graph);
  memory.updateIntent(model);
  await memory.save();

  const result: AutonomousResult = {
    iterations,
    finalModel: model,
    totalChanges,
    success: iterations.length > 0 && iterations[iterations.length - 1].buildPassed,
    summary: buildSummary(iterations),
  };

  log('auto', `Autonomous run complete: ${result.summary}`);
  return result;
}

/**
 * Execute plan steps with decision tracking in working memory.
 */
async function executePlanWithMemory(
  steps: PlanStep[],
  graph: KnowledgeGraph,
  repoPath: string,
  memory: WorkingMemory,
): Promise<{ executed: number; succeeded: number; failed: number }> {
  const completed = new Set<number>();
  let succeeded = 0;
  let failed = 0;

  for (const step of steps) {
    // Skip previously failed steps
    if (memory.failedStepIds.includes(step.id)) {
      log('auto', `Skipping step ${step.id} (${step.action}) — failed in prior iteration`);
      memory.recordDecision(`Step ${step.id}: ${step.action}`, 'skipped', 'Failed in prior iteration');
      continue;
    }

    // Check dependencies — log warning but attempt anyway to avoid cascading failures
    const depsReady = step.dependencies.every((depId) => completed.has(depId));
    if (!depsReady) {
      log('auto', `Step ${step.id} (${step.action}) — dependencies not met, attempting anyway`);
    }

    log('auto', `Executing step ${step.id}: [${step.system}] ${step.action}`);

    try {
      const changes = await proposeChanges(step.instruction, step.targetFiles, graph);

      if (changes.length === 0) {
        log('auto', `Step ${step.id}: no changes proposed — skipping`);
        completed.add(step.id);
        memory.recordDecision(`Step ${step.id}: ${step.action}`, 'skipped', 'No changes proposed');
        continue;
      }

      await applyChanges(changes);
      log('auto', `Step ${step.id}: applied ${changes.length} change(s)`);

      completed.add(step.id);
      succeeded++;
      memory.recordDecision(
        `Step ${step.id}: ${step.action}`,
        'success',
        `Applied ${changes.length} change(s)`,
      );
    } catch (error) {
      logError('auto', `Step ${step.id} failed`, error);
      failed++;
      memory.recordFailedStep(step.id);
      memory.recordDecision(
        `Step ${step.id}: ${step.action}`,
        'failure',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return { executed: completed.size + failed, succeeded, failed };
}

// ── World Model Construction ──

async function indexRepository(
  repoPath: string,
  graph: KnowledgeGraph,
): Promise<{ files: number; nodes: number; edges: number }> {
  // 1. Parse all files
  log('parse', 'Parsing repository');
  const parseResults = await parseRepository(repoPath);

  // 2. Build structural dependency graph
  log('graph', 'Building dependency graph');
  const { nodes, edges } = buildDependencyGraph(parseResults);

  // 3. Build knowledge graph
  graph.build(nodes, edges);
  const stats = graph.getStats();
  log('graph', 'Knowledge graph built', stats as unknown as Record<string, unknown>);

  // 4. Generate embeddings and store in vector DB
  try {
    log('embed', `Generating embeddings for ${nodes.length} nodes`);
    await initCollection();
    const textsToEmbed = nodes
      .filter((n) => n.type !== 'import' && n.type !== 'export')
      .slice(0, 500); // cap to avoid excessive API calls
    if (textsToEmbed.length > 0) {
      const texts = textsToEmbed.map(createNodeEmbeddingText);
      const embeddings = await generateEmbeddings(texts);
      await upsertNodes(textsToEmbed, embeddings);
      log('embed', `Stored ${textsToEmbed.length} embeddings`);
    }
  } catch (error) {
    logError('embed', 'Embedding generation failed (continuing without vector search)', error);
  }

  return { files: parseResults.length, nodes: nodes.length, edges: edges.length };
}

/**
 * Build a ProjectModel from the knowledge graph by combining
 * structural, semantic, and simulation data.
 */
export function buildProjectModel(graph: KnowledgeGraph): ProjectModel {
  const stats = graph.getStats();

  // ── Systems: group nodes by domain ──
  const systems = buildSystems(graph);

  // ── Flows: trace from route handlers ──
  const flows = buildFlows(graph);

  // ── Entities: extract from classes/interfaces with model patterns ──
  const entities = buildEntities(graph);

  return {
    systems,
    flows,
    entities,
    stats: {
      files: stats.nodesByType['file'] || 0,
      functions: (stats.nodesByType['function'] || 0) + (stats.nodesByType['method'] || 0),
      classes: stats.nodesByType['class'] || 0,
      routes: stats.nodesByType['route'] || 0,
    },
  };
}

function buildSystems(graph: KnowledgeGraph): System[] {
  const domainMap = new Map<string, string[]>();

  // Group all nodes by their domain metadata
  const allTypes: Array<'function' | 'class' | 'method' | 'route' | 'variable'> = [
    'function', 'class', 'method', 'route', 'variable',
  ];
  for (const type of allTypes) {
    for (const node of graph.findByType(type)) {
      const domain = node.metadata.domain || inferDomain(node);
      if (!domainMap.has(domain)) domainMap.set(domain, []);
      domainMap.get(domain)!.push(node.id);
    }
  }

  const systems: System[] = [];
  for (const [domain, nodeIds] of domainMap) {
    const issues: string[] = [];
    let completeness = 1.0;

    // Check system health
    const nodes = nodeIds.map((id) => graph.getNode(id)).filter(Boolean) as CodeNode[];

    // Functions without callers or exports → potentially dead code
    const orphaned = nodes.filter((n) => {
      if (n.type !== 'function') return false;
      if (n.metadata.exported) return false;
      const deps = getReverseDependencies(graph, n.id);
      return deps.length === 0;
    });
    if (orphaned.length > 0) {
      issues.push(`${orphaned.length} unused functions`);
      completeness -= orphaned.length * 0.05;
    }

    // Check for error handling
    const hasErrorHandling = nodes.some((n) => /try\s*\{|\.catch\(/s.test(n.content));
    if (!hasErrorHandling && nodes.length > 3) {
      issues.push('no error handling');
      completeness -= 0.15;
    }

    // Check for validation
    const hasValidation = nodes.some((n) => /validate|schema|parse|zod|joi/i.test(n.content));
    if (!hasValidation && domain === 'api') {
      issues.push('no input validation');
      completeness -= 0.2;
    }

    systems.push({
      name: domain,
      domain,
      nodeIds,
      completeness: Math.max(0, Math.min(1, completeness)),
      issues,
    });
  }

  return systems;
}

function inferDomain(node: CodeNode): string {
  const pathLower = node.filePath.toLowerCase();
  const nameLower = node.name.toLowerCase();
  const combined = pathLower + ' ' + nameLower;

  if (/auth|login|signup|session|jwt|token|password/i.test(combined)) return 'auth';
  if (/route|controller|endpoint|handler|api/i.test(combined)) return 'api';
  if (/model|schema|entity|migration/i.test(combined)) return 'models';
  if (/db|database|prisma|sequelize|mongo|query/i.test(combined)) return 'database';
  if (/middleware/i.test(combined)) return 'middleware';
  if (/valid|sanitiz/i.test(combined)) return 'validation';
  if (/test|spec|__test/i.test(combined)) return 'testing';
  if (/log|monitor|metric/i.test(combined)) return 'logging';
  if (/util|helper|lib|common/i.test(combined)) return 'utils';
  if (/config|env|setting/i.test(combined)) return 'config';
  if (/component|page|view|layout|hook|context/i.test(combined)) return 'frontend';
  if (/service/i.test(combined)) return 'services';

  return 'core';
}

function buildFlows(graph: KnowledgeGraph): Flow[] {
  const flows: Flow[] = [];
  const routes = graph.findByType('route');

  for (const route of routes) {
    const method = route.metadata.httpMethod || 'GET';
    const path = route.metadata.routePath || route.name;
    const flowName = `${method} ${path}`;

    // Trace the call chain from this route handler
    const chain = getCallChain(graph, route.id);
    const steps = chain.map((n) => n.id);

    // Determine completeness
    const gaps: string[] = [];
    const chainContent = chain.map((n) => n.content).join('\n');

    if (!/validate|schema|parse|zod/i.test(chainContent)) {
      gaps.push('no input validation');
    }
    if (!/try\s*\{|\.catch\(/s.test(chainContent) && chain.length > 1) {
      gaps.push('no error handling');
    }
    if (!/res\.(json|send|status)|return\s/i.test(chainContent)) {
      gaps.push('no response handling');
    }

    flows.push({
      name: flowName,
      entryPoint: route.id,
      steps,
      complete: gaps.length === 0,
      gaps,
    });
  }

  return flows;
}

function buildEntities(graph: KnowledgeGraph): Entity[] {
  const entities: Entity[] = [];
  const classes = graph.findByType('class');
  const interfaces = graph.findByType('interface');
  const types = graph.findByType('type');

  const candidates = [...classes, ...interfaces, ...types];

  for (const node of candidates) {
    // Check if this looks like a data model/entity
    const isModel = /model|entity|schema|record|dto/i.test(node.name) ||
      /model|entity|schema/i.test(node.filePath) ||
      node.metadata.decorators?.some((d) => /Entity|Table|Model|Schema/i.test(d));

    if (!isModel && node.type === 'class') {
      // Classes in model directories also count
      if (!/model|entity|schema/i.test(node.filePath)) continue;
    }

    // Extract fields from content
    const fields: string[] = [];
    const fieldPattern = /(\w+)\s*[?]?\s*:\s*(\w+)/g;
    let match;
    while ((match = fieldPattern.exec(node.content)) !== null) {
      fields.push(match[1]);
    }

    // Find nodes that use this entity
    const usedBy = getReverseDependencies(graph, node.id).map((n) => n.id);

    entities.push({
      name: node.name,
      nodeId: node.id,
      fields,
      usedBy,
    });
  }

  return entities;
}

// ── Validation ──

async function validate(
  repoPath: string,
  graph: KnowledgeGraph,
  changedFiles?: string[],
  baselineFingerprints?: Set<string>,
): Promise<boolean> {
  const buildResult = runCommand('npm run build 2>&1 || true', repoPath);

  if (buildResult.exitCode !== 0) {
    const rawErrors = buildResult.stderr || buildResult.stdout;
    const allErrors = parseStructuredErrors(rawErrors);
    const { envErrors, codeErrors } = classifyEnvironmentErrors(allErrors);

    // If we have a baseline, only care about NEW errors
    const baseline = baselineFingerprints ?? new Set<string>();
    const newErrors = diffErrors(codeErrors, baseline);

    log('execute', `Build check: ${allErrors.length} total, ${envErrors.length} env, ${codeErrors.length} code, ${newErrors.length} NEW`, {
      newSample: newErrors.slice(0, 3).map(e => e.raw.slice(0, 80)),
    });

    // If no new code errors, treat as success (all errors are pre-existing or environment)
    if (newErrors.length === 0) {
      log('execute', 'Build has errors but none are new — treating as success');
      return true;
    }

    // Only try to fix the NEW errors
    log('execute', `${newErrors.length} new error(s) — attempting auto-fix`);
    const errorFiles = extractErrorFiles(newErrors);
    const formattedErrors = formatErrorsForPrompt(newErrors);
    const targetFiles = errorFiles.length > 0
      ? errorFiles.slice(0, 10)
      : (changedFiles || []).slice(0, 10);

    try {
      const fixes = await proposeChanges(
        `Fix ONLY these build errors (ignore all other errors in the project):\n${formattedErrors.slice(0, 3000)}`,
        targetFiles,
        graph,
      );
      if (fixes.length > 0) {
        await applyChanges(fixes);
        const retryBuild = runCommand('npm run build 2>&1 || true', repoPath);
        if (retryBuild.exitCode === 0) {
          log('execute', 'Build fixed successfully');
          return true;
        }
        // Check if new errors are gone even if build still fails
        const retryRaw = retryBuild.stderr || retryBuild.stdout;
        const retryAll = parseStructuredErrors(retryRaw);
        const retryClassified = classifyEnvironmentErrors(retryAll);
        const retryNew = diffErrors(retryClassified.codeErrors, baseline);
        if (retryNew.length === 0) {
          log('execute', 'New errors fixed — remaining are pre-existing/env only');
          return true;
        }
      }
    } catch (err) {
      log('execute', 'Auto-fix attempt failed', { source: 'validate', error: String(err) });
    }

    log('execute', 'Build still has new errors after auto-fix attempt');
    return false;
  }

  log('execute', 'Build passed');

  // Try tests if they exist
  const testResult = runCommand('npm test 2>&1 || true', repoPath);
  if (testResult.exitCode !== 0 && !testResult.stderr.includes('no test specified')) {
    log('execute', 'Tests failed', { stderr: testResult.stderr.slice(0, 500) });
    return false;
  }

  // Simulate key flows to check for logical issues
  const detectedFlows = detectFlows(graph);
  for (const flow of detectedFlows.slice(0, 3)) {
    try {
      const simResult = simulateFlow(flow, graph);
      const criticalIssues = simResult.issues.filter((issue) => issue.severity === 'high');
      if (criticalIssues.length > 0) {
        log('simulate', `Flow "${flow.name}" has ${criticalIssues.length} critical issues`);
      }
    } catch (err) {
      log('simulate', 'Flow simulation failed, skipping', { source: 'validate', error: String(err) });
    }
  }

  return true;
}

// ── Helpers ──

function buildSummary(iterations: IterationResult[]): string {
  const total = iterations.reduce((acc, it) => acc + it.stepsSucceeded, 0);
  const lastIteration = iterations[iterations.length - 1];
  const buildStatus = lastIteration?.buildPassed ? 'passing' : 'failing';

  return `${iterations.length} iteration(s), ${total} changes applied, build ${buildStatus}, ` +
    `${lastIteration?.remainingGaps ?? 0} gap(s) remaining`;
}
