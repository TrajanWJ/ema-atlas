import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { DEFAULT_SERVER_PORT, DATABASE_DIR, DATABASE_FILE } from "@claudeforge/shared";
import { Persistence } from "./persistence.js";
import { SessionManager } from "./session-manager.js";
import { ProjectManager } from "./project-manager.js";
import { WsServer } from "./websocket-server.js";
import { createRouter } from "./rest-api.js";

// ─── Config ─────────────────────────────────────────────────

const PORT = parseInt(process.env.SERVER_PORT ?? "") || DEFAULT_SERVER_PORT;
const DATA_DIR = process.env.DATA_DIR ?? join(process.env.HOME ?? ".", DATABASE_DIR);
const DB_PATH = join(DATA_DIR, DATABASE_FILE);

// ─── Init ───────────────────────────────────────────────────

mkdirSync(DATA_DIR, { recursive: true });
const db = new Persistence(DB_PATH);
const sessions = new SessionManager(db);
const projects = new ProjectManager(db, sessions);

// ─── Express + HTTP ─────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());
app.use(createRouter(db, sessions, projects));

const server = createServer(app);

// ─── WebSocket ──────────────────────────────────────────────

const ws = new WsServer(server);

// Wire session events → WebSocket broadcasts
sessions.on("session.created", (session) => {
  ws.broadcast({ type: "session.created", session });
});

sessions.on("session.output", (sessionId, data) => {
  ws.broadcast({ type: "session.output", sessionId, data });
});

sessions.on("session.status", (sessionId, status) => {
  ws.broadcast({ type: "session.status", sessionId, status });
});

sessions.on("session.closed", (sessionId) => {
  ws.broadcast({ type: "session.closed", sessionId });
});

sessions.on("message.created", (message) => {
  ws.broadcast({ type: "message.created", message });
});

projects.on("project.created", (project) => {
  ws.broadcast({ type: "project.created", project });
});

projects.on("project.updated", (project) => {
  ws.broadcast({ type: "project.updated", project });
});

// Handle commands from web UI
ws.onCommand = async (command) => {
  try {
    switch (command.type) {
      case "session.message":
        await sessions.sendMessage(command.sessionId, command.content);
        break;
      case "session.create":
        // Find or create project for directory, then create session
        const { project } = await projects.openLocation({
          directory: command.directory,
          sessionName: command.name,
          provider: command.provider as any,
        });
        break;
      case "session.stop":
        sessions.stopSession(command.sessionId);
        break;
      case "session.resume":
        await sessions.resumeSession(command.sessionId);
        break;
      default:
        console.log("[ws] Unknown command:", command.type);
    }
  } catch (err) {
    console.error("[ws] Command error:", err);
  }
};

// ─── Health monitor ─────────────────────────────────────────

setInterval(() => {
  import("node:os").then((os) => {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    ws.broadcast({
      type: "system.health",
      data: {
        cpu: Math.round(os.loadavg()[0] * 100 / cpus.length),
        memory: Math.round(((totalMem - freeMem) / totalMem) * 100),
        disk: 0,
        uptime: os.uptime(),
      },
    });
  });
}, 15_000);

// ─── Start ──────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║           ClaudeForge Server             ║
║──────────────────────────────────────────║
║  REST API:   http://localhost:${PORT}       ║
║  WebSocket:  ws://localhost:${PORT}/ws      ║
║  Database:   ${DB_PATH}
║  Sessions:   ${sessions.getActive().length} active                  ║
╚══════════════════════════════════════════╝
`);
});

// ─── Exports for bot/web to import ──────────────────────────

export { db, sessions, projects, ws, server };
export type { Persistence } from "./persistence.js";
export type { SessionManager } from "./session-manager.js";
export type { ProjectManager } from "./project-manager.js";
export type { WsServer } from "./websocket-server.js";
export { classify, checkSafety, executeShell, buildContext, enhancePrompt } from "./interpreter.js";
