// routes/feed.js — /api/feed endpoints + SSE stream
import { Router } from 'express';
import { queries } from '../db.js';

const router = Router();

// GET /api/feed — paginated feed list
router.get('/', (req, res) => {
  const { type, agent, limit = '50', offset = '0' } = req.query;
  const events = queries.feedList.all({
    type: type || null,
    agent: agent || null,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  res.json({ events, meta: { total: events.length, offset: parseInt(offset) } });
});

// GET /api/feed/stream — SSE with Last-Event-ID reconnection
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial retry directive
  res.write('retry: 3000\n\n');

  const lastId = req.headers['last-event-id'] || '';
  if (lastId) {
    const missed = queries.feedSince.all(lastId);
    missed.forEach(e => res.write(`id: ${e.id}\ndata: ${JSON.stringify(e)}\n\n`));
  }

  let lastSentId = lastId || '';
  const interval = setInterval(() => {
    try {
      const newEvents = lastSentId ? queries.feedSince.all(lastSentId) : [];
      newEvents.forEach(e => {
        res.write(`id: ${e.id}\ndata: ${JSON.stringify(e)}\n\n`);
        lastSentId = e.id;
      });
    } catch {}
  }, 2000);

  req.on('close', () => clearInterval(interval));
});

export default router;
