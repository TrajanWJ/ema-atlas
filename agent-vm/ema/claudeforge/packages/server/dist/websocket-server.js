import { WebSocketServer, WebSocket } from "ws";
import { DEFAULT_WS_PATH } from "@claudeforge/shared";
export class WsServer {
    wss;
    clients = new Set();
    constructor(server, path = DEFAULT_WS_PATH) {
        this.wss = new WebSocketServer({ server, path });
        this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
    }
    /** Broadcast event to all connected clients */
    broadcast(event) {
        const data = JSON.stringify(event);
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    }
    /** Handler for incoming commands — call this to register a callback */
    onCommand = null;
    handleConnection(ws, _req) {
        this.clients.add(ws);
        console.log(`[ws] Client connected (${this.clients.size} total)`);
        ws.on("message", (raw) => {
            try {
                const command = JSON.parse(raw.toString());
                this.onCommand?.(command, ws);
            }
            catch (err) {
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
    get clientCount() {
        return this.clients.size;
    }
    close() {
        this.wss.close();
    }
}
//# sourceMappingURL=websocket-server.js.map