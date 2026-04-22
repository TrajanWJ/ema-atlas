import { describe, it, expect, beforeEach } from 'vitest';
import { TestGenerator } from '../intelligence/test-generator.js';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge } from '../types.js';

function makeNode(
  id: string,
  name: string,
  overrides: Partial<CodeNode> = {},
): CodeNode {
  return {
    id,
    name,
    type: 'function',
    filePath: 'src/utils.ts',
    language: 'typescript',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: `function ${name}() {}`,
    metadata: {},
    ...overrides,
  };
}

function makeEdge(source: string, target: string, type: string = 'calls'): CodeEdge {
  return { source, target, type: type as any };
}

describe('TestGenerator', () => {
  let graph: KnowledgeGraph;
  let generator: TestGenerator;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    generator = new TestGenerator(graph, 'vitest');
  });

  // ── getTestFilePath ──

  describe('getTestFilePath', () => {
    it('should place test files in __tests__ directory', () => {
      const result = generator.getTestFilePath('src/foo.ts');
      expect(result).toContain('__tests__');
      expect(result).toContain('foo.test.ts');
    });

    it('should handle nested paths', () => {
      const result = generator.getTestFilePath('src/bar/baz.ts');
      expect(result).toContain('src/bar/__tests__/baz.test.ts');
    });

    it('should handle .js source files', () => {
      const result = generator.getTestFilePath('src/helpers.js');
      expect(result).toContain('helpers.test.ts');
    });

    it('should handle .tsx files', () => {
      const result = generator.getTestFilePath('src/components/Button.tsx');
      expect(result).toContain('Button.test.ts');
    });

    it('should handle deeply nested paths', () => {
      const result = generator.getTestFilePath('src/a/b/c/deep.ts');
      expect(result).toContain('src/a/b/c/__tests__/deep.test.ts');
    });
  });

  // ── generateForFunction ──

  describe('generateForFunction', () => {
    it('should generate a test with correct structure', () => {
      const node = makeNode('f1', 'processData');
      graph.build([node], []);

      const result = generator.generateForFunction(node);

      expect(result.targetFile).toBe('src/utils.ts');
      expect(result.testFile).toContain('__tests__');
      expect(result.content).toContain("import { describe, it, expect } from 'vitest'");
      expect(result.content).toContain("describe('processData'");
      expect(result.testCount).toBeGreaterThanOrEqual(1);
      expect(result.testNames).toContain('should handle valid input');
    });

    it('should generate import statement for target function', () => {
      const node = makeNode('f1', 'calculate');
      graph.build([node], []);

      const result = generator.generateForFunction(node);
      expect(result.content).toContain('import { calculate }');
    });

    it('should generate edge case tests when function has parameters', () => {
      const node = makeNode('f1', 'add', {
        metadata: {
          parameters: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'number' },
          ],
        },
      });
      graph.build([node], []);

      const result = generator.generateForFunction(node);

      expect(result.testNames).toContain('should handle edge cases');
      expect(result.testCount).toBeGreaterThanOrEqual(2);
    });

    it('should generate edge case tests for optional parameters', () => {
      const node = makeNode('f1', 'search', {
        metadata: {
          parameters: [
            { name: 'query', type: 'string' },
            { name: 'limit', type: 'number', optional: true },
          ],
        },
      });
      graph.build([node], []);

      const result = generator.generateForFunction(node);

      expect(result.testNames).toContain('should handle edge cases');
      expect(result.content).toContain('only required parameters');
    });

    it('should generate error tests for functions with try/catch', () => {
      const node = makeNode('f1', 'fetchData', {
        content: `async function fetchData() { try { await fetch('/api'); } catch (err) { throw err; } }`,
        metadata: { async: true },
      });
      graph.build([node], []);

      const result = generator.generateForFunction(node);

      expect(result.testNames).toContain('should handle errors gracefully');
      expect(result.content).toContain('catch');
    });

    it('should handle async functions with await in test bodies', () => {
      const node = makeNode('f1', 'loadUser', {
        content: 'async function loadUser(id: string) { return {}; }',
        metadata: {
          async: true,
          parameters: [{ name: 'id', type: 'string' }],
        },
      });
      graph.build([node], []);

      const result = generator.generateForFunction(node);

      expect(result.content).toContain('async');
      expect(result.content).toContain('await loadUser');
    });

    it('should add dependency test when function calls other functions', () => {
      const caller = makeNode('f1', 'handleRequest');
      const callee = makeNode('f2', 'validateInput');
      graph.build([caller, callee], [makeEdge('f1', 'f2')]);

      const result = generator.generateForFunction(caller);

      expect(result.testNames).toContain('should interact with dependencies correctly');
      expect(result.content).toContain('validateInput');
    });

    it('should use correct parameter defaults based on type', () => {
      const node = makeNode('f1', 'config', {
        metadata: {
          parameters: [
            { name: 'name', type: 'string' },
            { name: 'count', type: 'number' },
            { name: 'enabled', type: 'boolean' },
            { name: 'items', type: 'string[]' },
          ],
        },
      });
      graph.build([node], []);

      const result = generator.generateForFunction(node);

      expect(result.content).toContain("'test'");
      expect(result.content).toContain('42');
      expect(result.content).toContain('true');
      expect(result.content).toContain('[]');
    });
  });

  // ── generateForRoute ──

  describe('generateForRoute', () => {
    it('should generate route tests with correct HTTP method', () => {
      const node = makeNode('r1', 'getUsers', {
        type: 'route',
        metadata: {
          httpMethod: 'GET',
          routePath: '/api/users',
        },
      });
      graph.build([node], []);

      const result = generator.generateForRoute(node);

      expect(result.content).toContain("describe('GET /api/users'");
      expect(result.testNames).toContain('should return success for valid GET request');
    });

    it('should generate validation test for POST routes', () => {
      const node = makeNode('r1', 'createUser', {
        type: 'route',
        metadata: {
          httpMethod: 'POST',
          routePath: '/api/users',
        },
      });
      graph.build([node], []);

      const result = generator.generateForRoute(node);

      expect(result.testNames).toContain('should return 400 for invalid input');
      expect(result.content).toContain('201');
    });

    it('should generate 404 test for GET routes', () => {
      const node = makeNode('r1', 'getUser', {
        type: 'route',
        metadata: {
          httpMethod: 'GET',
          routePath: '/api/users/:id',
        },
      });
      graph.build([node], []);

      const result = generator.generateForRoute(node);

      expect(result.testNames).toContain('should return 404 for missing resource');
    });

    it('should generate 500 test for routes with try/catch', () => {
      const node = makeNode('r1', 'deleteUser', {
        type: 'route',
        content: 'async function deleteUser() { try { await db.delete(); } catch (e) { res.status(500); } }',
        metadata: {
          httpMethod: 'DELETE',
          routePath: '/api/users/:id',
        },
      });
      graph.build([node], []);

      const result = generator.generateForRoute(node);

      expect(result.testNames).toContain('should return 500 on server error');
    });

    it('should not generate validation test for GET routes', () => {
      const node = makeNode('r1', 'listItems', {
        type: 'route',
        metadata: {
          httpMethod: 'GET',
          routePath: '/api/items',
        },
      });
      graph.build([node], []);

      const result = generator.generateForRoute(node);

      expect(result.testNames).not.toContain('should return 400 for invalid input');
    });

    it('should handle missing httpMethod and routePath', () => {
      const node = makeNode('r1', 'unknownRoute', {
        type: 'route',
        metadata: {},
      });
      graph.build([node], []);

      const result = generator.generateForRoute(node);

      expect(result.content).toContain('GET /unknown');
    });
  });

  // ── generateTests (target matching) ──

  describe('generateTests', () => {
    it('should find functions by name', async () => {
      const node = makeNode('f1', 'processPayment', { type: 'function' });
      graph.build([node], []);

      const results = await generator.generateTests('processPayment', '/tmp');

      expect(results).toHaveLength(1);
      expect(results[0].targetFile).toBe('src/utils.ts');
    });

    it('should find functions by partial name', async () => {
      const node = makeNode('f1', 'getUserProfile', { type: 'function' });
      graph.build([node], []);

      const results = await generator.generateTests('User', '/tmp');

      expect(results).toHaveLength(1);
    });

    it('should find nodes by file path', async () => {
      const node = makeNode('f1', 'helper', {
        type: 'function',
        filePath: 'src/helpers/math.ts',
      });
      graph.build([node], []);

      const results = await generator.generateTests('src/helpers/math.ts', '/tmp');

      expect(results).toHaveLength(1);
    });

    it('should find nodes by partial file path', async () => {
      const node = makeNode('f1', 'helper', {
        type: 'function',
        filePath: 'src/helpers/math.ts',
      });
      graph.build([node], []);

      const results = await generator.generateTests('helpers/math.ts', '/tmp');

      expect(results).toHaveLength(1);
    });

    it('should generate tests for all functions when target is "all"', async () => {
      graph.build(
        [
          makeNode('f1', 'funcA', { type: 'function' }),
          makeNode('f2', 'funcB', { type: 'function' }),
          makeNode('c1', 'MyClass', { type: 'class' }), // should be excluded
        ],
        [],
      );

      const results = await generator.generateTests('all', '/tmp');

      expect(results).toHaveLength(2);
    });

    it('should include methods and routes in "all" target', async () => {
      graph.build(
        [
          makeNode('f1', 'func', { type: 'function' }),
          makeNode('m1', 'method', { type: 'method' }),
          makeNode('r1', 'route', { type: 'route', metadata: { httpMethod: 'GET', routePath: '/api' } }),
        ],
        [],
      );

      const results = await generator.generateTests('all', '/tmp');

      expect(results).toHaveLength(3);
    });

    it('should return empty array when no matches found', async () => {
      graph.build([makeNode('f1', 'existing')], []);

      const results = await generator.generateTests('nonExistent', '/tmp');

      expect(results).toHaveLength(0);
    });

    it('should exclude non-testable node types from file targets', async () => {
      graph.build(
        [
          makeNode('f1', 'myFunc', { type: 'function', filePath: 'src/app.ts' }),
          makeNode('i1', 'MyInterface', { type: 'interface', filePath: 'src/app.ts' }),
          makeNode('t1', 'MyType', { type: 'type', filePath: 'src/app.ts' }),
        ],
        [],
      );

      const results = await generator.generateTests('src/app.ts', '/tmp');

      expect(results).toHaveLength(1);
      expect(results[0].targetFile).toBe('src/app.ts');
    });
  });

  // ── Framework detection ──

  describe('detectFramework', () => {
    it('should default to vitest when package.json is missing', async () => {
      const framework = await TestGenerator.detectFramework('/nonexistent/path');
      expect(framework).toBe('vitest');
    });
  });

  // ── Framework-specific import lines ──

  describe('framework-specific output', () => {
    it('should use vitest imports for vitest framework', () => {
      const gen = new TestGenerator(graph, 'vitest');
      const node = makeNode('f1', 'myFunc');
      graph.build([node], []);

      const result = gen.generateForFunction(node);
      expect(result.content).toContain("import { describe, it, expect } from 'vitest'");
    });

    it('should use jest comment for jest framework', () => {
      const gen = new TestGenerator(graph, 'jest');
      const node = makeNode('f1', 'myFunc');
      graph.build([node], []);

      const result = gen.generateForFunction(node);
      expect(result.content).toContain('Jest globals are auto-imported');
    });

    it('should use mocha/chai imports for mocha framework', () => {
      const gen = new TestGenerator(graph, 'mocha');
      const node = makeNode('f1', 'myFunc');
      graph.build([node], []);

      const result = gen.generateForFunction(node);
      expect(result.content).toContain("from 'mocha'");
      expect(result.content).toContain("from 'chai'");
    });
  });
});
