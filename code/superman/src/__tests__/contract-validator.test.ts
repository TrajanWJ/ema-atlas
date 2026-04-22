import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { matchContracts } from '../contract-validator/contract-matcher.js';
import { scanClientCalls } from '../contract-validator/client-scanner.js';
import { scanServerContracts } from '../contract-validator/server-scanner.js';
import { validateContracts } from '../contract-validator/index.js';
import type { ApiContract, ClientCall } from '../types.js';

// ── Unit tests for contract-matcher ──

describe('contract-matcher', () => {
  describe('matchContracts', () => {
    it('detects MISSING_ENDPOINT when client calls a URL with no server route', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users', method: 'GET', file: 'routes/users.ts', line: 1 },
      ];
      const calls: ClientCall[] = [
        { url: '/api/posts', method: 'GET', file: 'src/hooks/usePosts.ts', line: 5 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const missing = mismatches.find(m => m.type === 'MISSING_ENDPOINT');
      expect(missing).toBeDefined();
      expect(missing!.severity).toBe('critical');
      expect(missing!.clientCall?.url).toBe('/api/posts');
    });

    it('detects METHOD_MISMATCH when client uses wrong HTTP method', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users', method: 'GET', file: 'routes/users.ts', line: 1 },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users', method: 'POST', file: 'src/pages/users.tsx', line: 10 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const mismatch = mismatches.find(m => m.type === 'METHOD_MISMATCH');
      expect(mismatch).toBeDefined();
      expect(mismatch!.severity).toBe('high');
    });

    it('detects UNUSED_ENDPOINT when server route is never called', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users', method: 'GET', file: 'routes/users.ts', line: 1 },
        { endpoint: '/api/admin/stats', method: 'GET', file: 'routes/admin.ts', line: 5 },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users', method: 'GET', file: 'src/hooks/useUsers.ts', line: 3 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const unused = mismatches.find(m => m.type === 'UNUSED_ENDPOINT');
      expect(unused).toBeDefined();
      expect(unused!.severity).toBe('medium');
      expect(unused!.serverContract?.endpoint).toBe('/api/admin/stats');
    });

    it('detects UNTYPED_RESPONSE when server route has no typed response', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users', method: 'GET', file: 'routes/users.ts', line: 1 },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users', method: 'GET', file: 'src/hooks/useUsers.ts', line: 3 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const untyped = mismatches.find(m => m.type === 'UNTYPED_RESPONSE');
      expect(untyped).toBeDefined();
      expect(untyped!.severity).toBe('medium');
    });

    it('matches a perfect contract with no mismatches (except UNTYPED_RESPONSE)', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users', method: 'GET', file: 'routes/users.ts', line: 1, responseType: 'User[]' },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users', method: 'GET', file: 'src/hooks/useUsers.ts', line: 3 },
      ];

      const mismatches = matchContracts(contracts, calls);
      expect(mismatches).toHaveLength(0);
    });
  });

  describe('URL normalization', () => {
    it('matches /api/users/:id with /api/users/123', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users/:id', method: 'GET', file: 'routes/users.ts', line: 1, params: ['id'], responseType: 'User' },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users/123', method: 'GET', file: 'src/hooks/useUser.ts', line: 5 },
      ];

      const mismatches = matchContracts(contracts, calls);
      // Should not have MISSING_ENDPOINT — the URLs should match
      const missing = mismatches.find(m => m.type === 'MISSING_ENDPOINT');
      expect(missing).toBeUndefined();
    });

    it('matches /api/users/:id with /api/users/:param (template literal)', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users/:id', method: 'GET', file: 'routes/users.ts', line: 1, params: ['id'], responseType: 'User' },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users/:param', method: 'GET', file: 'src/hooks/useUser.ts', line: 5 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const missing = mismatches.find(m => m.type === 'MISSING_ENDPOINT');
      expect(missing).toBeUndefined();
    });

    it('handles trailing slashes', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users/', method: 'GET', file: 'routes/users.ts', line: 1, responseType: 'User[]' },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users', method: 'GET', file: 'src/hooks/useUsers.ts', line: 3 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const missing = mismatches.find(m => m.type === 'MISSING_ENDPOINT');
      expect(missing).toBeUndefined();
    });

    it('does not match different path lengths', () => {
      const contracts: ApiContract[] = [
        { endpoint: '/api/users', method: 'GET', file: 'routes/users.ts', line: 1 },
      ];
      const calls: ClientCall[] = [
        { url: '/api/users/123/posts', method: 'GET', file: 'src/hooks/usePosts.ts', line: 5 },
      ];

      const mismatches = matchContracts(contracts, calls);
      const missing = mismatches.find(m => m.type === 'MISSING_ENDPOINT');
      expect(missing).toBeDefined();
    });
  });

  describe('severity assignment', () => {
    it('assigns critical to MISSING_ENDPOINT', () => {
      const mismatches = matchContracts(
        [],
        [{ url: '/api/ghost', method: 'GET', file: 'a.ts', line: 1 }],
      );
      expect(mismatches[0].severity).toBe('critical');
    });

    it('assigns high to METHOD_MISMATCH', () => {
      const mismatches = matchContracts(
        [{ endpoint: '/api/data', method: 'GET', file: 'r.ts', line: 1 }],
        [{ url: '/api/data', method: 'DELETE', file: 'c.ts', line: 1 }],
      );
      const mismatch = mismatches.find(m => m.type === 'METHOD_MISMATCH');
      expect(mismatch?.severity).toBe('high');
    });

    it('assigns medium to UNUSED_ENDPOINT', () => {
      const mismatches = matchContracts(
        [{ endpoint: '/api/orphan', method: 'GET', file: 'r.ts', line: 1 }],
        [],
      );
      const unused = mismatches.find(m => m.type === 'UNUSED_ENDPOINT');
      expect(unused?.severity).toBe('medium');
    });
  });
});

// ── Integration tests with filesystem fixtures ──

describe('contract-validator integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'contract-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('scans Express server routes into ApiContract[]', async () => {
    // Create a minimal Express project
    await mkdir(join(tmpDir, 'src'), { recursive: true });
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '^4.0.0' } }),
    );
    await writeFile(
      join(tmpDir, 'src', 'routes.ts'),
      `
import { Router } from 'express';
const router = Router();
router.get('/api/users', (req, res) => { res.json([]); });
router.post('/api/users', (req, res) => { res.json({}); });
router.get('/api/users/:id', (req, res) => { res.json({}); });
router.delete('/api/users/:id', (req, res) => { res.json({}); });
export default router;
`.trim(),
    );

    const contracts = await scanServerContracts(tmpDir);
    expect(contracts.length).toBe(4);
    expect(contracts.map(c => c.method).sort()).toEqual(['DELETE', 'GET', 'GET', 'POST']);
    expect(contracts.find(c => c.endpoint === '/api/users/:id' && c.method === 'GET')).toBeDefined();
  });

  it('scans client fetch() calls into ClientCall[]', async () => {
    await mkdir(join(tmpDir, 'src', 'hooks'), { recursive: true });
    await writeFile(
      join(tmpDir, 'src', 'hooks', 'useUsers.ts'),
      `
export function useUsers() {
  return fetch('/api/users').then(r => r.json());
}
export function createUser(data: any) {
  return fetch('/api/users', { method: 'POST', body: JSON.stringify(data) });
}
`.trim(),
    );

    const calls = await scanClientCalls(tmpDir);
    expect(calls.length).toBe(2);
    expect(calls.find(c => c.url === '/api/users' && c.method === 'GET')).toBeDefined();
    expect(calls.find(c => c.url === '/api/users' && c.method === 'POST')).toBeDefined();
  });

  it('scans client axios calls into ClientCall[]', async () => {
    await mkdir(join(tmpDir, 'src', 'services'), { recursive: true });
    await writeFile(
      join(tmpDir, 'src', 'services', 'userService.ts'),
      `
import axios from 'axios';
export const getUsers = () => axios.get('/api/users');
export const deleteUser = (id: string) => axios.delete(\`/api/users/\${id}\`);
`.trim(),
    );

    const calls = await scanClientCalls(tmpDir);
    expect(calls.length).toBe(2);
    expect(calls.find(c => c.method === 'GET')).toBeDefined();
    expect(calls.find(c => c.method === 'DELETE')).toBeDefined();
  });

  it('full validation detects mismatches in a project', async () => {
    // Server routes
    await mkdir(join(tmpDir, 'src'), { recursive: true });
    await mkdir(join(tmpDir, 'src', 'components'), { recursive: true });
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '^4.0.0' } }),
    );
    await writeFile(
      join(tmpDir, 'src', 'routes.ts'),
      `
import { Router } from 'express';
const router = Router();
router.get('/api/users', (req, res) => { res.json([]); });
router.post('/api/users', (req, res) => { res.json({}); });
router.get('/api/admin/stats', (req, res) => { res.json({}); });
export default router;
`.trim(),
    );

    // Client calls — one calls a non-existent endpoint
    await writeFile(
      join(tmpDir, 'src', 'components', 'App.tsx'),
      `
export function App() {
  fetch('/api/users');
  fetch('/api/posts');
}
`.trim(),
    );

    const mismatches = await validateContracts(tmpDir);

    // Should find MISSING_ENDPOINT for /api/posts
    const missing = mismatches.find(m => m.type === 'MISSING_ENDPOINT');
    expect(missing).toBeDefined();
    expect(missing!.clientCall?.url).toBe('/api/posts');

    // Should find UNUSED_ENDPOINT for /api/admin/stats
    const unused = mismatches.find(m => m.type === 'UNUSED_ENDPOINT');
    expect(unused).toBeDefined();

    // Mismatches should be sorted by severity (critical first)
    const severities = mismatches.map(m => m.severity);
    const criticalIdx = severities.indexOf('critical');
    const mediumIdx = severities.lastIndexOf('medium');
    if (criticalIdx !== -1 && mediumIdx !== -1) {
      expect(criticalIdx).toBeLessThan(mediumIdx);
    }
  });

  it('detects Next.js App Router routes', async () => {
    await mkdir(join(tmpDir, 'app', 'api', 'users'), { recursive: true });
    await writeFile(
      join(tmpDir, 'app', 'api', 'users', 'route.ts'),
      `
export async function GET() {
  return Response.json([]);
}
export async function POST() {
  return Response.json({});
}
`.trim(),
    );

    const contracts = await scanServerContracts(tmpDir);
    expect(contracts.length).toBe(2);
    expect(contracts.find(c => c.method === 'GET')).toBeDefined();
    expect(contracts.find(c => c.method === 'POST')).toBeDefined();
  });
});
