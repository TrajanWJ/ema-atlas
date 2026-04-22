// routes/proposals.js — /api/proposals endpoints
import { Router } from 'express';
import { queries } from '../db.js';
import crypto from 'crypto';

const router = Router();

// GET /api/proposals
router.get('/', (req, res) => {
  const { status, limit = '50', offset = '0' } = req.query;
  const proposals = queries.proposalList.all({
    status: status || null,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  res.json({ proposals, meta: { total: proposals.length, offset: parseInt(offset) } });
});

// GET /api/proposals/:id
router.get('/:id', (req, res) => {
  const proposal = queries.proposalGet.get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found', code: 'NOT_FOUND' });
  res.json(proposal);
});

// POST /api/proposals
router.post('/', (req, res) => {
  const { title, description, idea_source, scope, task_breakdown, priority = 3, destructive = 0 } = req.body;
  if (!title) return res.status(400).json({ error: 'title required', code: 'VALIDATION' });

  const id = 'prop-' + crypto.randomBytes(4).toString('hex');
  queries.proposalCreate.run({
    id,
    title,
    description: description || '',
    idea_source: idea_source || 'manual',
    scope: scope || null,
    task_breakdown: typeof task_breakdown === 'object' ? JSON.stringify(task_breakdown) : (task_breakdown || '[]'),
    priority,
    destructive: destructive ? 1 : 0,
  });

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: null, agent: 'system', type: 'proposal_created', content: `Proposal: ${title}`, pinned: 0, urgent: destructive ? 1 : 0 });

  res.status(201).json({ id, status: 'pending' });
});

// POST /api/proposals/:id/approve — parse task_breakdown, create tasks
router.post('/:id/approve', (req, res) => {
  const proposal = queries.proposalGet.get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found', code: 'NOT_FOUND' });
  if (proposal.status !== 'pending') {
    return res.status(409).json({ error: `Cannot approve proposal with status '${proposal.status}'`, code: 'INVALID_STATE' });
  }

  // Parse task_breakdown and create tasks
  let tasks_created = [];
  try {
    const breakdown = JSON.parse(proposal.task_breakdown || '[]');
    for (const item of breakdown) {
      const taskId = 'task-' + crypto.randomBytes(4).toString('hex');
      const taskTitle = typeof item === 'string' ? item : (item.title || item.name || String(item));
      const taskAgent = (typeof item === 'object' && item.agent) ? item.agent : 'auto';
      const taskPriority = (typeof item === 'object' && item.priority) ? item.priority : proposal.priority;

      queries.taskCreate.run({
        id: taskId,
        title: taskTitle,
        description: (typeof item === 'object' && item.description) ? item.description : taskTitle,
        agent: taskAgent,
        status: 'queued',
        priority: taskPriority,
        source: 'proposal',
        mission_id: null,
        depends_on: '[]',
        timeout_min: 30,
      });
      tasks_created.push(taskId);

      const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
      queries.feedInsert.run({ id: feedId, task_id: taskId, agent: 'system', type: 'task_queued', content: `From proposal: ${taskTitle}`, pinned: 0, urgent: 0 });
    }
  } catch (err) {
    return res.status(400).json({ error: `Failed to parse task_breakdown: ${err.message}`, code: 'PARSE_ERROR' });
  }

  queries.proposalUpdate.run({
    id: req.params.id,
    status: 'approved',
    resolved_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    outcome: JSON.stringify({ tasks_created }),
  });

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: null, agent: 'system', type: 'proposal_approved', content: `Approved: ${proposal.title} (${tasks_created.length} tasks)`, pinned: 0, urgent: 0 });

  res.json({ id: req.params.id, status: 'approved', tasks_created });
});

// POST /api/proposals/:id/dismiss
router.post('/:id/dismiss', (req, res) => {
  const proposal = queries.proposalGet.get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found', code: 'NOT_FOUND' });
  if (proposal.status !== 'pending') {
    return res.status(409).json({ error: `Cannot dismiss proposal with status '${proposal.status}'`, code: 'INVALID_STATE' });
  }

  const { reason } = req.body;

  queries.proposalUpdate.run({
    id: req.params.id,
    status: 'dismissed',
    resolved_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    outcome: reason || 'Dismissed without reason',
  });

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: null, agent: 'system', type: 'proposal_dismissed', content: `Dismissed: ${proposal.title}`, pinned: 0, urgent: 0 });

  res.json({ id: req.params.id, status: 'dismissed' });
});

export default router;
