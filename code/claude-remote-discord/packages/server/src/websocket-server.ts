import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { Server as HttpServer } from "node:http";
import type { ServerEvent, ClientCommand } from "@claudeforge/shared";
import { DEFAULT_WS_PATH } from "@claudeforge/shared";

export class WsServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(server: HttpServer, path = DEFAULT_WS_PATH) {
    this.wss = new WebSocketServer({ server, path });
    this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
  }

  /** Broadcast event to all connected clients */
  broadcast(event: ServerEvent): void {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /** Handler for incoming commands — call this to register a callback */
  onCommand: ((command: ClientCommand, ws: WebSocket) => void) | null = null;

  private handleConnection(ws: WebSocket, _req: IncomingMessage): void {
    this.clients.add(ws);
    console.log(`[ws] Client connected (${this.clients.size} total)`);

    ws.on("message", (raw) => {
      try {
        const command = JSON.parse(raw.toString()) as ClientCommand;
        this.onCommand?.(command, ws);
      } catch (err) {
        console.error("[ws] Invalid message:", err);
      }
    });

    ws.on("close", () => {
      this.clients.delete(ws);
      console.log(`[ws] Client disconnected (${this.clients.size} total)`);
    });

    ws.on("error", (err) => {
      console.error("[ws] Client error:", err);
      this.clients.delete(ws);
    });
  }

  get clientCount(): number {
    return this.clients.size;
  }

  close(): void {
    this.wss.close();
  }
}
