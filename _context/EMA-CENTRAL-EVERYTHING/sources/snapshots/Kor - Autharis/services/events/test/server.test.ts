// `bun test` suite for the F8 events gateway.
//
// Covers the three contract-defining behaviors:
//   1. HTTP publish → WS fan-out
//   2. HMAC rejection on bad signature
//   3. Ring-buffer replay via `?since=<ts>`

import { describe, it, expect, beforeEach } from "bun:test";

import { RingBuffer } from "../src/ring-buffer.ts";
import { sign, verify } from "../src/hmac.ts";
import type { Event } from "../src/types.ts";

const SECRET = "test-secret-f8";

function mkEvent(ts: number, kind: Event["kind"] = "match-found"): Event {
  // Minimal valid events across the union — only `match-found` shape used here,
  // which satisfies `isEvent` and the buffer API.
  return {
    kind: "match-found",
    channel: "matches",
    ts,
    payload: { jobId: "j1", talentId: "t1", score: 0.9 },
  } as Event;
}

describe("RingBuffer", () => {
  let rb: RingBuffer;
  beforeEach(() => {
    rb = new RingBuffer(3);
  });

  it("caps at capacity and drops oldest", () => {
    rb.push(mkEvent(1));
    rb.push(mkEvent(2));
    rb.push(mkEvent(3));
    rb.push(mkEvent(4));
    const all = rb.all("matches");
    expect(all.map((e) => e.ts)).toEqual([2, 3, 4]);
  });

  it("replays events strictly after `since`", () => {
    rb.push(mkEvent(10));
    rb.push(mkEvent(20));
    rb.push(mkEvent(30));
    const since = rb.since("matches", 15);
    expect(since.map((e) => e.ts)).toEqual([20, 30]);
  });
});

describe("HMAC", () => {
  it("round-trips sign/verify", () => {
    const body = JSON.stringify({ hello: "world" });
    const sig = sign(SECRET, body);
    expect(verify(SECRET, body, sig)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const body = JSON.stringify({ hello: "world" });
    const sig = sign(SECRET, body);
    const tampered = sig.replace(/.$/, sig.endsWith("0") ? "1" : "0");
    expect(verify(SECRET, body, tampered)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verify(SECRET, "{}", null)).toBe(false);
    expect(verify(SECRET, "{}", "")).toBe(false);
  });
});

// Full HTTP+WS integration test — only runs under Bun where `Bun.serve` exists.
describe("publish → fan-out (integration)", () => {
  it("publishes via HTTP, receives via WS, rejects bad HMAC", async () => {
    // Dynamic import so the test suite still loads when Bun isn't present.
    // Binds an ephemeral port (0) to avoid collisions.
    process.env.AUTHARIS_EVENTS_SECRET = SECRET;
    process.env.PORT = "0";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BunAny = (globalThis as any).Bun;
    if (!BunAny?.serve) {
      // Skip gracefully when not on Bun (e.g. CI without bun).
      return;
    }

    const { server } = await import("../src/server.ts");
    const base = `http://localhost:${server.port}`;
    const wsBase = `ws://localhost:${server.port}`;

    // Open subscriber.
    const received: Event[] = [];
    const ws = new WebSocket(`${wsBase}/ws?channel=matches`);
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve());
      ws.addEventListener("error", () => reject(new Error("ws open failed")));
    });
    ws.addEventListener("message", (ev: MessageEvent) => {
      received.push(JSON.parse(String(ev.data)));
    });

    const event = mkEvent(Date.now());
    const body = JSON.stringify(event);

    // 1. Bad signature → 401.
    const bad = await fetch(`${base}/publish`, {
      method: "POST",
      headers: { "x-autharis-signature": "sha256=deadbeef" },
      body,
    });
    expect(bad.status).toBe(401);

    // 2. Good signature → 200 and fans out.
    const ok = await fetch(`${base}/publish`, {
      method: "POST",
      headers: { "x-autharis-signature": sign(SECRET, body) },
      body,
    });
    expect(ok.status).toBe(200);

    // Give the event loop a tick to deliver the WS frame.
    await new Promise((r) => setTimeout(r, 50));
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[received.length - 1].kind).toBe("match-found");

    ws.close();
    server.stop(true);
  });
});
