import { describe, it, expect } from 'vitest';
import {
  createExperience,
  buildExperienceContext,
  adjustConfidence,
  getConsecutiveFailures,
  buildPlanningContext,
} from '../experience-store';
import type { Experience } from '../types';

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: overrides.id ?? `exp-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: overrides.timestamp ?? Date.now(),
    query: overrides.query ?? 'test query',
    detectedFlow: overrides.detectedFlow ?? 'test flow',
    intent: overrides.intent ?? 'code',
    plan: overrides.plan ?? ['step 1', 'step 2'],
    actionsTaken: overrides.actionsTaken ?? ['action 1'],
    result: overrides.result ?? 'success',
    affectedFiles: overrides.affectedFiles ?? ['src/test.ts'],
    lesson: overrides.lesson ?? 'test lesson',
    confidence: overrides.confidence ?? 0.8,
  };
}

describe('experience activation', () => {
  describe('createExperience', () => {
    it('creates an experience with correct fields', () => {
      const exp = createExperience(
        'fix auth bug',
        'auth flow',
        'code',
        ['analyze', 'fix'],
        ['modified auth.ts'],
        'success',
        ['src/auth.ts'],
        'Always check token expiry',
      );

      expect(exp.query).toBe('fix auth bug');
      expect(exp.result).toBe('success');
      expect(exp.confidence).toBe(0.8);
      expect(exp.id).toMatch(/^exp-/);
    });

    it('assigns lower confidence for failures', () => {
      const exp = createExperience(
        'fix bug',
        'flow',
        'code',
        [],
        [],
        'failure',
        [],
        'did not work',
      );
      expect(exp.confidence).toBe(0.2);
    });
  });

  describe('adjustConfidence', () => {
    it('boosts confidence when approach worked again', () => {
      const exp = makeExperience({ confidence: 0.5 });
      const experiences = [exp];
      adjustConfidence(experiences, exp.id, true);
      expect(exp.confidence).toBe(0.6);
    });

    it('reduces confidence when approach failed', () => {
      const exp = makeExperience({ confidence: 0.5 });
      const experiences = [exp];
      adjustConfidence(experiences, exp.id, false);
      expect(exp.confidence).toBe(0.35);
    });

    it('caps confidence at 1.0', () => {
      const exp = makeExperience({ confidence: 0.95 });
      const experiences = [exp];
      adjustConfidence(experiences, exp.id, true);
      expect(exp.confidence).toBe(1.0);
    });

    it('floors confidence at 0.0', () => {
      const exp = makeExperience({ confidence: 0.05 });
      const experiences = [exp];
      adjustConfidence(experiences, exp.id, false);
      expect(exp.confidence).toBe(0.0);
    });
  });

  describe('buildExperienceContext', () => {
    it('builds context from experiences', () => {
      const experiences = [
        makeExperience({ result: 'success', query: 'fix auth', lesson: 'check tokens' }),
        makeExperience({ result: 'failure', query: 'fix db', lesson: 'wrong approach' }),
      ];
      const context = buildExperienceContext(experiences);
      expect(context).toContain('Lessons from Past Experience');
      expect(context).toContain('fix auth');
      expect(context).toContain('FAILED');
    });

    it('returns empty string for no experiences', () => {
      expect(buildExperienceContext([])).toBe('');
    });
  });

  describe('getConsecutiveFailures', () => {
    it('counts consecutive failures for a pattern', () => {
      const now = Date.now();
      const experiences: Experience[] = [
        makeExperience({ query: 'fix auth bug', result: 'failure', timestamp: now - 3000 }),
        makeExperience({ query: 'fix auth issue', result: 'failure', timestamp: now - 2000 }),
        makeExperience({ query: 'fix auth problem', result: 'failure', timestamp: now - 1000 }),
      ];
      expect(getConsecutiveFailures(experiences, 'auth')).toBe(3);
    });

    it('stops counting at first success', () => {
      const now = Date.now();
      const experiences: Experience[] = [
        makeExperience({ query: 'fix auth v1', result: 'failure', timestamp: now - 3000 }),
        makeExperience({ query: 'fix auth v2', result: 'success', timestamp: now - 2000 }),
        makeExperience({ query: 'fix auth v3', result: 'failure', timestamp: now - 1000 }),
      ];
      // Most recent first: v3 (failure) -> v2 (success) -> stop
      expect(getConsecutiveFailures(experiences, 'auth')).toBe(1);
    });

    it('returns 0 when no matching experiences', () => {
      expect(getConsecutiveFailures([], 'anything')).toBe(0);
    });
  });

  describe('buildPlanningContext', () => {
    it('includes successful approaches', () => {
      const experiences: Experience[] = [
        makeExperience({ result: 'success', confidence: 0.8, query: 'fix auth', lesson: 'check tokens first' }),
      ];
      const result = buildPlanningContext(experiences, 'auth');
      expect(result.context).toContain('Proven Approaches');
      expect(result.successfulApproaches).toHaveLength(1);
      expect(result.needsHumanReview).toBe(false);
    });

    it('includes failed approaches', () => {
      const experiences: Experience[] = [
        makeExperience({ result: 'failure', query: 'fix auth', lesson: 'wrong approach' }),
      ];
      const result = buildPlanningContext(experiences, 'auth');
      expect(result.context).toContain('Failed Approaches');
      expect(result.failedApproaches).toHaveLength(1);
    });

    it('flags NEEDS_HUMAN_REVIEW after 3 consecutive failures', () => {
      const now = Date.now();
      const experiences: Experience[] = [
        makeExperience({ query: 'fix auth v1', result: 'failure', timestamp: now - 3000 }),
        makeExperience({ query: 'fix auth v2', result: 'failure', timestamp: now - 2000 }),
        makeExperience({ query: 'fix auth v3', result: 'failure', timestamp: now - 1000 }),
      ];
      const result = buildPlanningContext(experiences, 'auth');
      expect(result.needsHumanReview).toBe(true);
      expect(result.context).toContain('NEEDS HUMAN REVIEW');
    });

    it('returns empty context for no experiences', () => {
      const result = buildPlanningContext([], 'anything');
      expect(result.context).toBe('');
      expect(result.needsHumanReview).toBe(false);
    });
  });
});
