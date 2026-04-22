import { describe, it, expect, beforeEach } from 'vitest';
import { FeedbackStore } from '../suggestions/feedback.js';

describe('FeedbackStore', () => {
  let store: FeedbackStore;

  beforeEach(() => {
    // Use a temp path that won't actually write
    store = new FeedbackStore('/tmp/test-project');
  });

  it('records and retrieves stats', () => {
    store.record({
      suggestionId: 'sug_fix_0',
      category: 'fix',
      system: 'auth',
      action: 'built',
      outcome: 'success',
      buildIterations: 1,
      timestamp: Date.now(),
    });

    store.record({
      suggestionId: 'sug_fix_1',
      category: 'fix',
      system: 'auth',
      action: 'built',
      outcome: 'failure',
      buildIterations: 3,
      timestamp: Date.now(),
      errorSummary: 'Import not found',
    });

    const stats = store.getStats();
    expect(stats.totalBuilt).toBe(2);
    expect(stats.totalSucceeded).toBe(1);
    expect(stats.totalFailed).toBe(1);
    expect(stats.successRate).toBe(0.5);
  });

  it('computes score adjustment based on success rate', () => {
    // Record enough data for a system
    for (let i = 0; i < 5; i++) {
      store.record({
        suggestionId: `sug_fix_${i}`,
        category: 'fix',
        system: 'api',
        action: 'built',
        outcome: i < 1 ? 'success' : 'failure', // 20% success
        timestamp: Date.now(),
      });
    }

    const adjustment = store.getScoreAdjustment('api', 'fix');
    expect(adjustment).toBeGreaterThan(1); // Should boost because low success rate
  });

  it('returns 1 for systems with no data', () => {
    expect(store.getScoreAdjustment('unknown', 'fix')).toBe(1);
  });

  it('tracks recently dismissed suggestions', () => {
    store.record({
      suggestionId: 'sug_insight_0',
      category: 'insight',
      system: 'structure',
      action: 'dismissed',
      timestamp: Date.now(),
    });

    expect(store.wasRecentlyDismissed('structure', 'some description')).toBe(true);
    expect(store.wasRecentlyDismissed('auth', 'other')).toBe(false);
  });

  it('returns failure patterns', () => {
    store.record({
      suggestionId: 'sug_fix_0',
      category: 'fix',
      system: 'auth',
      action: 'built',
      outcome: 'failure',
      timestamp: Date.now(),
      errorSummary: 'Cannot find module auth-utils',
    });

    const patterns = store.getFailurePatterns();
    expect(patterns).toContain('Cannot find module auth-utils');
  });

  it('computes stats by category and system', () => {
    store.record({ suggestionId: 's1', category: 'fix', system: 'auth', action: 'built', outcome: 'success', timestamp: Date.now() });
    store.record({ suggestionId: 's2', category: 'feature', system: 'api', action: 'built', outcome: 'failure', timestamp: Date.now() });
    store.record({ suggestionId: 's3', category: 'fix', system: 'auth', action: 'built', outcome: 'success', timestamp: Date.now() });

    const stats = store.getStats();
    expect(stats.byCategory['fix']).toEqual({ built: 2, succeeded: 2 });
    expect(stats.byCategory['feature']).toEqual({ built: 1, succeeded: 0 });
    expect(stats.bySystem['auth']).toEqual({ built: 2, succeeded: 2 });
    expect(stats.bySystem['api']).toEqual({ built: 1, succeeded: 0 });
  });
});
