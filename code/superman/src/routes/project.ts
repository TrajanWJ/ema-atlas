import { Router } from 'express';
import type { Request, Response } from 'express';
import { log, logError } from '../logger.js';
import { projectManager } from '../project-manager.js';
import { buildTask, continuousBuild } from '../build-loop.js';
import { selfEvolve, getProductGoal } from '../self-evolve.js';

export const router = Router();

router.post('/set', async (req: Request, res: Response) => {
  const { path } = req.body;

  if (!path || typeof path !== 'string') {
    res.status(400).json({ error: 'Missing required field: path' });
    return;
  }

  log('server', 'Setting active project', { path });

  try {
    const { files, nodes } = await projectManager.setActiveProject(path);
    res.json({
      success: true,
      projectPath: projectManager.getProjectPath(),
      files,
      nodes,
    });
  } catch (err: any) {
    logError('server', 'Failed to set active project', err);
    const status = err.message?.includes('not a directory') || err.message?.includes('ENOENT') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.get('/pick-folder', async (_req, res) => {
  try {
    let folder = '';
    const { platform } = process;

    if (platform === 'darwin') {
      const { execSync } = await import('child_process');
      const result = execSync(
        'osascript -e \'POSIX path of (choose folder with prompt "Select project folder")\'',
        { encoding: 'utf-8', timeout: 30000 }
      ).trim();
      if (result) folder = result;
    } else if (platform === 'win32') {
      const { execSync } = await import('child_process');
      const result = execSync(
        'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; if($f.ShowDialog() -eq \'OK\'){$f.SelectedPath}"',
        { encoding: 'utf-8', timeout: 30000 }
      ).trim();
      if (result) folder = result;
    } else {
      try {
        const { execSync } = await import('child_process');
        const result = execSync('zenity --file-selection --directory 2>/dev/null', { encoding: 'utf-8', timeout: 30000 }).trim();
        if (result) folder = result;
      } catch { /* zenity not available */ }
    }

    res.json({ path: folder || null });
  } catch {
    res.json({ path: null });
  }
});

router.get('/info', (_req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.json({ projectPath: null, initialized: false, phase: 'idle' });
    return;
  }

  try {
    const model = projectManager.getModel();
    const graph = projectManager.getGraph();
    res.json({
      projectPath: projectManager.getProjectPath(),
      initialized: true,
      phase: projectManager.getPhase(),
      stats: model?.stats ?? null,
      graphStats: graph.getStats(),
    });
  } catch (err: any) {
    logError('server', 'Failed to get project info', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/panels', (_req: Request, res: Response) => {
  if (!projectManager.isInitialized()) {
    res.json({ features: [], bugs: [], completion: [], loadingPhase: 'idle', overallCompleteness: 0 });
    return;
  }
  res.json(projectManager.getPanelData());
});

router.get('/flows', (_req: Request, res: Response) => {
  res.json(projectManager.getFlows());
});

router.post('/validate-execution', (req: Request, res: Response) => {
  const { flowId } = req.body;
  if (!flowId) {
    res.status(400).json({ error: 'Missing flowId' });
    return;
  }
  res.json(projectManager.validateExecution(flowId));
});

// Build a single task with full implementation plan
router.post('/build', async (req: Request, res: Response) => {
  const { task, blockers } = req.body;
  if (!task) {
    res.status(400).json({ error: 'Missing task name' });
    return;
  }
  try {
    const result = await buildTask(task, blockers || [], false);
    res.json(result);
  } catch (err: any) {
    logError('auto', 'Build failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Continuous build — keep building until convergence
router.post('/build-continuous', async (req: Request, res: Response) => {
  const { maxTasks } = req.body;
  try {
    const results = await continuousBuild(maxTasks || 5);
    res.json({ tasks: results.length, results });
  } catch (err: any) {
    logError('auto', 'Continuous build failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Self-evolution — analyze itself against target product, improve iteratively
router.post('/self-evolve', async (req: Request, res: Response) => {
  const { maxIterations } = req.body;
  try {
    const results = await selfEvolve(maxIterations || 3);
    res.json({ iterations: results.length, results });
  } catch (err: any) {
    logError('auto', 'Self-evolution failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Get the target product definition
router.get('/product-goal', (_req: Request, res: Response) => {
  res.json(getProductGoal());
});
