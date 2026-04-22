import { getOrRecoverSession } from '../session.ts';
import { buildProjectModel } from '../../src/autonomous-engine.ts';

export async function getGaps() {
  const session = await getOrRecoverSession('get_gaps');

  // Build project model if not cached
  if (!session.model) {
    session.model = buildProjectModel(session.graph);
  }

  const model = session.model;

  const gaps: Array<{
    type: string;
    severity: string;
    description: string;
    system: string;
  }> = [];

  // Gaps from incomplete systems
  for (const system of model.systems) {
    if (system.completeness < 1.0) {
      gaps.push({
        type: 'incomplete_system',
        severity: system.completeness < 0.5 ? 'high' : 'medium',
        description: `System "${system.name}" is ${Math.round(system.completeness * 100)}% complete. Issues: ${system.issues.join(', ') || 'none listed'}`,
        system: system.name,
      });
    }
  }

  // Gaps from flows
  for (const flow of model.flows) {
    if (!flow.complete) {
      gaps.push({
        type: 'incomplete_flow',
        severity: 'high',
        description: `Flow "${flow.name}" is incomplete`,
        system: flow.name,
      });
    }
    for (const gap of flow.gaps) {
      gaps.push({
        type: 'flow_gap',
        severity: 'medium',
        description: gap,
        system: flow.name,
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return {
    totalGaps: gaps.length,
    health: Math.round((1 - gaps.filter(g => g.severity === 'high').length / Math.max(gaps.length, 1)) * 100),
    gaps: gaps.slice(0, 20),
  };
}
