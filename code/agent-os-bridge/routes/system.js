// routes/system.js — /api/system endpoints
import { Router } from 'express';
import { queries } from '../db.js';
import { execSync } from 'child_process';

const router = Router();

// GET /api/system/health
router.get('/health', (req, res) => {
  const health = queries.systemHealth.get();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...health,
  });
});

// GET /api/system/crons — list crontab entries
router.get('/crons', (req, res) => {
  try {
    const raw = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8', timeout: 5000 });
    const entries = raw
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          schedule: parts.slice(0, 5).join(' '),
          command: parts.slice(5).join(' '),
          raw: line.trim(),
        };
      });
    res.json(entries);
  } catch (err) {
    res.json([]);
  }
});

export default router;
