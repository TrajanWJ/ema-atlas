import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  TimesheetSchema,
  TimesheetCreateSchema,
  IdParamSchema,
  ErrorSchema,
} from '../schemas/common.js';
import type { Store } from '../store/memory.js';

export const timesheetsRoutes = (store: Store): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get('/timesheets', {
      schema: {
        tags: ['timesheets'],
        summary: 'List timesheets',
        response: { 200: Type.Array(TimesheetSchema) },
      },
      handler: async () => store.listTimesheets(),
    });

    fastify.get('/timesheets/:id', {
      schema: {
        tags: ['timesheets'],
        summary: 'Get timesheet by id',
        params: IdParamSchema,
        response: { 200: TimesheetSchema, 404: ErrorSchema },
      },
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const row = store.getTimesheet(id);
        if (!row) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `timesheet ${id} not found` });
        return row;
      },
    });

    fastify.post('/timesheets', {
      schema: {
        tags: ['timesheets'],
        summary: 'Create timesheet',
        body: TimesheetCreateSchema,
        response: { 201: TimesheetSchema },
      },
      handler: async (request, reply) => {
        const row = store.createTimesheet(request.body as Parameters<Store['createTimesheet']>[0]);
        return reply.code(201).send(row);
      },
    });
  };
