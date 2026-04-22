/**
 * Server-side route scanner for API contract validation.
 *
 * Delegates to the existing route-scanner (which handles Express, Next.js App/Pages,
 * and Fastify) and transforms its RouteInfo[] output into ApiContract[].
 */

import { scanRoutes } from '../intelligence/route-scanner.js';
import { log } from '../logger.js';
import type { ApiContract } from '../types.js';
import { readFile } from 'fs/promises';

/**
 * Scan server-side route files and return ApiContract[].
 * Re-uses route-scanner.ts — no duplicate scanning logic.
 */
export async function scanServerContracts(projectPath: string): Promise<ApiContract[]> {
  log('sync', 'Scanning server contracts', { projectPath });

  const routeMap = await scanRoutes(projectPath);
  const contracts: ApiContract[] = [];

  for (const route of routeMap.routes) {
    const line = await findRouteLine(route.filePath, route.path, route.method);

    contracts.push({
      endpoint: route.path,
      method: route.method,
      file: route.filePath,
      line,
      params: route.parameters.length > 0 ? route.parameters : undefined,
      responseType: undefined, // route-scanner doesn't extract response types
    });
  }

  log('sync', `Server contract scan complete`, { total: contracts.length });
  return contracts;
}

/**
 * Try to find the line number where a route is defined.
 * Falls back to line 1 if the file can't be read or the pattern isn't found.
 */
async function findRouteLine(filePath: string, routePath: string, method: string): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Escape special regex chars in the route path for matching
    const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const methodLower = method.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Express style: router.get('/path', ...)
      if (line.includes(escaped) && new RegExp(`\\.${methodLower}\\s*\\(`).test(line)) {
        return i + 1;
      }

      // Next.js App Router: export async function GET
      if (new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${method}\\b`).test(line)) {
        return i + 1;
      }

      // Next.js Pages: req.method === 'GET'
      if (line.includes(`'${method}'`) || line.includes(`"${method}"`)) {
        return i + 1;
      }
    }
  } catch {
    // file not readable
  }

  return 1;
}
