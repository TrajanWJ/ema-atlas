import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  InvoiceSchema,
  InvoiceCreateSchema,
  IdParamSchema,
  ErrorSchema,
} from '../schemas/common.js';
import type { Store } from '../store/memory.js';

export const invoicesRoutes = (store: Store): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get('/invoices', {
      schema: {
        tags: ['invoices'],
        summary: 'List invoices',
        response: { 200: Type.Array(InvoiceSchema) },
      },
      handler: async () => store.listInvoices(),
    });

    fastify.get('/invoices/:id', {
      schema: {
        tags: ['invoices'],
        summary: 'Get invoice by id',
        params: IdParamSchema,
        response: { 200: InvoiceSchema, 404: ErrorSchema },
      },
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const row = store.getInvoice(id);
        if (!row) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `invoice ${id} not found` });
        return row;
      },
    });

    fastify.post('/invoices', {
      schema: {
        tags: ['invoices'],
        summary: 'Create invoice',
        body: InvoiceCreateSchema,
        response: { 201: InvoiceSchema },
      },
      handler: async (request, reply) => {
        const row = store.createInvoice(request.body as Parameters<Store['createInvoice']>[0]);
        return reply.code(201).send(row);
      },
    });
  };
