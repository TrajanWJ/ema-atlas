import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  TalentSchema,
  TalentCreateSchema,
  IdParamSchema,
  ErrorSchema,
} from '../schemas/common.js';
import type { Store } from '../store/memory.js';

export const talentRoutes = (store: Store): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get('/talent', {
      schema: {
        tags: ['talent'],
        summary: 'List talent',
        response: { 200: Type.Array(TalentSchema) },
      },
      handler: async () => store.listTalent(),
    });

    fastify.get('/talent/:id', {
      schema: {
        tags: ['talent'],
        summary: 'Get talent by id',
        params: IdParamSchema,
        response: { 200: TalentSchema, 404: ErrorSchema },
      },
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const row = store.getTalent(id);
        if (!row) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `talent ${id} not found` });
        return row;
      },
    });

    fastify.post('/talent', {
      schema: {
        tags: ['talent'],
        summary: 'Create talent',
        body: TalentCreateSchema,
        response: { 201: TalentSchema },
      },
      handler: async (request, reply) => {
        const row = store.createTalent(request.body as Parameters<Store['createTalent']>[0]);
        return reply.code(201).send(row);
      },
    });
  };
