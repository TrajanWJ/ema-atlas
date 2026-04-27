This lane reserves `prisma/` for a future relational migration, but E2 is intentionally using a typed JSON-serializable server snapshot for now.

Why:

- `lib/data.ts` is protected and already contains the canonical seed shapes.
- `package.json` is outside E2 scope, so adding Prisma dependencies in this pass would cross lane boundaries.
- The new `lib/db/` and `lib/server/` boundary keeps the API surface stable while leaving room to swap in Prisma later.
