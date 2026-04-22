// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Gateway Client (Framed WS Protocol)
// Stolen from OpenClaw's gateway.ts pattern
// ═══════════════════════════════════════════════════════════

type RequestFrame = { type: "req"; id: string; method: string; params?: unknown };
type ResponseFrame = { type: "res"; id: string; ok: boolean; payload?: unknown; error?: { code?: string; message: string } };
type EventFrame = { type: "event"; event: string; payload?: unknown; seq?: number };
type Frame = RequestFrame | ResponseFrame | EventFrame;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  method: string;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";
export type EventHandler = (event: string, payload: unknown) => void;

export interface GatewayClientOptions {
  url: string;
  token?: string;
  onStatus?: (status: ConnectionStatus) => void;
  onEvent?: EventHandler;
  requestTimeoutMs?: number;
}

let _idCounter = 0;
function nextId(): string {
  return `r${Date.now().toString(36)}-${(++_idCounter).toString(36)}`;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 800;
  private lastSeq = -1;
  private opts: Required<GatewayClientOptions>;

  status: ConnectionStatus = "disconnected";

  constructor(opts: GatewayClientOptions) {
    this.opts = {
      url: opts.url,
      token: opts.token ?? "",
      onStatus: opts.onStatus ?? (() => {}),
      onEvent: opts.onEvent ?? (() => {}),
      requestTimeoutMs: opts.requestTimeoutMs ?? 30_000,
    };
  }

  connect(): void {
    this.disconnect();
    this.setStatus("connecting");
    const wsUrl = this.opts.url.replace(/^http/, "ws");
    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 800;
      this.setStatus("connected");
      // Send auth if token is set
      if (this.opts.token) {
        this.ws?.send(JSON.stringify({ type: "auth", token: this.opts.token }));
      }
    };

    this.ws.onmessage = (ev) => {
      try {
        const frame: Frame = JSON.parse(ev.data);
        this.handleFrame(frame);
      } catch { /* ignore parse errors */ }
    };

    this.ws.onclose = () => {
      this.setStatus("disconnected");
      this.rejectAllPending("Connection closed");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.rejectAllPending("Disconnected");
    this.setStatus("disconnected");
  }

  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    // If WS is connected, use framed protocol
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.wsRequest<T>(method, params);
    }
    // Fallback: HTTP REST
    return this.httpRequest<T>(method, params);
  }

  /** Send a raw message (backward compat with old bridge format) */
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // ── HTTP Fallback ──────────────────────────────────────

  private async httpRequest<T>(method: string, params?: unknown): Promise<T> {
    // Map method names to REST endpoints
    const [resource, action] = method.split(".");
    const baseUrl = this.opts.url.replace(/^ws/, "http");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.opts.token) headers["Authorization"] = `Bearer ${this.opts.token}`;

    // Simple method → endpoint mapping
    const p = params as Record<string, unknown> | undefined;
    let url: string;
    let fetchOpts: RequestInit = { headers };

    switch (method) {
      case "feed.list":
        url = `${baseUrl}/api/feed?limit=${(p?.limit as number) ?? 50}`;
        break;
      case "channels.list":
        url = `${baseUrl}/api/channels`;
        break;
      case "channels.messages":
        url = `${baseUrl}/api/channels/${p?.channelId}/messages?limit=${(p?.limit as number) ?? 50}`;
        break;
      case "channels.send":
        url = `${baseUrl}/api/channels/${p?.channelId}/messages`;
        fetchOpts = { ...fetchOpts, method: "POST", body: JSON.stringify({ message: p?.message, reply_to: p?.replyTo }) };
        break;
      case "proposals.list":
        url = `${baseUrl}/api/proposals?status=${(p?.status as string) ?? "all"}&enrich=true`;
        break;
      case "proposals.resolve":
        url = `${baseUrl}/api/proposals/${p?.id}/resolve`;
        fetchOpts = { ...fetchOpts, method: "POST", body: JSON.stringify({ action: p?.action, option: p?.option }) };
        break;
      case "queue.list":
        url = `${baseUrl}/api/queue`;
        break;
      case "tasks.list":
        url = `${baseUrl}/api/tasks/all`;
        break;
      case "tasks.create":
        url = `${baseUrl}/api/dispatch/task`;
        fetchOpts = { ...fetchOpts, method: "POST", body: JSON.stringify(p) };
        break;
      case "agents.list":
        url = `${baseUrl}/api/agents`;
        break;
      case "agents.detail":
        url = `${baseUrl}/api/agents/${p?.id}`;
        break;
      case "agents.activity":
        url = `${baseUrl}/api/agents/${p?.id}/activity`;
        break;
      case "vault.search":
        url = `${baseUrl}/api/vault/search?q=${encodeURIComponent(p?.query as string ?? "")}&limit=${(p?.limit as number) ?? 10}`;
        break;
      case "vault.note":
        url = `${baseUrl}/api/vault/note?path=${encodeURIComponent(p?.path as string ?? "")}`;
        break;
      case "vault.recent":
        url = `${baseUrl}/api/vault/recent?limit=${(p?.limit as number) ?? 20}`;
        break;
      case "vault.stats":
        url = `${baseUrl}/api/vault/stats`;
        break;
      case "vault.graph":
        url = `${baseUrl}/api/vault/graph?limit=${(p?.limit as number) ?? 100}`;
        break;
      case "vault.tags":
        url = `${baseUrl}/api/vault/tags`;
        break;
      case "vault.folders":
        url = `${baseUrl}/api/vault/folders`;
        break;
      case "system.overview":
        url = `${baseUrl}/api/system/overview`;
        break;
      case "system.services":
        url = `${baseUrl}/api/system/services`;
        break;
      case "system.agents":
        url = `${baseUrl}/api/system/agents`;
        break;
      case "system.crons":
        url = `${baseUrl}/api/system/crons`;
        break;
      case "system.logs":
        url = `${baseUrl}/api/system/logs?service=${p?.service ?? ""}&lines=${(p?.lines as number) ?? 50}`;
        break;
      case "system.processes":
        url = `${baseUrl}/api/system/processes`;
        break;
      case "plans.list":
        url = `${baseUrl}/api/plans`;
        break;
      case "plans.detail":
        url = `${baseUrl}/api/plans/${p?.id}`;
        break;
      case "plans.createTask":
        url = `${baseUrl}/api/plans/${p?.planId}/tasks`;
        fetchOpts = { ...fetchOpts, method: "POST", body: JSON.stringify(p) };
        break;
      case "plans.updateTask":
        url = `${baseUrl}/api/plans/${p?.planId}/tasks/${p?.taskId}`;
        fetchOpts = { ...fetchOpts, method: "PUT", body: JSON.stringify(p) };
        break;
      case "missions.list":
        url = `${baseUrl}/api/missions`;
        break;
      case "missions.detail":
        url = `${baseUrl}/api/missions/${p?.id}`;
        break;
      case "projects.list":
        url = `${baseUrl}/api/projects`;
        break;
      case "stream.list":
        url = `${baseUrl}/api/stream?limit=${(p?.limit as number) ?? 50}`;
        break;
      case "timeline.list":
        url = `${baseUrl}/api/timeline?limit=${(p?.limit as number) ?? 100}`;
        break;
      default:
        url = `${baseUrl}/api/${resource}${action ? "/" + action : ""}`;
        if (p) {
          fetchOpts = { ...fetchOpts, method: "POST", body: JSON.stringify(p) };
        }
    }

    const resp = await fetch(url, fetchOpts);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<T>;
  }

  // ── WS Framed Protocol ─────────────────────────────────

  private wsRequest<T>(method: string, params?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = nextId();
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.opts.requestTimeoutMs);

      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer, method });
      this.ws!.send(JSON.stringify({ type: "req", id, method, params } satisfies RequestFrame));
    });
  }

  private handleFrame(frame: Frame): void {
    switch (frame.type) {
      case "res": {
        const req = this.pending.get(frame.id);
        if (req) {
          this.pending.delete(frame.id);
          clearTimeout(req.timer);
          if (frame.ok) {
            req.resolve(frame.payload);
          } else {
            req.reject(new Error(frame.error?.message ?? "Unknown error"));
          }
        }
        break;
      }
      case "event": {
        // Gap detection
        if (frame.seq !== undefined && this.lastSeq >= 0 && frame.seq > this.lastSeq + 1) {
          console.warn(`[gateway] Event gap: expected seq ${this.lastSeq + 1}, got ${frame.seq}`);
        }
        if (frame.seq !== undefined) this.lastSeq = frame.seq;
        this.opts.onEvent(frame.event, frame.payload);
        break;
      }
      default: {
        // Legacy format: { type: "message"|"feed"|"queue"|..., data: ... }
        const legacy = frame as unknown as { type: string; data?: unknown; channel?: string };
        if (legacy.type && legacy.type !== "req" && legacy.type !== "res" && legacy.type !== "event") {
          this.opts.onEvent(legacy.type, legacy);
        }
      }
    }
  }

  // ── Internal ───────────────────────────────────────────

  private setStatus(s: ConnectionStatus): void {
    this.status = s;
    this.opts.onStatus(s);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 15_000);
  }

  private rejectAllPending(reason: string): void {
    for (const [id, req] of this.pending) {
      clearTimeout(req.timer);
      req.reject(new Error(reason));
      this.pending.delete(id);
    }
  }
}
