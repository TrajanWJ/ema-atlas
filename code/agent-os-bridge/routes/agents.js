// routes/agents.js — /api/agents endpoints
import { Router } from 'express';
import { queries } from '../db.js';

const router = Router();

// GET /api/agents
router.get('/', (req, res) => {
  const agents = queries.agentList.all();
  res.json(agents);
});

// GET /api/agents/:id — single agent with current task, recent feed, inbox
router.get('/:id', (req, res) => {
  const agent = queries.agentGet.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found', code: 'NOT_FOUND' });

  // Current task
  const current_task = agent.current_task_id ? queries.taskGet.get(agent.current_task_id) : null;

  // Recent feed events for this agent
  const recent_feed = queries.feedList.all({
    type: null,
    agent: agent.id,
    limit: 20,
    offset: 0,
  });

  // Unread inbox
  const inbox = queries.inboxList.all({
    to_agent: agent.id,
    read: 0,
    limit: 50,
    offset: 0,
  });

  res.json({
    ...agent,
    current_task,
    recent_feed,
    inbox,
  });
});

export default router;
