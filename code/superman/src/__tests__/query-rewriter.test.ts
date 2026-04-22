import { describe, it, expect, beforeEach } from 'vitest';
import { heuristicExpand, clearRewriteCache, getCachedRewrite } from '../retrieval/query-rewriter';
import type { ExpandedQuery } from '../types';

describe('QueryRewriter', () => {
  beforeEach(() => {
    clearRewriteCache();
  });

  describe('heuristicExpand', () => {
    it('extracts auth concepts from auth-related queries', () => {
      const result = heuristicExpand('how does authentication work');
      expect(result.original).toBe('how does authentication work');
      expect(result.concepts).toContain('auth');
      expect(result.actions).toContain('understand');
    });

    it('extracts database concepts from db queries', () => {
      const result = heuristicExpand('what are the models in the database');
      expect(result.concepts).toContain('database');
      expect(result.actions).toContain('identify');
    });

    it('extracts API concepts from route queries', () => {
      const result = heuristicExpand('list all API endpoints');
      expect(result.concepts).toContain('api');
      expect(result.actions).toContain('find');
    });

    it('extracts UI concepts from component queries', () => {
      const result = heuristicExpand('show the form component');
      expect(result.concepts).toContain('ui');
      expect(result.actions).toContain('find');
    });

    it('infers components from concepts', () => {
      const result = heuristicExpand('how does the auth middleware validate tokens');
      expect(result.concepts).toContain('auth');
      expect(result.components.length).toBeGreaterThan(0);
    });

    it('uses meaningful words as concepts when no domain match', () => {
      const result = heuristicExpand('explain the billing reconciliation process');
      expect(result.concepts.length).toBeGreaterThan(0);
      // Should pick up longer words
      expect(result.concepts.some(c => c.length > 4)).toBe(true);
    });

    it('identifies debug intent', () => {
      const result = heuristicExpand('why does the payment processing fail');
      expect(result.actions).toContain('debug');
    });

    it('identifies trace intent', () => {
      const result = heuristicExpand('what calls the handleLogin function');
      expect(result.actions).toContain('trace');
    });

    it('returns all required fields', () => {
      const result = heuristicExpand('test query');
      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('concepts');
      expect(result).toHaveProperty('actions');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('fileTypes');
      expect(Array.isArray(result.concepts)).toBe(true);
      expect(Array.isArray(result.actions)).toBe(true);
      expect(Array.isArray(result.components)).toBe(true);
      expect(Array.isArray(result.fileTypes)).toBe(true);
    });

    it('limits array sizes', () => {
      const result = heuristicExpand('auth database api component state error config test');
      expect(result.concepts.length).toBeLessThanOrEqual(5);
      expect(result.actions.length).toBeLessThanOrEqual(3);
      expect(result.components.length).toBeLessThanOrEqual(5);
      expect(result.fileTypes.length).toBeLessThanOrEqual(3);
    });
  });

  describe('cache', () => {
    it('returns null for uncached query', () => {
      expect(getCachedRewrite('unknown query')).toBeNull();
    });

    it('clearRewriteCache clears all entries', () => {
      // Trigger heuristicExpand doesn't cache, but rewriteQuery does.
      // Just test that clearing doesn't throw
      clearRewriteCache();
      expect(getCachedRewrite('anything')).toBeNull();
    });
  });

  describe('ExpandedQuery type', () => {
    it('is assignable from heuristicExpand result', () => {
      const result: ExpandedQuery = heuristicExpand('how does auth work');
      expect(result.original).toBe('how does auth work');
    });
  });
});
