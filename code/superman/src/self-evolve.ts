/**
 * Self-Evolution Engine.
 *
 * Defines what this product SHOULD be, analyzes what it IS,
 * finds the gaps, and iteratively builds toward completion.
 *
 * This is not a generic improvement tool — it has a specific
 * target product definition and works toward it.
 */

import { log, logError } from './logger.js';
import { projectManager } from './project-manager.js';
import { simulateFlow, simulateAllFlows, type FlowSimulation } from './simulation/engine.js';
import { predictImpact } from './impact/predictor.js';
import { proposeChanges, applyChanges } from './modification/engine.js';
import { parseStructuredErrors, formatErrorsForPrompt, extractErrorFiles, classifyEnvironmentErrors, captureBaseline, diffErrors } from './execution/runner.js';
import { runCommand } from './execution/runner.js';
import type { StructuredFlow } from './types.js';

// ── Target Product Definition ──

export interface ProductGoal {
  name: string;
  description: string;
  targetUser: string;
  requiredFlows: RequiredFlow[];
  uxExpectations: string[];
}

interface RequiredFlow {
  name: string;
  description: string;
  steps: string[];
  priority: 'critical' | 'high' | 'medium';
}

const TARGET_PRODUCT: ProductGoal = {
  name: 'AI Code Intelligence IDE',
  description: 'An IDE that understands codebases as products, detects what\'s missing, simulates user flows, and iteratively builds toward completion.',
  targetUser: 'Developer who wants to understand, analyze, and improve any codebase',
  requiredFlows: [
    {
      name: 'Project Loading',
      description: 'User opens app, selects a project folder, sees file tree instantly, background indexing shows progress',
      steps: [
        'Open app → see empty state with path input',
        'Click Browse → macOS folder picker opens',
        'Select folder → file tree appears instantly',
        'Status bar shows indexing progress (scanning → analyzing → ready)',
        'Files are clickable during indexing',
      ],
      priority: 'critical',
    },
    {
      name: 'Code Editing',
      description: 'User browses files, opens them in tabs, edits with Monaco, saves with Ctrl+S',
      steps: [
        'Click file in sidebar → opens in editor tab',
        'Multiple files open as tabs',
        'Edit code → tab shows modified indicator',
        'Ctrl+S → saves to disk, indicator clears',
        'Close tab → file removed from tabs',
      ],
      priority: 'critical',
    },
    {
      name: 'AI Query',
      description: 'User asks questions about the codebase, gets intelligent answers with flow context',
      steps: [
        'Open AI panel (right side)',
        'Type question → press Enter',
        'System detects mode (analyze/simulate/execute)',
        'Loading indicator while processing',
        'Response appears with structured format',
        'Can ask follow-up questions',
      ],
      priority: 'critical',
    },
    {
      name: 'Insights Dashboard',
      description: 'User sees project health: tasks, missing features, issues — can click to build/fix',
      steps: [
        'Click Insights in status bar → popup opens',
        'See completeness bar and 3 tabs (Tasks/Features/Issues)',
        'Click a task → expands with explanation and blockers',
        'Click Plan & Build → system plans and executes improvements',
        'Results appear inline with step-by-step progress',
        'Panel refreshes with updated data after build',
      ],
      priority: 'high',
    },
    {
      name: 'Intent Graph Visualization',
      description: 'User explores the codebase as a spatial graph of user flows',
      steps: [
        'Click Graph in status bar → spatial canvas opens',
        'See flows as dots on a line',
        'Scroll to zoom → deeper nodes appear',
        'Drag to orbit around the graph',
        'Click node → inspector shows details',
        'Can edit, add children, or execute nodes',
      ],
      priority: 'medium',
    },
    {
      name: 'Auto-Build',
      description: 'User clicks Build All → system continuously improves the loaded project',
      steps: [
        'Click Build All in Insights panel',
        'System generates product vision',
        'Picks lowest-completeness task',
        'Plans implementation steps',
        'Simulates flow before executing',
        'Executes step by step',
        'Re-indexes and picks next task',
        'Repeats until convergence',
      ],
      priority: 'high',
    },
  ],
  uxExpectations: [
    'Dark theme, clean design, no clutter',
    'Instant response for file operations',
    'Smooth transitions and animations',
    'Clear loading states (never show blank screens)',
    'Error messages that explain what went wrong',
    'Status bar always shows current state',
    'Keyboard shortcuts for common actions',
  ],
};

// ── Self-Evolution Result ──

export interface EvolutionResult {
  iteration: number;
  flowsAnalyzed: number;
  gapsFound: number;
  improvementsAttempted: number;
  improvementsSucceeded: number;
  buildPassed: boolean;
  completeness: { before: number; after: number };
  details: EvolutionDetail[];
}

interface EvolutionDetail {
  flow: string;
  status: 'complete' | 'partial' | 'missing' | 'improved' | 'failed';
  issues: string[];
  actions: string[];
  targetFiles?: string[];
}

// ── Main Evolution Loop ──

export async function selfEvolve(maxIterations: number = 3): Promise<EvolutionResult[]> {
  log('auto', '═══ SELF-EVOLUTION STARTED ═══');
  log('auto', `Target: ${TARGET_PRODUCT.name}`);
  log('auto', `Required flows: ${TARGET_PRODUCT.requiredFlows.length}`);

  const results: EvolutionResult[] = [];
  const repoPath = projectManager.getProjectPath();

  for (let iter = 1; iter <= maxIterations; iter++) {
    log('auto', `\n═══ Evolution Iteration ${iter}/${maxIterations} ═══`);

    // 1. Self-analysis
    log('auto', 'Phase 1: Self-analysis');
    await projectManager.reindex();
    const graph = projectManager.getGraph();
    const currentFlows = projectManager.getFlows();
    const model = projectManager.getModel();

    const beforeCompleteness = currentFlows.length > 0
      ? currentFlows.reduce((s, f) => s + f.completeness, 0) / currentFlows.length
      : 0;

    // 2. Compare against target
    log('auto', 'Phase 2: Gap comparison');
    const gaps = compareAgainstTarget(currentFlows);
    log('auto', `Found ${gaps.length} gaps against target product`);

    if (gaps.length === 0) {
      log('auto', 'No gaps found — product matches target');
      results.push({
        iteration: iter,
        flowsAnalyzed: currentFlows.length,
        gapsFound: 0,
        improvementsAttempted: 0,
        improvementsSucceeded: 0,
        buildPassed: true,
        completeness: { before: beforeCompleteness, after: beforeCompleteness },
        details: [],
      });
      break;
    }

    // 3. Simulate current flows
    log('auto', 'Phase 3: Flow simulation');
    const simulations = simulateAllFlows(currentFlows, graph);
    const simIssues = simulations.reduce((s, sim) => s + sim.issues.length, 0);
    log('auto', `Simulation: ${simulations.length} flows, ${simIssues} total issues`);

    // 4. Prioritize improvements
    log('auto', 'Phase 4: Prioritizing improvements');
    const prioritized = prioritizeGaps(gaps, simulations);

    // 4.5. Capture baseline build errors BEFORE making changes
    log('auto', 'Capturing baseline build errors');
    const baselineBuild = runCommand('npm run build 2>&1 || true', repoPath);
    const selfEvolveBaseline = captureBaseline(baselineBuild);
    if (baselineBuild.exitCode !== 0) {
      const baseAll = parseStructuredErrors(baselineBuild.stderr || baselineBuild.stdout);
      const { envErrors } = classifyEnvironmentErrors(baseAll);
      log('auto', `Baseline: ${baseAll.length} errors (${envErrors.length} env), will ignore these`);
    }

    // 5. Execute top improvements (max 3 per iteration)
    log('auto', 'Phase 5: Executing improvements');
    const details: EvolutionDetail[] = [];
    let succeeded = 0;

    for (const gap of prioritized.slice(0, 3)) {
      log('auto', `Improving: ${gap.flow} — ${gap.issue}`);

      const detail: EvolutionDetail = {
        flow: gap.flow,
        status: 'partial',
        issues: [gap.issue],
        actions: [],
        targetFiles: gap.targetFiles,
      };

      try {
        // Generate fix instruction
        const instruction = buildFixInstruction(gap);

        // Impact check
        const impact = predictImpact(instruction, graph, currentFlows, null);
        if (impact.overallRisk === 'critical') {
          log('auto', `Skipping: critical impact risk`);
          detail.status = 'failed';
          detail.actions.push('Skipped — critical impact risk');
          details.push(detail);
          continue;
        }

        // Execute
        const changes = await proposeChanges(instruction, gap.targetFiles, graph);
        if (changes.length > 0) {
          await applyChanges(changes);
          detail.actions.push(`Applied ${changes.length} change(s)`);
          succeeded++;
          detail.status = 'improved';
        } else {
          detail.actions.push('No changes proposed');
        }
      } catch (err) {
        detail.status = 'failed';
        detail.actions.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }

      details.push(detail);
    }

    // 6. Validate (only flag NEW errors, ignore pre-existing/environment)
    log('auto', 'Phase 6: Validation');
    const buildResult = runCommand('npm run build 2>&1 || true', repoPath);
    let buildPassed = buildResult.exitCode === 0;

    if (!buildPassed && succeeded > 0) {
      const rawError = buildResult.stderr || buildResult.stdout;
      const allErrors = parseStructuredErrors(rawError);
      const { envErrors, codeErrors } = classifyEnvironmentErrors(allErrors);
      const newErrors = diffErrors(codeErrors, selfEvolveBaseline);

      log('auto', `Validation: ${allErrors.length} total, ${envErrors.length} env, ${newErrors.length} NEW`);

      if (newErrors.length === 0) {
        log('auto', 'Build has errors but none are new — treating as success');
        buildPassed = true;
      } else {
        // Only fix NEW errors
        try {
          const errorFiles = extractErrorFiles(newErrors);
          const formatted = formatErrorsForPrompt(newErrors);
          const changedFiles = details
            .filter(d => d.status === 'improved')
            .flatMap(d => d.targetFiles ?? []);
          const fixTargets = errorFiles.length > 0
            ? errorFiles.slice(0, 10)
            : changedFiles.slice(0, 10);

          if (fixTargets.length > 0) {
            const fixes = await proposeChanges(
              `Fix ONLY these build errors (ignore all other errors):\n${formatted.slice(0, 3000)}`,
              fixTargets,
              graph,
            );
            if (fixes.length > 0) {
              await applyChanges(fixes);
              const retry = runCommand('npm run build 2>&1 || true', repoPath);
              if (retry.exitCode === 0) {
                log('auto', 'Auto-fix succeeded');
                buildPassed = true;
              } else {
                // Check if new errors are gone
                const retryRaw = retry.stderr || retry.stdout;
                const retryAll = parseStructuredErrors(retryRaw);
                const retryClassified = classifyEnvironmentErrors(retryAll);
                const retryNew = diffErrors(retryClassified.codeErrors, selfEvolveBaseline);
                if (retryNew.length === 0) {
                  log('auto', 'New errors fixed — remaining are pre-existing/env');
                  buildPassed = true;
                }
              }
            }
          }
        } catch (err) {
          log('auto', 'Auto-fix attempt failed', { source: 'self-evolve', error: String(err) });
        }
      }
    }

    // 7. Re-analyze
    log('auto', 'Phase 7: Re-analysis');
    await projectManager.reindex();
    const afterFlows = projectManager.getFlows();
    const afterCompleteness = afterFlows.length > 0
      ? afterFlows.reduce((s, f) => s + f.completeness, 0) / afterFlows.length
      : 0;

    const result: EvolutionResult = {
      iteration: iter,
      flowsAnalyzed: currentFlows.length,
      gapsFound: gaps.length,
      improvementsAttempted: Math.min(prioritized.length, 3),
      improvementsSucceeded: succeeded,
      buildPassed,
      completeness: {
        before: Math.round(beforeCompleteness * 100),
        after: Math.round(afterCompleteness * 100),
      },
      details,
    };

    results.push(result);
    log('auto', `Iteration ${iter}: ${succeeded} improvements, completeness ${result.completeness.before}% → ${result.completeness.after}%, build ${buildPassed ? 'PASSED' : 'FAILED'}`);

    // Check convergence
    if (afterCompleteness >= 0.95) {
      log('auto', 'Product is 95%+ complete — stopping');
      break;
    }
    if (succeeded === 0) {
      log('auto', 'No improvements succeeded — stopping to avoid spinning');
      break;
    }
  }

  log('auto', '═══ SELF-EVOLUTION COMPLETE ═══');
  return results;
}

// ── Gap Detection ──

interface ProductGap {
  flow: string;
  issue: string;
  priority: 'critical' | 'high' | 'medium';
  type: 'missing_flow' | 'incomplete_step' | 'ux_gap' | 'simulation_issue';
  targetFiles: string[];
}

function compareAgainstTarget(currentFlows: StructuredFlow[]): ProductGap[] {
  const gaps: ProductGap[] = [];
  const flowNames = new Set(currentFlows.map((f) => f.name.toLowerCase()));

  // Check each required flow
  for (const required of TARGET_PRODUCT.requiredFlows) {
    const match = currentFlows.find((f) =>
      f.name.toLowerCase().includes(required.name.toLowerCase()) ||
      required.name.toLowerCase().includes(f.name.toLowerCase()),
    );

    if (!match) {
      gaps.push({
        flow: required.name,
        issue: `Required flow "${required.name}" not found: ${required.description}`,
        priority: required.priority,
        type: 'missing_flow',
        targetFiles: [],
      });
      continue;
    }

    // Check each required step
    for (const step of required.steps) {
      const stepWords = step.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const hasStep = match.steps.some((s) => {
        const actionWords = s.userAction.toLowerCase();
        return stepWords.some((w) => actionWords.includes(w));
      });

      if (!hasStep) {
        gaps.push({
          flow: required.name,
          issue: `Missing step: "${step}"`,
          priority: required.priority === 'critical' ? 'high' : 'medium',
          type: 'incomplete_step',
          targetFiles: match.relatedFiles,
        });
      }
    }

    // Check completeness
    if (match.completeness < 0.5) {
      gaps.push({
        flow: required.name,
        issue: `Flow is only ${Math.round(match.completeness * 100)}% complete`,
        priority: required.priority,
        type: 'incomplete_step',
        targetFiles: match.relatedFiles,
      });
    }
  }

  return gaps;
}

function prioritizeGaps(gaps: ProductGap[], simulations: FlowSimulation[]): ProductGap[] {
  // Add simulation issues as gaps
  for (const sim of simulations) {
    for (const issue of sim.issues.filter((i) => i.severity === 'high')) {
      gaps.push({
        flow: sim.flow,
        issue: `Simulation: ${issue.description}`,
        priority: 'high',
        type: 'simulation_issue',
        targetFiles: [],
      });
    }
  }

  // Sort: critical first, then high, then by type (missing > incomplete > ux > sim)
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  const typeOrder: Record<string, number> = { missing_flow: 0, incomplete_step: 1, ux_gap: 2, simulation_issue: 3 };

  gaps.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    return (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3);
  });

  // Deduplicate
  const seen = new Set<string>();
  return gaps.filter((g) => {
    const key = `${g.flow}::${g.issue.slice(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFixInstruction(gap: ProductGap): string {
  switch (gap.type) {
    case 'missing_flow':
      return `Create the "${gap.flow}" user flow. Requirements: ${gap.issue}. Create the necessary page components, handlers, and API integrations.`;
    case 'incomplete_step':
      return `Complete the "${gap.flow}" flow. ${gap.issue}. Add the missing handler, state management, or API call to make this step functional.`;
    case 'ux_gap':
      return `Improve UX for "${gap.flow}". ${gap.issue}. Add proper loading states, error handling, or transitions.`;
    case 'simulation_issue':
      return `Fix flow issue in "${gap.flow}". ${gap.issue}. Ensure the handler connects properly to the next step in the flow.`;
  }
}

// ── Export target product for API access ──
export function getProductGoal(): ProductGoal {
  return TARGET_PRODUCT;
}
