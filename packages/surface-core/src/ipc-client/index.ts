/**
 * Surface → daemon WebSocket client.
 *
 * Protocol: packages/contracts/ipc/shell-protocol.md (v0).
 *
 * This is the single place that knows how to speak EMA's IPC. Surfaces
 * use the higher-level hooks in `@ema/web` (useProjection, useCommand)
 * rather than calling methods directly.
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

export interface IpcClient {
  connect(): void;
  disconnect(): void;
  sendCommand(op: string, args: Record<string, unknown>): Promise<CommandResult>;
  subscribeProjection<T = unknown>(
    name: string,
    listener: ProjectionListener<T>,
  ): () => void;
}

/**
 * Create an IPC client. Not connected until `.connect()` is called.
 */
export function createIpcClient(options: IpcClientOptions): IpcClient {
  const listeners = new Map<string, Set<ProjectionListener<any>>>();
  const pending = new Map<
    string,
    {
      resolve: (result: CommandResult) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  let socket: WebSocket | null = null;
  let manuallyClosed = false;

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
      socket = new WebSocket(options.url);
      socket.addEventListener("open", () => {
        sendRaw({
          v: 0,
          id: messageId("hello"),
          type: "hello",
          surface: options.surface,
          device_id: null,
        });
        for (const name of listeners.keys()) {
          sendRaw({ v: 0, id: messageId("sub"), type: "subscribe", channel: name });
        }
      });
      socket.addEventListener("message", (event) => {
        if (typeof event.data !== "string") return;
        handleMessage(event.data);
      });
      socket.addEventListener("close", () => {
        socket = null;
        failPending("ipc socket closed");
        notifyOffline();
      });
      socket.addEventListener("error", () => {
        if (manuallyClosed) return;
        failPending("ipc socket error");
      });
    },
    disconnect() {
      manuallyClosed = true;
      failPending("ipc client disconnected");
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      socket = null;
    },
    async sendCommand(op: string, _args: Record<string, unknown>): Promise<CommandResult> {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return { ok: false, error: { class: "internal", message: "not connected" } };
      }
      const id = messageId("cmd");
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve({
            ok: false,
            error: { class: "unavailable", message: `command timed out: ${op}` },
          });
        }, 10_000);
        pending.set(id, { resolve, reject, timer });
        sendRaw({ v: 0, id, type: "command", op, args: _args });
      });
    },
    subscribeProjection<T>(name: string, listener: ProjectionListener<T>) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      const set = listeners.get(name)!;
      set.add(listener as ProjectionListener<any>);
      listener(null);
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendRaw({ v: 0, id: messageId("sub"), type: "subscribe", channel: name });
      }
      return () => {
        set.delete(listener as ProjectionListener<any>);
        if (set.size === 0) {
          listeners.delete(name);
          if (socket && socket.readyState === WebSocket.OPEN) {
            sendRaw({
              v: 0,
              id: messageId("unsub"),
              type: "unsubscribe",
              channel: name,
            });
          }
        }
      };
    },
  };

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

    if (msg.type === "ping") {
      sendRaw({ v: 0, id: messageId("pong"), type: "pong", in_reply_to: msg.id });
      return;
    }

    if (msg.type === "command_result") {
      resolveCommand(msg);
      return;
    }

    if (msg.type === "projection" && typeof msg.name === "string") {
      const set = listeners.get(msg.name);
      if (!set) return;
      for (const listener of set) listener(msg.data ?? null);
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
    for (const [, set] of listeners) {
      for (const listener of set) listener(null);
    }
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
