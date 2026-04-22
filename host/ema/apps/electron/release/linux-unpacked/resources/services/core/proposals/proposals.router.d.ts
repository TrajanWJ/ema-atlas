/**
 * Proposals domain router — auto-registered by `services/http/server.ts`.
 *
 * Surfaces the seeder and farmer as read-only HTTP endpoints so the
 * renderer (and any other client) can prime the proposal pipeline. The
 * bootstrap is best-effort: if `EMA_VAULT_ROOT` isn't set the GET handlers
 * still respond, they just return an empty list.
 *
 * Writes against `IntentionFarmer.clean` are guarded behind an explicit
 * POST so a stray `curl` can't wipe harvested state.
 */
import type { FastifyInstance } from "fastify";
export declare function registerRoutes(app: FastifyInstance): void;
//# sourceMappingURL=proposals.router.d.ts.map