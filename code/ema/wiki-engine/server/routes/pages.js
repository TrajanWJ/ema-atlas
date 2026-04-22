const { Hono } = require('hono');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { broadcast } = require('../ws');
const { writeMarkdownFile, wikiPathToFilePath } = require('../utils/frontmatter');
const { extractWikilinks, generateExcerpt, slugify } = require('../utils/markdown');

const router = new Hono();

function parsePageRow(row) {
  if (!row) return null;
  return {
    ...row,
    frontmatter: JSON.parse(row.frontmatter || '{}'),
    fields: JSON.parse(row.fields || '{}'),
    tags: JSON.parse(row.tags || '[]'),
  };
}

// GET /api/wiki/pages
router.get('/', (c) => {
  const db = getDb();
  const { space, project, type, tag, status, q, limit = '50', cursor } = c.req.query();
  
  let sql = 'SELECT * FROM wiki_pages WHERE 1=1';
  const params = [];
  
  if (space) { sql += ' AND space_id = ?'; params.push(space); }
  if (project) { sql += ' AND project_id = ?'; params.push(project); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  else { sql += ' AND status != ?'; params.push('archived'); }
  if (tag) { sql += ' AND tags LIKE ?'; params.push(`%"${tag}"%`); }
  if (q) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (cursor) { sql += ' AND updated_at < ?'; params.push(parseInt(cursor)); }
  
  sql += ' ORDER BY updated_at DESC LIMIT ?';
  params.push(parseInt(limit) + 1);
  
  const rows = db.prepare(sql).all(...params);
  const hasMore = rows.length > parseInt(limit);
  const pages = rows.slice(0, parseInt(limit)).map(r => ({
    ...parsePageRow(r),
    content: undefined,  // omit content in list
    excerpt: generateExcerpt(r.content),
  }));
  
  const nextCursor = hasMore && pages.length > 0 ? pages[pages.length - 1].updated_at : null;
  
  return c.json({ pages, next_cursor: nextCursor });
});

// GET /api/wiki/pages/by-path/*
router.get('/by-path/*', (c) => {
  const db = getDb();
  const fullPath = c.req.path.replace('/api/wiki/pages/by-path/', '');
  const decodedPath = decodeURIComponent(fullPath);
  
  const row = db.prepare('SELECT * FROM wiki_pages WHERE path = ?').get(decodedPath);
  if (!row) return c.json({ error: 'Not found', path: decodedPath }, 404);
  
  const page = parsePageRow(row);
  
  // Add relations
  const outgoing = db.prepare(`
    SELECT e.*, p.title, p.path, p.type 
    FROM wiki_edges e 
    JOIN wiki_pages p ON p.id = e.to_page_id 
    WHERE e.from_page_id = ?
  `).all(row.id);
  
  const incoming = db.prepare(`
    SELECT e.*, p.title, p.path, p.type 
    FROM wiki_edges e 
    JOIN wiki_pages p ON p.id = e.from_page_id 
    WHERE e.to_page_id = ?
  `).all(row.id);
  
  return c.json({ ...page, relations: { outgoing, incoming } });
});

// GET /api/wiki/pages/:id
router.get('/:id', (c) => {
  const db = getDb();
  const { id } = c.req.param();
  
  const row = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(id);
  if (!row) return c.json({ error: 'Not found' }, 404);
  
  const page = parsePageRow(row);
  
  const outgoing = db.prepare(`
    SELECT e.id, e.relation_type, e.label, p.id as page_id, p.title, p.path, p.type 
    FROM wiki_edges e 
    JOIN wiki_pages p ON p.id = e.to_page_id 
    WHERE e.from_page_id = ?
  `).all(id);
  
  const incoming = db.prepare(`
    SELECT e.id, e.relation_type, e.label, p.id as page_id, p.title, p.path, p.type 
    FROM wiki_edges e 
    JOIN wiki_pages p ON p.id = e.from_page_id 
    WHERE e.to_page_id = ?
  `).all(id);
  
  return c.json({ ...page, relations: { outgoing, incoming } });
});

// POST /api/wiki/pages
router.post('/', async (c) => {
  const db = getDb();
  const body = await c.req.json();
  
  const { space_id = 'default', project_id, title, type = 'knowledge', content = '',
          frontmatter = {}, fields = {}, tags = [], author = 'trajan', status = 'active' } = body;
  
  if (!title) return c.json({ error: 'title is required' }, 400);
  
  const id = uuidv4();
  const slug = slugify(title);
  const now = Date.now();
  
  // Build path
  let wikiPath = body.path;
  if (!wikiPath) {
    if (project_id) {
      const proj = db.prepare('SELECT slug FROM wiki_projects WHERE id = ?').get(project_id);
      wikiPath = proj ? `${space_id}/${proj.slug}/${slug}` : `${space_id}/${slug}`;
    } else {
      wikiPath = `${space_id}/${slug}`;
    }
  }
  
  // Ensure unique path
  let finalPath = wikiPath;
  let suffix = 1;
  while (db.prepare('SELECT id FROM wiki_pages WHERE path = ?').get(finalPath)) {
    finalPath = `${wikiPath}-${suffix++}`;
  }
  
  const filePath = wikiPathToFilePath(finalPath);
  
  db.prepare(`
    INSERT INTO wiki_pages (id, space_id, project_id, title, slug, path, type, content,
      frontmatter, fields, author, status, tags, file_path, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id, space_id, project_id || null, title, slug, finalPath, type, content,
    JSON.stringify(frontmatter), JSON.stringify(fields), author, status,
    JSON.stringify(tags), filePath, now, now
  );
  
  // Extract wikilinks → edges (resolve later after all pages indexed)
  // For now just record them
  const links = extractWikilinks(content);
  
  // Write to filesystem
  try {
    writeMarkdownFile(filePath, {
      frontmatter: { title, type, status, tags, created: new Date(now).toISOString(), ...frontmatter },
      content,
    });
  } catch (err) {
    console.warn('[pages] Could not write to filesystem:', err.message);
  }
  
  // Save initial version
  db.prepare(`
    INSERT INTO wiki_page_versions (id, page_id, version, content, frontmatter, fields, author, change_summary, created_at)
    VALUES (?, ?, 1, ?, ?, ?, ?, 'Initial creation', ?)
  `).run(uuidv4(), id, content, JSON.stringify(frontmatter), JSON.stringify(fields), author, now);
  
  broadcast('wiki:page_created', { page_id: id, path: finalPath, type, author });
  
  return c.json({ id, path: finalPath, created_at: now }, 201);
});

// PUT /api/wiki/pages/:id
router.put('/:id', async (c) => {
  const db = getDb();
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const existing = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  
  const now = Date.now();
  const newVersion = (existing.version || 1) + 1;
  const { title, content, frontmatter, fields, tags, status, change_summary, author = 'trajan' } = body;
  
  // Save version snapshot before update
  db.prepare(`
    INSERT OR IGNORE INTO wiki_page_versions (id, page_id, version, content, frontmatter, fields, author, change_summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), id, existing.version || 1, existing.content, existing.frontmatter, 
         existing.fields, author, change_summary || 'Updated', now);
  
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (frontmatter !== undefined) updates.frontmatter = JSON.stringify(frontmatter);
  if (fields !== undefined) updates.fields = JSON.stringify(fields);
  if (tags !== undefined) updates.tags = JSON.stringify(tags);
  if (status !== undefined) updates.status = status;
  updates.updated_at = now;
  updates.version = newVersion;
  
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE wiki_pages SET ${setClauses} WHERE id = ?`)
    .run(...Object.values(updates), id);
  
  // Sync to filesystem
  const updated = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(id);
  try {
    writeMarkdownFile(updated.file_path, {
      frontmatter: { 
        title: updated.title, type: updated.type, status: updated.status,
        tags: JSON.parse(updated.tags || '[]'),
        updated: new Date(now).toISOString(),
        ...JSON.parse(updated.frontmatter || '{}'),
      },
      content: updated.content || '',
    });
  } catch (err) {
    console.warn('[pages] Could not write to filesystem:', err.message);
  }
  
  broadcast('wiki:page_updated', { page_id: id, path: existing.path, version: newVersion, author });
  
  return c.json({ id, updated_at: now, version: newVersion });
});

// DELETE /api/wiki/pages/:id
router.delete('/:id', (c) => {
  const db = getDb();
  const { id } = c.req.param();
  
  const existing = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  
  // Soft delete: archive
  db.prepare("UPDATE wiki_pages SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(Date.now(), id);
  
  broadcast('wiki:page_deleted', { page_id: id, path: existing.path });
  
  return c.json({ deleted: true, archived_path: existing.path });
});

// GET /api/wiki/pages/:id/versions
router.get('/:id/versions', (c) => {
  const db = getDb();
  const { id } = c.req.param();
  
  const versions = db.prepare(`
    SELECT version, author, change_summary, created_at 
    FROM wiki_page_versions 
    WHERE page_id = ? 
    ORDER BY version DESC
  `).all(id);
  
  return c.json({ versions });
});

// POST /api/wiki/pages/:id/relations
router.post('/:id/relations', async (c) => {
  const db = getDb();
  const { id } = c.req.param();
  const { to_page_id, relation_type = 'relates', label } = await c.req.json();
  
  if (!to_page_id) return c.json({ error: 'to_page_id required' }, 400);
  
  const edgeId = uuidv4();
  try {
    db.prepare(`
      INSERT INTO wiki_edges (id, from_page_id, to_page_id, relation_type, label, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(edgeId, id, to_page_id, relation_type, label || null, Date.now());
    
    broadcast('wiki:edge_added', { from_id: id, to_id: to_page_id, relation_type });
    return c.json({ edge_id: edgeId });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return c.json({ error: 'Edge already exists' }, 409);
    }
    throw err;
  }
});

module.exports = router;
