const { serve } = require('@hono/node-server');
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const http = require('http');
const { getDb } = require('./db');
const { initWebSocket } = require('./ws');

// Route modules
const pagesRouter = require('./routes/pages');
const searchRouter = require('./routes/search');
const spacesRouter = require('./routes/spaces');
const graphRouter = require('./routes/graph');
const intentRouter = require('./routes/intent');
const typesRouter = require('./routes/types');

const app = new Hono();

// CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Health check
app.get('/api/wiki/health', (c) => {
  const db = getDb();
  const stats = db.prepare('SELECT COUNT(*) as count FROM wiki_pages').get();
  return c.json({ 
    status: 'ok', 
    version: '1.0.0', 
    pages: stats.count,
    timestamp: new Date().toISOString() 
  });
});

// Stats
app.get('/api/wiki/stats', (c) => {
  const db = getDb();
  const totalPages = db.prepare("SELECT COUNT(*) as n FROM wiki_pages WHERE status != 'archived'").get().n;
  const byType = db.prepare("SELECT type, COUNT(*) as count FROM wiki_pages WHERE status != 'archived' GROUP BY type ORDER BY count DESC").all();
  const bySpace = db.prepare("SELECT space_id, COUNT(*) as count FROM wiki_pages WHERE status != 'archived' GROUP BY space_id").all();
  const totalEdges = db.prepare('SELECT COUNT(*) as n FROM wiki_edges').get().n;
  const lastUpdated = db.prepare("SELECT MAX(updated_at) as ts FROM wiki_pages").get().ts;
  
  return c.json({ 
    total_pages: totalPages,
    total_edges: totalEdges,
    by_type: byType,
    by_space: bySpace,
    last_updated: lastUpdated,
  });
});

// Mount routers
app.route('/api/wiki/pages', pagesRouter);
app.route('/api/wiki/search', searchRouter);
app.route('/api/wiki/spaces', spacesRouter);
app.route('/api/wiki/graph', graphRouter);
app.route('/api/wiki', intentRouter);
app.route('/api/wiki/types', typesRouter);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found', path: c.req.path }, 404));

// Error handler
app.onError((err, c) => {
  console.error('[server] Error:', err.message, err.stack);
  return c.json({ error: err.message }, 500);
});

const PORT = process.env.WIKI_PORT || 4488;

// Create Node.js HTTP server so we can attach WebSocket
const httpServer = http.createServer();

// Initialize DB
getDb();
console.log('[wiki-engine] Database initialized');

// Initialize WebSocket
initWebSocket(httpServer);

// Hono handles HTTP
const honoFetch = app.fetch.bind(app);
httpServer.on('request', async (req, res) => {
  // Convert Node IncomingMessage to Fetch Request
  const url = `http://localhost:${PORT}${req.url}`;
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val) headers.set(key, Array.isArray(val) ? val.join(',') : val);
  }
  
  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  
  const request = new Request(url, {
    method: req.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
  });
  
  try {
    const response = await honoFetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const buf = await response.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error('[server] Request error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[wiki-engine] API server running at http://localhost:${PORT}`);
  console.log(`[wiki-engine] WebSocket ready on ws://localhost:${PORT}`);
  console.log(`[wiki-engine] Endpoints:`);
  console.log(`  GET  /api/wiki/health`);
  console.log(`  GET  /api/wiki/stats`);
  console.log(`  GET  /api/wiki/pages`);
  console.log(`  POST /api/wiki/pages`);
  console.log(`  GET  /api/wiki/search?q=...`);
  console.log(`  GET  /api/wiki/spaces`);
  console.log(`  GET  /api/wiki/types`);
  console.log(`  GET  /api/wiki/context/:project_id`);
});
