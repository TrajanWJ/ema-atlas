import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { Server as HttpServer } from "node:http";
import type { ServerEvent, ClientCommand } from "@claudeforge/shared";
import { DEFAULT_WS_PATH } from "@claudeforge/shared";
import { nanoid } from "nanoid";
import { wsAuth } from "./auth.js";

const HEARTBEAT_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const EVENT_BUFFER_SIZE = 500;

export interface ConnectedClient {
  id: string;
  connectedAt: number;
  lastPing: number;
  subscriptions: Set<string>; // session IDs they're watching
}

interface BufferedEvent {
  timestamp: number;
  event: ServerEvent;
}

export class WsServer {
  private wss: WebSocketServer;
  private clients = new Map<WebSocket, ConnectedClient>();
  private apiKey: string | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private eventBuffer: BufferedEvent[] = [];
  private bufferHead = 0; // ring buffer write pointer

  constructor(server: HttpServer, path = DEFAULT_WS_PATH, apiKey?: string) {
    this.apiKey = apiKey;
    this.wss = new WebSocketServer({ server, path });
    this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
    this.startHeartbeat();
  }

  /** Broadcast event to all connected clients (respects subscriptions) */
  broadcast(event: ServerEvent): void {
    this.bufferEvent(event);
    const data = JSON.stringify(event);
    const sessionId = this.extractSessionId(event);

    for (const [ws, client] of this.clients) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      // System events go to all clients
      if (!sessionId) {
        ws.send(data);
        continue;
      }

      // Session-scoped events: send if client has no subscriptions (legacy) or is subscribed
      if (client.subscriptions.size === 0 || client.subscriptions.has(sessionId)) {
        ws.send(data);
      }
    }
  }

  /** Handler for incoming commands — call this to register a callback */
  onCommand: ((command: ClientCommand, ws: WebSocket) => void) | null = null;

  /** Subscribe a client to a session */
  subscribe(ws: WebSocket, sessionId: string): void {
    const client = this.clients.get(ws);
    if (client) {
      client.subscriptions.add(sessionId);
    }
  }

  /** Unsubscribe a client from a session */
  unsubscribe(ws: WebSocket, sessionId: string): void {
    const client = this.clients.get(ws);
    if (client) {
      client.subscriptions.delete(sessionId);
    }
  }

  /** Get info about all connected clients */
  getConnectedClients(): Array<Omit<ConnectedClient, "subscriptions"> & { subscriptions: string[] }> {
    return [...this.clients.values()].map((c) => ({
      id: c.id,
      connectedAt: c.connectedAt,
      lastPing: c.lastPing,
      subscriptions: [...c.subscriptions],
    }));
  }

  /** Replay events since a timestamp for a specific client */
  replayEvents(ws: WebSocket, since: number): void {
    const client = this.clients.get(ws);
    if (!client) return;

    const events = this.getEventsSince(since);
    for (const { event } of events) {
      const sessionId = this.extractSessionId(event);
      // Same subscription filtering as broadcast
      if (!sessionId || client.subscriptions.size === 0 || client.subscriptions.has(sessionId)) {
        ws.send(JSON.stringify(event));
      }
    }
    console.log(`[ws] Replayed ${events.length} events for client ${client.id} (since ${new Date(since).toISOString()})`);
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    // Auth check: token from query string ?token=xxx
    if (this.apiKey) {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      const token = url.searchParams.get("token") ?? undefined;
      if (!wsAuth(this.apiKey, token)) {
        ws.close(4001, "Unauthorized");
        return;
      }
    }

    const client: ConnectedClient = {
      id: nanoid(8),
      connectedAt: Date.now(),
      lastPing: Date.now(),
      subscriptions: new Set(),
    };
    this.clients.set(ws, client);
    console.log(`[ws] Client ${client.id} connected (${this.clients.size} total)`);

    ws.on("message", (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        client.lastPing = Date.now();

        // Handle subscribe/unsubscribe internally
        if (parsed.type === "subscribe" && typeof parsed.sessionId === "string") {
          this.subscribe(ws, parsed.sessionId);
          return;
        }
        if (parsed.type === "unsubscribe" && typeof parsed.sessionId === "string") {
          this.unsubscribe(ws, parsed.sessionId);
          return;
        }

        // Handle replay internally
        if (parsed.type === "replay" && typeof parsed.since === "number") {
          this.replayEvents(ws, parsed.since);
          return;
        }

        // Handle client-level ping (browser WebSocket has no native ping)
        if (parsed.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        this.onCommand?.(parsed as ClientCommand, ws);
      } catch (err) {
        console.error("[ws] Invalid message:", err);
      }
    });

    ws.on("close", (code, reason) => {
      this.clients.delete(ws);
      console.log(`[ws] Client ${client.id} disconnected (code=${code}, reason=${reason.toString() || "none"}, ${this.clients.size} remaining)`);
    });

    ws.on("error", (err) => {
      console.error(`[ws] Client ${client.id} error:`, err);
      this.clients.delete(ws);
    });

    ws.on("pong", () => {
      client.lastPing = Date.now();
    });
  }

  /** Start heartbeat interval — ping all clients every 30s, close unresponsive ones */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const [ws, client] of this.clients) {
        // If no pong received within timeout, terminate
        if (now - client.lastPing > HEARTBEAT_INTERVAL_MS + PONG_TIMEOUT_MS) {
          console.log(`[ws] Client ${client.id} timed out (no pong for ${Math.round((now - client.lastPing) / 1000)}s), terminating`);
          this.clients.delete(ws);
          ws.terminate();
          continue;
        }
        // Send ping
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  /** Store event in ring buffer */
  private bufferEvent(event: ServerEvent): void {
    const entry: BufferedEvent = { timestamp: Date.now(), event };
    if (this.eventBuffer.length < EVENT_BUFFER_SIZE) {
      this.eventBuffer.push(entry);
    } else {
      this.eventBuffer[this.bufferHead] = entry;
    }
    this.bufferHead = (this.bufferHead + 1) % EVENT_BUFFER_SIZE;
  }

  /** Get all buffered events since a timestamp, ordered chronologically */
  private getEventsSince(since: number): BufferedEvent[] {
    return this.eventBuffer
      .filter((e) => e.timestamp > since)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  get clientCount(): number {
    return this.clients.size;
  }

  close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.wss.close();
  }

  /** Extract sessionId from an event for subscription filtering */
  private extractSessionId(event: ServerEvent): string | null {
    switch (event.type) {
      case "session.output":
      case "session.status":
      case "session.closed":
        return event.sessionId;
      case "session.created":
      case "session.updated":
        return event.session.id;
      case "message.created":
        return event.message.sessionId;
      default:
        return null;
    }
  }
}
