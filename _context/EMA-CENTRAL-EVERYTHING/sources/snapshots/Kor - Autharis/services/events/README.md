# @autharis/events

Realtime gateway built on Bun's native WebSocket server. **Lane F8.**

Distinct from Lane E5 (in-app notifications inside Next.js). F8 is the out-of-process fan-out layer: accepts HMAC-signed events from `services/api` (F6), fans out to connected subscribers, and persists a short-term ring buffer (last 100 events per channel) for reconnect replay.

Intentionally a different runtime (Bun, not Node) so the monorepo exercises multi-runtime orchestration in CI.

## Run

```bash
# dev with file watch
bun run dev

# production
bun run start

# tests
bun test
```

Default port: `4020` (override with `PORT`).

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/publish` | Ingest a signed event. Requires `x-autharis-signature: sha256=<hex>` over the raw request body. |
| `GET`  | `/healthz` | `{ ok, connections, channels }`. |
| `WS`   | `/ws?channel=<name>&since=<ts?>` | Subscribe to a channel. On connect, the gateway replays buffered events with `ts > since`. |

### Channels

`matches`, `timesheets`, `invoices`, `disputes`, `messages`.

### Event shape

Every event is a discriminated union on `kind`:

```ts
{
  kind: "match-found" | "timesheet-submitted" | "invoice-paid" | "dispute-opened" | "message-received";
  channel: EventChannel;
  userId?: string;
  engagementId?: string;
  ts: number;     // unix millis
  payload: { ... };
}
```

See `src/types.ts` for the full union.

## Env vars

| Var | Required | Default | Notes |
| --- | --- | --- | --- |
| `AUTHARIS_EVENTS_SECRET` | yes | — | HMAC-SHA256 shared secret for `/publish`. |
| `PORT` | no | `4020` | Bind port. Use `0` in tests for an ephemeral port. |

## Client

```ts
import { createEventsClient } from "@autharis/events";

const client = createEventsClient({
  url: "ws://localhost:4020",
  channel: "matches",
  since: Date.now() - 60_000,
  onEvent: (e) => console.log(e),
});
```

Consumable from Next.js (E5), the Astro hub (F1), or any ESM context with a
native `WebSocket` global.

## Publishing (from F6 or internal scripts)

```ts
const body = JSON.stringify(event);
const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
await fetch("http://localhost:4020/publish", {
  method: "POST",
  headers: { "x-autharis-signature": sig, "content-type": "application/json" },
  body,
});
```

## Docker

```bash
docker build -t autharis-events .
docker run -p 4020:4020 -e AUTHARIS_EVENTS_SECRET=dev autharis-events
```

## Non-goals

- Durability beyond the 100-event ring buffer — the API service (F6) is source of truth.
- Auth/authz beyond HMAC on the publish path — subscribers are read-only and
  access control is delegated to the Next.js edge.
