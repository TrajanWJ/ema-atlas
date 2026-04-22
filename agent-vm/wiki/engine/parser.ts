// ============================================================
// Wiki Engine — Markdown / Frontmatter Parser
// Uses gray-matter for YAML frontmatter parsing
// ============================================================

import matter from 'gray-matter';
import path from 'path';
import { PageFrontmatter, PageType } from './types';

export interface ParsedPage {
  frontmatter: PageFrontmatter;
  content: string;
  raw: string;
  wikilinks: Array<{ text: string; target: string; displayText?: string }>;
  wordCount: number;
}

/**
 * Parse a markdown file with YAML frontmatter.
 */
export function parsePage(raw: string, filePath: string): ParsedPage {
  const parsed = matter(raw);
  const frontmatter = normalizeFrontmatter(parsed.data as Record<string, unknown>, filePath);
  const content = parsed.content;
  const wikilinks = extractWikilinks(content);
  const wordCount = countWords(content);

  return { frontmatter, content, raw, wikilinks, wordCount };
}

/**
 * Serialize a page back to Markdown with YAML frontmatter.
 */
export function serializePage(frontmatter: PageFrontmatter, content: string): string {
  return matter.stringify(content, frontmatter as Record<string, unknown>);
}

/**
 * Normalize frontmatter — ensure required fields, convert dates, etc.
 */
function normalizeFrontmatter(data: Record<string, unknown>, filePath: string): PageFrontmatter {
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  // Derive title from filename if missing
  const defaultTitle = path.basename(filePath, '.md')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ');

  // Sanitize all values: convert Date objects → ISO strings, arrays → string arrays, etc.
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Date) sanitized[k] = v.toISOString().split('T')[0];
    else if (Array.isArray(v)) sanitized[k] = v.map(item => item instanceof Date ? item.toISOString() : item);
    else sanitized[k] = v;
  }

  const fm: PageFrontmatter = {
    title: (sanitized.title as string) || defaultTitle,
    type: normalizeType((sanitized.type as string) || 'knowledge'),
    status: (sanitized.status as string) || undefined,
    created: normalizeDate(sanitized.created) || dateStr,
    updated: normalizeDate(sanitized.updated) || dateStr,
    summary: (sanitized.summary as string) || undefined,
    tags: normalizeTags(sanitized.tags),
    project: (sanitized.project as string) || undefined,
    agent: (sanitized.agent as string) || undefined,
    author: (sanitized.author as string) || undefined,
    source: (sanitized.source as string) || undefined,
    confidence: typeof sanitized.confidence === 'number' ? sanitized.confidence : undefined,
    ...sanitized,  // preserve all original fields (sanitized)
  };

  // Re-apply normalized versions (override anything from spread)
  fm.title = (data.title as string) || defaultTitle;
  fm.type = normalizeType((data.type as string) || 'knowledge');
  fm.tags = normalizeTags(data.tags);

  return fm;
}

/**
 * Normalize date to ISO 8601 string (YYYY-MM-DD or full ISO).
 */
export function normalizeDate(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'string') {
    // Already looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val;
    // Try parsing
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return undefined;
}

/**
 * Map legacy/inconsistent types to canonical 16 types.
 */
export function normalizeType(rawType: string): PageType {
  if (!rawType) return 'knowledge';
  const t = rawType.toLowerCase().trim();
  const mapping: Record<string, PageType> = {
    // Direct matches
    'project': 'project',
    'research': 'research',
    'intent': 'intent',
    'intent-bundle': 'intent-bundle',
    'intent_bundle': 'intent-bundle',
    'task': 'task',
    'decision': 'decision',
    'codebase': 'codebase',
    'config': 'config',
    'agent-profile': 'agent-profile',
    'agent_profile': 'agent-profile',
    'agent-learning': 'agent-learning',
    'agent_learning': 'agent-learning',
    'session-summary': 'session-summary',
    'session_summary': 'session-summary',
    'daily-note': 'daily-note',
    'daily_note': 'daily-note',
    'playbook': 'playbook',
    'integration': 'integration',
    'synthesis': 'synthesis',
    'knowledge': 'knowledge',
    'sprint': 'sprint',
    // Legacy / long-tail types
    'agent': 'agent-profile',
    'subagent task': 'task',
    'subagent-task': 'task',
    'system': 'knowledge',
    'architecture': 'knowledge',
    'reference': 'knowledge',
    'operations': 'playbook',
    'moc': 'knowledge',
    'evolution-log': 'agent-learning',
    'evolution_log': 'agent-learning',
    'session': 'session-summary',
    'daily': 'daily-note',
    'performance': 'agent-learning',
    'skill': 'knowledge',
    'personal': 'knowledge',
    'auto-captured': 'knowledge',
    'design': 'knowledge',
    'planning': 'knowledge',
    'hub': 'knowledge',
    'coordinator': 'knowledge',
    'template': 'knowledge',
    'course': 'knowledge',
    'security': 'playbook',
    'runbook': 'playbook',
  };
  return mapping[t] || 'knowledge';
}

/**
 * Normalize tags — handle string, array, or null.
 */
function normalizeTags(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string') {
    // Might be comma-separated or space-separated
    return val.split(/[,\s]+/).filter(Boolean);
  }
  return [];
}

/**
 * Extract all [[wikilinks]] from content.
 * Supports:
 *   [[Page Name]]
 *   [[Folder/Page Name]]
 *   [[Page Name|Display Text]]
 */
export function extractWikilinks(content: string): Array<{
  text: string;
  target: string;
  displayText?: string;
}> {
  const links: Array<{ text: string; target: string; displayText?: string }> = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const inner = match[1];
    const pipeIdx = inner.indexOf('|');
    if (pipeIdx >= 0) {
      links.push({
        text: match[0],
        target: inner.slice(0, pipeIdx).trim(),
        displayText: inner.slice(pipeIdx + 1).trim(),
      });
    } else {
      links.push({
        text: match[0],
        target: inner.trim(),
      });
    }
  }

  return links;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Slugify a title for use in file paths.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Derive a file path from page type and title.
 */
export function derivePath(type: PageType, frontmatter: Partial<PageFrontmatter>): string {
  const title = frontmatter.title || 'untitled';
  const slug = slugify(title);
  const project = frontmatter.project ? slugify(frontmatter.project) : null;
  const agent = frontmatter.agent ? slugify(frontmatter.agent) : null;
  const date = frontmatter.created || new Date().toISOString().split('T')[0];

  const typeToFolder: Record<string, string> = {
    'project': 'projects',
    'research': 'research',
    'intent': project ? `projects/${project}/.superman/intents` : 'intents',
    'intent-bundle': project ? `projects/${project}/.superman` : 'intents',
    'task': project ? `projects/${project}/tasks` : 'tasks',
    'decision': 'decisions',
    'codebase': 'codebases',
    'config': 'system/configs',
    'agent-profile': agent ? `agents/${agent}` : 'agents',
    'agent-learning': agent ? `agents/${agent}/learnings` : 'agent-learnings',
    'session-summary': 'sessions',
    'daily-note': 'daily-notes',
    'playbook': 'operations',
    'integration': 'system/integrations',
    'synthesis': 'research/synthesis',
    'knowledge': 'knowledge',
    'sprint': project ? `projects/${project}/sprints` : 'sprints',
  };

  const folder = typeToFolder[type] || 'knowledge';
  return `spaces/default/${folder}/${slug}.md`;
}
