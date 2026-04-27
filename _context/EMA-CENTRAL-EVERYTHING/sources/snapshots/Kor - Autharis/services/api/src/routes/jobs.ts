import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  JobSchema,
  JobCreateSchema,
  IdParamSchema,
  ErrorSchema,
} from '../schemas/common.js';
import type { Store } from '../store/memory.js';

export const jobsRoutes = (store: Store): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get('/jobs', {
      schema: {
        tags: ['jobs'],
        summary: 'List job requests',
        response: { 200: Type.Array(JobSchema) },
      },
      handler: async () => store.listJobs(),
    });

    fastify.get('/jobs/:id', {
      schema: {
        tags: ['jobs'],
        summary: 'Get job request by id',
        params: IdParamSchema,
        response: { 200: JobSchema, 404: ErrorSchema },
      },
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const row = store.getJob(id);
        if (!row) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `job ${id} not found` });
        return row;
      },
    });

    fastify.post('/jobs', {
      schema: {
        tags: ['jobs'],
        summary: 'Create job request',
        body: JobCreateSchema,
        response: { 201: JobSchema },
      },
      handler: async (request, reply) => {
        const row = store.createJob(request.body as Parameters<Store['createJob']>[0]);
        return reply.code(201).send(row);
      },
    });
  };
