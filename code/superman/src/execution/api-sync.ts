/**
 * Frontend/backend coordination.
 *
 * When a backend endpoint changes, finds every frontend store, hook,
 * and component that calls it via the import graph. Both sides get
 * updated in the same task.
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';

export interface APIConsumer {
  filePath: string;
  nodeId: string;
  nodeName: string;
  connection: 'direct' | 'via-hook' | 'via-store' | 'via-import';
}

const BACKEND_PATTERNS = [
  /^(?:src\/)?routes\//,
  /^(?:src\/)?api\//,
  /^app\/api\//,
  /^pages\/api\//,
  /^(?:src\/)?server\//,
  /^(?:src\/)?controllers\//,
];

const FRONTEND_PATTERNS = [
  /\.tsx$/,
  /\/components\//,
  /\/hooks\//,
  /\/store\//,
  /\/stores\//,
  /\/pages\/(?!api)/,
  /\/views\//,
  /\/screens\//,
];

export function isBackendEndpoint(filePath: string): boolean {
  return BACKEND_PATTERNS.some((p) => p.test(filePath));
}

export function isFrontendConsumer(filePath: string): boolean {
  return FRONTEND_PATTERNS.some((p) => p.test(filePath));
}

/**
 * Find all frontend files that consume a backend endpoint.
 * Walks the import graph transitively from the endpoint file.
 */
export function findAPIConsumers(
  backendFile: string,
  graph: KnowledgeGraph,
): APIConsumer[] {
  if (!isBackendEndpoint(backendFile)) return [];

  const consumers: APIConsumer[] = [];
  const visited = new Set<string>();
  visited.add(backendFile);

  function walkConsumers(filePath: string, depth: number): void {
    const nodesInFile = graph.findByFile(filePath);

    for (const node of nodesInFile) {
      const edges = graph.getEdgesFor(node.id, 'both');

      for (const edge of edges) {
        if (edge.target !== node.id) continue;

        const consumer = graph.getNode(edge.source);
        if (!consumer) continue;
        if (visited.has(consumer.filePath)) continue;

        visited.add(consumer.filePath);

        if (isFrontendConsumer(consumer.filePath)) {
          let connection: APIConsumer['connection'] = 'direct';
          if (/hook/i.test(consumer.filePath) || /^use[A-Z]/.test(consumer.name)) {
            connection = 'via-hook';
          } else if (/store/i.test(consumer.filePath)) {
            connection = 'via-store';
          } else if (depth > 0) {
            connection = 'via-import';
          }

          consumers.push({
            filePath: consumer.filePath,
            nodeId: consumer.id,
            nodeName: consumer.name,
            connection,
          });
        }

        if (depth < 5) {
          walkConsumers(consumer.filePath, depth + 1);
        }
      }
    }
  }

  walkConsumers(backendFile, 0);

  log('execute', 'API consumers found', {
    backendFile,
    consumerCount: consumers.length,
    files: consumers.map((c) => `${c.filePath} (${c.connection})`),
  });

  return consumers;
}

/**
 * Given a set of changed files, find all backend->frontend pairs
 * that need coordinated updates.
 */
export function findCoordinatedUpdates(
  changedFiles: string[],
  graph: KnowledgeGraph,
): Array<{ backendFile: string; frontendFiles: string[] }> {
  const updates: Array<{ backendFile: string; frontendFiles: string[] }> = [];

  for (const file of changedFiles) {
    if (!isBackendEndpoint(file)) continue;

    const consumers = findAPIConsumers(file, graph);
    const frontendFiles = [...new Set(consumers.map((c) => c.filePath))];

    if (frontendFiles.length > 0) {
      updates.push({ backendFile: file, frontendFiles });
    }
  }

  return updates;
}
