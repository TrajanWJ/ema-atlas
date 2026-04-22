import { Router } from 'express';
import type { Request, Response } from 'express';
import { log, logError } from '../logger.js';
import { query } from '../query/engine.js';
import { projectManager } from '../project-manager.js';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Missing required field: question' });
    return;
  }

  if (!projectManager.isInitialized()) {
    res.status(500).json({ error: 'Knowledge graph not initialized. Run /index-repo first.' });
    return;
  }

  const graph = projectManager.getGraph();

  log('query', 'Processing query', { question });

  try {
    const result = await query(question, graph);
    log('query', 'Query completed');
    res.json(result);
  } catch (err: any) {
    logError('query', 'Query failed', err);
    res.status(500).json({ error: err.message });
  }
});
