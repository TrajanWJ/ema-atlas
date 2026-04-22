// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Core Types
// ═══════════════════════════════════════════════════════════

export type Page =
  | "feed" | "inbox" | "proposals" | "briefing" | "workbench"
  | "talk" | "rooms"
  | "tasks" | "projects" | "plans" | "missions" | "pipelines"
  | "mind" | "explore" | "wiki"
  | "roles" | "records" | "system"
  | "sessions" | "usage" | "config" | "skills" | "debug"
  | "agent-workbench";

export interface FeedEvent {
  id: string;
  agent: string;
  type: string;
  content: string;
  timestamp: string;
  time?: string;
  pinned?: boolean;
  urgent?: boolean;
  _chain?: DelegationChain;
}

export interface DelegationChain {
  task?: { id: string; description: string; status: string; agent?: string; priority?: string };
  pipeline?: { id: string; focus: string; stage: string };
  goal?: { id: string; description: string; status: string };
}

export interface Proposal {
  id: string;
  type: string;
  title: string;
  body?: string;
  priority: string;
  status: string;
  source?: string;
  confidence?: number;
  triage_verdict?: string;
  triage_reason?: string;
  created_at: string;
  options?: string[];
  _chain?: DelegationChain;
}

export interface ChannelCategory {
  id: string;
  name: string;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  topic?: string;
  unread?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar?: string;
    bot: boolean;
  };
  timestamp: string;
  attachments?: unknown[];
  embeds?: unknown[];
  reactions?: { emoji: string; count: number }[];
  referenced_message?: { id: string; content: string; author: string } | null;
  thread?: { id: string; name: string } | null;
}

export interface Task {
  id: string;
  title?: string;
  description?: string;
  agent?: string;
  priority?: string;
  status: string;
  source?: string;
  created_at?: string;
  completed_at?: string;
  failed_at?: string;
  error?: string;
  proposal_id?: string;
  _chain?: DelegationChain;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  tasks_active: number;
  tasks_done: number;
  vault_notes?: number;
  mission?: string;
  last_activity?: string;
}

export interface Mission {
  id: string;
  icon: string;
  title: string;
  desc: string;
  status: string;
  progress: number;
  tasks_done: number;
  tasks_total: number;
  agents_active: number;
  days_active: number;
  velocity: number;
  milestones: string[];
  target_date?: string;
}

export interface VaultSearchResult {
  docid?: string;
  score?: number;
  path: string;
  title: string;
  snippet?: string;
}

export interface VaultNote {
  path: string;
  content: string;
  frontmatter: Record<string, string>;
  wikilinks: { target: string; alias: string | null }[];
  backlinks: string[];
  wordCount: number;
  modified: string;
}

export interface AgentCard {
  id: string;
  name: string;
  domain?: string;
  status: string;
  current_task?: { id: string; description: string; priority?: string };
  health?: { success_rate: number | null; avg_duration_ms: number | null; total: number };
  active_count: number;
}

export interface SystemOverview {
  uptime: string;
  load: { avg1: number; avg5: number; avg15: number };
  memory: { total: number; used: number; available: number };
  disk: { total: string; used: string; available: string; percent: string };
  services: Record<string, string>;
}

export interface ServiceStatus {
  name: string;
  active: string;
  sub: string;
  pid: number;
  since: string;
  description: string;
}

export interface CronEntry {
  type: string;
  schedule?: string;
  command?: string;
  unit?: string;
  next?: string;
  left?: string;
}

export interface Session {
  key: string;
  agentId?: string;
  kind?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  tokensCache?: number;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  status: string;
  columns: { id: string; name: string; color: string }[];
  tasks: PlanTask[];
  updated_at?: string;
}

export interface PlanTask {
  id: string;
  title: string;
  description?: string;
  column: string;
  agent?: string | null;
  priority?: string;
  labels?: string[];
  comments?: { agent: string; text: string; at: string }[];
}

export interface InboxItem {
  id: string;
  type: string;
  agent: string;
  title: string;
  detail?: string;
  time: string;
  source: string;
  read: boolean;
  severity?: string;
  priority?: string;
  confidence?: number;
}

// Wiki
export interface WikiPage {
  id: string;
  path: string;
  title: string;
  type: string;
  status?: string;
  summary?: string;
  tags: string[];
  project?: string;
  updated_at: string;
  word_count: number;
}

export interface WikiStats {
  total_pages: number;
  by_type: Array<{ type: string; count: number }>;
  spaces: string[];
}

// Agent Workbench
export interface AgentWorkbenchEntry {
  id: string;
  has_soul: boolean;
  has_agents_md: boolean;
  soul_size: number;
  workspace_path: string;
}

export interface AgentWorkbenchDetail extends AgentWorkbenchEntry {
  soul_content: string | null;
  candidate_content: string | null;
}

export interface AgentWorkbenchTestResult {
  ok: boolean;
  agent_id: string;
  variant: string;
  prompt: string;
  response: string;
}

export interface AgentWorkbenchLogEntry {
  ts: string;
  agent_id: string;
  variant: string;
  prompt: string;
  response: string;
}
