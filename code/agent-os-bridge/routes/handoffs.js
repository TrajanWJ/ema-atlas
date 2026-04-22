// routes/handoffs.js — /api/handoffs endpoints
import { Router } from 'express';
import { queries } from '../db.js';
import crypto from 'crypto';

const router = Router();

// GET /api/handoffs
router.get('/', (req, res) => {
  const { status } = req.query;
  const handoffs = queries.handoffList.all({
    status: status || null,
  });
  res.json(handoffs);
});

// POST /api/handoffs — create handoff
router.post('/', (req, res) => {
  const { from_agent, to_agent, task_id, context } = req.body;
  if (!from_agent) return res.status(400).json({ error: 'from_agent required', code: 'VALIDATION' });
  if (!to_agent) return res.status(400).json({ error: 'to_agent required', code: 'VALIDATION' });
  if (!task_id) return res.status(400).json({ error: 'task_id required', code: 'VALIDATION' });

  const id = 'handoff-' + crypto.randomBytes(4).toString('hex');
  queries.handoffCreate.run({
    id,
    from_agent,
    to_agent,
    task_id,
    context: context || '',
  });

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id, agent: from_agent, type: 'handoff_created', content: `Handoff ${from_agent} → ${to_agent}`, pinned: 0, urgent: 0 });

  res.status(201).json({ id, status: 'pending' });
});

// POST /api/handoffs/:id/claim
router.post('/:id/claim', (req, res) => {
  const result = queries.handoffClaim.run(req.params.id);
  if (result.changes === 0) {
    return res.status(409).json({ error: 'Handoff not found or not in pending state', code: 'INVALID_STATE' });
  }
  res.json({ id: req.params.id, status: 'claimed' });
});

// POST /api/handoffs/:id/complete
router.post('/:id/complete', (req, res) => {
  const result = queries.handoffComplete.run(req.params.id);
  if (result.changes === 0) {
    return res.status(409).json({ error: 'Handoff not found or not in claimed state', code: 'INVALID_STATE' });
  }
  res.json({ id: req.params.id, status: 'completed' });
});

export default router;
