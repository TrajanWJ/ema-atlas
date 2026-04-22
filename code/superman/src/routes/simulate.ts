import { Router } from 'express';
import type { Request, Response } from 'express';
import { log, logError } from '../logger.js';
import { simulateFlow, simulateAllFlows } from '../simulation/engine.js';
import { projectManager } from '../project-manager.js';

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { entryPoint } = req.body;

  if (!projectManager.isInitialized()) {
    res.status(500).json({ error: 'Project not initialized.' });
    return;
  }

  const graph = projectManager.getGraph();
  const flows = projectManager.getFlows();

  // If entryPoint provided, find the matching flow
  if (entryPoint && typeof entryPoint === 'string') {
    const flow = flows.find((f) =>
      f.name.toLowerCase().includes(entryPoint.toLowerCase()) ||
      f.id.toLowerCase().includes(entryPoint.toLowerCase()),
    );

    if (!flow) {
      res.status(404).json({
        error: `Flow "${entryPoint}" not found`,
        availableFlows: flows.map((f) => f.name),
      });
      return;
    }

    log('simulate', `Simulating flow: ${flow.name}`);
    const result = simulateFlow(flow, graph);
    res.json(result);
    return;
  }

  // No entryPoint — simulate all flows
  log('simulate', 'Simulating all flows');
  const results = simulateAllFlows(flows, graph);
  res.json({ flows: results });
});
