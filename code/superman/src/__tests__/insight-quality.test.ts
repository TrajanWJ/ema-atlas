import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyQuestion,
  buildProjectContext,
  invalidateAnswerCache,
  type QAContext,
  type QAAnswer,
} from '../intelligence/project-qa';

describe('insight quality', () => {
  beforeEach(() => {
    invalidateAnswerCache();
  });

  describe('classifyQuestion', () => {
    it('classifies security questions', () => {
      expect(classifyQuestion('who can access the admin panel')).toBe('security');
      expect(classifyQuestion('is the login route protected')).toBe('security');
      expect(classifyQuestion('can users without auth create records')).toBe('security');
    });

    it('classifies data questions', () => {
      expect(classifyQuestion('what tables are in the database')).toBe('data');
      expect(classifyQuestion('show me the prisma schema')).toBe('data');
      expect(classifyQuestion('what fields does the user model have')).toBe('data');
    });

    it('classifies architecture questions', () => {
      expect(classifyQuestion('how does the payment flow work')).toBe('architecture');
      expect(classifyQuestion('what calls the payment service')).toBe('architecture');
      expect(classifyQuestion('what does this component import')).toBe('architecture');
    });

    it('classifies health questions', () => {
      expect(classifyQuestion('what is broken in the system')).toBe('health');
      expect(classifyQuestion('are there any missing features')).toBe('health');
      expect(classifyQuestion('show me each error and gap')).toBe('health');
    });

    it('falls back to general', () => {
      expect(classifyQuestion('tell me about this project')).toBe('general');
    });
  });

  describe('buildProjectContext', () => {
    it('builds context from infrastructure', () => {
      const context: QAContext = {
        infrastructure: {
          database: {
            provider: 'postgresql',
            orm: 'prisma',
            isRunning: true,
            models: [
              {
                name: 'User',
                fields: [
                  { name: 'id', type: 'String', isRelation: false },
                  { name: 'email', type: 'String', isRelation: false },
                ],
                relations: [],
              },
            ],
          },
          services: [],
          envVars: [],
          runtime: { framework: 'Next.js', packageManager: 'npm' },
          ports: [],
        } as any,
        routes: null,
        graph: null,
        model: null,
      };

      const result = buildProjectContext(context);
      expect(result).toContain('Database');
      expect(result).toContain('postgresql');
      expect(result).toContain('User');
    });

    it('includes gaps section when gapAnalysis is provided', () => {
      const context: QAContext = {
        infrastructure: null,
        routes: null,
        graph: null,
        model: null,
        gapAnalysis: {
          gaps: [
            {
              type: 'missing_system' as const,
              system: 'auth',
              description: 'No auth middleware on /api/admin routes',
              severity: 'critical' as const,
              suggestedFix: 'Add auth middleware',
              affectedNodes: [],
            },
          ],
          overallHealth: 65,
          criticalIssues: 1,
        },
      };

      const result = buildProjectContext(context);
      expect(result).toContain('Known Gaps');
      expect(result).toContain('CRITICAL');
      expect(result).toContain('auth middleware');
    });

    it('handles empty context gracefully', () => {
      const context: QAContext = {
        infrastructure: null,
        routes: null,
        graph: null,
        model: null,
      };

      const result = buildProjectContext(context);
      expect(typeof result).toBe('string');
    });
  });

  describe('QAAnswer type', () => {
    it('supports followUpQuestions field', () => {
      const answer: QAAnswer = {
        answer: 'test',
        confidence: 'high',
        evidence: [],
        relatedFiles: [],
        followUpQuestions: ['What about security?', 'How does auth work?'],
      };
      expect(answer.followUpQuestions).toHaveLength(2);
    });
  });

  describe('answer cache', () => {
    it('invalidateAnswerCache does not throw', () => {
      expect(() => invalidateAnswerCache()).not.toThrow();
    });
  });
});
