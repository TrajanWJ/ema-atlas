import { describe, it, expect } from 'vitest';
import { shouldTriggerLLMRerank } from '../retrieval/reranker';
import type { ScoredCandidate } from '../retrieval/types';
import type { CodeNode } from '../types';

function makeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    id: overrides.id ?? 'node-1',
    type: overrides.type ?? 'function',
    name: overrides.name ?? 'testFunction',
    filePath: overrides.filePath ?? 'src/test.ts',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: overrides.content ?? 'function testFunction() {}',
    language: 'typescript',
    metadata: {},
  };
}

function makeCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    id: overrides.id ?? 'c-1',
    text: overrides.text ?? 'test',
    score: overrides.score ?? 0.5,
    sources: overrides.sources ?? ['bm25'],
    type: overrides.type ?? 'code',
    node: overrides.node,
  };
}

describe('shouldTriggerLLMRerank', () => {
  it('triggers when top 3 candidates score within 0.1', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.85 }),
      makeCandidate({ id: 'c-2', score: 0.83 }),
      makeCandidate({ id: 'c-3', score: 0.80 }),
    ];
    expect(shouldTriggerLLMRerank('simple query', candidates, 1)).toBe(true);
  });

  it('does not trigger when top 3 candidates are spread apart', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.95 }),
      makeCandidate({ id: 'c-2', score: 0.70 }),
      makeCandidate({ id: 'c-3', score: 0.50 }),
    ];
    expect(shouldTriggerLLMRerank('simple query', candidates, 1)).toBe(false);
  });

  it('triggers when query has 3+ concepts', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.95 }),
      makeCandidate({ id: 'c-2', score: 0.40 }),
      makeCandidate({ id: 'c-3', score: 0.20 }),
    ];
    expect(shouldTriggerLLMRerank('query about stuff', candidates, 3)).toBe(true);
  });

  it('triggers when query contains "how does"', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.95 }),
      makeCandidate({ id: 'c-2', score: 0.40 }),
      makeCandidate({ id: 'c-3', score: 0.20 }),
    ];
    expect(shouldTriggerLLMRerank('how does auth work', candidates, 1)).toBe(true);
  });

  it('triggers for "explain" queries', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.9 }),
      makeCandidate({ id: 'c-2', score: 0.5 }),
      makeCandidate({ id: 'c-3', score: 0.2 }),
    ];
    expect(shouldTriggerLLMRerank('explain the payment flow', candidates, 1)).toBe(true);
  });

  it('triggers for "why" queries', () => {
    expect(shouldTriggerLLMRerank('why does the login fail', [
      makeCandidate({ score: 0.9 }),
      makeCandidate({ score: 0.5 }),
      makeCandidate({ score: 0.3 }),
    ], 1)).toBe(true);
  });

  it('does not trigger for simple queries with clear ranking', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.95 }),
      makeCandidate({ id: 'c-2', score: 0.50 }),
      makeCandidate({ id: 'c-3', score: 0.20 }),
    ];
    expect(shouldTriggerLLMRerank('find auth module', candidates, 1)).toBe(false);
  });

  it('handles fewer than 3 candidates', () => {
    const candidates: ScoredCandidate[] = [
      makeCandidate({ id: 'c-1', score: 0.9 }),
    ];
    expect(shouldTriggerLLMRerank('simple', candidates, 0)).toBe(false);
  });

  it('handles empty candidates', () => {
    expect(shouldTriggerLLMRerank('test', [], 0)).toBe(false);
  });
});
