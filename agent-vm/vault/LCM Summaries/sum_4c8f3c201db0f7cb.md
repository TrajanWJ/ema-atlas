# LCM Summary sum_4c8f3c201db0f7cb

Created: 2026-03-20 05:56:34
Kind: leaf
Depth: 0
Conversation: 659
Tokens: 1215
Descendants: 0
Earliest: 2026-03-20T05:42:28.000Z
Latest: 2026-03-20T05:51:52.000Z

## Content

[2026-03-20 05:42 UTC]
});

// GET /api/queue/history
app.get('/api/queue/history', async (_req, res, next) => {
  try {
    const files = await readdir(DONE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const items = [];
    for (const f of jsonFiles) {
      try {
        const raw = await readFile(join(DONE_DIR, f), 'utf8');
        items.push(JSON.parse(raw));
      } catch { /* skip */ }
    }
    items.sort((a, b) => (b.resolved_at || '').localeCompare(a.resolved_at || ''));
    res.json(items.slice(0, 50));
  } catch (err) {
    next(err);
  }
});

// GET /api/queue/:id
app.get('/api/queue/:id', async (req, res, next) => {
  try {
    const filePath = join(QUEUE_DIR, `${req.params.id}.json`);
    const raw = await readFile(filePath, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    next(err);
  }
});

// POST /api/queue/:id/resolve
app.post('/api/queue/:id/resolve', async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    if (!['approved', 'rejected', 'deferred'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved, rejected, or deferred' });
    }

    const srcPath = join(QUEUE_DIR, `${req.params.id}.json`);
    const dstPath = join(DONE_DIR, `${req.params.id}.json`);

    let item;
    try {
      const raw = await readFile(srcPath, 'utf8');
      item = JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Queue item not found' });
      }
      throw err;
    }

    item.status = status;
    item.resolution = resolution || '';
    item.resolved_at = new Date().toISOString();

    await writeFile(dstPath, JSON.stringify(item, null, 2));
    await unlink(srcPath).catch(() => {});

    await rebuildQueueIndex();

    broadcast({ type: 'queue', action: 'resolved', data: item });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Feed API
// ---------------------------------------------------------------------------

async function readFeedLines() {
  try {
    const raw = await readFile(FEED_PATH, 'utf8');
    return raw.trim().split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function appendJsonl(filePath, entry) {
  await appendFile(filePath, JSON.stringify(entry) + '\n');
}

// GET /api/feed
app.get('/api/feed', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const afterId = req.query.after || null;
    const typeFilter = req.query.type || null;

    let entries = await readFeedLines();

    // newest first
    entries.reverse();

    if (typeFilter) {
      entries = entries.filter(e => e.type === typeFilter);
    }

    if (afterId) {
      const idx = entries.findIndex(e => e.id === afterId);
      if (idx >= 0) {
        entries = entries.slice(idx + 1);
      }
    }

    res.json(entries.slice(0, limit));
  } catch (err) {
    next(err);
  }
});

// POST /api/feed
app.post('/api/feed', async (req, res, next) => {
  try {
    const entry = {
      id: req.body.id || `f-${Date.now()}`,
      agent: req.body.agent || 'unknown',
      type: req.body.type || 'info',
      content: req.body.content || '',
      timestamp: req.body.timestamp || new Date().toISOString(),
      pinned: req.body.pinned || false,
      urgent: req.body.urgent || false,
    };

    await appendJsonl(FEED_PATH, entry);
    broadcast({ type: 'feed', data: entry });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message });
});

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
    }
  }
}

// --
[LCM fallback summary; truncated for context management]
