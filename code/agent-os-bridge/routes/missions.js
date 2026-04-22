// routes/missions.js — /api/missions endpoints
import { Router } from 'express';
import { queries } from '../db.js';
import db from '../db.js';
import crypto from 'crypto';

const router = Router();

// Pipelines query — not in shared queries object, define locally
const pipelinesForMission = db.prepare('SELECT * FROM pipelines WHERE mission_id = ? ORDER BY created_at ASC');

// GET /api/missions — all missions with computed progress
router.get('/', (req, res) => {
  const missions = queries.missionList.all();
  const enriched = missions.map(m => {
    const tasks = queries.missionTasks.all(m.id);
    const done = tasks.filter(t => t.status === 'done').length;
    return {
      ...m,
      progress: tasks.length ? done / tasks.length : 0,
      task_count: tasks.length,
      done_count: done,
    };
  });
  res.json(enriched);
});

// GET /api/missions/:id — mission + tasks + pipelines
router.get('/:id', (req, res) => {
  const mission = queries.missionGet.get(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Mission not found', code: 'NOT_FOUND' });

  const tasks = queries.missionTasks.all(mission.id);
  const done = tasks.filter(t => t.status === 'done').length;

  let pipelines = [];
  try {
    pipelines = pipelinesForMission.all(mission.id);
  } catch {}

  res.json({
    ...mission,
    progress: tasks.length ? done / tasks.length : 0,
    task_count: tasks.length,
    done_count: done,
    tasks,
    pipelines,
  });
});

// POST /api/missions
router.post('/', (req, res) => {
  const { title, description, goal_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title required', code: 'VALIDATION' });

  const id = 'mission-' + crypto.randomBytes(4).toString('hex');
  queries.missionCreate.run({ id, title, description: description || '', goal_id: goal_id || null, status: 'planned' });

  res.status(201).json({ id, status: 'planned' });
});

export default router;
