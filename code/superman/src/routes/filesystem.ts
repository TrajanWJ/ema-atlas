import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { log, logError } from '../logger.js';
import { projectManager } from '../project-manager.js';

export const router = Router();

router.get('/tree', async (_req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  try {
    const tree = await projectManager.getFileTree();
    res.json(tree);
  } catch (err: any) {
    logError('server', 'Failed to get file tree', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/read', async (req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  const relativePath = req.query.path as string;
  if (!relativePath || typeof relativePath !== 'string') {
    res.status(400).json({ error: 'Missing required query parameter: path' });
    return;
  }

  try {
    const fullPath = projectManager.validatePath(relativePath);
    const content = await projectManager.readFile(relativePath);
    const ext = path.extname(fullPath).slice(1).toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', go: 'go', rs: 'rust', java: 'java',
      json: 'json', md: 'markdown', yml: 'yaml', yaml: 'yaml',
      css: 'css', scss: 'scss', html: 'html', sh: 'shell',
      sql: 'sql', toml: 'toml', xml: 'xml', txt: 'plaintext',
    };
    const language = languageMap[ext] || 'plaintext';
    res.json({ content, language });
  } catch (err: any) {
    logError('server', 'Failed to read file', err);
    const status = err.message?.includes('Access denied') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/write', async (req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.status(400).json({ error: 'No active project. Call POST /project first.' });
    return;
  }

  const { path: relativePath, content } = req.body;

  if (!relativePath || typeof relativePath !== 'string') {
    res.status(400).json({ error: 'Missing required field: path' });
    return;
  }

  if (content === undefined || content === null || typeof content !== 'string') {
    res.status(400).json({ error: 'Missing required field: content' });
    return;
  }

  try {
    await projectManager.writeFile(relativePath, content);
    res.json({ success: true });
  } catch (err: any) {
    logError('server', 'Failed to write file', err);
    const status = err.message?.includes('Access denied') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});
