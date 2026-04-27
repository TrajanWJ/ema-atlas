# @autharis/api

Fastify 5 + TypeScript backend. Lane F6. Standalone HTTP service — distinct from Lane E2 (Next.js route handlers inside `autharis/app/api/`).

Listens on `:4010`. Emits OpenAPI 3.1 at `/openapi.json` and Swagger UI at `/docs`.

## Scripts

```sh
pnpm --filter @autharis/api dev      # tsx watch src/server.ts
pnpm --filter @autharis/api build    # tsc
pnpm --filter @autharis/api start    # node dist/server.js
```

## Endpoints

| Method | Path                   | Notes                                  |
| ------ | ---------------------- | -------------------------------------- |
| GET    | `/healthz`             | Liveness probe                         |
| GET    | `/openapi.json`        | OpenAPI 3.1 document                   |
| GET    | `/docs`                | Swagger UI                             |
| GET    | `/talent`              | List talent                            |
| GET    | `/talent/:id`          | Get one talent                         |
| POST   | `/talent`              | Create talent                          |
| GET    | `/jobs`                | List job requests                      |
| GET    | `/jobs/:id`            | Get one job request                    |
| POST   | `/jobs`                | Create job request                     |
| GET    | `/engagements`         | List engagements                       |
| GET    | `/engagements/:id`     | Get one engagement                     |
| POST   | `/engagements`         | Create engagement                      |
| GET    | `/timesheets`          | List timesheets                        |
| GET    | `/timesheets/:id`      | Get one timesheet                      |
| POST   | `/timesheets`          | Create timesheet                       |
| GET    | `/invoices`            | List invoices                          |
| GET    | `/invoices/:id`        | Get one invoice                        |
| POST   | `/invoices`            | Create invoice                         |
| GET    | `/admin/queue`         | List admin queue                       |
| GET    | `/admin/queue/:id`     | Get one admin queue item               |
| POST   | `/admin/queue`         | Create admin queue item                |

## CORS allowlist

- `http://localhost:3000` — autharis web
- `http://localhost:4321` — hub
- `http://localhost:4000` — docs

## Sample curl

```sh
# Health
curl -s http://localhost:4010/healthz | jq

# List talent
curl -s http://localhost:4010/talent | jq '.[0]'

# One talent
curl -s http://localhost:4010/talent/t-001 | jq

# Create a job request
curl -s -X POST http://localhost:4010/jobs \
  -H 'content-type: application/json' \
  -d '{
    "title":"EA coverage — founder, 20 hrs",
    "category":"admin",
    "client":"Ladder Fintech",
    "description":"Calendar, travel, inbox triage.",
    "hoursPerWeek":20,
    "duration":"Ongoing",
    "timezone":"ET",
    "budget":[35,50],
    "skills":["Calendar Mgmt","Email Triage"],
    "industry":"Fintech",
    "status":"Draft",
    "posted":"just now",
    "matches":0
  }' | jq

# OpenAPI document
curl -s http://localhost:4010/openapi.json | jq '.info'
```

## Storage

In-memory behind a `Store` interface in `src/store/memory.ts`. Seeds in `src/seed/fixtures.ts` mirror the shapes in `autharis/lib/data.ts` (read-only there). A Postgres-backed `Store` impl can slot in later without touching callers.

## Docker

```sh
docker build -t autharis/api -f services/api/Dockerfile services/api
docker run --rm -p 4010:4010 autharis/api
```
