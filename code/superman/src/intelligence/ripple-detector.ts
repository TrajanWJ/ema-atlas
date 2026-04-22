import * as fs from 'fs/promises';
import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeChange } from '../types.js';

/**
 * Find all files that depend on the changed files via the import graph.
 * Returns file paths that import from or are imported by the changed files.
 */
export function findDependentFiles(
  changedFiles: string[],
  graph: KnowledgeGraph,
): string[] {
  const dependents = new Set<string>();
  const changedSet = new Set(changedFiles);

  for (const filePath of changedFiles) {
    // Find the file node in the graph
    const fileNodes = graph.findByType('file');
    const fileNode = fileNodes.find(n => n.filePath === filePath);
    if (!fileNode) continue;

    // Find reverse edges (files that import THIS file)
    const reverseEdges = graph.getEdgesFor(fileNode.id, 'reverse');
    for (const edge of reverseEdges) {
      if (edge.type === 'imports') {
        const sourceNode = graph.getNode(edge.source);
        if (sourceNode && !changedSet.has(sourceNode.filePath)) {
          dependents.add(sourceNode.filePath);
        }
      }
    }

    // Also find nodes contained in this file that are imported elsewhere
    const containedEdges = graph.getEdgesFor(fileNode.id, 'forward');
    for (const edge of containedEdges) {
      if (edge.type === 'contains' || edge.type === 'exports') {
        const exportedNode = graph.getNode(edge.target);
        if (!exportedNode) continue;

        // Find what imports this exported node
        const importEdges = graph.getEdgesFor(exportedNode.id, 'reverse');
        for (const ie of importEdges) {
          if (ie.type === 'imports' || ie.type === 'uses') {
            const importer = graph.getNode(ie.source);
            if (importer && !changedSet.has(importer.filePath)) {
              dependents.add(importer.filePath);
            }
          }
        }
      }
    }
  }

  return [...dependents];
}

/**
 * Detect if a backend API change requires frontend updates.
 * Checks if changed files are route/API files and finds corresponding
 * frontend files that call those endpoints.
 */
export async function detectFrontendImpact(
  changes: CodeChange[],
  projectRoot: string,
): Promise<{ file: string; reason: string }[]> {
  const impacts: { file: string; reason: string }[] = [];

  // Collect endpoint changes from the diffs
  const endpointChanges: string[] = [];
  for (const change of changes) {
    // Check if this is a route/API file
    const isRoute = /\b(routes?|api|endpoint|handler)\b/i.test(change.filePath);
    if (!isRoute) continue;

    // Look for response shape changes in the diff
    const diff = change.diff || '';
    // Check for added pagination, changed response keys, new fields
    if (diff.includes('pagination') || diff.includes('totalPages')) {
      endpointChanges.push(`pagination added in ${change.filePath}`);
    }
    if (/res\.json\(/.test(diff) || /return.*json/.test(diff)) {
      endpointChanges.push(`response shape changed in ${change.filePath}`);
    }
  }

  if (endpointChanges.length === 0) return impacts;

  // Scan for frontend files that might consume these endpoints
  const frontendDirs = ['src', 'app', 'components', 'lib', 'hooks', 'store', 'pages'];
  for (const dir of frontendDirs) {
    const fullDir = `${projectRoot}/${dir}`;
    try {
      await fs.access(fullDir);
    } catch {
      continue;
    }

    const files = await walkDir(fullDir, ['.ts', '.tsx', '.js', '.jsx']);
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Check if this file makes API calls
        const isApiConsumer =
          content.includes('apiFetch') ||
          content.includes('fetch(') ||
          content.includes('axios') ||
          content.includes('useQuery') ||
          content.includes('useSWR');

        if (!isApiConsumer) continue;

        // Check for affected endpoint paths
        for (const change of changes) {
          const routePath = extractRoutePath(change.filePath);
          if (routePath && content.includes(routePath)) {
            impacts.push({
              file,
              reason: `Calls endpoint ${routePath} which was modified`,
            });
          }
        }

        // Check for pagination consumption
        if (endpointChanges.some(e => e.includes('pagination'))) {
          if (content.includes('.loads') || content.includes('.carriers') || content.includes('.tickets')) {
            if (!content.includes('pagination')) {
              impacts.push({
                file,
                reason: 'Consumes paginated endpoint but does not handle pagination',
              });
            }
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return impacts;
}

/**
 * Extract a likely API route path from a file path.
 * e.g. "src/routes/loads.ts" → "/loads"
 */
function extractRoutePath(filePath: string): string | null {
  const match = filePath.match(/routes?\/([^.]+)\./);
  if (match) return `/${match[1]}`;
  const apiMatch = filePath.match(/api\/([^.]+)\./);
  if (apiMatch) return `/api/${apiMatch[1]}`;
  return null;
}

/**
 * Recursively walk a directory and return files matching extensions.
 */
async function walkDir(dir: string, extensions: string[]): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${dir}/${entry.name}`;
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
      if (entry.isDirectory()) {
        results.push(...await walkDir(full, extensions));
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return results;
}
