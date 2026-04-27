// Bun WebSocket + HTTP gateway. Lane F8.
//
// Endpoints:
//   POST /publish  — HMAC-signed event publication from F6 / internal services
//   GET  /healthz  — liveness + subscriber count + active channels
//   WS   /ws?channel=<name>&since=<ts?>  — subscriber fan-out with replay
//
// Env:
//   AUTHARIS_EVENTS_SECRET  — HMAC shared secret (required for /publish)
//   PORT                    — bind port (default 4020)

import { isEvent, type Event, type EventChannel } from "./types.ts";
import { RingBuffer } from "./ring-buffer.ts";
import { verify } from "./hmac.ts";

type ClientMeta = {
  channel: EventChannel;
  since: number;
};

const PORT = Number(process.env.PORT ?? 4020);
const SECRET = process.env.AUTHARIS_EVENTS_SECRET ?? "";

const buffer = new RingBuffer(100);
// channel -> set of sockets. Bun's ServerWebSocket is generic over data type.
const subscribers: Map<EventChannel, Set<any>> = new Map();

function addSubscriber(channel: EventChannel, ws: any): void {
  let set = subscribers.get(channel);
  if (!set) {
    set = new Set();
    subscribers.set(channel, set);
  }
  set.add(ws);
}

function removeSubscriber(channel: EventChannel, ws: any): void {
  const set = subscribers.get(channel);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) subscribers.delete(channel);
}

function totalConnections(): number {
  let n = 0;
  for (const set of subscribers.values()) n += set.size;
  return n;
}

function fanOut(event: Event): void {
  const set = subscribers.get(event.channel);
  if (!set || set.size === 0) return;
  const payload = JSON.stringify(event);
  for (const ws of set) {
    try {
      ws.send(payload);
    } catch {
      // swallow — Bun marks the socket closed; cleanup runs on `close`.
    }
  }
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

// Bun global — declared loosely to keep this file buildable under `tsc --noEmit`
// when bun-types isn't installed in the sandbox.
declare const Bun: any;

const server = Bun.serve<ClientMeta>({
  port: PORT,
  async fetch(req: Request, srv: any) {
    const url = new URL(req.url);

    if (url.pathname === "/healthz" && req.method === "GET") {
      return json({
        ok: true,
        connections: totalConnections(),
        channels: Array.from(subscribers.keys()),
      });
    }

    if (url.pathname === "/publish" && req.method === "POST") {
      if (!SECRET) {
        return json(
          { ok: false, error: "server missing AUTHARIS_EVENTS_SECRET" },
          { status: 500 },
        );
      }
      const rawBody = await req.text();
      const sig = req.headers.get("x-autharis-signature");
      if (!verify(SECRET, rawBody, sig)) {
        return json(
          { ok: false, error: "invalid signature" },
          { status: 401 },
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        return json({ ok: false, error: "invalid json" }, { status: 400 });
      }
      if (!isEvent(parsed)) {
        return json(
          { ok: false, error: "invalid event shape" },
          { status: 400 },
        );
      }
      const event = parsed as Event;
      buffer.push(event);
      fanOut(event);
      return json({ ok: true });
    }

    if (url.pathname === "/ws") {
      const channel = url.searchParams.get("channel") as EventChannel | null;
      if (!channel) {
        return json(
          { ok: false, error: "missing channel" },
          { status: 400 },
        );
      }
      const sinceRaw = url.searchParams.get("since");
      const since = sinceRaw ? Number(sinceRaw) : 0;
      const ok = srv.upgrade(req, {
        data: {
          channel,
          since: Number.isFinite(since) ? since : 0,
        } satisfies ClientMeta,
      });
      if (ok) {
        // Bun returns undefined on successful upgrade; client is now a WS.
        return undefined;
      }
      return json({ ok: false, error: "upgrade failed" }, { status: 400 });
    }

    return json({ ok: false, error: "not found" }, { status: 404 });
  },
  websocket: {
    open(ws: any) {
      const { channel, since } = ws.data as ClientMeta;
      addSubscriber(channel, ws);
      // Replay buffered events strictly newer than `since`.
      const replay = since > 0 ? buffer.since(channel, since) : buffer.all(channel);
      for (const event of replay) {
        try {
          ws.send(JSON.stringify(event));
        } catch {
          // ignore
        }
      }
    },
    message(_ws: any, _msg: string | Buffer) {
      // Subscribers are read-only against this gateway; ignore inbound frames.
      // Writers use HTTP POST /publish with an HMAC signature.
    },
    close(ws: any) {
      const { channel } = ws.data as ClientMeta;
      removeSubscriber(channel, ws);
    },
  },
});

// eslint-disable-next-line no-console
console.log(`[events] listening on :${server.port}`);

function shutdown(sig: string) {
  // eslint-disable-next-line no-console
  console.log(`[events] received ${sig}, shutting down`);
  try {
    server.stop(true);
  } catch {
    // ignore
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export { server };
