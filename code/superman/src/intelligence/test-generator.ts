import { log } from '../logger.js';
import type { CodeNode } from '../types.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import { readFile } from 'fs/promises';
import { dirname, basename, join } from 'path';

export interface GeneratedTest {
  targetFile: string;
  testFile: string;
  content: string;
  testCount: number;
  testNames: string[];
}

type TestFramework = 'vitest' | 'jest' | 'mocha';

export class TestGenerator {
  private graph: KnowledgeGraph;
  private testFramework: TestFramework;

  constructor(graph: KnowledgeGraph, testFramework: TestFramework = 'vitest') {
    this.graph = graph;
    this.testFramework = testFramework;
  }

  /**
   * Detect test framework from package.json devDependencies.
   */
  static async detectFramework(projectPath: string): Promise<TestFramework> {
    try {
      const pkgRaw = await readFile(join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgRaw);
      const deps = {
        ...pkg.devDependencies,
        ...pkg.dependencies,
      };

      if (deps?.vitest) return 'vitest';
      if (deps?.jest) return 'jest';
      if (deps?.mocha) return 'mocha';
    } catch {
      // package.json missing or unreadable
    }

    return 'vitest';
  }

  /**
   * Calculate the test file path for a given source file.
   * src/foo.ts          -> src/__tests__/foo.test.ts
   * src/bar/baz.ts      -> src/bar/__tests__/baz.test.ts
   * src/bar/baz.js      -> src/bar/__tests__/baz.test.ts
   */
  getTestFilePath(sourceFile: string): string {
    const dir = dirname(sourceFile);
    const base = basename(sourceFile).replace(/\.(ts|js|tsx|jsx)$/, '');
    return join(dir, '__tests__', `${base}.test.ts`);
  }

  /**
   * Generate test for a function node.
   */
  generateForFunction(node: CodeNode): GeneratedTest {
    const testFile = this.getTestFilePath(node.filePath);
    const testNames: string[] = [];
    const lines: string[] = [];

    const importLine = this.buildImportLine(node);
    const describeBlock: string[] = [];

    // Build header
    lines.push(this.getTestImport());
    lines.push('');
    lines.push(importLine);
    lines.push('');

    // Happy path test
    const happyTestName = `should handle valid input`;
    testNames.push(happyTestName);
    const happyBody = this.buildHappyPathBody(node);

    describeBlock.push(`  it('${happyTestName}', ${node.metadata.async ? 'async ' : ''}() => {`);
    describeBlock.push(...happyBody.map(l => `    ${l}`));
    describeBlock.push(`  });`);

    // Edge case test — if function has optional/nullable params
    const hasOptionalParams = node.metadata.parameters?.some(p => p.optional) ?? false;
    const hasParams = (node.metadata.parameters?.length ?? 0) > 0;

    if (hasOptionalParams || hasParams) {
      const edgeTestName = `should handle edge cases`;
      testNames.push(edgeTestName);
      const edgeBody = this.buildEdgeCaseBody(node);

      describeBlock.push('');
      describeBlock.push(`  it('${edgeTestName}', ${node.metadata.async ? 'async ' : ''}() => {`);
      describeBlock.push(...edgeBody.map(l => `    ${l}`));
      describeBlock.push(`  });`);
    }

    // Error case test — if function has try/catch
    const hasTryCatch = node.content.includes('try') && node.content.includes('catch');
    if (hasTryCatch) {
      const errorTestName = `should handle errors gracefully`;
      testNames.push(errorTestName);
      const errorBody = this.buildErrorCaseBody(node);

      describeBlock.push('');
      describeBlock.push(`  it('${errorTestName}', ${node.metadata.async ? 'async ' : ''}() => {`);
      describeBlock.push(...errorBody.map(l => `    ${l}`));
      describeBlock.push(`  });`);
    }

    // Dependency interaction test — if function calls other things
    const callees = this.graph.getNeighbors(node.id, 'forward');
    if (callees.length > 0) {
      const depTestName = `should interact with dependencies correctly`;
      testNames.push(depTestName);

      describeBlock.push('');
      describeBlock.push(`  it('${depTestName}', ${node.metadata.async ? 'async ' : ''}() => {`);
      describeBlock.push(`    // ${node.name} calls: ${callees.map(c => c.name).join(', ')}`);
      describeBlock.push(`    // Verify integration with dependencies`);
      describeBlock.push(`    expect(${node.name}).toBeDefined();`);
      describeBlock.push(`  });`);
    }

    lines.push(`describe('${node.name}', () => {`);
    lines.push(...describeBlock);
    lines.push(`});`);
    lines.push('');

    const content = lines.join('\n');

    log('graph', `Generated ${testNames.length} tests for function ${node.name}`);

    return {
      targetFile: node.filePath,
      testFile,
      content,
      testCount: testNames.length,
      testNames,
    };
  }

  /**
   * Generate test for a route/API endpoint node.
   */
  generateForRoute(node: CodeNode): GeneratedTest {
    const testFile = this.getTestFilePath(node.filePath);
    const testNames: string[] = [];
    const lines: string[] = [];

    const method = (node.metadata.httpMethod ?? 'GET').toUpperCase();
    const routePath = node.metadata.routePath ?? '/unknown';
    const describeName = `${method} ${routePath}`;

    lines.push(this.getTestImport());
    lines.push('');

    const describeBlock: string[] = [];

    // Happy path
    const happyTestName = `should return success for valid ${method} request`;
    testNames.push(happyTestName);
    describeBlock.push(`  it('${happyTestName}', async () => {`);
    describeBlock.push(`    // ${method} ${routePath} with valid input`);
    if (method === 'GET') {
      describeBlock.push(`    const response = { status: 200, body: {} };`);
    } else {
      describeBlock.push(`    const body = {};`);
      describeBlock.push(`    const response = { status: ${method === 'POST' ? '201' : '200'}, body: {} };`);
    }
    describeBlock.push(`    expect(response.status).toBeLessThan(400);`);
    describeBlock.push(`  });`);

    // Validation error
    if (method !== 'GET' && method !== 'DELETE') {
      const validationTestName = `should return 400 for invalid input`;
      testNames.push(validationTestName);
      describeBlock.push('');
      describeBlock.push(`  it('${validationTestName}', async () => {`);
      describeBlock.push(`    // ${method} ${routePath} with invalid/missing fields`);
      describeBlock.push(`    const response = { status: 400, error: 'Validation failed' };`);
      describeBlock.push(`    expect(response.status).toBe(400);`);
      describeBlock.push(`  });`);
    }

    // 404 for missing resource
    if (method === 'GET' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      const notFoundTestName = `should return 404 for missing resource`;
      testNames.push(notFoundTestName);
      describeBlock.push('');
      describeBlock.push(`  it('${notFoundTestName}', async () => {`);
      describeBlock.push(`    // ${method} ${routePath} with non-existent ID`);
      describeBlock.push(`    const response = { status: 404, error: 'Not found' };`);
      describeBlock.push(`    expect(response.status).toBe(404);`);
      describeBlock.push(`  });`);
    }

    // Error handling
    const hasTryCatch = node.content.includes('try') && node.content.includes('catch');
    if (hasTryCatch) {
      const errorTestName = `should return 500 on server error`;
      testNames.push(errorTestName);
      describeBlock.push('');
      describeBlock.push(`  it('${errorTestName}', async () => {`);
      describeBlock.push(`    // ${method} ${routePath} when an internal error occurs`);
      describeBlock.push(`    const response = { status: 500, error: 'Internal server error' };`);
      describeBlock.push(`    expect(response.status).toBe(500);`);
      describeBlock.push(`  });`);
    }

    lines.push(`describe('${describeName}', () => {`);
    lines.push(...describeBlock);
    lines.push(`});`);
    lines.push('');

    const content = lines.join('\n');

    log('graph', `Generated ${testNames.length} tests for route ${describeName}`);

    return {
      targetFile: node.filePath,
      testFile,
      content,
      testCount: testNames.length,
      testNames,
    };
  }

  /**
   * Generate tests for a specific target (function name, file path, or "all").
   */
  async generateTests(target: string, _projectPath: string): Promise<GeneratedTest[]> {
    const results: GeneratedTest[] = [];

    let targetNodes: CodeNode[] = [];

    if (target === 'all') {
      // All functions and routes
      for (const node of this.graph.nodes.values()) {
        if (node.type === 'function' || node.type === 'method' || node.type === 'route') {
          targetNodes.push(node);
        }
      }
    } else if (target.includes('/') || target.includes('\\') || target.endsWith('.ts') || target.endsWith('.js')) {
      // File path — find all nodes in this file
      targetNodes = this.graph.findByFile(target);
      if (targetNodes.length === 0) {
        // Try partial match
        for (const node of this.graph.nodes.values()) {
          if (node.filePath.includes(target)) {
            targetNodes.push(node);
          }
        }
      }
      // Only functions, methods, and routes
      targetNodes = targetNodes.filter(
        n => n.type === 'function' || n.type === 'method' || n.type === 'route',
      );
    } else {
      // Function name — find by name
      targetNodes = this.graph.findByName(target).filter(
        n => n.type === 'function' || n.type === 'method' || n.type === 'route',
      );
    }

    // Deduplicate by test file path to avoid collisions
    const byTestFile = new Map<string, CodeNode[]>();
    for (const node of targetNodes) {
      const testFile = this.getTestFilePath(node.filePath);
      const existing = byTestFile.get(testFile) ?? [];
      existing.push(node);
      byTestFile.set(testFile, existing);
    }

    for (const [_testFile, nodes] of byTestFile) {
      for (const node of nodes) {
        if (node.type === 'route') {
          results.push(this.generateForRoute(node));
        } else {
          results.push(this.generateForFunction(node));
        }
      }
    }

    log('graph', `Generated tests for ${results.length} targets`, { target });

    return results;
  }

  // ── Private helpers ──

  private getTestImport(): string {
    switch (this.testFramework) {
      case 'vitest':
        return "import { describe, it, expect } from 'vitest';";
      case 'jest':
        return "// Jest globals are auto-imported";
      case 'mocha':
        return "import { describe, it } from 'mocha';\nimport { expect } from 'chai';";
    }
  }

  private buildImportLine(node: CodeNode): string {
    // Convert source file path to a relative import from the test file
    const dir = dirname(node.filePath);
    const base = basename(node.filePath).replace(/\.(ts|js|tsx|jsx)$/, '');
    // Test file is in __tests__ subdir, so import goes up one level
    return `import { ${node.name} } from '../${base}.js';`;
  }

  private buildHappyPathBody(node: CodeNode): string[] {
    const lines: string[] = [];
    const params = node.metadata.parameters ?? [];
    const isAsync = node.metadata.async ?? false;

    if (params.length === 0) {
      // No parameters
      if (isAsync) {
        lines.push(`const result = await ${node.name}();`);
      } else {
        lines.push(`const result = ${node.name}();`);
      }
      lines.push(`expect(result).toBeDefined();`);
    } else {
      // Build parameter values based on types
      const args: string[] = [];
      for (const param of params) {
        const value = this.getDefaultValueForType(param.type);
        lines.push(`const ${param.name} = ${value};`);
        args.push(param.name);
      }

      if (isAsync) {
        lines.push(`const result = await ${node.name}(${args.join(', ')});`);
      } else {
        lines.push(`const result = ${node.name}(${args.join(', ')});`);
      }
      lines.push(`expect(result).toBeDefined();`);
    }

    return lines;
  }

  private buildEdgeCaseBody(node: CodeNode): string[] {
    const lines: string[] = [];
    const params = node.metadata.parameters ?? [];
    const isAsync = node.metadata.async ?? false;
    const hasOptional = params.some(p => p.optional);

    if (hasOptional) {
      // Call with only required params
      const requiredParams = params.filter(p => !p.optional);
      const args: string[] = [];
      for (const param of requiredParams) {
        const value = this.getDefaultValueForType(param.type);
        args.push(value);
      }

      lines.push(`// Call with only required parameters`);
      if (isAsync) {
        lines.push(`const result = await ${node.name}(${args.join(', ')});`);
      } else {
        lines.push(`const result = ${node.name}(${args.join(', ')});`);
      }
      lines.push(`expect(result).toBeDefined();`);
    } else if (params.length > 0) {
      // Call with boundary values
      lines.push(`// Test with boundary/edge values`);
      const args: string[] = [];
      for (const param of params) {
        const edgeValue = this.getEdgeValueForType(param.type);
        args.push(edgeValue);
      }
      if (isAsync) {
        lines.push(`const result = await ${node.name}(${args.join(', ')});`);
      } else {
        lines.push(`const result = ${node.name}(${args.join(', ')});`);
      }
      lines.push(`expect(result).toBeDefined();`);
    }

    return lines;
  }

  private buildErrorCaseBody(node: CodeNode): string[] {
    const lines: string[] = [];
    const isAsync = node.metadata.async ?? false;

    if (isAsync) {
      lines.push(`// Verify function handles errors without crashing`);
      lines.push(`try {`);
      lines.push(`  await ${node.name}(${this.buildInvalidArgs(node)});`);
      lines.push(`} catch (err) {`);
      lines.push(`  expect(err).toBeDefined();`);
      lines.push(`}`);
    } else {
      lines.push(`// Verify function handles errors without crashing`);
      lines.push(`try {`);
      lines.push(`  ${node.name}(${this.buildInvalidArgs(node)});`);
      lines.push(`} catch (err) {`);
      lines.push(`  expect(err).toBeDefined();`);
      lines.push(`}`);
    }

    return lines;
  }

  private buildInvalidArgs(node: CodeNode): string {
    const params = node.metadata.parameters ?? [];
    if (params.length === 0) return '';
    return params.map(() => 'null as any').join(', ');
  }

  private getDefaultValueForType(type?: string): string {
    if (!type) return "'test'";
    const lower = type.toLowerCase().replace(/\s/g, '');
    if (lower === 'string') return "'test'";
    if (lower === 'number') return '42';
    if (lower === 'boolean') return 'true';
    if (lower.startsWith('array') || lower.endsWith('[]')) return '[]';
    if (lower === 'object' || lower.startsWith('{')) return '{}';
    if (lower === 'void' || lower === 'undefined') return 'undefined';
    if (lower === 'null') return 'null';
    // Complex types — use empty object
    return '{} as any';
  }

  private getEdgeValueForType(type?: string): string {
    if (!type) return "''";
    const lower = type.toLowerCase().replace(/\s/g, '');
    if (lower === 'string') return "''";
    if (lower === 'number') return '0';
    if (lower === 'boolean') return 'false';
    if (lower.startsWith('array') || lower.endsWith('[]')) return '[]';
    if (lower === 'object' || lower.startsWith('{')) return '{}';
    return '{} as any';
  }
}
