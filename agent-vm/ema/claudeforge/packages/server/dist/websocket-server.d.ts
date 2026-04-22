import { WebSocket } from "ws";
import type { Server as HttpServer } from "node:http";
import type { ServerEvent, ClientCommand } from "@claudeforge/shared";
export declare class WsServer {
    private wss;
    private clients;
    constructor(server: HttpServer, path?: string);
    /** Broadcast event to all connected clients */
    broadcast(event: ServerEvent): void;
    /** Handler for incoming commands — call this to register a callback */
    onCommand: ((command: ClientCommand, ws: WebSocket) => void) | null;
    private handleConnection;
    get clientCount(): number;
    close(): void;
}
//# sourceMappingURL=websocket-server.d.ts.map