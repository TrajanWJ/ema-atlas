import { Router } from 'express';
import { getDb } from '../db.js';

export function flowsRoutes(): Router {
  const router = Router();

  router.get('/:projectId', (req, res) => {
    const { projectId } = req.params;

    // Try in-memory session first
    const session = (global as any).__supermanSession;
    if (session && session.projectId === projectId && session.flows?.length) {
      const flows = session.flows.map((f: any) => ({
        id: f.id || f.name,
        name: f.name,
        description: f.description || '',
        stepCount: f.steps?.length || 0,
        completeness: f.completeness ?? 0,
        confidence: f.confidence ?? 0,
        entryFile: f.entryFile || null,
        relatedFiles: f.relatedFiles || [],
        steps: (f.steps || []).map((s: any) => ({
          id: s.id,
          userAction: s.userAction,
          systemResponse: s.systemResponse,
          status: s.status,
        })),
      }));
      return res.json(flows);
    }

    // Fall back to SQLite
    const db = getDb();
    const row = db.prepare('SELECT flows_json FROM projects WHERE id = ?').get(projectId) as any;
    if (!row || !row.flows_json) {
      return res.json([]);
    }

    try {
      const rawFlows = JSON.parse(row.flows_json);
      const flows = rawFlows.map((f: any) => ({
        id: f.id || f.name,
        name: f.name,
        description: f.description || '',
        stepCount: f.steps?.length || 0,
        completeness: f.completeness ?? 0,
        confidence: f.confidence ?? 0,
        entryFile: f.entryFile || null,
        relatedFiles: f.relatedFiles || [],
        steps: (f.steps || []).map((s: any) => ({
          id: s.id,
          userAction: s.userAction,
          systemResponse: s.systemResponse,
          status: s.status,
        })),
      }));
      res.json(flows);
    } catch {
      res.json([]);
    }
  });

  return router;
}
