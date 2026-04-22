import { describe, it, expect } from 'vitest';
import {
  createExperience,
  buildExperienceContext,
  adjustConfidence,
} from '../experience-store.js';
import type { Experience } from '../types.js';

describe('experience store integration', () => {
  it('buildExperienceContext marks failures with warning', () => {
    const experiences: Experience[] = [
      createExperience(
        'add validation to user routes',
        'api',
        'code',
        ['modify function', 'add import'],
        ['modified createUser', 'added zod import'],
        'failure',
        ['src/routes/users.ts'],
        'Failed because schema was incompatible with existing middleware',
      ),
    ];

    const context = buildExperienceContext(experiences);
    expect(context).toContain('FAIL');
    expect(context).toContain('FAILED — avoid repeating it');
    expect(context).toContain('schema was incompatible');
  });

  it('buildExperienceContext includes success lessons', () => {
    const experiences: Experience[] = [
      createExperience(
        'add error handling to routes',
        'api',
        'code',
        ['wrap in try-catch'],
        ['wrapped 5 handlers'],
        'success',
        ['src/routes/users.ts'],
        'Wrapping each handler individually worked better than a global wrapper',
      ),
    ];

    const context = buildExperienceContext(experiences);
    expect(context).toContain('OK');
    expect(context).toContain('individually worked better');
  });

  it('failed experiences get lower initial confidence', () => {
    const failExp = createExperience('test', 'api', 'code', [], [], 'failure', [], 'failed');
    const successExp = createExperience('test', 'api', 'code', [], [], 'success', [], 'worked');

    expect(failExp.confidence).toBe(0.2);
    expect(successExp.confidence).toBe(0.8);
  });

  it('adjustConfidence reduces on failure and boosts on success', () => {
    const experiences: Experience[] = [
      createExperience('test', 'api', 'code', [], [], 'success', [], 'worked'),
    ];

    const initial = experiences[0].confidence;
    adjustConfidence(experiences, experiences[0].id, false);
    expect(experiences[0].confidence).toBeLessThan(initial);

    adjustConfidence(experiences, experiences[0].id, true);
    adjustConfidence(experiences, experiences[0].id, true);
    // Should have bounced back up
    expect(experiences[0].confidence).toBeGreaterThan(0.5);
  });

  it('adjustConfidence caps at 0 and 1', () => {
    const experiences: Experience[] = [
      createExperience('test', 'api', 'code', [], [], 'failure', [], 'bad'),
    ];

    // Keep reducing — should floor at 0
    for (let i = 0; i < 20; i++) {
      adjustConfidence(experiences, experiences[0].id, false);
    }
    expect(experiences[0].confidence).toBe(0);

    // Keep boosting — should cap at 1
    for (let i = 0; i < 20; i++) {
      adjustConfidence(experiences, experiences[0].id, true);
    }
    expect(experiences[0].confidence).toBe(1);
  });

  it('buildExperienceContext returns empty string for no experiences', () => {
    expect(buildExperienceContext([])).toBe('');
  });

  it('experience stores affected files and plan steps', () => {
    const exp = createExperience(
      'add auth middleware',
      'auth',
      'system',
      ['create middleware file', 'wire into routes'],
      ['created src/middleware/auth.ts', 'updated src/routes/index.ts'],
      'success',
      ['src/middleware/auth.ts', 'src/routes/index.ts'],
      'Created dedicated middleware file and imported it in all route files',
    );

    expect(exp.affectedFiles).toHaveLength(2);
    expect(exp.plan).toHaveLength(2);
    expect(exp.actionsTaken).toHaveLength(2);
  });
});
