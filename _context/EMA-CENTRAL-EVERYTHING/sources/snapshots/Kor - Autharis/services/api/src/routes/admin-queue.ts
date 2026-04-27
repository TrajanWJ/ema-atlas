import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  AdminQueueItemSchema,
  AdminQueueItemCreateSchema,
  IdParamSchema,
  ErrorSchema,
} from '../schemas/common.js';
import type { Store } from '../store/memory.js';

export const adminQueueRoutes = (store: Store): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get('/admin/queue', {
      schema: {
        tags: ['admin'],
        summary: 'List admin queue items',
        response: { 200: Type.Array(AdminQueueItemSchema) },
      },
      handler: async () => store.listAdminQueue(),
    });

    fastify.get('/admin/queue/:id', {
      schema: {
        tags: ['admin'],
        summary: 'Get admin queue item by id',
        params: IdParamSchema,
        response: { 200: AdminQueueItemSchema, 404: ErrorSchema },
      },
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const row = store.getAdminQueueItem(id);
        if (!row) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `queue item ${id} not found` });
        return row;
      },
    });

    fastify.post('/admin/queue', {
      schema: {
        tags: ['admin'],
        summary: 'Create admin queue item',
        body: AdminQueueItemCreateSchema,
        response: { 201: AdminQueueItemSchema },
      },
      handler: async (request, reply) => {
        const row = store.createAdminQueueItem(
          request.body as Parameters<Store['createAdminQueueItem']>[0],
        );
        return reply.code(201).send(row);
      },
    });
  };
