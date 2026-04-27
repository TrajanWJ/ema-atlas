# @autharis/status

Public status + uptime dashboard for every Autharis service. **Lane G5.**

Next.js 16 App Router (not 14, not pages router) running on port `:4040`.
Pings each service's `/healthz` server-side, stores results in a local SQLite
file, and renders a 90-day uptime grid + incident timeline.

## Services monitored

| Service      | Lane | URL                      |
| ------------ | ---- | ------------------------ |
| Autharis Web | A–C  | http://localhost:3000    |
| API          | F6   | http://localhost:4010    |
| Events       | F8   | http://localhost:4020    |
| Matching     | F7   | http://localhost:4030    |
| Warehouse    | G7   | static (dbt run results) |

See `lib/services.ts` for the canonical list.

## Run

```bash
pnpm install
pnpm --filter @autharis/status seed    # populate uptime.sqlite with 90d of synthetic data
pnpm --filter @autharis/status dev     # http://localhost:4040
```

`dev` is `next dev -p 4040`. `start` is `next start -p 4040` after `next build`.

## Endpoints

| Route            | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `/`              | Overview: overall banner + per-service 90d grids  |
| `/incidents`     | Incident list (pass `?id=N` for the detail panel) |
| `/api/ping`      | Runs one sweep, writes results, returns JSON      |

`/api/ping` has a 3-second timeout per service and records every result to
SQLite whether it succeeded or failed.

## Storage

- `uptime.sqlite` is created at project root on first DB touch. **Do not
  commit this file** — it's regenerated from `scripts/seed.ts`.
- Schema: `pings(id, service, ts, ok, latency_ms)` and
  `incidents(id, service, opened_at, closed_at?, note)`.

## Uptime rollup

`lib/uptime.ts#rollup90Days(service)` bins pings into 90 daily buckets:

- `ok` — all pings that day succeeded
- `partial` — some failed, some succeeded
- `outage` — all failed
- `nodata` — no pings recorded

## Smoke check

```bash
pnpm --filter @autharis/status typecheck
```

## Scope

Lane G5 owns only `apps/status/**`. It is read-only over every other package
and over `autharis/**`.
