import { Router } from 'express';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { log, logError } from '../logger.js';
import { projectManager } from '../project-manager.js';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const start = Date.now();
  const repoPath = req.body.repoPath ?? config.targetRepoPath;

  if (!repoPath) {
    res.status(400).json({ error: 'Missing repoPath in body or TARGET_REPO_PATH env var' });
    return;
  }

  log('index', 'Starting repository indexing', { repoPath });

  try {
    const { files, nodes } = await projectManager.setActiveProject(repoPath);
    const graph = projectManager.getGraph();
    const duration = Date.now() - start;

    const result = {
      filesProcessed: files,
      nodesCreated: nodes,
      edgesCreated: graph.getStats().edgeCount,
      errors: [],
      duration,
    };

    log('index', 'Indexing complete', result as unknown as Record<string, unknown>);
    res.json(result);
  } catch (err: any) {
    logError('index', 'Indexing failed', err);
    res.status(500).json({ error: err.message });
  }
});
