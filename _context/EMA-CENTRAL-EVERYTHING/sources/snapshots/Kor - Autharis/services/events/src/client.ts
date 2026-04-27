// Thin ESM client for the F8 events gateway.
//
// Consumed by Next.js (E5 notifications surface) and the monorepo hub. Uses
// the platform `WebSocket` global — works in browsers, Bun, and Node 22+.

import type { Event, EventChannel } from "./types.ts";

export interface EventsClientOptions {
  /** Base URL, e.g. `ws://localhost:4020` or `wss://events.autharis.com`. */
  url: string;
  channel: EventChannel;
  /** Optional replay cursor — millisecond timestamp. */
  since?: number;
  onEvent: (event: Event) => void;
  onError?: (err: Event | Error) => void;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
}

export interface EventsClient {
  close(): void;
  readonly socket: WebSocket;
}

export function createEventsClient(opts: EventsClientOptions): EventsClient {
  const url = new URL("/ws", opts.url.replace(/^http/, "ws"));
  url.searchParams.set("channel", opts.channel);
  if (typeof opts.since === "number" && opts.since > 0) {
    url.searchParams.set("since", String(opts.since));
  }

  const ws = new WebSocket(url.toString());

  ws.addEventListener("open", () => {
    opts.onOpen?.();
  });

  ws.addEventListener("message", (ev: MessageEvent) => {
    try {
      const parsed = JSON.parse(typeof ev.data === "string" ? ev.data : String(ev.data));
      opts.onEvent(parsed as Event);
    } catch (err) {
      opts.onError?.(err as Error);
    }
  });

  ws.addEventListener("error", () => {
    opts.onError?.(new Error("websocket error"));
  });

  ws.addEventListener("close", (ev: CloseEvent) => {
    opts.onClose?.(ev.code, ev.reason);
  });

  return {
    socket: ws,
    close() {
      try {
        ws.close();
      } catch {
        // ignore
      }
    },
  };
}

export type { Event, EventChannel } from "./types.ts";
