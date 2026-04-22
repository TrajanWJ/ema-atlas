import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ChatMessage,
  ProjectLocation,
  SessionRecord,
  TaskRecord,
} from "@claudeforge/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Persistence {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.init();
  }

  private init() {
    const schemaPath = join(__dirname, "..", "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    this.db.exec(schema);
  }

  // ─── Projects ───────────────────────────────────────────

  getProjects(includeArchived = false): ProjectLocation[] {
    const where = includeArchived ? "" : "WHERE is_archived = 0";
    return this.db
      .prepare(`SELECT * FROM projects ${where} ORDER BY updated_at DESC`)
      .all()
      .map(this.mapProject);
  }

  getProject(id: string): ProjectLocation | undefined {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return row ? this.mapProject(row) : undefined;
  }

  getProjectByDirectory(directory: string): ProjectLocation | undefined {
    const row = this.db.prepare("SELECT * FROM projects WHERE directory = ?").get(directory);
    return row ? this.mapProject(row) : undefined;
  }

  getProjectByCategoryId(categoryId: string): ProjectLocation | undefined {
    const row = this.db.prepare("SELECT * FROM projects WHERE category_id = ?").get(categoryId);
    return row ? this.mapProject(row) : undefined;
  }

  upsertProject(project: ProjectLocation): void {
    this.db
      .prepare(
        `INSERT INTO projects (id, name, directory, category_id, log_channel_id, personality, config, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           directory = excluded.directory,
           category_id = excluded.category_id,
           log_channel_id = excluded.log_channel_id,
           personality = excluded.personality,
           config = excluded.config,
           is_archived = excluded.is_archived,
           updated_at = excluded.updated_at`
      )
      .run(
        project.id,
        project.name,
        project.directory,
        project.categoryId ?? null,
        project.logChannelId ?? null,
        project.personality ?? null,
        JSON.stringify(project.config ?? {}),
        project.isArchived ? 1 : 0,
        project.createdAt,
        project.updatedAt
      );
  }

  archiveProject(id: string): void {
    this.db
      .prepare("UPDATE projects SET is_archived = 1, updated_at = ? WHERE id = ?")
      .run(Date.now(), id);
  }

  // ─── Sessions ───────────────────────────────────────────

  getSessions(projectId?: string): SessionRecord[] {
    if (projectId) {
      return this.db
        .prepare("SELECT * FROM sessions WHERE project_id = ? ORDER BY last_activity DESC")
        .all(projectId)
        .map(this.mapSession);
    }
    return this.db
      .prepare("SELECT * FROM sessions ORDER BY last_activity DESC")
      .all()
      .map(this.mapSession);
  }

  getSession(id: string): SessionRecord | undefined {
    const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
    return row ? this.mapSession(row) : undefined;
  }

  getSessionByChannelId(channelId: string): SessionRecord | undefined {
    const row = this.db.prepare("SELECT * FROM sessions WHERE channel_id = ?").get(channelId);
    return row ? this.mapSession(row) : undefined;
  }

  getActiveSessions(): SessionRecord[] {
    return this.db
      .prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY last_activity DESC")
      .all()
      .map(this.mapSession);
  }

  upsertSession(session: SessionRecord): void {
    this.db
      .prepare(
        `INSERT INTO sessions (id, name, project_id, project_name, directory, channel_id, provider, provider_session_id, tmux_name, model, mode, agent_persona, status, verbose, created_at, last_activity, message_count, total_tokens, total_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           channel_id = excluded.channel_id,
           provider_session_id = excluded.provider_session_id,
           model = excluded.model,
           mode = excluded.mode,
           agent_persona = excluded.agent_persona,
           status = excluded.status,
           verbose = excluded.verbose,
           last_activity = excluded.last_activity,
           message_count = excluded.message_count,
           total_tokens = excluded.total_tokens,
           total_cost = excluded.total_cost`
      )
      .run(
        session.id,
        session.name,
        session.projectId,
        session.projectName,
        session.directory,
        session.channelId ?? null,
        session.provider,
        session.providerSessionId ?? null,
        session.tmuxName,
        session.model ?? null,
        session.mode,
        session.agentPersona ?? null,
        session.status,
        session.verbose ? 1 : 0,
        session.createdAt,
        session.lastActivity,
        session.messageCount,
        session.totalTokens,
        session.totalCost
      );
  }

  updateSessionStatus(id: string, status: SessionRecord["status"]): void {
    this.db
      .prepare("UPDATE sessions SET status = ?, last_activity = ? WHERE id = ?")
      .run(status, Date.now(), id);
  }

  // ─── Messages ───────────────────────────────────────────

  getMessages(sessionId: string, limit = 100, before?: number): ChatMessage[] {
    if (before) {
      return this.db
        .prepare(
          "SELECT * FROM messages WHERE session_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?"
        )
        .all(sessionId, before, limit)
        .reverse()
        .map(this.mapMessage);
    }
    return this.db
      .prepare(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(sessionId, limit)
      .reverse()
      .map(this.mapMessage);
  }

  insertMessage(message: ChatMessage): void {
    this.db
      .prepare(
        "INSERT INTO messages (id, session_id, role, content, tool_call, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        message.id,
        message.sessionId,
        message.role,
        message.content,
        message.toolCall ? JSON.stringify(message.toolCall) : null,
        message.createdAt
      );
    // Bump session message count + activity
    this.db
      .prepare(
        "UPDATE sessions SET message_count = message_count + 1, last_activity = ? WHERE id = ?"
      )
      .run(Date.now(), message.sessionId);
  }

  // ─── Tasks ──────────────────────────────────────────────

  getTasks(status?: string): TaskRecord[] {
    if (status) {
      return this.db
        .prepare("SELECT * FROM tasks WHERE status = ? ORDER BY updated_at DESC")
        .all(status)
        .map(this.mapTask);
    }
    return this.db
      .prepare("SELECT * FROM tasks ORDER BY updated_at DESC")
      .all()
      .map(this.mapTask);
  }

  getTask(id: string): TaskRecord | undefined {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return row ? this.mapTask(row) : undefined;
  }

  upsertTask(task: TaskRecord): void {
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, description, status, priority, agent, session_id, project_name, output, created_at, started_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           status = excluded.status,
           priority = excluded.priority,
           agent = excluded.agent,
           session_id = excluded.session_id,
           project_name = excluded.project_name,
           output = excluded.output,
           started_at = excluded.started_at,
           completed_at = excluded.completed_at,
           updated_at = excluded.updated_at`
      )
      .run(
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.agent ?? null,
        task.sessionId ?? null,
        task.projectName ?? null,
        task.output ?? null,
        task.createdAt,
        task.startedAt ?? null,
        task.completedAt ?? null,
        task.updatedAt
      );
  }

  // ─── Events ─────────────────────────────────────────────

  insertEvent(type: string, source: string, data: unknown): void {
    this.db
      .prepare("INSERT INTO events (type, source, data, timestamp) VALUES (?, ?, ?, ?)")
      .run(type, source, JSON.stringify(data), Date.now());
  }

  getRecentEvents(limit = 50): Array<{ id: number; type: string; source: string; data: unknown; timestamp: number }> {
    return this.db
      .prepare("SELECT * FROM events ORDER BY timestamp DESC LIMIT ?")
      .all(limit)
      .map((row: any) => ({
        ...row,
        data: JSON.parse(row.data || "{}"),
      }));
  }

  // ─── Mappers ────────────────────────────────────────────

  private mapProject = (row: any): ProjectLocation => ({
    id: row.id,
    name: row.name,
    directory: row.directory,
    categoryId: row.category_id,
    logChannelId: row.log_channel_id,
    personality: row.personality,
    config: JSON.parse(row.config || "{}"),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  private mapSession = (row: any): SessionRecord => ({
    id: row.id,
    name: row.name,
    projectId: row.project_id,
    projectName: row.project_name,
    directory: row.directory,
    channelId: row.channel_id,
    provider: row.provider,
    providerSessionId: row.provider_session_id,
    tmuxName: row.tmux_name,
    model: row.model,
    mode: row.mode,
    agentPersona: row.agent_persona,
    status: row.status,
    verbose: Boolean(row.verbose),
    createdAt: row.created_at,
    lastActivity: row.last_activity,
    messageCount: row.message_count,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
  });

  private mapMessage = (row: any): ChatMessage => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    toolCall: row.tool_call ? JSON.parse(row.tool_call) : null,
  });

  private mapTask = (row: any): TaskRecord => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    agent: row.agent,
    sessionId: row.session_id,
    projectName: row.project_name,
    output: row.output,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  });

  close(): void {
    this.db.close();
  }
}
