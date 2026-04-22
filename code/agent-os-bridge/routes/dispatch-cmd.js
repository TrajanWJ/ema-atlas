// routes/dispatch-cmd.js — POST /api/dispatch endpoint
import { Router } from 'express';
import { queries } from '../db.js';
import crypto from 'crypto';

const router = Router();

// POST /api/dispatch — create task + spawn openclaw agent
router.post('/', async (req, res) => {
  const { prompt, agent, priority = 2, mission_id } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required', code: 'VALIDATION' });

  const id = 'task-' + crypto.randomBytes(4).toString('hex');
  queries.taskCreate.run({
    id,
    title: prompt.slice(0, 200),
    description: prompt,
    agent: agent || 'auto',
    status: 'queued',
    priority,
    source: 'manual',
    mission_id: mission_id || null,
    depends_on: '[]',
    timeout_min: 30,
  });

  // Spawn openclaw agent in background
  try {
    const { spawn } = await import('child_process');
    const child = spawn('openclaw', ['agent', '--message', prompt, '--session', `dispatch:${id}`], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    });
    child.unref();

    queries.taskSetActive.run({ id, pid: child.pid, pid_command: `openclaw agent --session dispatch:${id}` });
  } catch (err) {
    // Task created but spawn failed — leave as queued for manual pickup
    const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
    queries.feedInsert.run({ id: feedId, task_id: id, agent: 'system', type: 'task_error', content: `Spawn failed: ${err.message}`, pinned: 0, urgent: 1 });
  }

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: id, agent: agent || 'system', type: 'task_started', content: `Dispatched: ${prompt.slice(0, 100)}`, pinned: 0, urgent: 0 });

  res.status(202).json({ id, status: 'active' });
});

export default router;
