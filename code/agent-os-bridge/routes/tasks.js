// routes/tasks.js — /api/tasks endpoints
import { Router } from 'express';
import { queries } from '../db.js';
import crypto from 'crypto';

const router = Router();

// GET /api/tasks
router.get('/', (req, res) => {
  const { status, agent, mission_id, limit = '50', offset = '0' } = req.query;
  const tasks = queries.taskList.all({
    status: status || null,
    agent: agent || null,
    mission_id: mission_id || null,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  res.json({ tasks, meta: { total: tasks.length, offset: parseInt(offset) } });
});

// GET /api/tasks/:id — full context
router.get('/:id', (req, res) => {
  const task = queries.taskGet.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });

  // Enrich with context
  const mission = task.mission_id ? queries.missionGet.get(task.mission_id) : null;
  const feed_events = queries.feedForTask.all(task.id);
  const vault_links = queries.vaultLinksForTask.all(task.id);
  const handoffs = queries.handoffsForTask.all(task.id);
  const unblocks = queries.tasksDependingOn.all(task.id);

  let depends_on_tasks = [];
  try {
    const depIds = JSON.parse(task.depends_on || '[]');
    depends_on_tasks = depIds.map(id => queries.taskGet.get(id)).filter(Boolean);
  } catch {}

  // Compute mission progress if present
  let missionProgress = null;
  if (mission) {
    const mTasks = queries.missionTasks.all(mission.id);
    const done = mTasks.filter(t => t.status === 'done').length;
    missionProgress = { ...mission, progress: mTasks.length ? done / mTasks.length : 0, task_count: mTasks.length, done_count: done };
  }

  res.json({
    ...task,
    depends_on: depends_on_tasks,
    mission: missionProgress,
    feed_events,
    vault_links,
    handoffs,
    unblocks,
  });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, agent, priority = 3, mission_id, depends_on = '[]', timeout_min = 30 } = req.body;
  if (!title) return res.status(400).json({ error: 'title required', code: 'VALIDATION' });

  const id = 'task-' + crypto.randomBytes(4).toString('hex');
  const source = 'manual';
  const status = depends_on !== '[]' ? 'blocked' : 'queued';

  queries.taskCreate.run({ id, title, description: description || title, agent: agent || 'auto', status, priority, source, mission_id: mission_id || null, depends_on, timeout_min });

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: id, agent: agent || 'system', type: 'task_queued', content: `Queued: ${title}`, pinned: 0, urgent: 0 });

  res.status(201).json({ id, status });
});

// POST /api/tasks/:id/cancel
router.post('/:id/cancel', (req, res) => {
  const task = queries.taskGet.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });
  if (['done', 'failed', 'cancelled'].includes(task.status)) {
    return res.status(409).json({ error: `Cannot cancel task with status '${task.status}'`, code: 'INVALID_STATE' });
  }

  // Kill PID if active
  if (task.status === 'active' && task.pid) {
    try { process.kill(task.pid); } catch {}
  }

  queries.taskCancel.run(req.params.id);

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: req.params.id, agent: task.agent || 'system', type: 'task_cancelled', content: `Cancelled: ${task.title}`, pinned: 0, urgent: 0 });

  res.json({ id: req.params.id, status: 'cancelled' });
});

export default router;
