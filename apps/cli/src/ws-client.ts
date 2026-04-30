// Tiny WebSocket client for the EMA daemon shell-protocol (v0).
// Deliberately stdlib-first; only `ws` is used for the transport.
//
// Protocol: packages/contracts/ipc/shell-protocol.md

import WebSocket, { type RawData } from "ws";

export const DAEMON_URL = process.env.EMA_DAEMON_URL ?? "ws://127.0.0.1:49555";
export const HELLO_TIMEOUT_MS = 5_000;
export const COMMAND_TIMEOUT_MS = 15_000;

export type Surface = "web" | "desktop";

export interface HelloResponse {
  v: 0;
  id: string;
  type: "hello";
  daemon_version: string;
  accepted_device_id: string | null;
  note: string | null;
}

export interface CommandSuccess {
  v: 0;
  type: "command_result";
  in_reply_to: string;
  ok: true;
  events?: string[];
  [extra: string]: unknown; // query commands may carry extra keys (e.g. picker_items)
}

export interface CommandFailure {
  v: 0;
  type: "command_result";
  in_reply_to: string;
  ok: false;
  error: { class: string; message: string };
}

export type CommandResult = CommandSuccess | CommandFailure;

export interface EventEnvelope {
  v: 0;
  type: "event";
  channel: string;
  event: Record<string, unknown>;
}

export interface ProjectionEnvelope {
  v: 0;
  type: "projection";
  name: string;
  data: Record<string, unknown>;
}

export interface SubscriptionDropped {
  v: 0;
  type: "subscription_dropped";
  channel: string;
  reason: string;
}

type AnyMessage =
  | HelloResponse
  | CommandResult
  | EventEnvelope
  | ProjectionEnvelope
  | SubscriptionDropped
  | { v: 0; type: "pong"; in_reply_to: string }
  | { v: 0; type: "ping"; id: string }
  | { v: 0; type: string; [k: string]: unknown };

export type MessageHandler = (msg: AnyMessage) => void;

export class DaemonUnreachableError extends Error {
  constructor(cause: string) {
    super(
      `daemon not reachable at ${DAEMON_URL} (${cause}). ` +
        `Start it with: bash scripts/dev-daemon.sh`
    );
    this.name = "DaemonUnreachableError";
  }
}

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolError";
  }
}

let _counter = 0;
export function nextId(): string {
  // msg-<time36>-<seq>; avoids a ulid dep while keeping messages unique per process.
  _counter += 1;
  return `msg-${Date.now().toString(36)}-${_counter.toString(36)}`;
}

export interface ClientOptions {
  url?: string;
  surface?: Surface;
  deviceId?: string | null;
}

export class Client {
  private ws: WebSocket | null = null;
  private url: string;
  private surface: Surface;
  private deviceId: string | null;
  private pendingCommands = new Map<
    string,
    { resolve: (r: CommandResult) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }
  >();
  private pendingPings = new Map<
    string,
    { sentAt: number; resolve: (rttMs: number) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }
  >();
  private handlers: MessageHandler[] = [];
  private droppedChannels = new Set<string>();
  hello: HelloResponse | null = null;

  constructor(opts: ClientOptions = {}) {
    this.url = opts.url ?? DAEMON_URL;
    this.surface = opts.surface ?? "desktop";
    this.deviceId = opts.deviceId ?? null;
  }

  onMessage(fn: MessageHandler): void {
    this.handlers.push(fn);
  }

  /** Connect + send hello; resolves when server hello comes back. */
  async connect(): Promise<HelloResponse> {
    await this.openSocket();
    return await this.sendHello();
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const onOpen = () => {
        if (settled) return;
        settled = true;
        ws.off("error", onErr);
        ws.on("message", (raw: RawData) => this.handleRaw(raw));
        ws.on("close", () => this.handleClose());
        ws.on("error", (err: Error) => this.handleSocketError(err));
        resolve();
      };

      const onErr = (err: Error) => {
        if (settled) return;
        settled = true;
        ws.off("open", onOpen);
        const code = (err as NodeJS.ErrnoException).code ?? err.message;
        reject(new DaemonUnreachableError(code));
      };

      ws.once("open", onOpen);
      ws.once("error", onErr);
    });
  }

  private sendHello(): Promise<HelloResponse> {
    return new Promise((resolve, reject) => {
      const id = nextId();
      const timer = setTimeout(() => {
        reject(new ProtocolError("hello timed out"));
      }, HELLO_TIMEOUT_MS);
      const handler: MessageHandler = (msg) => {
        if (msg.type === "hello" && (msg as HelloResponse).id === id /* id echo */) {
          clearTimeout(timer);
          this.handlers = this.handlers.filter((h) => h !== handler);
          this.hello = msg as HelloResponse;
          resolve(msg as HelloResponse);
        } else if (msg.type === "hello") {
          // Daemon may not echo our id; accept the first hello we see.
          clearTimeout(timer);
          this.handlers = this.handlers.filter((h) => h !== handler);
          this.hello = msg as HelloResponse;
          resolve(msg as HelloResponse);
        }
      };
      this.handlers.push(handler);
      this.sendRaw({
        v: 0,
        id,
        type: "hello",
        surface: this.surface,
        device_id: this.deviceId,
      });
    });
  }

  /** Send a command, return the daemon's command_result. */
  command(op: string, args: Record<string, unknown> = {}): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new ProtocolError("socket not open"));
        return;
      }
      const id = nextId();
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new ProtocolError(`command ${op} timed out`));
      }, COMMAND_TIMEOUT_MS);
      this.pendingCommands.set(id, { resolve, reject, timer });
      this.sendRaw({ v: 0, id, type: "command", op, args });
    });
  }

  /** Send ping, resolve with RTT ms. */
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new ProtocolError("socket not open"));
        return;
      }
      const id = nextId();
      const sentAt = Date.now();
      const timer = setTimeout(() => {
        this.pendingPings.delete(id);
        reject(new ProtocolError("ping timed out"));
      }, 15_000);
      this.pendingPings.set(id, { sentAt, resolve, reject, timer });
      this.sendRaw({ v: 0, id, type: "ping" });
    });
  }

  subscribe(channel: string, options?: { project_id?: string | null }): void {
    this.droppedChannels.delete(channel);
    const msg: Record<string, unknown> = { v: 0, id: nextId(), type: "subscribe", channel };
    if (options?.project_id) msg.args = { project_id: options.project_id };
    this.sendRaw(msg);
  }

  unsubscribe(channel: string): void {
    this.sendRaw({ v: 0, id: nextId(), type: "unsubscribe", channel });
  }

  isDropped(channel: string): boolean {
    return this.droppedChannels.has(channel);
  }

  close(): void {
    for (const p of this.pendingCommands.values()) clearTimeout(p.timer);
    for (const p of this.pendingPings.values()) clearTimeout(p.timer);
    this.pendingCommands.clear();
    this.pendingPings.clear();
    this.ws?.close();
  }

  private sendRaw(obj: Record<string, unknown>): void {
    this.ws?.send(JSON.stringify(obj));
  }

  private handleRaw(raw: RawData): void {
    let msg: AnyMessage;
    try {
      msg = JSON.parse(raw.toString()) as AnyMessage;
    } catch {
      return; // ignore malformed frames
    }

    // Respond to server-side pings so the daemon keepalive is happy.
    if (msg.type === "ping" && typeof (msg as { id?: string }).id === "string") {
      this.sendRaw({ v: 0, type: "pong", in_reply_to: (msg as { id: string }).id });
      return;
    }

    if (msg.type === "pong") {
      const id = (msg as { in_reply_to?: string }).in_reply_to;
      if (id) {
        const p = this.pendingPings.get(id);
        if (p) {
          clearTimeout(p.timer);
          this.pendingPings.delete(id);
          p.resolve(Date.now() - p.sentAt);
          return;
        }
      }
    }

    if (msg.type === "command_result") {
      const r = msg as CommandResult;
      const p = this.pendingCommands.get(r.in_reply_to);
      if (p) {
        clearTimeout(p.timer);
        this.pendingCommands.delete(r.in_reply_to);
        p.resolve(r);
        return;
      }
    }

    if (msg.type === "subscription_dropped") {
      const d = msg as SubscriptionDropped;
      this.droppedChannels.add(d.channel);
    }

    for (const h of this.handlers) h(msg);
  }

  private handleClose(): void {
    const err = new ProtocolError("connection closed");
    for (const [id, p] of this.pendingCommands) {
      clearTimeout(p.timer);
      p.reject(err);
      this.pendingCommands.delete(id);
    }
    for (const [id, p] of this.pendingPings) {
      clearTimeout(p.timer);
      p.reject(err);
      this.pendingPings.delete(id);
    }
  }

  private handleSocketError(_err: Error): void {
    // Swallow — close handler will flush pending work with a clear error.
  }
}

/** Convenience: connect + hello in one call, mapping connection failures to DaemonUnreachableError. */
export async function connect(opts: ClientOptions = {}): Promise<Client> {
  const c = new Client(opts);
  await c.connect();
  return c;
}
