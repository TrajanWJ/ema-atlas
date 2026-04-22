import { Router } from 'express';
import type { Request, Response } from 'express';
import { log, logError } from '../logger.js';
import { proposeChanges } from '../modification/engine.js';
import { executionLoop } from '../execution/runner.js';
import { projectManager } from '../project-manager.js';
import { scanRoutes } from '../intelligence/route-scanner.js';
import { scanInfrastructure } from '../intelligence/infrastructure-scanner.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';

export const router = Router();

/**
 * Deterministic file resolver — uses route map, schema, and import graph
 * instead of fuzzy keyword matching.
 */
async function resolveTargetFiles(
  instruction: string,
  graph: KnowledgeGraph,
  cwd: string,
): Promise<string[]> {
  const q = instruction.toLowerCase();
  const files = new Set<string>();

  // Strategy 1: If instruction mentions a specific file path, use it directly
  const filePathMatch = instruction.match(/((?:src|lib|app|pages)\/[^\s,'"]+\.[a-z]{1,4})/g);
  if (filePathMatch) {
    for (const fp of filePathMatch) {
      const fullPath = fp.startsWith('/') ? fp : `${cwd}/${fp}`;
      files.add(fullPath);
    }
  }

  // Strategy 2: Route-related tasks → find route files
  const routePatterns = /\b(route|endpoint|api|handler|get|post|put|delete|patch|middleware|auth)\b/;
  if (routePatterns.test(q)) {
    try {
      const routeMap = await scanRoutes(cwd);
      for (const route of routeMap.routes) {
        // Check if instruction mentions this route's path or method
        const routePath = route.path.toLowerCase();
        const words = q.split(/\s+/);
        for (const word of words) {
          if (word.length > 2 && (routePath.includes(word) || route.filePath.toLowerCase().includes(word))) {
            files.add(route.filePath);
            break;
          }
        }
      }
      // If asking about adding a route, include existing route files as examples
      if (/\b(add|create|new)\b/.test(q) && /\b(route|endpoint|api)\b/.test(q) && files.size === 0) {
        const routeFiles = [...new Set(routeMap.routes.map(r => r.filePath))];
        // Take the first 2 route files as pattern examples
        for (const rf of routeFiles.slice(0, 2)) {
          files.add(rf);
        }
      }
    } catch (err) {
      log('apply', 'Route scan failed during file resolution, continuing', { error: String(err) });
    }
  }

  // Strategy 3: Database/model tasks → find schema + model files
  const dataPatterns = /\b(model|schema|database|prisma|migration|seed|table|entity|field|column)\b/;
  if (dataPatterns.test(q)) {
    try {
      const infra = await scanInfrastructure(cwd);
      if (infra.database?.orm === 'prisma') {
        // Add prisma schema and any seed file
        const prismaSchema = `${cwd}/prisma/schema.prisma`;
        files.add(prismaSchema);
      }
    } catch {
      // Continue without infra data
    }

    // Also find model/entity files from graph
    for (const node of graph.nodes.values()) {
      if (node.type === 'class' || node.type === 'interface' || node.type === 'type') {
        const name = node.name.toLowerCase();
        if (q.includes(name) || /model|entity|schema/.test(node.filePath.toLowerCase())) {
          files.add(node.filePath);
        }
      }
    }
  }

  // Strategy 4: Import graph — if we found files, add their direct importers/importees
  if (files.size > 0 && files.size < 5) {
    const toAdd: string[] = [];
    for (const filePath of files) {
      const fileNodes = graph.findByType('file');
      const fileNode = fileNodes.find(n => n.filePath === filePath);
      if (!fileNode) continue;

      // Get files this one imports (we might need to modify those too)
      const forwardEdges = graph.getEdgesFor(fileNode.id, 'forward');
      for (const edge of forwardEdges) {
        if (edge.type === 'imports') {
          const target = graph.getNode(edge.target);
          if (target) toAdd.push(target.filePath);
        }
      }
    }
    for (const f of toAdd.slice(0, 3)) {
      files.add(f);
    }
  }

  // Strategy 5: Fallback — use graph node name matching (last resort)
  if (files.size === 0) {
    const keywords = q.split(/[\s,.\-_/]+/).filter(w => w.length > 3).slice(0, 8);
    const scored = new Map<string, number>();

    for (const node of graph.nodes.values()) {
      if (!node.filePath) continue;
      const text = `${node.name} ${node.filePath}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > 0) {
        scored.set(node.filePath, Math.max(scored.get(node.filePath) || 0, score));
      }
    }

    const sorted = [...scored.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    for (const [path] of sorted) {
      files.add(path);
    }
  }

  // Hard cap
  const result = [...files].slice(0, 8);
  return result;
}

router.post('/', async (req: Request, res: Response) => {
  const { instruction, files } = req.body;

  if (!instruction || typeof instruction !== 'string') {
    res.status(400).json({ error: 'Missing required field: instruction' });
    return;
  }

  if (files !== undefined && !Array.isArray(files)) {
    res.status(400).json({ error: 'Field "files" must be an array when provided' });
    return;
  }

  if (!projectManager.isInitialized()) {
    res.status(500).json({ error: 'Knowledge graph not initialized. Run /index-repo first.' });
    return;
  }

  const graph = projectManager.getGraph();
  const cwd = projectManager.getProjectPath();

  // Use explicit files if provided, otherwise resolve deterministically
  let resolvedFiles: string[];
  if (Array.isArray(files) && files.length > 0) {
    resolvedFiles = files;
    log('apply', 'Using explicit file list', { fileCount: resolvedFiles.length });
  } else {
    resolvedFiles = await resolveTargetFiles(instruction, graph, cwd);
    log('apply', 'Deterministically resolved target files', {
      fileCount: resolvedFiles.length,
      files: resolvedFiles,
    });
  }

  log('apply', 'Processing change request', { instruction, fileCount: resolvedFiles.length });

  try {
    const changes = await proposeChanges(instruction, resolvedFiles, graph);
    log('apply', `Proposed ${changes.length} change(s), starting execution loop`);

    const result = await executionLoop(changes, cwd, graph);
    log('apply', 'Apply changes completed', { success: result.success, iterations: result.iterations });

    res.json(result);
  } catch (err: any) {
    logError('apply', 'Apply changes failed', err);
    res.status(500).json({ error: err.message });
  }
});
