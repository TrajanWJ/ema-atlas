// routes/inbox.js — /api/inbox endpoints
import { Router } from 'express';
import { queries } from '../db.js';
import crypto from 'crypto';

const router = Router();

// GET /api/inbox
router.get('/', (req, res) => {
  const { to_agent, read, limit = '50', offset = '0' } = req.query;
  const messages = queries.inboxList.all({
    to_agent: to_agent || null,
    read: read !== undefined ? parseInt(read) : null,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  res.json({ messages, meta: { total: messages.length, offset: parseInt(offset) } });
});

// POST /api/inbox — send message
router.post('/', (req, res) => {
  const { to_agent, from_agent, message, task_id } = req.body;
  if (!to_agent) return res.status(400).json({ error: 'to_agent required', code: 'VALIDATION' });
  if (!message) return res.status(400).json({ error: 'message required', code: 'VALIDATION' });

  const id = 'inbox-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.inboxSend.run({
    id,
    to_agent,
    from_agent: from_agent || 'system',
    task_id: task_id || null,
    message,
  });

  const feedId = 'feed-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  queries.feedInsert.run({ id: feedId, task_id: task_id || null, agent: from_agent || 'system', type: 'inbox_sent', content: `Message to ${to_agent}: ${message.slice(0, 100)}`, pinned: 0, urgent: 0 });

  res.status(201).json({ id, status: 'sent' });
});

// POST /api/inbox/:id/read — mark read
router.post('/:id/read', (req, res) => {
  const result = queries.inboxRead.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Message not found', code: 'NOT_FOUND' });
  }
  res.json({ id: req.params.id, read: true });
});

export default router;
