// db.js — SQLite connection for bridge server
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = process.env.DISPATCH_DB || join(process.env.HOME, 'dispatch', 'dispatch.db');
const db = new Database(DB_PATH, { readonly: false });

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Prepared statements for common queries
export const queries = {
  // Tasks
  taskList: db.prepare(`SELECT * FROM tasks WHERE
    (CASE WHEN @status IS NOT NULL THEN status = @status ELSE 1 END) AND
    (CASE WHEN @agent IS NOT NULL THEN agent = @agent ELSE 1 END) AND
    (CASE WHEN @mission_id IS NOT NULL THEN mission_id = @mission_id ELSE 1 END)
    ORDER BY priority ASC, created_at DESC LIMIT @limit OFFSET @offset`),
  taskGet: db.prepare('SELECT * FROM tasks WHERE id = ?'),
  taskCreate: db.prepare(`INSERT INTO tasks (id, title, description, agent, status, priority, source, mission_id, depends_on, timeout_min)
    VALUES (@id, @title, @description, @agent, @status, @priority, @source, @mission_id, @depends_on, @timeout_min)`),
  taskUpdate: db.prepare('UPDATE tasks SET status = @status, completed_at = @completed_at, output = @output, error = @error WHERE id = @id'),
  taskSetActive: db.prepare(`UPDATE tasks SET status = 'active', started_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'), pid = @pid, pid_command = @pid_command, attempts = attempts + 1 WHERE id = @id`),
  taskSetCheckpoint: db.prepare(`UPDATE tasks SET checkpoint = @checkpoint, checkpoint_updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = @id`),
  taskCancel: db.prepare(`UPDATE tasks SET status = 'cancelled', completed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? AND status IN ('queued','active','blocked')`),

  // Feed
  feedList: db.prepare(`SELECT * FROM feed WHERE
    (CASE WHEN @type IS NOT NULL THEN type = @type ELSE 1 END) AND
    (CASE WHEN @agent IS NOT NULL THEN agent = @agent ELSE 1 END)
    ORDER BY timestamp DESC LIMIT @limit OFFSET @offset`),
  feedSince: db.prepare('SELECT * FROM feed WHERE id > ? ORDER BY timestamp ASC'),
  feedInsert: db.prepare(`INSERT INTO feed (id, task_id, agent, type, content, pinned, urgent)
    VALUES (@id, @task_id, @agent, @type, @content, @pinned, @urgent)`),

  // Agents
  agentList: db.prepare('SELECT * FROM agents ORDER BY status DESC, id ASC'),
  agentGet: db.prepare('SELECT * FROM agents WHERE id = ?'),

  // Missions
  missionList: db.prepare('SELECT * FROM missions ORDER BY status ASC, created_at DESC'),
  missionGet: db.prepare('SELECT * FROM missions WHERE id = ?'),
  missionCreate: db.prepare('INSERT INTO missions (id, title, description, goal_id, status) VALUES (@id, @title, @description, @goal_id, @status)'),
  missionTasks: db.prepare('SELECT * FROM tasks WHERE mission_id = ? ORDER BY priority ASC'),

  // Proposals
  proposalList: db.prepare(`SELECT * FROM proposals WHERE
    (CASE WHEN @status IS NOT NULL THEN status = @status ELSE 1 END)
    ORDER BY created_at DESC LIMIT @limit OFFSET @offset`),
  proposalGet: db.prepare('SELECT * FROM proposals WHERE id = ?'),
  proposalCreate: db.prepare(`INSERT INTO proposals (id, title, description, idea_source, scope, task_breakdown, priority, destructive)
    VALUES (@id, @title, @description, @idea_source, @scope, @task_breakdown, @priority, @destructive)`),
  proposalUpdate: db.prepare('UPDATE proposals SET status = @status, resolved_at = @resolved_at, outcome = @outcome WHERE id = @id'),

  // Inbox
  inboxList: db.prepare(`SELECT * FROM inbox WHERE
    (CASE WHEN @to_agent IS NOT NULL THEN to_agent = @to_agent ELSE 1 END) AND
    (CASE WHEN @read IS NOT NULL THEN read = @read ELSE 1 END)
    ORDER BY created_at DESC LIMIT @limit OFFSET @offset`),
  inboxSend: db.prepare('INSERT INTO inbox (id, to_agent, from_agent, task_id, message) VALUES (@id, @to_agent, @from_agent, @task_id, @message)'),
  inboxRead: db.prepare('UPDATE inbox SET read = 1 WHERE id = ?'),

  // Handoffs
  handoffList: db.prepare(`SELECT * FROM handoffs WHERE
    (CASE WHEN @status IS NOT NULL THEN status = @status ELSE 1 END)
    ORDER BY created_at DESC`),
  handoffCreate: db.prepare('INSERT INTO handoffs (id, from_agent, to_agent, task_id, context) VALUES (@id, @from_agent, @to_agent, @task_id, @context)'),
  handoffClaim: db.prepare(`UPDATE handoffs SET status = 'claimed', claimed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? AND status = 'pending'`),
  handoffComplete: db.prepare(`UPDATE handoffs SET status = 'completed', completed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? AND status = 'claimed'`),

  // Vault links
  vaultLinksForTask: db.prepare('SELECT * FROM vault_links WHERE task_id = ?'),

  // System
  systemHealth: db.prepare(`SELECT
    (SELECT count(*) FROM agents WHERE status = 'active') as active_agents,
    (SELECT count(*) FROM agents WHERE status = 'circuit_open') as circuit_open,
    (SELECT count(*) FROM tasks WHERE status = 'queued') as queued_tasks,
    (SELECT count(*) FROM tasks WHERE status = 'active') as active_tasks,
    (SELECT count(*) FROM tasks WHERE status = 'blocked') as blocked_tasks,
    (SELECT count(*) FROM proposals WHERE status = 'pending') as pending_proposals,
    (SELECT count(*) FROM inbox WHERE read = 0) as unread_inbox`),

  // Task context (for detail view)
  feedForTask: db.prepare('SELECT * FROM feed WHERE task_id = ? ORDER BY timestamp ASC'),
  handoffsForTask: db.prepare('SELECT * FROM handoffs WHERE task_id = ?'),
  tasksDependingOn: db.prepare(`SELECT id, title, status FROM tasks WHERE depends_on LIKE '%' || ? || '%'`),
};

export default db;
