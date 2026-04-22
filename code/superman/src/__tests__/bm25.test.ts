import { describe, it, expect, beforeEach } from 'vitest';
import { BM25Index } from '../semantic/bm25';

describe('BM25Index', () => {
  let index: BM25Index;

  beforeEach(() => {
    index = new BM25Index();
  });

  it('builds index from documents', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'function authenticateUser(token) { verify(token); }' },
      { id: 'fn-pay', name: 'processPayment', filePath: 'src/billing.ts', content: 'function processPayment(amount) { stripe.charge(amount); }' },
    ]);
    expect(index.size).toBe(2);
  });

  it('finds exact function name matches', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'function authenticateUser(token) {}' },
      { id: 'fn-pay', name: 'processPayment', filePath: 'src/billing.ts', content: 'function processPayment(amount) {}' },
    ]);
    const results = index.search('authenticateUser');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('fn-auth');
  });

  it('boosts symbol name matches over content matches', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'validates token' },
      { id: 'fn-other', name: 'doSomething', filePath: 'src/other.ts', content: 'calls authenticateUser internally' },
    ]);
    const results = index.search('authenticateUser');
    expect(results[0].id).toBe('fn-auth');
  });

  it('handles fuzzy matching', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'auth function' },
    ]);
    const results = index.search('autenticate');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no matches', () => {
    index.build([
      { id: 'fn-auth', name: 'authenticateUser', filePath: 'src/auth.ts', content: 'auth' },
    ]);
    const results = index.search('zzzznonexistent');
    expect(results).toHaveLength(0);
  });

  it('supports search with limit', () => {
    index.build([
      { id: 'a', name: 'funcA', filePath: 'a.ts', content: 'token auth' },
      { id: 'b', name: 'funcB', filePath: 'b.ts', content: 'token verify' },
      { id: 'c', name: 'funcC', filePath: 'c.ts', content: 'token decode' },
    ]);
    const results = index.search('token', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('can clear and rebuild', () => {
    index.build([{ id: 'a', name: 'funcA', filePath: 'a.ts', content: 'hello' }]);
    expect(index.size).toBe(1);
    index.build([
      { id: 'b', name: 'funcB', filePath: 'b.ts', content: 'world' },
      { id: 'c', name: 'funcC', filePath: 'c.ts', content: 'test' },
    ]);
    expect(index.size).toBe(2);
  });
});
