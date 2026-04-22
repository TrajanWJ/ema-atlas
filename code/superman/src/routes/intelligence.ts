import { Router } from 'express';
import { log, logError } from '../logger.js';
import { scanInfrastructure } from '../intelligence/infrastructure-scanner.js';
import { scanRoutes } from '../intelligence/route-scanner.js';
import { answerQuestion, buildProjectContext } from '../intelligence/project-qa.js';
import type { QAContext } from '../intelligence/project-qa.js';
import { projectManager } from '../project-manager.js';
import { config } from '../config.js';

export const router = Router();

// Cache for expensive scans
let infraCache: { data: Awaited<ReturnType<typeof scanInfrastructure>>; timestamp: number } | null = null;
let routeCache: { data: Awaited<ReturnType<typeof scanRoutes>>; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 1 minute

function isCacheValid(cache: { timestamp: number } | null): boolean {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL;
}

/**
 * GET /intelligence/infrastructure
 * Scan and return full infrastructure model
 */
router.get('/infrastructure', async (_req, res) => {
  try {
    const repoPath = config.targetRepoPath;
    if (!repoPath) {
      return res.status(400).json({ error: 'No target repo configured' });
    }

    if (isCacheValid(infraCache)) {
      return res.json(infraCache!.data);
    }

    const infra = await scanInfrastructure(repoPath);
    infraCache = { data: infra, timestamp: Date.now() };
    res.json(infra);
  } catch (error) {
    logError('infra', 'Infrastructure scan failed', error);
    res.status(500).json({ error: 'Infrastructure scan failed' });
  }
});

/**
 * GET /intelligence/routes
 * Scan and return complete route map
 */
router.get('/routes', async (_req, res) => {
  try {
    const repoPath = config.targetRepoPath;
    if (!repoPath) {
      return res.status(400).json({ error: 'No target repo configured' });
    }

    if (isCacheValid(routeCache)) {
      return res.json(routeCache!.data);
    }

    const routes = await scanRoutes(repoPath);
    routeCache = { data: routes, timestamp: Date.now() };
    res.json(routes);
  } catch (error) {
    logError('infra', 'Route scan failed', error);
    res.status(500).json({ error: 'Route scan failed' });
  }
});

/**
 * GET /intelligence/health
 * Quick health check — what's running, what's missing
 */
router.get('/health', async (_req, res) => {
  try {
    const repoPath = config.targetRepoPath;
    if (!repoPath) {
      return res.status(400).json({ error: 'No target repo configured' });
    }

    const infra = isCacheValid(infraCache)
      ? infraCache!.data
      : await scanInfrastructure(repoPath);

    if (!isCacheValid(infraCache)) {
      infraCache = { data: infra, timestamp: Date.now() };
    }

    const health = {
      database: infra.database ? {
        provider: infra.database.provider,
        running: infra.database.isRunning,
        modelCount: infra.database.models.length,
      } : null,
      services: infra.services.map(s => ({
        name: s.name,
        configured: s.missingEnvVars.length === 0,
        missing: s.missingEnvVars,
      })),
      missingEnvVars: infra.envVars.filter(v => v.required && !v.hasValue).map(v => v.name),
      portsDown: infra.ports.filter(p => !p.isListening).map(p => `${p.service}:${p.port}`),
      framework: infra.runtime.framework,
    };

    res.json(health);
  } catch (error) {
    logError('infra', 'Health check failed', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

/**
 * POST /intelligence/ask
 * Ask a natural language question about the project
 * Body: { question: string }
 */
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required' });
    }

    const repoPath = config.targetRepoPath;
    if (!repoPath) {
      return res.status(400).json({ error: 'No target repo configured' });
    }

    // Gather all available context
    const infra = isCacheValid(infraCache)
      ? infraCache!.data
      : await scanInfrastructure(repoPath);
    if (!isCacheValid(infraCache)) {
      infraCache = { data: infra, timestamp: Date.now() };
    }

    const routes = isCacheValid(routeCache)
      ? routeCache!.data
      : await scanRoutes(repoPath);
    if (!isCacheValid(routeCache)) {
      routeCache = { data: routes, timestamp: Date.now() };
    }

    const graph = projectManager.getGraph() ?? null;
    const model = projectManager.getModel() ?? null;

    const context: QAContext = { infrastructure: infra, routes, graph, model };
    const answer = await answerQuestion(question, context);

    res.json(answer);
  } catch (error) {
    logError('infra', 'Q&A failed', error);
    res.status(500).json({ error: 'Q&A failed' });
  }
});

/**
 * GET /intelligence/context
 * Returns the full project context string (for debugging)
 */
router.get('/context', async (_req, res) => {
  try {
    const repoPath = config.targetRepoPath;
    if (!repoPath) {
      return res.status(400).json({ error: 'No target repo configured' });
    }

    const infra = isCacheValid(infraCache)
      ? infraCache!.data
      : await scanInfrastructure(repoPath);
    const routes = isCacheValid(routeCache)
      ? routeCache!.data
      : await scanRoutes(repoPath);
    const graph = projectManager.getGraph() ?? null;
    const model = projectManager.getModel() ?? null;

    const context: QAContext = { infrastructure: infra, routes, graph, model };
    const contextStr = buildProjectContext(context);

    res.type('text/plain').send(contextStr);
  } catch (error) {
    logError('infra', 'Context build failed', error);
    res.status(500).json({ error: 'Context build failed' });
  }
});

/**
 * POST /intelligence/invalidate
 * Clear caches to force re-scan
 */
router.post('/invalidate', (_req, res) => {
  infraCache = null;
  routeCache = null;
  log('infra', 'Intelligence caches invalidated');
  res.json({ status: 'ok' });
});
