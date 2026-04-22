from pathlib import Path
p = Path('/home/trajan/Projects/ema/services/core/runtime-fabric/routes.ts')
text = p.read_text()
text = text.replace('  listObservedSessions,', '  listObservedSessionEvents,\n  listObservedSessions,')
text = text.replace('const observerQuerySchema = z.object({\n  limit: z.coerce.number().int().min(1).max(500).optional(),\n});', 'const observerQuerySchema = z.object({\n  limit: z.coerce.number().int().min(1).max(500).optional(),\n});\n\nconst observerEventsQuerySchema = z.object({\n  limit: z.coerce.number().int().min(1).max(500).optional(),\n});')
old = '''  app.get(
    "/api/runtime-fabric/session-observer",
    async (request: FastifyRequest<{ Querystring: unknown }>, reply: FastifyReply) => {
      try {
        const query = observerQuerySchema.parse(request.query ?? {});
        return listObservedSessions(query.limit);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return invalid(reply, err);
        }
        return internal(reply, err);
      }
    },
  );
'''
new = old + '''
  app.get(
    "/api/runtime-fabric/session-observer/events",
    async (request: FastifyRequest<{ Querystring: unknown }>, reply: FastifyReply) => {
      try {
        const query = observerEventsQuerySchema.parse(request.query ?? {});
        return {
          events: listObservedSessionEvents(query.limit),
        };
      } catch (err) {
        if (err instanceof z.ZodError) {
          return invalid(reply, err);
        }
        return internal(reply, err);
      }
    },
  );
'''
text = text.replace(old, new)
p.write_text(text)
