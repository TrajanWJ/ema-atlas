import { Router } from 'express';
import { Server as SocketServer } from 'socket.io';

export function askRoutes(io: SocketServer): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { projectId, question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    try {
      const session = (global as any).__supermanSession;
      if (!session) {
        return res.status(404).json({ error: 'No active session. Analyze a project first.' });
      }

      io.emit('engine-output', { type: 'info', text: `[→] Querying: "${question}"`, timestamp: Date.now() });

      // Use the graph to find relevant nodes
      const matchingNodes = session.graph.findByName(question.split(' ').filter((w: string) => w.length > 3)[0] || question);
      const stats = session.graph.getStats();

      const answer = {
        question,
        relevantFiles: [...new Set(matchingNodes.slice(0, 10).map((n: any) => n.filePath))],
        matchingNodes: matchingNodes.slice(0, 10).map((n: any) => ({
          name: n.name,
          type: n.type,
          file: n.filePath,
          signature: n.signature,
        })),
        projectStats: {
          files: stats.fileCount,
          nodes: stats.nodeCount,
          edges: stats.edgeCount,
        },
        flows: session.flows?.slice(0, 5).map((f: any) => ({
          name: f.name,
          steps: f.steps.length,
          completeness: f.completeness,
        })),
      };

      io.emit('engine-output', { type: 'info', text: `[SUCCESS] Found ${matchingNodes.length} relevant nodes`, timestamp: Date.now() });

      res.json(answer);
    } catch (err: any) {
      io.emit('engine-output', { type: 'error', text: `[ERROR] ${err.message}`, timestamp: Date.now() });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
