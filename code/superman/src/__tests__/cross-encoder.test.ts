import { describe, it, expect } from 'vitest';
import {
  crossEncoderRerank,
  isCrossEncoderReady,
} from '../retrieval/cross-encoder.js';

describe('cross-encoder', () => {
  it('reports readiness state', () => {
    expect(typeof isCrossEncoderReady()).toBe('boolean');
  });

  it('ranks relevant documents higher', async () => {
    const query = 'authenticate user with JWT token';
    const documents = [
      { id: 'a', text: 'function processPayment(amount) { stripe.charge(amount); }' },
      { id: 'b', text: 'function authenticateUser(token) { return jwt.verify(token, secret); }' },
      { id: 'c', text: 'function formatDate(date) { return date.toISOString(); }' },
    ];

    const ranked = await crossEncoderRerank(query, documents);
    expect(ranked[0].id).toBe('b');
    expect(ranked[0].score).toBeGreaterThan(ranked[2].score);
  }, 120000);

  it('handles empty documents', async () => {
    const result = await crossEncoderRerank('test', []);
    expect(result).toEqual([]);
  });

  it('respects topK parameter', async () => {
    const docs = [
      { id: 'a', text: 'function a() {}' },
      { id: 'b', text: 'function b() {}' },
      { id: 'c', text: 'function c() {}' },
    ];
    const result = await crossEncoderRerank('function', docs, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  }, 120000);
});
