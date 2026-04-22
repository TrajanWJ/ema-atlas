import { Router } from 'express';
import { getDb } from '../db.js';

export function gapsRoutes(): Router {
  const router = Router();

  router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { severity, system, sort } = req.query;

    try {
      // Try in-memory session first
      const session = (global as any).__supermanSession;
      let gaps: any[] = [];
      let health = 0;

      if (session && session.projectId === projectId) {
        const { analyzeGaps } = await import('../../../src/gap-engine.js');
        const gapResult = await analyzeGaps(session.model, {
          appType: 'unknown',
          currentCapabilities: [],
          intendedCapabilities: [],
          missingSystems: [],
        }, session.graph);
        gaps = gapResult.gaps;
        health = gapResult.overallHealth;
      } else {
        // Fall back to SQLite
        const db = getDb();
        const row = db.prepare('SELECT gaps_json, health_score FROM projects WHERE id = ?').get(projectId) as any;
        if (row && row.gaps_json) {
          try {
            gaps = JSON.parse(row.gaps_json);
            health = row.health_score || 0;
          } catch {
            gaps = [];
          }
        }
      }

      // Filter by severity
      if (severity && typeof severity === 'string' && severity !== 'all') {
        gaps = gaps.filter(g => g.severity === severity);
      }

      // Filter by system
      if (system && typeof system === 'string') {
        gaps = gaps.filter(g => g.system?.toLowerCase().includes(system.toLowerCase()));
      }

      // Sort
      const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      if (sort === 'severity') {
        gaps.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
      }

      res.json({
        totalGaps: gaps.length,
        health,
        gaps: gaps.map((g, i) => ({
          id: `gap-${i}`,
          ...g,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
