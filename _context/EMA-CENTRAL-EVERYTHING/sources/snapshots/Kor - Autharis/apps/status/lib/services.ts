export type ServiceId =
  | "autharis-web"
  | "api"
  | "events"
  | "matching"
  | "warehouse";

export interface ServiceDef {
  id: ServiceId;
  name: string;
  lane: string;
  url: string;
  healthz: string;
  kind: "http" | "static";
  blurb: string;
}

export const SERVICES: ServiceDef[] = [
  {
    id: "autharis-web",
    name: "Autharis Web",
    lane: "A/B/C",
    url: "http://localhost:3000",
    healthz: "http://localhost:3000/api/healthz",
    kind: "http",
    blurb: "Next.js marketing + app surface.",
  },
  {
    id: "api",
    name: "API (Fastify)",
    lane: "F6",
    url: "http://localhost:4010",
    healthz: "http://localhost:4010/healthz",
    kind: "http",
    blurb: "Fastify 5 REST surface with OpenAPI 3.1.",
  },
  {
    id: "events",
    name: "Events (Bun WS)",
    lane: "F8",
    url: "http://localhost:4020",
    healthz: "http://localhost:4020/healthz",
    kind: "http",
    blurb: "Bun WebSocket gateway for realtime fan-out.",
  },
  {
    id: "matching",
    name: "Matching (FastAPI)",
    lane: "F7",
    url: "http://localhost:4030",
    healthz: "http://localhost:4030/healthz",
    kind: "http",
    blurb: "Python scoring + ranking microservice.",
  },
  {
    id: "warehouse",
    name: "Warehouse (dbt/DuckDB)",
    lane: "G7",
    url: "file:services/warehouse",
    healthz: "file:services/warehouse/target/run_results.json",
    kind: "static",
    blurb: "Static analytics artifacts. Health based on last dbt build.",
  },
];

export function serviceById(id: string): ServiceDef | undefined {
  return SERVICES.find((s) => s.id === id);
}
