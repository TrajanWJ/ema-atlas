import { describe, it, expect } from 'vitest';
import { generateSuggestions } from '../suggestions/engine.js';
import type { Gap } from '../types.js';
import type { FocusItem } from '../focus-engine.js';

// Minimal mock KnowledgeGraph
function mockGraph(): any {
  return {
    getNode: (id: string) => {
      if (id === 'node1') return { id: 'node1', filePath: 'src/auth.ts', name: 'loginHandler', type: 'function' };
      if (id === 'node2') return { id: 'node2', filePath: 'src/routes/api.ts', name: 'getUser', type: 'function' };
      return null;
    },
  };
}

function makeGap(overrides: Partial<Gap> = {}): Gap {
  return {
    type: 'broken_integration',
    system: 'auth',
    description: 'Unresolved import in auth.ts',
    severity: 'high',
    suggestedFix: 'Fix the broken import',
    affectedNodes: ['node1'],
    ...overrides,
  };
}

describe('generateSuggestions', () => {
  it('classifies broken_integration as fix', () => {
    const gaps: Gap[] = [makeGap({ type: 'broken_integration' })];
    const result = generateSuggestions(gaps, [], mockGraph(), 70);

    expect(result.fixes.length).toBe(1);
    expect(result.features.length).toBe(0);
    expect(result.insights.length).toBe(0);
    expect(result.fixes[0].category).toBe('fix');
  });

  it('classifies missing_system as feature', () => {
    const gaps: Gap[] = [makeGap({ type: 'missing_system', description: 'System "payments" is missing' })];
    const result = generateSuggestions(gaps, [], mockGraph(), 50);

    expect(result.features.length).toBe(1);
    expect(result.features[0].category).toBe('feature');
  });

  it('classifies architectural_issue as insight', () => {
    const gaps: Gap[] = [makeGap({ type: 'architectural_issue', description: 'File has 20 functions — consider splitting' })];
    const result = generateSuggestions(gaps, [], mockGraph(), 80);

    expect(result.insights.length).toBe(1);
    expect(result.insights[0].category).toBe('insight');
  });

  it('refines "no error handling" to fix regardless of gap type', () => {
    const gaps: Gap[] = [makeGap({ type: 'incomplete_flow', description: 'Flow "login" has no error handling across 5 steps' })];
    const result = generateSuggestions(gaps, [], mockGraph(), 60);

    expect(result.fixes.length).toBe(1);
    expect(result.features.length).toBe(0);
  });

  it('sorts by score descending within each category', () => {
    const gaps: Gap[] = [
      makeGap({ severity: 'low', description: 'Minor issue A' }),
      makeGap({ severity: 'critical', description: 'Critical issue B' }),
      makeGap({ severity: 'medium', description: 'Medium issue C' }),
    ];
    const result = generateSuggestions(gaps, [], mockGraph(), 50);

    const scores = result.fixes.map((s) => s.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('resolves affected files from graph nodes', () => {
    const gaps: Gap[] = [makeGap({ affectedNodes: ['node1', 'node2'] })];
    const result = generateSuggestions(gaps, [], mockGraph(), 70);

    expect(result.fixes[0].affectedFiles).toContain('src/auth.ts');
    expect(result.fixes[0].affectedFiles).toContain('src/routes/api.ts');
  });

  it('boosts score from focus items', () => {
    const gaps: Gap[] = [makeGap({ severity: 'medium', system: 'auth' })];
    const focus: FocusItem[] = [{
      id: 'f1', name: 'auth flow', type: 'flow', score: 90,
      reason: 'critical', flowId: undefined, relatedGaps: [], completeness: 0.2,
    }];

    const withFocus = generateSuggestions(gaps, focus, mockGraph(), 50);
    const withoutFocus = generateSuggestions(gaps, [], mockGraph(), 50);

    expect(withFocus.fixes[0].score).toBeGreaterThanOrEqual(withoutFocus.fixes[0].score);
  });

  it('returns correct totalCount and health', () => {
    const gaps: Gap[] = [
      makeGap({ type: 'broken_integration' }),
      makeGap({ type: 'missing_system', description: 'Missing payment system' }),
      makeGap({ type: 'architectural_issue', description: 'God file with 20 functions' }),
    ];
    const result = generateSuggestions(gaps, [], mockGraph(), 42);

    expect(result.totalCount).toBe(3);
    expect(result.health).toBe(42);
  });

  it('handles empty gaps', () => {
    const result = generateSuggestions([], [], mockGraph(), 100);

    expect(result.fixes).toEqual([]);
    expect(result.features).toEqual([]);
    expect(result.insights).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.health).toBe(100);
  });
});
