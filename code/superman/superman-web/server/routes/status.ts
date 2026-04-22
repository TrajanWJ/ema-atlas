import { Router } from 'express';

export function statusRoutes(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const session = (global as any).__supermanSession;

    if (!session) {
      return res.json({
        active: false,
        message: 'No active session. Analyze a project to get started.',
      });
    }

    const stats = session.graph?.getStats() || {};

    res.json({
      active: true,
      projectId: session.projectId,
      projectPath: session.projectPath,
      health: session.health,
      gapCount: session.gapCount,
      graph: {
        nodes: stats.nodeCount || 0,
        edges: stats.edgeCount || 0,
        files: stats.fileCount || 0,
      },
      flowCount: session.flows?.length || 0,
    });
  });

  return router;
}
