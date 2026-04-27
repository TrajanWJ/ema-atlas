import type { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerOpenapi(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: '@autharis/api',
        description:
          'Fastify 5 + TypeScript backend for Autharis — remote hourly talent marketplace. Lane F6.',
        version: '0.0.0',
      },
      servers: [{ url: 'http://localhost:4010', description: 'local dev' }],
      tags: [
        { name: 'talent', description: 'Talent roster' },
        { name: 'jobs', description: 'Job requests' },
        { name: 'engagements', description: 'Active matches between client and talent' },
        { name: 'timesheets', description: 'Weekly hours, per engagement' },
        { name: 'invoices', description: 'Billing and payout records' },
        { name: 'admin', description: 'Admin operations queue' },
      ],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Explicit JSON endpoint at /openapi.json (in addition to /docs/json).
  app.get('/openapi.json', { schema: { hide: true } }, async () => app.swagger());
}
