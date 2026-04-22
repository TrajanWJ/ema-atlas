/**
 * Focus Engine — ranks what to work on next.
 *
 * Considers:
 *   - flow criticality (is this a core user journey?)
 *   - gap density (how many issues in this area?)
 *   - completeness (lower = higher priority)
 *   - blockage count (how many things depend on this?)
 *   - confidence (lower = needs more analysis first)
 */

import { log } from './logger.js';
import type { StructuredFlow, Gap, IntentNode } from './types.js';

export interface FocusItem {
  id: string;
  name: string;
  type: 'flow' | 'gap' | 'node';
  score: number; // 0-100, higher = more urgent
  reason: string;
  flowId?: string;
  relatedGaps: string[];
  completeness: number;
}

/**
 * Get the top priorities for improvement.
 */
export function getRecommendedFocus(
  flows: StructuredFlow[],
  gaps: Gap[],
  intentNodes: IntentNode[],
  limit: number = 10,
): FocusItem[] {
  const items: FocusItem[] = [];

  // Score each flow
  for (const flow of flows) {
    const flowGaps = gaps.filter((g) => g.flowId === flow.id);
    const missingSteps = flow.steps.filter((s) => s.status === 'missing').length;
    const partialSteps = flow.steps.filter((s) => s.status === 'partial').length;

    let score = 0;

    // Incompleteness: 0-40 points
    score += (1 - flow.completeness) * 40;

    // Gap density: 0-25 points
    score += Math.min(25, flowGaps.length * 8);

    // Missing steps: 0-20 points
    score += Math.min(20, missingSteps * 10 + partialSteps * 5);

    // Low confidence: 0-15 points (needs analysis before action)
    score += (1 - flow.confidence) * 15;

    // Critical gaps boost
    const criticalGaps = flowGaps.filter((g) => g.severity === 'critical');
    if (criticalGaps.length > 0) score += 20;

    const reasons: string[] = [];
    if (flow.completeness < 0.5) reasons.push(`${Math.round(flow.completeness * 100)}% complete`);
    if (missingSteps > 0) reasons.push(`${missingSteps} missing steps`);
    if (flowGaps.length > 0) reasons.push(`${flowGaps.length} gaps`);
    if (flow.confidence < 0.5) reasons.push('low confidence');
    if (criticalGaps.length > 0) reasons.push(`${criticalGaps.length} critical`);

    items.push({
      id: flow.id,
      name: flow.name,
      type: 'flow',
      score: Math.min(100, Math.round(score)),
      reason: reasons.join(', ') || 'needs attention',
      flowId: flow.id,
      relatedGaps: flowGaps.map((g) => g.description.slice(0, 60)),
      completeness: flow.completeness,
    });
  }

  // Score orphan gaps (not linked to any flow)
  const flowIds = new Set(flows.map((f) => f.id));
  const orphanGaps = gaps.filter((g) => !g.flowId || !flowIds.has(g.flowId));

  for (const gap of orphanGaps) {
    const severityScore: Record<string, number> = {
      critical: 90, high: 70, medium: 45, low: 20,
    };
    items.push({
      id: `gap::${gap.system}::${gap.description.slice(0, 30)}`,
      name: gap.description.slice(0, 80),
      type: 'gap',
      score: severityScore[gap.severity] || 30,
      reason: `${gap.severity} ${gap.type} in ${gap.system}`,
      relatedGaps: [gap.description],
      completeness: 0,
    });
  }

  // Sort by score descending
  items.sort((a, b) => b.score - a.score);

  log('auto', `Focus engine: ${items.length} items ranked, top: ${items[0]?.name || 'none'} (${items[0]?.score || 0})`);

  return items.slice(0, limit);
}
