import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  EngagementSchema,
  EngagementCreateSchema,
  IdParamSchema,
  ErrorSchema,
} from '../schemas/common.js';
import type { Store } from '../store/memory.js';

export const engagementsRoutes = (store: Store): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get('/engagements', {
      schema: {
        tags: ['engagements'],
        summary: 'List engagements',
        response: { 200: Type.Array(EngagementSchema) },
      },
      handler: async () => store.listEngagements(),
    });

    fastify.get('/engagements/:id', {
      schema: {
        tags: ['engagements'],
        summary: 'Get engagement by id',
        params: IdParamSchema,
        response: { 200: EngagementSchema, 404: ErrorSchema },
      },
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const row = store.getEngagement(id);
        if (!row) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `engagement ${id} not found` });
        return row;
      },
    });

    fastify.post('/engagements', {
      schema: {
        tags: ['engagements'],
        summary: 'Create engagement',
        body: EngagementCreateSchema,
        response: { 201: EngagementSchema },
      },
      handler: async (request, reply) => {
        const row = store.createEngagement(request.body as Parameters<Store['createEngagement']>[0]);
        return reply.code(201).send(row);
      },
    });
  };
