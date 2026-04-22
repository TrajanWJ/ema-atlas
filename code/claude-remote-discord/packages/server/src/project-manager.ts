import { nanoid } from "nanoid";
import { basename } from "node:path";
import { existsSync } from "node:fs";
import { EventEmitter } from "node:events";
import type { ProjectLocation, OpenLocationRequest } from "@claudeforge/shared";
import { DEFAULT_SESSION_NAME } from "@claudeforge/shared";
import { Persistence } from "./persistence.js";
import { SessionManager } from "./session-manager.js";
import { getProjectPersonality } from "./project-personalities.js";

export class ProjectManager extends EventEmitter {
  constructor(
    private db: Persistence,
    private sessions: SessionManager
  ) {
    super();
  }

  /** Open a directory as a project location */
  async openLocation(req: OpenLocationRequest): Promise<{
    project: ProjectLocation;
    sessionId: string;
  }> {
    // Normalize path
    const directory = req.directory.replace(/\/+$/, "");
    if (!existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`);
    }

    // Check if already open
    let project = this.db.getProjectByDirectory(directory);
    if (project && !project.isArchived) {
      if (!project.personality) {
        const inferredPersonality = getProjectPersonality(project.directory);
        if (inferredPersonality) {
          project.personality = inferredPersonality;
          project.updatedAt = Date.now();
          this.db.upsertProject(project);
        }
      }

      // Already open — just create a new session if requested
      const sessionName = req.sessionName ?? DEFAULT_SESSION_NAME;

      // Check if a session with this name already exists
      const existing = this.db
        .getSessions(project.id)
        .find((s) => s.name === sessionName && s.status !== "stopped");
      if (existing) {
        return { project, sessionId: existing.id };
      }

      const session = await this.sessions.createSession({
        projectId: project.id,
        directory: project.directory,
        projectName: project.name,
        name: sessionName,
        provider: req.provider,
        model: req.model,
        mode: req.mode,
      });

      return { project, sessionId: session.id };
    }

    // Create new project
    const now = Date.now();
    const name = this.formatProjectName(directory);
    project = {
      id: nanoid(12),
      name,
      directory,
      categoryId: null,
      logChannelId: null,
      personality: getProjectPersonality(directory),
      config: {},
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    this.db.upsertProject(project);
    this.db.insertEvent("project.created", "project-manager", { projectId: project.id, directory });
    this.emit("project.created", project);

    // Create default session
    const session = await this.sessions.createSession({
      projectId: project.id,
      directory: project.directory,
      projectName: project.name,
      name: req.sessionName ?? DEFAULT_SESSION_NAME,
      provider: req.provider,
      model: req.model,
      mode: req.mode,
    });

    return { project, sessionId: session.id };
  }

  /** Close/archive a location */
  closeLocation(projectId: string): void {
    const project = this.db.getProject(projectId);
    if (!project) return;

    // Stop all sessions in this project
    const sessions = this.db.getSessions(projectId);
    for (const session of sessions) {
      if (session.status === "active" || session.status === "idle") {
        this.sessions.stopSession(session.id);
      }
    }

    this.db.archiveProject(projectId);
    this.emit("project.archived", project);
  }

  /** Navigate — open if not exists, return if exists */
  async navigate(directory: string): Promise<{
    project: ProjectLocation;
    sessionId: string;
    isNew: boolean;
  }> {
    const existing = this.db.getProjectByDirectory(directory.replace(/\/+$/, ""));
    if (existing && !existing.isArchived) {
      const sessions = this.db.getSessions(existing.id);
      const active = sessions.find((s) => s.status === "active" || s.status === "idle");
      return {
        project: existing,
        sessionId: active?.id ?? sessions[0]?.id ?? "",
        isNew: false,
      };
    }

    const { project, sessionId } = await this.openLocation({ directory });
    return { project, sessionId, isNew: true };
  }

  /** Set project personality/system prompt */
  setPersonality(projectId: string, personality: string): void {
    const project = this.db.getProject(projectId);
    if (!project) return;
    project.personality = personality;
    project.updatedAt = Date.now();
    this.db.upsertProject(project);
    this.emit("project.updated", project);
  }

  /** Merge project config */
  setProjectConfig(projectId: string, config: Record<string, unknown>): void {
    const project = this.db.getProject(projectId);
    if (!project) return;
    project.config = { ...(project.config ?? {}), ...config };
    project.updatedAt = Date.now();
    this.db.upsertProject(project);
    this.emit("project.updated", project);
  }

  /** Bind Discord category to project */
  bindCategory(projectId: string, categoryId: string, logChannelId?: string): void {
    const project = this.db.getProject(projectId);
    if (!project) return;
    project.categoryId = categoryId;
    if (logChannelId) project.logChannelId = logChannelId;
    project.updatedAt = Date.now();
    this.db.upsertProject(project);
  }

  /** Get project by Discord category */
  getByCategory(categoryId: string): ProjectLocation | undefined {
    return this.db.getProjectByCategoryId(categoryId);
  }

  /** List all open projects */
  list(includeArchived = false): ProjectLocation[] {
    return this.db.getProjects(includeArchived);
  }

  /** Get a single project */
  get(projectId: string): ProjectLocation | undefined {
    return this.db.getProject(projectId);
  }

  /** Format directory path as a display name */
  private formatProjectName(directory: string): string {
    // Replace home dir with ~
    const home = process.env.HOME ?? "/home/user";
    let display = directory.replace(home, "~");
    // Truncate to 100 chars (Discord category limit) keeping tail segments
    if (display.length > 100) {
      const parts = display.split("/");
      display = ".../" + parts.slice(-3).join("/");
      if (display.length > 100) {
        display = display.slice(-100);
      }
    }
    return display;
  }
}
