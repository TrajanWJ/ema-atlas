import type { FastifyInstance } from "fastify";

import { registerOrganizationsRoutes } from "./routes.js";
import { initOrganizations } from "./service.js";

let bootstrapped = false;

function bootstrap(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  initOrganizations();
}

export function registerRoutes(app: FastifyInstance): void {
  bootstrap();
  void app.register(async (scope) => {
    registerOrganizationsRoutes(scope);
  }, { prefix: "/api" });
}
