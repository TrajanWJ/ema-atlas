import { Router } from 'express';
import { Server as SocketServer } from 'socket.io';

export function simulateRoutes(io: SocketServer): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { projectId, flowName } = req.body;
    if (!flowName) return res.status(400).json({ error: 'flowName is required' });

    try {
      const session = (global as any).__supermanSession;
      if (!session) {
        return res.status(404).json({ error: 'No active session. Analyze a project first.' });
      }

      io.emit('engine-output', { type: 'info', text: `[→] Simulating flow: "${flowName}"`, timestamp: Date.now() });

      const { simulateFlow } = await import('../../../src/simulation/engine.js');

      // Find matching flow
      const flow = session.flows?.find((f: any) =>
        f.name.toLowerCase().includes(flowName.toLowerCase()),
      );

      if (!flow) {
        io.emit('engine-output', { type: 'warning', text: `[WARNING] Flow "${flowName}" not found`, timestamp: Date.now() });
        return res.status(404).json({ error: `Flow "${flowName}" not found`, availableFlows: session.flows?.map((f: any) => f.name) });
      }

      const result = await simulateFlow(flow, session.graph);

      io.emit('engine-output', { type: 'info', text: `[SUCCESS] Simulation complete: ${result.issues?.length || 0} issues found`, timestamp: Date.now() });

      res.json(result);
    } catch (err: any) {
      io.emit('engine-output', { type: 'error', text: `[ERROR] ${err.message}`, timestamp: Date.now() });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
