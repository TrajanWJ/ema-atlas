import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { registerOpenapi } from './plugins/openapi.js';
import { createMemoryStore, type Store } from './store/memory.js';
import { talentRoutes } from './routes/talent.js';
import { jobsRoutes } from './routes/jobs.js';
import { engagementsRoutes } from './routes/engagements.js';
import { timesheetsRoutes } from './routes/timesheets.js';
import { invoicesRoutes } from './routes/invoices.js';
import { adminQueueRoutes } from './routes/admin-queue.js';

const CORS_ALLOWLIST = new Set([
  'http://localhost:3000', // autharis web
  'http://localhost:4321', // hub
  'http://localhost:4000', // docs
]);

export async function buildServer(
  opts: { store?: Store; logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      opts.logger === false
        ? false
        : {
            level: process.env.LOG_LEVEL ?? 'info',
            transport:
              process.env.NODE_ENV === 'production'
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: { colorize: true, translateTime: 'HH:MM:ss.l' },
                  },
          },
  });

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow server-to-server (no Origin header) and the listed web origins.
      if (!origin || CORS_ALLOWLIST.has(origin)) return cb(null, true);
      return cb(new Error(`origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  await registerOpenapi(app);

  const store = opts.store ?? createMemoryStore();

  app.get('/healthz', { schema: { hide: true } }, async () => ({ ok: true, service: 'autharis-api' }));

  await app.register(talentRoutes(store));
  await app.register(jobsRoutes(store));
  await app.register(engagementsRoutes(store));
  await app.register(timesheetsRoutes(store));
  await app.register(invoicesRoutes(store));
  await app.register(adminQueueRoutes(store));

  return app;
}

async function main(): Promise<void> {
  const app = await buildServer();
  const port = Number(process.env.PORT ?? 4010);
  const host = process.env.HOST ?? '0.0.0.0';

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.error({ err }, 'failed to start server');
    process.exit(1);
  }
}

// Only auto-start when executed directly (not when imported for tests).
const isDirect =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('server.ts') === true ||
  process.argv[1]?.endsWith('server.js') === true;

if (isDirect) {
  void main();
}
