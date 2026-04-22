import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { log, logError } from './logger.js';
import { router as indexRepoRouter } from './routes/index-repo.js';
import { router as queryRouter } from './routes/query.js';
import { router as simulateRouter } from './routes/simulate.js';
import { router as applyChangesRouter } from './routes/apply-changes.js';
import { router as autonomousRouter } from './routes/autonomous.js';
import { router as projectRouter } from './routes/project.js';
import { router as filesystemRouter } from './routes/filesystem.js';
import { router as intentGraphRouter } from './routes/intent-graph-routes.js';
import { router as suggestionsRouter } from './routes/suggestions.js';
import { router as intelligenceRouter } from './routes/intelligence.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Routes
app.use('/project', projectRouter);
app.use('/files', filesystemRouter);
app.use('/intent-graph', intentGraphRouter);
app.use('/index-repo', indexRepoRouter);
app.use('/query', queryRouter);
app.use('/simulate', simulateRouter);
app.use('/apply-changes', applyChangesRouter);
app.use('/autonomous', autonomousRouter);
app.use('/suggestions', suggestionsRouter);
app.use('/intelligence', intelligenceRouter);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('server', 'Unhandled error', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(config.port, () => {
  log('server', `Code Intelligence Engine started on port ${config.port}`);
  log('server', `Health check: http://localhost:${config.port}/`);
});

export { app };
