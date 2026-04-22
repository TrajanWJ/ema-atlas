/**
 * Build Loop — continuous implementation with re-vectorization.
 *
 * When the user clicks "build" on a task:
 * 1. Generate product vision (or load cached)
 * 2. Build full implementation plan
 * 3. Execute each step
 * 4. After each step: re-parse changed files, update flows, update panels
 * 5. Validate build
 * 6. Record experience
 * 7. Return updated state so UI refreshes
 *
 * Can run in "continuous" mode: after finishing one task, pick the next
 * highest-priority task and keep going.
 */

import { log, logError } from './logger.js';
import { projectManager } from './project-manager.js';
import { generateProductVision, buildImplementationPlan, type ProductVision, type ImplementationPlan } from './product-vision.js';
import { proposeChanges, applyChanges } from './modification/engine.js';
import { runCommand, parseStructuredErrors, formatErrorsForPrompt, extractErrorFiles } from './execution/runner.js';
import { getRecommendedFocus } from './focus-engine.js';
import { simulateFlow, type FlowSimulation } from './simulation/engine.js';
import { predictImpact, type ImpactResult } from './impact/predictor.js';
import type { StructuredFlow } from './types.js';

export interface BuildProgress {
  taskName: string;
  vision: ProductVision;
  plan: ImplementationPlan;
  stepsCompleted: number;
  totalSteps: number;
  currentStep: string;
  buildPassed: boolean;
  errors: string[];
  completed: boolean;
  nextTask: string | null;
  simulation?: FlowSimulation;
  impact?: ImpactResult;
}

let cachedVision: ProductVision | null = null;

/**
 * Build a single task end-to-end.
 */
export async function buildTask(
  taskName: string,
  blockers: string[],
  continuous: boolean = false,
): Promise<BuildProgress> {
  log('auto', `═══ BUILD: ${taskName} ═══`);

  const model = projectManager.getModel();
  const graph = projectManager.getGraph();
  const flows = projectManager.getFlows();

  if (!model) throw new Error('Project not indexed');

  // 1. Product vision (cached, refreshed every 10 min)
  if (!cachedVision || Date.now() - cachedVision.timestamp > 600_000) {
    cachedVision = await generateProductVision(model, flows, cachedVision);
    log('auto', `Vision: "${cachedVision.purpose}" → Next: ${cachedVision.nextMilestone}`);
  }

  // 2. Implementation plan
  const plan = await buildImplementationPlan(taskName, blockers, cachedVision, model, flows);
  log('plan', `Plan: ${plan.steps.length} steps, complexity: ${plan.estimatedComplexity}`);
  log('plan', `Approach: ${plan.approach}`);

  // 3. SIMULATE before executing — check if the flow works now
  const targetFlow = flows.find((f) =>
    f.name.toLowerCase().includes(taskName.toLowerCase()) ||
    taskName.toLowerCase().includes(f.name.toLowerCase()),
  );
  let preSim: FlowSimulation | undefined;
  if (targetFlow) {
    preSim = simulateFlow(targetFlow, graph);
    log('simulate', `Pre-simulation: ${preSim.overallValidity * 100}% valid, ${preSim.issues.length} issues`);
  }

  // 4. IMPACT PREDICTION — check blast radius
  let impact: ImpactResult | undefined;
  try {
    const tfidfIndex = projectManager.getTFIDFIndex();
    impact = predictImpact(plan.approach, graph, flows, tfidfIndex);
    if (impact.overallRisk === 'critical') {
      log('auto', `⚠ CRITICAL impact detected: ${impact.recommendation}`);
    }
  } catch (err) {
    log('auto', 'Impact prediction unavailable, proceeding without risk assessment', { source: 'build-loop', error: String(err) });
  }

  const progress: BuildProgress = {
    taskName,
    vision: cachedVision,
    plan,
    stepsCompleted: 0,
    totalSteps: plan.steps.length,
    currentStep: '',
    buildPassed: false,
    errors: [],
    completed: false,
    nextTask: null,
    simulation: preSim,
    impact,
  };

  // 5. Execute each step
  for (const step of plan.steps) {
    progress.currentStep = step.action;
    log('auto', `Step ${step.order}/${plan.steps.length}: ${step.action}`);

    try {
      // Generate code changes
      const changes = await proposeChanges(step.instruction, step.targetFiles, graph);

      if (changes.length === 0) {
        log('auto', `Step ${step.order}: no changes proposed, skipping`);
        progress.stepsCompleted++;
        continue;
      }

      // Apply
      await applyChanges(changes);
      log('auto', `Step ${step.order}: applied ${changes.length} change(s)`);
      progress.stepsCompleted++;

      // 4. Re-index changed files (incremental)
      // The file watcher handles this automatically via chokidar
      // But we trigger a manual re-compute of panel data
      try {
        // Give the watcher a moment to detect changes
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        log('auto', 'File watcher sync timeout, proceeding with possibly stale data', { source: 'build-loop', error: String(err) });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log('auto', `Step ${step.order} failed: ${msg}`);
      progress.errors.push(`Step ${step.order}: ${msg}`);

      // Try to continue with next step
      continue;
    }
  }

  // 5. Validate build
  try {
    const repoPath = projectManager.getProjectPath();
    const buildResult = runCommand('npm run build 2>&1', repoPath);
    progress.buildPassed = buildResult.exitCode === 0;

    if (!progress.buildPassed) {
      log('execute', 'Build failed, attempting auto-fix');

      // Auto-fix attempt with structured error parsing
      try {
        const rawErrors = buildResult.stderr || buildResult.stdout;
        const structuredErrors = parseStructuredErrors(rawErrors);
        const errorFiles = extractErrorFiles(structuredErrors);
        const formattedErrors = formatErrorsForPrompt(structuredErrors);

        // Target files: prefer files from errors, fall back to files changed by plan steps
        const stepFiles = plan.steps.flatMap((s) => s.targetFiles);
        const fixTargets = errorFiles.length > 0
          ? [...new Set([...errorFiles, ...stepFiles])].slice(0, 10)
          : stepFiles.slice(0, 10);

        const fixes = await proposeChanges(
          `Fix these build errors:\n${formattedErrors.slice(0, 3000)}`,
          fixTargets,
          graph,
        );
        if (fixes.length > 0) {
          await applyChanges(fixes);
          const retry = runCommand('npm run build 2>&1', repoPath);
          progress.buildPassed = retry.exitCode === 0;
          if (progress.buildPassed) log('execute', 'Auto-fix succeeded');
        }
      } catch (err) {
        log('auto', 'Auto-fix attempt failed', { source: 'build-loop', error: String(err) });
      }
    }
  } catch {
    progress.buildPassed = false;
  }

  // 6. Trigger full re-index to update everything
  try {
    await projectManager.reindex();
    log('auto', 'Re-indexed after build');
  } catch (err) {
    logError('auto', 'Re-index failed', err);
  }

  // 6.5. Post-execution simulation — did the flow improve?
  if (targetFlow) {
    const updatedFlow = projectManager.getFlows().find((f) => f.id === targetFlow.id);
    if (updatedFlow) {
      const postSim = simulateFlow(updatedFlow, projectManager.getGraph());
      progress.simulation = postSim;
      const improved = preSim ? postSim.overallValidity > preSim.overallValidity : false;
      log('simulate', `Post-simulation: ${postSim.overallValidity * 100}% valid (${improved ? 'IMPROVED' : 'unchanged'}), ${postSim.issues.length} issues`);
      const allFlows = projectManager.getFlows();
      const postSimAll = allFlows.map((f) => simulateFlow(f, projectManager.getGraph()));
      log('simulate', `Post-build simulation: ${postSimAll.length} flows checked`, {
        source: 'build-loop',
        validFlows: postSimAll.filter(s => s.overallValidity > 0.7).length,
        totalFlows: postSimAll.length,
      });
    }
  }

  // 7. Find next task
  const updatedFlows = projectManager.getFlows();
  const panelData = projectManager.getPanelData();
  const focus = getRecommendedFocus(updatedFlows, panelData.features.map((f) => ({
    type: 'missing_system' as const,
    system: f.affectedFlow,
    description: f.description,
    severity: f.impactScore >= 70 ? 'high' as const : 'medium' as const,
    suggestedFix: f.title,
    affectedNodes: [],
  })), [], 3);

  if (focus.length > 0 && focus[0].name !== taskName) {
    progress.nextTask = focus[0].name;
  }

  progress.completed = true;

  log('auto', `BUILD COMPLETE: ${taskName} — ${progress.stepsCompleted}/${progress.totalSteps} steps, build ${progress.buildPassed ? 'PASSED' : 'FAILED'}`);
  if (progress.nextTask) {
    log('auto', `Suggested next: ${progress.nextTask}`);
  }

  return progress;
}

/**
 * Continuous build — keeps building tasks until convergence or limit.
 */
export async function continuousBuild(maxTasks: number = 5): Promise<BuildProgress[]> {
  const results: BuildProgress[] = [];

  for (let i = 0; i < maxTasks; i++) {
    // Get highest priority task
    const panelData = projectManager.getPanelData();
    const tasks = panelData.completion
      .filter((t) => t.completeness < 1 && t.blockers.length > 0)
      .sort((a, b) => a.completeness - b.completeness);

    if (tasks.length === 0) {
      log('auto', 'No more tasks to build — project is complete');
      break;
    }

    const task = tasks[0];
    log('auto', `Continuous build: task ${i + 1}/${maxTasks} — "${task.task}"`);

    try {
      const result = await buildTask(task.task, task.blockers, true);
      results.push(result);

      if (!result.buildPassed && result.errors.length > 2) {
        log('auto', 'Too many errors, stopping continuous build');
        break;
      }
    } catch (err) {
      logError('auto', `Continuous build failed on "${task.task}"`, err);
      break;
    }
  }

  return results;
}
