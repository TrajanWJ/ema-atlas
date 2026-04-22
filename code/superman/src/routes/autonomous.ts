import { Router, type Request, type Response } from 'express';
import { config } from '../config.js';
import { log, logError } from '../logger.js';
import { runAutonomous } from '../autonomous-engine.js';
import { projectManager } from '../project-manager.js';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { repoPath } = req.body;
  const defaultPath = projectManager.isInitialized() ? projectManager.getProjectPath() : config.targetRepoPath;
  const targetPath = repoPath || defaultPath;

  if (!targetPath) {
    res.status(400).json({
      error: 'Missing repoPath in body or TARGET_REPO_PATH env var',
    });
    return;
  }

  log('auto', `Autonomous run requested for ${targetPath}`);

  try {
    const result = await runAutonomous(targetPath);
    res.json(result);
  } catch (error) {
    logError('auto', 'Autonomous run failed', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Autonomous run failed',
    });
  }
});
