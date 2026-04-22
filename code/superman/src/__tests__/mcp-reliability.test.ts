import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActiveSession,
  requireSession,
  getSessionHealth,
  invalidateSession,
  resetForTesting,
  getLastKnownPath,
} from '../../codevault-mcp/session';

describe('MCP reliability', () => {
  beforeEach(() => {
    resetForTesting();
  });

  describe('requireSession', () => {
    it('throws actionable error when no session exists', () => {
      try {
        requireSession('test_tool');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('test_tool');
        expect(err.message).toContain('NEXT STEP');
        expect(err.message).toContain('analyze_repo');
        expect(err.message).toContain('Required tool call order');
      }
    });

    it('includes example in error message', () => {
      try {
        requireSession('ask_codebase');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('Example');
        expect(err.message).toContain('analyze_repo');
      }
    });
  });

  describe('getActiveSession', () => {
    it('returns null when no session initialized', () => {
      expect(getActiveSession()).toBeNull();
    });
  });

  describe('getSessionHealth', () => {
    it('returns correct state when no session', () => {
      const health = getSessionHealth();
      expect(health.active).toBe(false);
      expect(health.stale).toBe(false);
      expect(health.repoPath).toBeNull();
      expect(health.age).toBeNull();
      expect(health.initializing).toBe(false);
    });
  });

  describe('invalidateSession', () => {
    it('does not throw when no session exists', () => {
      expect(() => invalidateSession()).not.toThrow();
    });
  });

  describe('resetForTesting', () => {
    it('clears all state', () => {
      resetForTesting();
      expect(getActiveSession()).toBeNull();
      expect(getLastKnownPath()).toBeNull();
    });
  });

  describe('error message quality', () => {
    it('mentions specific tool name in error', () => {
      try {
        requireSession('get_gaps');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('get_gaps');
      }
    });

    it('includes step-by-step instructions', () => {
      try {
        requireSession('simulate_flow');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('1.');
        expect(err.message).toContain('2.');
        expect(err.message).toContain('3.');
      }
    });
  });
});
