import { describe, it, expect } from 'vitest';
import { TFIDFIndex, tokenize } from '../semantic/tfidf.js';

describe('tokenize', () => {
  it('splits camelCase words', () => {
    const tokens = tokenize('getUserName');
    expect(tokens).toContain('user');
    expect(tokens).toContain('name');
  });

  it('splits snake_case words', () => {
    const tokens = tokenize('get_user_name');
    expect(tokens).toContain('user');
    expect(tokens).toContain('name');
  });

  it('removes stopwords', () => {
    const tokens = tokenize('const function return');
    expect(tokens).toHaveLength(0);
  });

  it('filters short tokens', () => {
    const tokens = tokenize('a b cd efg');
    expect(tokens).not.toContain('a');
    expect(tokens).not.toContain('b');
  });
});

describe('TFIDFIndex', () => {
  it('builds index from documents', () => {
    const index = new TFIDFIndex();
    index.build([
      { id: 'a', text: 'user authentication login' },
      { id: 'b', text: 'user profile settings' },
      { id: 'c', text: 'payment checkout cart' },
    ]);
    expect(index.size).toBe(3);
  });

  it('returns similar documents for query', () => {
    const index = new TFIDFIndex();
    index.build([
      { id: 'auth', text: 'user authentication login password' },
      { id: 'profile', text: 'user profile settings avatar' },
      { id: 'payment', text: 'payment checkout credit card' },
    ]);
    const results = index.querySimilar('login authentication', 3);
    expect(results[0].id).toBe('auth');
  });

  it('computes similarity between documents', () => {
    const index = new TFIDFIndex();
    index.build([
      { id: 'a', text: 'user login auth' },
      { id: 'b', text: 'user login session' },
      { id: 'c', text: 'payment cart checkout' },
    ]);
    const simAB = index.similarity('a', 'b');
    const simAC = index.similarity('a', 'c');
    expect(simAB).toBeGreaterThan(simAC);
  });
});
