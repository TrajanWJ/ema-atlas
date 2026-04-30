/**
 * Surface → daemon WebSocket client.
 *
 * Protocol: packages/contracts/ipc/shell-protocol.md (v0).
 *
 * This is the single place that knows how to speak EMA's IPC. Surfaces
 * use the higher-level hooks in `@ema/web` (useProjection, useCommand,
 * useIpcConnection) rather than calling methods directly.
 */

export type SurfaceKind = "web" | "desktop";

export type IpcClientOptions = {
  url: string;
  surface: SurfaceKind;
};

export type CommandResult =
  | { ok: true; event_ids: string[]; [key: string]: unknown }
  | { ok: false; error: { class: string; message: string } };

export type ProjectionListener<T> = (data: T | null) => void;
export type ChannelListener = (event: Record<string, unknown>) => void;

export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "offline"
  | "reconnecting";

export type ConnectionListener = (state: ConnectionState) => void;

export interface IpcClient {
  connect(): void;
  disconnect(): void;
  sendCommand(op: string, args: Record<string, unknown>): Promise<CommandResult>;
  subscribeProjection<T = unknown>(
    name: string,
    listener: ProjectionListener<T>,
  ): () => void;
  subscribeChannel(channel: string, listener: ChannelListener): () => void;
  subscribeConnection(listener: ConnectionListener): () => void;
  getConnectionState(): ConnectionState;
}

const RECONNECT_BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];
const PING_INTERVAL_MS = 10_000;
const PONG_TIMEOUT_MS = 15_000;
const COMMAND_TIMEOUT_MS = 10_000;

/**
 * Create an IPC client. Not connected until `.connect()` is called.
 */
export function createIpcClient(options: IpcClientOptions): IpcClient {
  const projectionListeners = new Map<string, Set<ProjectionListener<any>>>();
  const channelListeners = new Map<string, Set<ChannelListener>>();
  const connectionListeners = new Set<ConnectionListener>();
  const pending = new Map<
    string,
    {
      resolve: (result: CommandResult) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  const queuedSubscribes = new Set<string>();
  let socket: WebSocket | null = null;
  let manuallyClosed = false;
  let helloAcked = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;
  let connectionState: ConnectionState = "idle";

  return {
    connect() {
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
      manuallyClosed = false;
      clearReconnectTimer();
      openSocket();
    },
    disconnect() {
      manuallyClosed = true;
      clearReconnectTimer();
      stopKeepalive();
      failPending("ipc client disconnected");
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      socket = null;
      helloAcked = false;
      reconnectAttempts = 0;
      setConnectionState("offline");
    },
    async sendCommand(op: string, args: Record<string, unknown>): Promise<CommandResult> {
      if (!socket || socket.readyState !== WebSocket.OPEN || !helloAcked) {
        return {
          ok: false,
          error: {
            class: "unavailable",
            message: helloAcked ? "not connected" : "ipc not ready (handshake pending)",
          },
        };
      }
      const id = messageId("cmd");
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve({
            ok: false,
            error: { class: "unavailable", message: `command timed out: ${op}` },
          });
        }, COMMAND_TIMEOUT_MS);
        pending.set(id, { resolve, reject, timer });
        sendRaw({ v: 0, id, type: "command", op, args });
      });
    },
    subscribeProjection<T>(name: string, listener: ProjectionListener<T>) {
      if (!projectionListeners.has(name)) projectionListeners.set(name, new Set());
      const set = projectionListeners.get(name)!;
      set.add(listener as ProjectionListener<any>);
      listener(null);
      ensureSubscribed(name);
      return () => {
        set.delete(listener as ProjectionListener<any>);
        if (set.size === 0 && !channelListeners.has(name)) {
          projectionListeners.delete(name);
          maybeUnsubscribe(name);
        }
      };
    },
    subscribeChannel(channel: string, listener: ChannelListener) {
      if (!channelListeners.has(channel)) channelListeners.set(channel, new Set());
      const set = channelListeners.get(channel)!;
      set.add(listener);
      ensureSubscribed(channel);
      return () => {
        set.delete(listener);
        if (set.size === 0 && !projectionListeners.has(channel)) {
          channelListeners.delete(channel);
          maybeUnsubscribe(channel);
        }
      };
    },
    subscribeConnection(listener: ConnectionListener) {
      connectionListeners.add(listener);
      listener(connectionState);
      return () => {
        connectionListeners.delete(listener);
      };
    },
    getConnectionState() {
      return connectionState;
    },
  };

  function openSocket() {
    setConnectionState("connecting");
    helloAcked = false;
    const ws = new WebSocket(options.url);
    socket = ws;
    ws.addEventListener("open", () => {
      if (socket !== ws) return;
      sendRaw({
        v: 0,
        id: messageId("hello"),
        type: "hello",
        surface: options.surface,
        device_id: null,
      });
      // Subscribes wait for hello-ack — see handleMessage.
    });
    ws.addEventListener("message", (event) => {
      if (socket !== ws) return;
      if (typeof event.data !== "string") return;
      handleMessage(event.data);
    });
    ws.addEventListener("close", () => {
      if (socket !== ws) return;
      socket = null;
      helloAcked = false;
      stopKeepalive();
      failPending("ipc socket closed");
      notifyOffline();
      if (manuallyClosed) {
        setConnectionState("offline");
        return;
      }
      scheduleReconnect();
    });
    ws.addEventListener("error", () => {
      if (socket !== ws) return;
      // Don't fail pending here — the close handler is the single source
      // of truth for socket lifecycle. WS error events are advisory.
    });
  }

  function scheduleReconnect() {
    setConnectionState("reconnecting");
    const idx = Math.min(reconnectAttempts, RECONNECT_BACKOFF_MS.length - 1);
    const delay = RECONNECT_BACKOFF_MS[idx];
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (manuallyClosed) return;
      openSocket();
    }, delay);
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function startKeepalive() {
    stopKeepalive();
    pingTimer = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      sendRaw({ v: 0, id: messageId("ping"), type: "ping" });
      if (pongTimer) clearTimeout(pongTimer);
      pongTimer = setTimeout(() => {
        // No pong in time — treat connection as dead. Closing triggers
        // the reconnect path via the close handler.
        if (socket && socket.readyState !== WebSocket.CLOSED) {
          socket.close();
        }
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }

  function stopKeepalive() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    if (pongTimer) {
      clearTimeout(pongTimer);
      pongTimer = null;
    }
  }

  function ensureSubscribed(name: string) {
    if (!helloAcked || !socket || socket.readyState !== WebSocket.OPEN) {
      queuedSubscribes.add(name);
      return;
    }
    sendRaw({ v: 0, id: messageId("sub"), type: "subscribe", channel: name });
  }

  function maybeUnsubscribe(name: string) {
    queuedSubscribes.delete(name);
    if (helloAcked && socket && socket.readyState === WebSocket.OPEN) {
      sendRaw({
        v: 0,
        id: messageId("unsub"),
        type: "unsubscribe",
        channel: name,
      });
    }
  }

  function flushQueuedSubscribes() {
    if (!helloAcked || !socket || socket.readyState !== WebSocket.OPEN) return;
    // Re-issue every active subscription on (re)connect — protocol §Reconnect
    // says the client must resubscribe; the daemon replies with a fresh snapshot.
    const all = new Set<string>([
      ...projectionListeners.keys(),
      ...channelListeners.keys(),
      ...queuedSubscribes,
    ]);
    queuedSubscribes.clear();
    for (const name of all) {
      sendRaw({ v: 0, id: messageId("sub"), type: "subscribe", channel: name });
    }
  }

  function sendRaw(frame: Record<string, unknown>) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(frame));
  }

  function handleMessage(raw: string) {
    let msg: Record<string, any>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "hello") {
      // Server's hello reply (per protocol §Handshake). Marks the
      // connection as fully ready; flush queued subscribes and start
      // keepalive.
      helloAcked = true;
      reconnectAttempts = 0;
      flushQueuedSubscribes();
      startKeepalive();
      setConnectionState("open");
      return;
    }

    if (msg.type === "ping") {
      sendRaw({ v: 0, id: messageId("pong"), type: "pong", in_reply_to: msg.id });
      return;
    }

    if (msg.type === "pong") {
      if (pongTimer) {
        clearTimeout(pongTimer);
        pongTimer = null;
      }
      return;
    }

    if (msg.type === "command_result") {
      resolveCommand(msg);
      return;
    }

    if (msg.type === "projection" && typeof msg.name === "string") {
      const set = projectionListeners.get(msg.name);
      if (!set) return;
      for (const listener of set) listener(msg.data ?? null);
      return;
    }

    if (msg.type === "event" && typeof msg.channel === "string") {
      const set = channelListeners.get(msg.channel);
      if (!set) return;
      const event = (msg.event ?? msg) as Record<string, unknown>;
      for (const listener of set) listener(event);
      return;
    }

    if (msg.type === "subscription_dropped" && typeof msg.channel === "string") {
      // Backpressure-driven drop. Per protocol the client should
      // re-subscribe; the resulting fresh snapshot is equivalent to
      // having received every delta.
      const name = msg.channel;
      if (projectionListeners.has(name) || channelListeners.has(name)) {
        ensureSubscribed(name);
      }
    }
  }

  function resolveCommand(msg: Record<string, any>) {
    const replyId = typeof msg.in_reply_to === "string" ? msg.in_reply_to : "";
    const waiter = pending.get(replyId);
    if (!waiter) return;

    pending.delete(replyId);
    clearTimeout(waiter.timer);
    if (msg.ok === true) {
      const eventIds = Array.isArray(msg.event_ids)
        ? msg.event_ids
        : Array.isArray(msg.events)
          ? msg.events
          : [];
      waiter.resolve({ ...msg, ok: true, event_ids: eventIds });
      return;
    }

    const error = normalizeError(msg.error);
    waiter.resolve({ ok: false, error });
  }

  function failPending(message: string) {
    for (const [, waiter] of pending) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error(message));
    }
    pending.clear();
  }

  function notifyOffline() {
    for (const [, set] of projectionListeners) {
      for (const listener of set) listener(null);
    }
  }

  function setConnectionState(next: ConnectionState) {
    if (connectionState === next) return;
    connectionState = next;
    for (const listener of connectionListeners) listener(next);
  }
}

// Re-export for convenience when imported as @ema/surface-core/ipc-client
export { createIpcClient as default };

function messageId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `msg-${prefix}-${random}`;
}

function normalizeError(value: unknown): { class: string; message: string } {
  if (value && typeof value === "object") {
    const maybe = value as { class?: unknown; message?: unknown };
    return {
      class: typeof maybe.class === "string" ? maybe.class : "internal",
      message: typeof maybe.message === "string" ? maybe.message : "unknown ipc error",
    };
  }
  return { class: "internal", message: "unknown ipc error" };
}
