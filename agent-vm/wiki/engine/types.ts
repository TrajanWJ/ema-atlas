// ============================================================
// Wiki Engine — Type Definitions
// 16 canonical page types from schema spec
// ============================================================

export type PageType =
  | 'project'
  | 'research'
  | 'intent'
  | 'intent-bundle'
  | 'task'
  | 'decision'
  | 'codebase'
  | 'config'
  | 'agent-profile'
  | 'agent-learning'
  | 'session-summary'
  | 'daily-note'
  | 'playbook'
  | 'integration'
  | 'synthesis'
  | 'knowledge'
  | 'sprint'
  // legacy types (mapped on import but kept for compatibility)
  | 'skill'
  | 'template'
  | 'moc'
  | string;

export type PageStatus =
  | 'active'
  | 'draft'
  | 'archived'
  | 'deprecated'
  | 'open'
  | 'in-progress'
  | 'done'
  | 'cancelled'
  | 'complete'
  | 'paused'
  | 'connected'
  | 'disconnected'
  | 'pending'
  | 'superseded'
  | 'reversed'
  | 'planned'
  | string;

export interface PageFrontmatter {
  title: string;
  type: PageType;
  status?: PageStatus;
  created?: string;
  updated?: string;
  summary?: string;
  tags?: string[];
  project?: string;
  agent?: string;
  author?: string;
  source?: string;
  confidence?: number;
  // import tracking
  wiki_id?: string;
  imported_from?: string;
  imported_at?: string;
  // type-specific
  priority?: string | number;
  owner?: string;
  project_id?: string;
  phase?: number;
  intent_type?: string;
  outcome?: string;
  session_id?: string;
  date?: string;
  domain?: string;
  stack?: string[];
  repo?: string;
  path?: string;
  system?: string;
  sprint_number?: number;
  start?: string;
  end?: string;
  execution_id?: string;
  assigned_to?: string;
  due?: string;
  last_ingested?: string;
  intent_count?: number;
  duration_min?: number;
  channel?: string;
  topic?: string;
  recurrence?: number;
  impact?: string;
  resolved?: boolean;
  impact_score?: number;
  auto_generated?: boolean;
  [key: string]: unknown;
}

export interface WikiPage {
  id: string;
  path: string;          // relative path from wiki root: spaces/default/research/foo.md
  frontmatter: PageFrontmatter;
  content: string;       // full markdown body (without frontmatter)
  raw: string;           // full file content (frontmatter + body)
  backlinks: string[];   // page IDs that link to this page
  forward_links: string[]; // page IDs this page links to
  created_at: string;
  updated_at: string;
  word_count: number;
}

export interface PageSummary {
  id: string;
  path: string;
  title: string;
  type: PageType;
  status?: PageStatus;
  summary?: string;
  tags: string[];
  project?: string;
  agent?: string;
  created_at: string;
  updated_at: string;
  word_count: number;
  backlink_count: number;
}

export interface SearchResult {
  id: string;
  path: string;
  title: string;
  type: PageType;
  snippet: string;
  rank: number;
}

export interface GraphNode {
  id: string;
  title: string;
  type: PageType;
  path: string;
}

export interface GraphEdge {
  from_id: string;
  to_id: string;
  link_text: string;
}

export interface GraphResult {
  page: GraphNode;
  backlinks: GraphNode[];
  forward_links: GraphNode[];
}

export interface ListPagesQuery {
  type?: string;
  space?: string;
  project?: string;
  agent?: string;
  tags?: string[];
  status?: string;
  created_after?: string;
  updated_before?: string;
  updated_after?: string;
  backlink_count?: number;
  impact_score_gte?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePageRequest {
  path?: string;           // optional: if not provided, derived from type+title
  frontmatter: Partial<PageFrontmatter> & { title: string; type: PageType };
  content: string;
}

export interface UpdatePageRequest {
  frontmatter?: Partial<PageFrontmatter>;
  content?: string;
}
