"use strict";
// ============================================================
// Wiki Engine — Markdown / Frontmatter Parser
// Uses gray-matter for YAML frontmatter parsing
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePage = parsePage;
exports.serializePage = serializePage;
exports.normalizeDate = normalizeDate;
exports.normalizeType = normalizeType;
exports.extractWikilinks = extractWikilinks;
exports.slugify = slugify;
exports.derivePath = derivePath;
const gray_matter_1 = __importDefault(require("gray-matter"));
const path_1 = __importDefault(require("path"));
/**
 * Parse a markdown file with YAML frontmatter.
 */
function parsePage(raw, filePath) {
    const parsed = (0, gray_matter_1.default)(raw);
    const frontmatter = normalizeFrontmatter(parsed.data, filePath);
    const content = parsed.content;
    const wikilinks = extractWikilinks(content);
    const wordCount = countWords(content);
    return { frontmatter, content, raw, wikilinks, wordCount };
}
/**
 * Serialize a page back to Markdown with YAML frontmatter.
 */
function serializePage(frontmatter, content) {
    return gray_matter_1.default.stringify(content, frontmatter);
}
/**
 * Normalize frontmatter — ensure required fields, convert dates, etc.
 */
function normalizeFrontmatter(data, filePath) {
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];
    // Derive title from filename if missing
    const defaultTitle = path_1.default.basename(filePath, '.md')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ');
    // Sanitize all values: convert Date objects → ISO strings, arrays → string arrays, etc.
    const sanitized = {};
    for (const [k, v] of Object.entries(data)) {
        if (v instanceof Date)
            sanitized[k] = v.toISOString().split('T')[0];
        else if (Array.isArray(v))
            sanitized[k] = v.map(item => item instanceof Date ? item.toISOString() : item);
        else
            sanitized[k] = v;
    }
    const fm = {
        title: sanitized.title || defaultTitle,
        type: normalizeType(sanitized.type || 'knowledge'),
        status: sanitized.status || undefined,
        created: normalizeDate(sanitized.created) || dateStr,
        updated: normalizeDate(sanitized.updated) || dateStr,
        summary: sanitized.summary || undefined,
        tags: normalizeTags(sanitized.tags),
        project: sanitized.project || undefined,
        agent: sanitized.agent || undefined,
        author: sanitized.author || undefined,
        source: sanitized.source || undefined,
        confidence: typeof sanitized.confidence === 'number' ? sanitized.confidence : undefined,
        ...sanitized, // preserve all original fields (sanitized)
    };
    // Re-apply normalized versions (override anything from spread)
    fm.title = data.title || defaultTitle;
    fm.type = normalizeType(data.type || 'knowledge');
    fm.tags = normalizeTags(data.tags);
    return fm;
}
/**
 * Normalize date to ISO 8601 string (YYYY-MM-DD or full ISO).
 */
function normalizeDate(val) {
    if (!val)
        return undefined;
    if (val instanceof Date)
        return val.toISOString().split('T')[0];
    if (typeof val === 'string') {
        // Already looks like a date
        if (/^\d{4}-\d{2}-\d{2}/.test(val))
            return val;
        // Try parsing
        const d = new Date(val);
        if (!isNaN(d.getTime()))
            return d.toISOString().split('T')[0];
    }
    return undefined;
}
/**
 * Map legacy/inconsistent types to canonical 16 types.
 */
function normalizeType(rawType) {
    if (!rawType)
        return 'knowledge';
    const t = rawType.toLowerCase().trim();
    const mapping = {
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
function normalizeTags(val) {
    if (!val)
        return [];
    if (Array.isArray(val))
        return val.map(String).filter(Boolean);
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
function extractWikilinks(content) {
    const links = [];
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
        }
        else {
            links.push({
                text: match[0],
                target: inner.trim(),
            });
        }
    }
    return links;
}
function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
/**
 * Slugify a title for use in file paths.
 */
function slugify(title) {
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
function derivePath(type, frontmatter) {
    const title = frontmatter.title || 'untitled';
    const slug = slugify(title);
    const project = frontmatter.project ? slugify(frontmatter.project) : null;
    const agent = frontmatter.agent ? slugify(frontmatter.agent) : null;
    const date = frontmatter.created || new Date().toISOString().split('T')[0];
    const typeToFolder = {
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
//# sourceMappingURL=parser.js.map