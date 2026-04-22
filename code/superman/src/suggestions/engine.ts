import { log } from '../logger.js';
import type { Gap, StructuredFlow, CodeNode } from '../types.js';
import type { FocusItem } from '../focus-engine.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import { predictImpact } from '../impact/predictor.js';
import type { TFIDFIndex } from '../semantic/tfidf.js';

// ── Suggestion Types ──

export type SuggestionCategory = 'fix' | 'feature' | 'insight';

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100, higher = more urgent
  system: string;
  affectedFiles: string[];
  affectedNodes: string[];
  flowId?: string;
  gapType?: Gap['type'];
  suggestedFix: string;
}

export interface SuggestionsResult {
  fixes: Suggestion[];
  features: Suggestion[];
  insights: Suggestion[];
  health: number;
  totalCount: number;
}

// ── Category Classification ──

function classifyGap(gap: Gap): SuggestionCategory {
  switch (gap.type) {
    case 'broken_integration':
      return 'fix';
    case 'missing_system':
    case 'incomplete_flow':
      return 'feature';
    case 'architectural_issue':
      return 'insight';
    default:
      return 'insight';
  }
}

// Refine: broken integrations with 'unresolved import' or 'circular dependency' are fixes.
// Missing systems with low completeness are features. Architectural issues are insights.
// But some incomplete flows that have error handling issues are fixes, not features.
function refineCategory(gap: Gap): SuggestionCategory {
  const desc = gap.description.toLowerCase();

  // Error handling, validation, security issues → fix
  if (desc.includes('no error handling') ||
      desc.includes('missing error') ||
      desc.includes('no input validation') ||
      desc.includes('no input sanitization') ||
      desc.includes('missing auth') ||
      desc.includes('security') ||
      desc.includes('unresolved import') ||
      desc.includes('circular dependency')) {
    return 'fix';
  }

  // God files, coupling, scattered → insight
  if (desc.includes('god file') ||
      desc.includes('high coupling') ||
      desc.includes('scattered across') ||
      desc.includes('consider splitting') ||
      desc.includes('dependents')) {
    return 'insight';
  }

  // Fall back to gap type classification
  return classifyGap(gap);
}

// ── Score Calculation ──

function computeScore(gap: Gap, focusItems: FocusItem[]): number {
  // Base score from severity
  const severityScore: Record<string, number> = {
    critical: 85,
    high: 65,
    medium: 40,
    low: 15,
  };
  let score = severityScore[gap.severity] || 30;

  // Boost from focus engine (if this gap's system/flow is in focus)
  const matchingFocus = focusItems.find(
    (f) => f.flowId === gap.flowId || f.name.toLowerCase().includes(gap.system.toLowerCase())
  );
  if (matchingFocus) {
    score = Math.max(score, matchingFocus.score);
  }

  // Boost for gaps with many affected nodes (wider blast radius)
  if (gap.affectedNodes.length > 5) score += 10;
  if (gap.affectedNodes.length > 15) score += 10;

  return Math.min(100, Math.round(score));
}

// ── File Resolution ──

function resolveAffectedFiles(gap: Gap, graph: KnowledgeGraph): string[] {
  const files = new Set<string>();
  for (const nodeId of gap.affectedNodes) {
    const node = graph.getNode(nodeId);
    if (node) {
      files.add((node as CodeNode).filePath);
    }
  }
  return [...files];
}

// ── Main Engine ──

export function generateSuggestions(
  gaps: Gap[],
  focusItems: FocusItem[],
  graph: KnowledgeGraph,
  health: number,
): SuggestionsResult {
  log('auto', `Generating suggestions from ${gaps.length} gaps`);

  const fixes: Suggestion[] = [];
  const features: Suggestion[] = [];
  const insights: Suggestion[] = [];

  for (let i = 0; i < gaps.length; i++) {
    const gap = gaps[i];
    const category = refineCategory(gap);
    const score = computeScore(gap, focusItems);
    const affectedFiles = resolveAffectedFiles(gap, graph);

    const suggestion: Suggestion = {
      id: `sug_${category}_${i}`,
      category,
      title: buildTitle(gap),
      description: gap.description,
      severity: gap.severity,
      score,
      system: gap.system,
      affectedFiles,
      affectedNodes: gap.affectedNodes,
      flowId: gap.flowId,
      gapType: gap.type,
      suggestedFix: gap.suggestedFix,
    };

    switch (category) {
      case 'fix': fixes.push(suggestion); break;
      case 'feature': features.push(suggestion); break;
      case 'insight': insights.push(suggestion); break;
    }
  }

  // Sort each category by score descending
  fixes.sort((a, b) => b.score - a.score);
  features.sort((a, b) => b.score - a.score);
  insights.sort((a, b) => b.score - a.score);

  const result: SuggestionsResult = {
    fixes,
    features,
    insights,
    health,
    totalCount: fixes.length + features.length + insights.length,
  };

  log('auto', `Suggestions generated: ${fixes.length} fixes, ${features.length} features, ${insights.length} insights`);
  return result;
}

// ── Title Generation ──

function buildTitle(gap: Gap): string {
  const desc = gap.description;

  // Extract a clean, short title from the description
  // Remove quotes and system prefixes
  let title = desc
    .replace(/^(System|Flow|Feature|Function|File)\s+"[^"]+"\s+/i, '')
    .replace(/^"[^"]+"\s+/i, '');

  // Cap at 80 chars
  if (title.length > 80) {
    title = title.slice(0, 77) + '...';
  }

  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}
