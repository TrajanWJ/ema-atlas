import { Router, type Request, type Response } from "express";
import type { Persistence } from "./persistence.js";
import type { SessionManager } from "./session-manager.js";
import type { ProjectManager } from "./project-manager.js";
import type {
  OpenLocationRequest,
  CreateSessionRequest,
  SendMessageRequest,
  CreateTaskRequest,
} from "@claudeforge/shared";
import { nanoid } from "nanoid";
import os from "node:os";

/** Extract a single param value (Express v5 returns string | string[]) */
function param(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

export function createRouter(
  db: Persistence,
  sessions: SessionManager,
  projects: ProjectManager
): Router {
  const router = Router();

  // ─── Projects ───────────────────────────────────────────

  router.get("/api/projects", (_req: Request, res: Response) => {
    const list = projects.list(false);
    res.json(list);
  });

  router.post("/api/projects/open", async (req: Request, res: Response) => {
    try {
      const body = req.body as OpenLocationRequest;
      const result = await projects.openLocation(body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/api/projects/:id/close", (req: Request, res: Response) => {
    projects.closeLocation(param(req, "id"));
    res.json({ ok: true });
  });

  // ─── Sessions ───────────────────────────────────────────

  router.get("/api/sessions", (req: Request, res: Response) => {
    const projectId = String(req.query.projectId ?? "") || undefined;
    res.json(sessions.list(projectId));
  });

  router.get("/api/sessions/active", (_req: Request, res: Response) => {
    res.json(sessions.getActive());
  });

  router.get("/api/sessions/:id", (req: Request, res: Response) => {
    const session = sessions.get(param(req, "id"));
    if (!session) return res.status(404).json({ error: "Not found" });
    res.json(session);
  });

  router.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const body = req.body as CreateSessionRequest;
      const session = await sessions.createSession(body);
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/api/sessions/:id/message", async (req: Request, res: Response) => {
    try {
      const { content } = req.body as { content: string };
      await sessions.sendMessage(param(req, "id"), content);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/api/sessions/:id/stop", (req: Request, res: Response) => {
    sessions.stopSession(param(req, "id"));
    res.json({ ok: true });
  });

  router.post("/api/sessions/:id/resume", async (req: Request, res: Response) => {
    try {
      await sessions.resumeSession(param(req, "id"));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/api/sessions/:id/abort", (req: Request, res: Response) => {
    sessions.abortSession(param(req, "id"));
    res.json({ ok: true });
  });

  // ─── Messages ───────────────────────────────────────────

  router.get("/api/sessions/:id/messages", (req: Request, res: Response) => {
    const limit = parseInt(String(req.query.limit ?? "100")) || 100;
    const before = parseInt(String(req.query.before ?? "")) || undefined;
    res.json(db.getMessages(param(req, "id"), limit, before));
  });

  // ─── Tasks ──────────────────────────────────────────────

  router.get("/api/tasks", (req: Request, res: Response) => {
    const status = String(req.query.status ?? "") || undefined;
    res.json(db.getTasks(status));
  });

  router.post("/api/tasks", (req: Request, res: Response) => {
    const body = req.body as CreateTaskRequest;
    const now = Date.now();
    const task = {
      id: nanoid(12),
      title: body.title,
      description: body.description ?? "",
      status: "backlog" as const,
      priority: body.priority ?? "normal" as const,
      agent: body.agent ?? null,
      sessionId: null,
      projectName: body.projectName ?? null,
      output: null,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
    };
    db.upsertTask(task);
    res.json(task);
  });

  router.patch("/api/tasks/:id", (req: Request, res: Response) => {
    const existing = db.getTask(param(req, "id"));
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = { ...existing, ...req.body, updatedAt: Date.now() };
    db.upsertTask(updated);
    res.json(updated);
  });

  // ─── System ─────────────────────────────────────────────

  router.get("/api/system/health", (_req: Request, res: Response) => {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    res.json({
      cpu: Math.round((1 - os.loadavg()[0] / cpus.length) * 100),
      memory: Math.round(((totalMem - freeMem) / totalMem) * 100),
      disk: 0, // Will be populated by health monitor
      uptime: os.uptime(),
    });
  });

  router.get("/api/system/status", (_req: Request, res: Response) => {
    const allSessions = sessions.list();
    const allTasks = db.getTasks();
    res.json({
      projects: projects.list().length,
      sessions: allSessions.length,
      activeSessions: allSessions.filter((s) => s.status === "active").length,
      tasks: {
        backlog: allTasks.filter((t) => t.status === "backlog").length,
        in_progress: allTasks.filter((t) => t.status === "in_progress").length,
        review: allTasks.filter((t) => t.status === "review").length,
        done: allTasks.filter((t) => t.status === "done").length,
      },
    });
  });

  router.get("/api/events", (req: Request, res: Response) => {
    const limit = parseInt(String(req.query.limit ?? "50")) || 50;
    res.json(db.getRecentEvents(limit));
  });

  return router;
}
