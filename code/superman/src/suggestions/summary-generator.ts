import { log, logError } from '../logger.js';
import { callClaude, buildPrompt } from '../ai/claude-client.js';
import { predictImpact } from '../impact/predictor.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { StructuredFlow } from '../types.js';
import type { TFIDFIndex } from '../semantic/tfidf.js';
import type { Suggestion } from './engine.js';

// ── Types ──

export interface SuggestionSummary {
  summary: string;           // Plain English explanation
  impact: string;            // What happens if this isn't fixed / is built
  estimatedEffort: string;   // "Small (1-2 files)", "Medium (3-5 files)", "Large (6+ files)"
  affectedFlows: string[];   // User-facing flows that are impacted
  priority: string;          // "Fix this now", "Plan for next sprint", "Nice to have"
}

// ── Effort Estimation ──

function estimateEffort(suggestion: Suggestion): string {
  const fileCount = suggestion.affectedFiles.length;
  if (fileCount <= 2) return 'Small (1-2 files)';
  if (fileCount <= 5) return 'Medium (3-5 files)';
  return `Large (${fileCount} files)`;
}

// ── Priority Description ──

function describePriority(suggestion: Suggestion): string {
  if (suggestion.severity === 'critical') return 'Fix this now — it blocks core functionality';
  if (suggestion.severity === 'high') return 'Fix soon — it affects reliability';
  if (suggestion.severity === 'medium') return 'Plan for next sprint';
  return 'Nice to have — improves code quality';
}

// ── Main: Generate Summary ──

export async function generateSummary(
  suggestion: Suggestion,
  graph: KnowledgeGraph,
  flows: StructuredFlow[],
  tfidfIndex?: TFIDFIndex | null,
): Promise<SuggestionSummary> {
  log('auto', `Generating AI summary for: ${suggestion.title}`);

  // Get impact prediction
  let affectedFlowNames: string[] = [];
  try {
    const impact = predictImpact(suggestion.description, graph, flows, tfidfIndex);
    affectedFlowNames = impact.affectedFlows.map(f => f.flow);
  } catch {
    // Impact prediction is best-effort
  }

  const effort = estimateEffort(suggestion);
  const priority = describePriority(suggestion);

  // Build prompt for Claude to generate a plain-English summary
  const prompt = buildPrompt(
    'a senior engineering lead explaining a codebase issue to a product manager',
    [
      'Explain this issue in 2-3 sentences that a non-technical person can understand.',
      'Focus on: what\'s wrong (or what\'s missing), what impact it has on users, and what fixing it would accomplish.',
      'Do NOT use technical jargon. Do NOT mention file names or function names.',
      'Do NOT use markdown formatting.',
      '',
      `Issue type: ${suggestion.category}`,
      `Severity: ${suggestion.severity}`,
      `Description: ${suggestion.description}`,
      `Suggested fix: ${suggestion.suggestedFix}`,
      `System: ${suggestion.system}`,
      affectedFlowNames.length > 0
        ? `Affected user flows: ${affectedFlowNames.join(', ')}`
        : '',
    ].filter(Boolean).join('\n'),
  );

  let summary: string;
  try {
    summary = await callClaude(prompt, 'auto');
    // Clean up — remove any markdown or quotes Claude might add
    summary = summary.replace(/^["']|["']$/g, '').trim();
    // Cap length
    if (summary.length > 500) {
      summary = summary.slice(0, 497) + '...';
    }
  } catch (err) {
    logError('auto', 'Failed to generate AI summary, using fallback', err);
    summary = buildFallbackSummary(suggestion);
  }

  // Build impact description
  let impact: string;
  if (suggestion.category === 'fix') {
    impact = affectedFlowNames.length > 0
      ? `If not fixed, this affects: ${affectedFlowNames.join(', ')}`
      : 'This issue may cause errors or unexpected behavior for users';
  } else if (suggestion.category === 'feature') {
    impact = `Adding this would improve: ${suggestion.system}`;
  } else {
    impact = 'Improving this would make the codebase easier to maintain and extend';
  }

  return {
    summary,
    impact,
    estimatedEffort: effort,
    affectedFlows: affectedFlowNames,
    priority,
  };
}

// ── Fallback Summary ──

function buildFallbackSummary(suggestion: Suggestion): string {
  switch (suggestion.category) {
    case 'fix':
      return `There's a problem in the ${suggestion.system} area of the app that needs fixing. ${suggestion.suggestedFix}.`;
    case 'feature':
      return `The ${suggestion.system} part of the app is missing functionality. ${suggestion.suggestedFix}.`;
    case 'insight':
      return `The code structure in ${suggestion.system} could be improved for better maintainability. ${suggestion.suggestedFix}.`;
    default:
      return suggestion.description;
  }
}
