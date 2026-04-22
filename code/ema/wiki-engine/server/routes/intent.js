const { Hono } = require('hono');
const { getDb } = require('../db');
const { generateExcerpt } = require('../utils/markdown');

const router = new Hono();

/**
 * Superman/Intent Layer
 * Provides project context assembly for agent dispatch
 */

// GET /api/wiki/context/:project_id
// Assembles full project context for agent spawn
router.get('/context/:project_id', (c) => {
  const db = getDb();
  const { project_id } = c.req.param();
  
  const project = db.prepare('SELECT * FROM wiki_projects WHERE id = ?').get(project_id)
    || db.prepare('SELECT * FROM wiki_projects WHERE slug = ?').get(project_id);
  
  if (!project) return c.json({ error: 'Project not found' }, 404);
  
  // Intent page (type: intent for this project)
  const intentPage = db.prepare(`
    SELECT * FROM wiki_pages 
    WHERE project_id = ? AND type = 'intent' 
    ORDER BY updated_at DESC LIMIT 1
  `).get(project.id);
  
  // Recent pages (last 5 updated)
  const recentPages = db.prepare(`
    SELECT id, title, path, type, status, updated_at, content
    FROM wiki_pages 
    WHERE project_id = ? AND status != 'archived'
    ORDER BY updated_at DESC LIMIT 5
  `).all(project.id);
  
  // Active tasks
  const activeTasks = db.prepare(`
    SELECT id, title, path, fields
    FROM wiki_pages
    WHERE project_id = ? AND type = 'task'
    AND json_extract(fields, '$.status') NOT IN ('done', 'cancelled')
    ORDER BY updated_at DESC LIMIT 10
  `).all(project.id);
  
  // Graph neighbors (pages linked to intent page or project root pages)
  let graphNeighbors = [];
  if (intentPage) {
    graphNeighbors = db.prepare(`
      SELECT p.id, p.title, p.path, p.type, e.relation_type
      FROM wiki_edges e
      JOIN wiki_pages p ON p.id = e.to_page_id
      WHERE e.from_page_id = ?
      LIMIT 10
    `).all(intentPage.id);
  }
  
  const parsePageRow = (row) => row ? {
    ...row,
    frontmatter: JSON.parse(row.frontmatter || '{}'),
    fields: JSON.parse(row.fields || '{}'),
    tags: JSON.parse(row.tags || '[]'),
    excerpt: generateExcerpt(row.content),
  } : null;
  
  const intentParsed = parsePageRow(intentPage);
  
  // Build text context block for agent prompt injection
  const contextBlock = buildContextBlock(project, intentParsed, recentPages, activeTasks);
  
  return c.json({
    project,
    intent_page: intentParsed,
    recent_pages: recentPages.map(r => ({ ...r, excerpt: generateExcerpt(r.content), content: undefined })),
    active_tasks: activeTasks.map(r => ({ ...r, fields: JSON.parse(r.fields || '{}') })),
    graph_neighbors: graphNeighbors,
    context_block: contextBlock,
    embeddings_ready: false,
  });
});

// GET /api/wiki/projects/:id/intents
router.get('/projects/:id/intents', (c) => {
  const db = getDb();
  const { id } = c.req.param();
  
  const intents = db.prepare(`
    SELECT * FROM wiki_pages
    WHERE project_id = ? AND type = 'intent'
    ORDER BY updated_at DESC
  `).all(id);
  
  return c.json({
    intents: intents.map(r => ({
      ...r,
      frontmatter: JSON.parse(r.frontmatter || '{}'),
      fields: JSON.parse(r.fields || '{}'),
      tags: JSON.parse(r.tags || '[]'),
    }))
  });
});

// POST /api/wiki/prompt
// Simplified instruction-based page update
router.post('/prompt', async (c) => {
  const db = getDb();
  const body = await c.req.json();
  const { instruction, page_id, page_path, content, type = 'knowledge', 
          author = 'agent', context } = body;
  
  if (!instruction) return c.json({ error: 'instruction is required' }, 400);
  
  // Find or create target page
  let page = null;
  if (page_id) {
    page = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(page_id);
  } else if (page_path) {
    page = db.prepare('SELECT * FROM wiki_pages WHERE path = ?').get(page_path);
  }
  
  if (!page && page_path) {
    // Auto-create page from path
    const parts = page_path.split('/');
    const title = parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const { v4: uuidv4 } = require('uuid');
    const { writeMarkdownFile, wikiPathToFilePath } = require('../utils/frontmatter');
    const { slugify } = require('../utils/markdown');
    const { broadcast } = require('../ws');
    
    const id = uuidv4();
    const now = Date.now();
    const filePath = wikiPathToFilePath(page_path);
    const newContent = content || `# ${title}\n\n${instruction}\n`;
    
    db.prepare(`
      INSERT INTO wiki_pages (id, space_id, title, slug, path, type, content, frontmatter, fields, author, status, tags, file_path, version, created_at, updated_at)
      VALUES (?, 'default', ?, ?, ?, ?, ?, '{}', '{}', ?, 'active', '[]', ?, 1, ?, ?)
    `).run(id, title, slugify(title), page_path, type, newContent, author, filePath, now, now);
    
    try {
      writeMarkdownFile(filePath, {
        frontmatter: { title, type, author, created: new Date(now).toISOString() },
        content: newContent,
      });
    } catch (err) {
      console.warn('[prompt] FS write failed:', err.message);
    }
    
    return c.json({ page_id: id, action: 'created', path: page_path });
  }
  
  if (!page) {
    return c.json({ error: 'Page not found and no path provided for creation' }, 404);
  }
  
  // Append instruction as a new section
  const now = Date.now();
  const appendSection = `\n\n---\n*Agent note (${new Date(now).toISOString()}): ${instruction}*\n\n${content || ''}`;
  const newContent = (page.content || '') + appendSection;
  
  db.prepare('UPDATE wiki_pages SET content = ?, updated_at = ?, version = version + 1 WHERE id = ?')
    .run(newContent, now, page.id);
  
  return c.json({ page_id: page.id, action: 'updated', path: page.path });
});

function buildContextBlock(project, intentPage, recentPages, activeTasks) {
  const lines = [
    `=== PROJECT CONTEXT: ${project.name} ===`,
    '',
  ];
  
  if (intentPage?.fields) {
    const f = intentPage.fields;
    lines.push('INTENT:');
    if (f.objective) lines.push(`Objective: ${f.objective}`);
    if (f.current_state) lines.push(`Current state: ${f.current_state}`);
    if (f.next_milestone) lines.push(`Next milestone: ${f.next_milestone}`);
    if (f.constraints) lines.push(`Constraints: ${f.constraints}`);
    lines.push('');
  }
  
  if (activeTasks.length > 0) {
    lines.push('ACTIVE TASKS:');
    activeTasks.slice(0, 5).forEach(t => {
      const fields = JSON.parse(t.fields || '{}');
      lines.push(`- ${t.title} [${fields.status || 'open'}]`);
    });
    lines.push('');
  }
  
  if (recentPages.length > 0) {
    lines.push('RECENT ACTIVITY:');
    recentPages.forEach(p => {
      lines.push(`- ${p.title} (${p.type}) — updated ${new Date(p.updated_at).toISOString().split('T')[0]}`);
    });
    lines.push('');
  }
  
  lines.push('=== END CONTEXT ===');
  return lines.join('\n');
}

module.exports = router;
