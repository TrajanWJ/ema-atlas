"use client";

import { create } from "zustand";

// ─── Gateway WS protocol frame types ─────────────────────────────────────────

interface GatewayReq {
  type: "req";
  id: string;
  method: string;
  params: unknown;
}

interface GatewayRes {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: unknown;
}

interface GatewayEvent {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
}

type GatewayFrame = GatewayReq | GatewayRes | GatewayEvent;

// ─── Chat types ──────────────────────────────────────────────────────────────

interface ChatSendParams {
  sessionKey: string;
  message: string;
  agentId?: string;
  idempotencyKey?: string;
  thinking?: string;
}

interface ChatSendResult {
  runId: string;
  status: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface GatewayStore {
  connected: boolean;
  protocol: number | null;
  connecting: boolean;

  _pending: Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>;
  _ws: WebSocket | null;
  _reqCounter: number;
  _listeners: Map<string, Set<(payload: unknown) => void>>;
  _reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  connect: () => Promise<void>;
  disconnect: () => void;
  call: (method: string, params: unknown) => Promise<unknown>;
  on: (event: string, cb: (payload: unknown) => void) => () => void;

  chatSend: (params: ChatSendParams) => Promise<ChatSendResult>;
  chatHistory: (sessionKey: string) => Promise<unknown[]>;
  chatAbort: (sessionKey: string) => Promise<void>;
}

const CONNECT_TIMEOUT = 10_000;
const CALL_TIMEOUT = 30_000;

export const useGatewayStore = create<GatewayStore>((set, get) => ({
  connected: false,
  protocol: null,
  connecting: false,

  _pending: new Map(),
  _ws: null,
  _reqCounter: 0,
  _listeners: new Map(),
  _reconnectTimer: undefined,

  // ── Connect to gateway ──────────────────────────────────────────────────

  connect: async () => {
    const state = get();
    if (state.connected || state.connecting) return;
    if (state._ws?.readyState === WebSocket.OPEN) return;

    set({ connecting: true });

    // Fetch config from server route (token stays server-side)
    let url: string;
    let token: string;
    try {
      const res = await fetch("/api/gateway/config");
      const cfg = (await res.json()) as { url: string; token: string };
      url = cfg.url;
      token = cfg.token;
    } catch {
      set({ connecting: false });
      return;
    }

    if (!token) {
      console.warn("[gateway] No token configured, skipping connect");
      set({ connecting: false });
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        set({ connecting: false });
        reject(new Error("Gateway connect timeout"));
      }, CONNECT_TIMEOUT);

      const ws = new WebSocket(url);
      set({ _ws: ws });

      let handshakeDone = false;

      ws.onopen = () => {
        // Wait for connect.challenge event from server
      };

      ws.onmessage = (event) => {
        let frame: GatewayFrame;
        try {
          frame = JSON.parse(event.data) as GatewayFrame;
        } catch {
          return;
        }

        // ── Phase 1: Handshake ──
        if (!handshakeDone) {
          // Step 2: Receive connect.challenge, send connect request
          if (
            frame.type === "event" &&
            frame.event === "connect.challenge"
          ) {
            const connectReq: GatewayReq = {
              type: "req",
              id: "init-1",
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "frontend-layer",
                  version: "1.0.0",
                  platform: "web",
                  mode: "operator",
                },
                role: "operator",
                scopes: ["operator.read", "operator.write"],
                caps: [],
                commands: [],
                permissions: {},
                auth: { token },
                locale: "en-US",
                userAgent: "frontend-layer/1.0.0",
                device: { id: "frontend-layer-web" },
              },
            };
            ws.send(JSON.stringify(connectReq));
            return;
          }

          // Step 4: Receive hello-ok response
          if (
            frame.type === "res" &&
            frame.id === "init-1" &&
            (frame as GatewayRes).ok
          ) {
            const payload = (frame as GatewayRes).payload as
              | { type?: string; protocol?: number }
              | undefined;
            handshakeDone = true;
            clearTimeout(timeout);
            set({
              connected: true,
              connecting: false,
              protocol: payload?.protocol ?? 3,
            });
            resolve();
            return;
          }

          // Handshake failure
          if (frame.type === "res" && frame.id === "init-1" && !(frame as GatewayRes).ok) {
            clearTimeout(timeout);
            ws.close();
            set({ connecting: false });
            reject(new Error(`Gateway handshake failed: ${JSON.stringify((frame as GatewayRes).error)}`));
            return;
          }

          return; // Ignore other frames during handshake
        }

        // ── Phase 2: Normal operation ──

        // Handle responses to pending requests
        if (frame.type === "res") {
          const res = frame as GatewayRes;
          const pending = get()._pending.get(res.id);
          if (pending) {
            get()._pending.delete(res.id);
            if (res.ok) {
              pending.resolve(res.payload);
            } else {
              pending.reject(res.error);
            }
          }
          return;
        }

        // Handle server push events
        if (frame.type === "event") {
          const evt = frame as GatewayEvent;
          const listeners = get()._listeners.get(evt.event);
          if (listeners) {
            for (const cb of listeners) {
              try {
                cb(evt.payload);
              } catch (e) {
                console.error("[gateway] event listener error:", e);
              }
            }
          }
        }
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        const wasConnected = get().connected;
        // Reject all pending requests
        for (const [, p] of get()._pending) {
          p.reject(new Error("WebSocket closed"));
        }
        set({
          connected: false,
          connecting: false,
          protocol: null,
          _ws: null,
          _pending: new Map(),
        });
        if (!handshakeDone) {
          reject(new Error("WebSocket closed before handshake"));
        }
        // Auto-reconnect if was previously connected
        if (wasConnected) {
          const timer = setTimeout(() => {
            get().connect().catch(() => {});
          }, 3000);
          set({ _reconnectTimer: timer });
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    });
  },

  // ── Disconnect ──────────────────────────────────────────────────────────

  disconnect: () => {
    const { _ws, _reconnectTimer, _pending } = get();
    clearTimeout(_reconnectTimer);
    for (const [, p] of _pending) {
      p.reject(new Error("Disconnected"));
    }
    _ws?.close();
    set({
      _ws: null,
      connected: false,
      connecting: false,
      protocol: null,
      _pending: new Map(),
      _reconnectTimer: undefined,
    });
  },

  // ── Low-level RPC call ──────────────────────────────────────────────────

  call: (method: string, params: unknown): Promise<unknown> => {
    const { _ws, connected } = get();
    if (!connected || !_ws || _ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Gateway not connected"));
    }

    const counter = get()._reqCounter + 1;
    set({ _reqCounter: counter });
    const id = `req-${counter}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        get()._pending.delete(id);
        reject(new Error(`Gateway call timeout: ${method}`));
      }, CALL_TIMEOUT);

      get()._pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });

      const req: GatewayReq = { type: "req", id, method, params };
      _ws.send(JSON.stringify(req));
    });
  },

  // ── Event subscription ──────────────────────────────────────────────────

  on: (event: string, cb: (payload: unknown) => void) => {
    const listeners = get()._listeners;
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(cb);

    // Return unsubscribe function
    return () => {
      const set = get()._listeners.get(event);
      if (set) {
        set.delete(cb);
        if (set.size === 0) {
          get()._listeners.delete(event);
        }
      }
    };
  },

  // ── High-level chat methods ─────────────────────────────────────────────

  chatSend: async (params: ChatSendParams): Promise<ChatSendResult> => {
    const result = await get().call("chat.send", params);
    return result as ChatSendResult;
  },

  chatHistory: async (sessionKey: string): Promise<unknown[]> => {
    const result = await get().call("chat.history", { sessionKey });
    return (result as unknown[]) ?? [];
  },

  chatAbort: async (sessionKey: string): Promise<void> => {
    await get().call("chat.abort", { sessionKey });
  },
}));
