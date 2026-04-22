import { describe, it, expect } from 'vitest';
import { findAPIConsumers, isBackendEndpoint, isFrontendConsumer, findCoordinatedUpdates } from '../execution/api-sync.js';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge } from '../types.js';

function makeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    id: overrides.id ?? 'node-1',
    type: overrides.type ?? 'function',
    name: overrides.name ?? 'handler',
    filePath: overrides.filePath ?? 'src/test.ts',
    range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
    content: overrides.content ?? '',
    language: 'typescript',
    metadata: overrides.metadata ?? {},
  };
}

describe('api-sync', () => {
  describe('isBackendEndpoint', () => {
    it('identifies backend endpoint files', () => {
      expect(isBackendEndpoint('src/routes/users.ts')).toBe(true);
      expect(isBackendEndpoint('src/api/auth.ts')).toBe(true);
      expect(isBackendEndpoint('app/api/users/route.ts')).toBe(true);
      expect(isBackendEndpoint('pages/api/login.ts')).toBe(true);
      expect(isBackendEndpoint('src/controllers/auth.ts')).toBe(true);
      expect(isBackendEndpoint('src/components/Button.tsx')).toBe(false);
      expect(isBackendEndpoint('src/utils/format.ts')).toBe(false);
    });
  });

  describe('isFrontendConsumer', () => {
    it('identifies frontend consumer files', () => {
      expect(isFrontendConsumer('src/components/UserList.tsx')).toBe(true);
      expect(isFrontendConsumer('src/hooks/useUser.ts')).toBe(true);
      expect(isFrontendConsumer('src/store/userStore.ts')).toBe(true);
      expect(isFrontendConsumer('src/pages/dashboard.tsx')).toBe(true);
      expect(isFrontendConsumer('src/routes/api.ts')).toBe(false);
      expect(isFrontendConsumer('src/utils/format.ts')).toBe(false);
    });
  });

  describe('findAPIConsumers', () => {
    it('finds frontend consumers of a backend endpoint', () => {
      const graph = new KnowledgeGraph();
      const nodes: CodeNode[] = [
        makeNode({ id: 'route', name: 'getUsers', filePath: 'src/routes/users.ts',
          content: 'router.get("/api/users", getUsers)',
          metadata: { httpMethod: 'GET', routePath: '/api/users', exported: true } }),
        makeNode({ id: 'hook', name: 'useUsers', filePath: 'src/hooks/useUsers.ts',
          content: 'export function useUsers() { return fetch("/api/users"); }' }),
        makeNode({ id: 'component', name: 'UserList', filePath: 'src/components/UserList.tsx',
          content: 'function UserList() { const users = useUsers(); }' }),
        makeNode({ id: 'unrelated', name: 'formatDate', filePath: 'src/utils/format.ts',
          content: 'export function formatDate(d) {}' }),
      ];
      const edges: CodeEdge[] = [
        { source: 'hook', target: 'route', type: 'calls' },
        { source: 'component', target: 'hook', type: 'imports' },
      ];
      graph.build(nodes, edges);

      const consumers = findAPIConsumers('src/routes/users.ts', graph);
      const files = consumers.map((c) => c.filePath);
      expect(files).toContain('src/hooks/useUsers.ts');
      expect(files).toContain('src/components/UserList.tsx');
      expect(files).not.toContain('src/utils/format.ts');
    });

    it('returns empty for non-backend files', () => {
      const graph = new KnowledgeGraph();
      graph.build([], []);
      expect(findAPIConsumers('src/utils/format.ts', graph)).toHaveLength(0);
    });

    it('classifies connection types correctly', () => {
      const graph = new KnowledgeGraph();
      const nodes: CodeNode[] = [
        makeNode({ id: 'route', name: 'getUsers', filePath: 'src/routes/users.ts' }),
        makeNode({ id: 'hook', name: 'useUsers', filePath: 'src/hooks/useUsers.ts' }),
        makeNode({ id: 'store', name: 'userStore', filePath: 'src/store/users.ts' }),
      ];
      const edges: CodeEdge[] = [
        { source: 'hook', target: 'route', type: 'calls' },
        { source: 'store', target: 'route', type: 'imports' },
      ];
      graph.build(nodes, edges);

      const consumers = findAPIConsumers('src/routes/users.ts', graph);
      const hookConsumer = consumers.find((c) => c.filePath === 'src/hooks/useUsers.ts');
      const storeConsumer = consumers.find((c) => c.filePath === 'src/store/users.ts');
      expect(hookConsumer?.connection).toBe('via-hook');
      expect(storeConsumer?.connection).toBe('via-store');
    });
  });

  describe('findCoordinatedUpdates', () => {
    it('finds backend-frontend pairs needing coordinated updates', () => {
      const graph = new KnowledgeGraph();
      const nodes: CodeNode[] = [
        makeNode({ id: 'route', name: 'getUsers', filePath: 'src/routes/users.ts' }),
        makeNode({ id: 'component', name: 'UserList', filePath: 'src/components/UserList.tsx' }),
      ];
      const edges: CodeEdge[] = [
        { source: 'component', target: 'route', type: 'imports' },
      ];
      graph.build(nodes, edges);

      const updates = findCoordinatedUpdates(['src/routes/users.ts'], graph);
      expect(updates).toHaveLength(1);
      expect(updates[0].backendFile).toBe('src/routes/users.ts');
      expect(updates[0].frontendFiles).toContain('src/components/UserList.tsx');
    });

    it('ignores non-backend changed files', () => {
      const graph = new KnowledgeGraph();
      graph.build([], []);
      const updates = findCoordinatedUpdates(['src/utils/format.ts'], graph);
      expect(updates).toHaveLength(0);
    });
  });
});
