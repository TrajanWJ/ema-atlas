import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge } from '../types.js';

// Mock node:fs/promises at module level for ESM compatibility
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { FileHashCache } from '../parser/incremental.js';

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

function makeNode(id: string, name: string, file: string, type: string = 'function'): CodeNode {
  return {
    id,
    name,
    type: type as any,
    filePath: file,
    language: 'typescript',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: `function ${name}() {}`,
    metadata: {},
  };
}

function makeEdge(source: string, target: string, type: string = 'imports'): CodeEdge {
  return { source, target, type: type as any };
}

describe('FileHashCache', () => {
  let cache: FileHashCache;

  beforeEach(() => {
    cache = new FileHashCache();
    vi.clearAllMocks();
  });

  describe('hasChanged', () => {
    it('returns true for a file not yet in cache', () => {
      expect(cache.hasChanged('src/foo.ts', 'const x = 1;')).toBe(true);
    });

    it('returns false when content has not changed', () => {
      const content = 'const x = 1;';
      cache.updateHash('src/foo.ts', content);
      expect(cache.hasChanged('src/foo.ts', content)).toBe(false);
    });

    it('returns true when content has changed', () => {
      cache.updateHash('src/foo.ts', 'const x = 1;');
      expect(cache.hasChanged('src/foo.ts', 'const x = 2;')).toBe(true);
    });
  });

  describe('updateHash', () => {
    it('stores hash so subsequent hasChanged returns false', () => {
      const content = 'export function hello() {}';
      cache.updateHash('lib/hello.ts', content);
      expect(cache.hasChanged('lib/hello.ts', content)).toBe(false);
    });

    it('updates hash when content changes', () => {
      cache.updateHash('lib/hello.ts', 'v1');
      cache.updateHash('lib/hello.ts', 'v2');
      expect(cache.hasChanged('lib/hello.ts', 'v2')).toBe(false);
      expect(cache.hasChanged('lib/hello.ts', 'v1')).toBe(true);
    });
  });

  describe('getChangedFiles', () => {
    it('returns only files whose content changed', async () => {
      // Pre-populate cache with known content
      cache.updateHash('a.ts', 'content-a');
      cache.updateHash('b.ts', 'content-b');

      // Mock readFile: a.ts unchanged, b.ts changed, c.ts is new
      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = String(filePath);
        if (p.endsWith('a.ts')) return 'content-a';
        if (p.endsWith('b.ts')) return 'content-b-modified';
        if (p.endsWith('c.ts')) return 'content-c';
        throw new Error('not found');
      });

      const changed = await cache.getChangedFiles(['a.ts', 'b.ts', 'c.ts'], '/repo');
      expect(changed).toContain('b.ts');
      expect(changed).toContain('c.ts');
      expect(changed).not.toContain('a.ts');
    });

    it('treats unreadable files as changed', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const changed = await cache.getChangedFiles(['missing.ts'], '/repo');
      expect(changed).toContain('missing.ts');
    });
  });

  describe('invalidateDependents', () => {
    it('invalidates files that import the changed file', () => {
      const graph = new KnowledgeGraph();

      // File A exports funcA, File B imports funcA
      const nodeA = makeNode('a', 'funcA', 'src/a.ts');
      const nodeB = makeNode('b', 'funcB', 'src/b.ts');
      const importEdge = makeEdge('b', 'a', 'imports');

      graph.build([nodeA, nodeB], [importEdge]);

      // Pre-populate hashes
      cache.updateHash('src/a.ts', 'original-a');
      cache.updateHash('src/b.ts', 'original-b');

      // Invalidate dependents of a.ts
      const invalidated = cache.invalidateDependents('src/a.ts', graph);

      expect(invalidated).toContain('src/b.ts');
      // b.ts hash should now be removed, so hasChanged returns true
      expect(cache.hasChanged('src/b.ts', 'original-b')).toBe(true);
    });

    it('does not invalidate the changed file itself', () => {
      const graph = new KnowledgeGraph();
      const nodeA = makeNode('a', 'funcA', 'src/a.ts');
      graph.build([nodeA], []);

      cache.updateHash('src/a.ts', 'content-a');
      const invalidated = cache.invalidateDependents('src/a.ts', graph);

      expect(invalidated).not.toContain('src/a.ts');
    });

    it('returns empty array when no dependents exist', () => {
      const graph = new KnowledgeGraph();
      const nodeA = makeNode('a', 'funcA', 'src/a.ts');
      graph.build([nodeA], []);

      const invalidated = cache.invalidateDependents('src/a.ts', graph);
      expect(invalidated).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('removes all stored hashes', () => {
      cache.updateHash('a.ts', 'content');
      cache.updateHash('b.ts', 'content');
      cache.clearCache();
      expect(cache.hasChanged('a.ts', 'content')).toBe(true);
      expect(cache.hasChanged('b.ts', 'content')).toBe(true);
    });
  });

  describe('persistence (load/save)', () => {
    it('saves to disk and reloads correctly', async () => {
      let savedData = '';

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockImplementation(async (_path: any, data: any) => {
        savedData = String(data);
      });

      // Populate and save
      cache.updateHash('src/foo.ts', 'hello world');
      cache.updateHash('src/bar.ts', 'goodbye world');
      await cache.save('/project');

      expect(savedData).toBeTruthy();
      const parsed = JSON.parse(savedData);
      expect(Object.keys(parsed)).toHaveLength(2);

      // Load into a new cache
      mockReadFile.mockResolvedValue(savedData as any);
      const cache2 = new FileHashCache();
      await cache2.load('/project');

      // Same content should not be changed
      expect(cache2.hasChanged('src/foo.ts', 'hello world')).toBe(false);
      expect(cache2.hasChanged('src/bar.ts', 'goodbye world')).toBe(false);
      // Different content should be changed
      expect(cache2.hasChanged('src/foo.ts', 'modified')).toBe(true);
    });

    it('starts fresh when no cache file exists', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const freshCache = new FileHashCache();
      await freshCache.load('/nonexistent');

      // Everything should be treated as changed
      expect(freshCache.hasChanged('any-file.ts', 'content')).toBe(true);
    });
  });

  describe('forceReparse behavior', () => {
    it('cache correctly identifies unchanged files that forceReparse would override', () => {
      // This tests the cache side — forceReparse is handled in parseRepository
      const content = 'const x = 1;';
      cache.updateHash('src/file.ts', content);

      // Without force, hasChanged returns false (would be skipped)
      expect(cache.hasChanged('src/file.ts', content)).toBe(false);

      // The forceReparse flag in parseRepository skips the hasChanged check entirely.
      // We verify the cache is consistent — force behavior is in the parser.
    });
  });
});
