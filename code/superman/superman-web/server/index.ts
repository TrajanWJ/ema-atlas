import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { getDb } from './db.js';
import { analyzeRoutes } from './routes/analyze.js';
import { gapsRoutes } from './routes/gaps.js';
import { applyRoutes } from './routes/apply.js';
import { askRoutes } from './routes/ask.js';
import { simulateRoutes } from './routes/simulate.js';
import { statusRoutes } from './routes/status.js';
import { projectsRoutes } from './routes/projects.js';
import { promptsRoutes } from './routes/prompts.js';
import { flowsRoutes } from './routes/flows.js';

const PORT = parseInt(process.env.SUPERMAN_PORT || '3001', 10);

// Ensure claude CLI is findable by child processes
if (!process.env.CLAUDE_CLI_PATH) {
  process.env.CLAUDE_CLI_PATH = '/Users/will/.local/bin/claude';
}
// Ensure ~/.local/bin is in PATH for spawned processes
if (!process.env.PATH?.includes('.local/bin')) {
  process.env.PATH = `/Users/will/.local/bin:${process.env.PATH}`;
}
// ANTHROPIC_API_KEY loaded from .env via dotenv/config

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], methods: ['GET', 'POST'] },
});

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));

// Make io available to routes
app.set('io', io);

// Initialize database
getDb();

// Mount routes
app.use('/api/analyze', analyzeRoutes(io));
app.use('/api/gaps', gapsRoutes());
app.use('/api/apply', applyRoutes(io));
app.use('/api/ask', askRoutes(io));
app.use('/api/simulate', simulateRoutes(io));
app.use('/api/status', statusRoutes());
app.use('/api/projects', projectsRoutes());
app.use('/api/prompts', promptsRoutes());
app.use('/api/flows', flowsRoutes());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`[superman-web] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[superman-web] Client disconnected: ${socket.id}`);
  });
});

// Intercept console output and emit via socket
const originalLog = console.log;
const originalError = console.error;

console.log = (...args: unknown[]) => {
  originalLog(...args);
  const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  io.emit('engine-output', { type: 'info', text, timestamp: Date.now() });
};

console.error = (...args: unknown[]) => {
  originalError(...args);
  const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  io.emit('engine-output', { type: 'error', text, timestamp: Date.now() });
};

httpServer.listen(PORT, () => {
  originalLog(`[superman-web] Server running on http://localhost:${PORT}`);
  originalLog(`[superman-web] Socket.io ready`);
});
