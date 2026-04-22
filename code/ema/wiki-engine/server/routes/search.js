const { Hono } = require('hono');
const { getDb } = require('../db');
const { generateExcerpt } = require('../utils/markdown');

const router = new Hono();

// GET /api/wiki/search?q=&mode=fts&space=&project=&type=&limit=20
router.get('/', (c) => {
  const db = getDb();
  const { q, mode = 'fts', space, project, type, limit = '20' } = c.req.query();
  
  if (!q || q.trim().length < 2) {
    return c.json({ results: [], query: q });
  }
  
  const limitN = Math.min(parseInt(limit) || 20, 100);
  
  let results = [];
  
  if (mode === 'fts') {
    // FTS5 full-text search with BM25 ranking
    try {
      // Sanitize query for FTS5 (escape special chars)
      const ftsQuery = q.replace(/['"*()]/g, ' ').trim() + '*';
      
      let sql = `
        SELECT p.*, bm25(wiki_pages_fts) as score
        FROM wiki_pages_fts fts
        JOIN wiki_pages p ON p.rowid = fts.rowid
        WHERE wiki_pages_fts MATCH ?
          AND p.status != 'archived'
      `;
      const params = [ftsQuery];
      
      if (space) { sql += ' AND p.space_id = ?'; params.push(space); }
      if (project) { sql += ' AND p.project_id = ?'; params.push(project); }
      if (type) { sql += ' AND p.type = ?'; params.push(type); }
      
      sql += ' ORDER BY score LIMIT ?';
      params.push(limitN);
      
      results = db.prepare(sql).all(...params);
    } catch (err) {
      // FTS query failed (bad syntax) - fall back to LIKE search
      console.warn('[search] FTS failed, falling back to LIKE:', err.message);
      results = fallbackSearch(db, q, { space, project, type, limit: limitN });
    }
  } else {
    // Simple LIKE fallback
    results = fallbackSearch(db, q, { space, project, type, limit: limitN });
  }
  
  const formatted = results.map(r => ({
    id: r.id,
    title: r.title,
    path: r.path,
    type: r.type,
    status: r.status,
    tags: JSON.parse(r.tags || '[]'),
    score: r.score || 0,
    excerpt: generateExcerpt(r.content),
    updated_at: r.updated_at,
  }));
  
  return c.json({ results: formatted, query: q, mode });
});

function fallbackSearch(db, q, { space, project, type, limit }) {
  let sql = `
    SELECT *, 0 as score FROM wiki_pages 
    WHERE status != 'archived' 
    AND (title LIKE ? OR content LIKE ?)
  `;
  const params = [`%${q}%`, `%${q}%`];
  
  if (space) { sql += ' AND space_id = ?'; params.push(space); }
  if (project) { sql += ' AND project_id = ?'; params.push(project); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  
  sql += ' ORDER BY updated_at DESC LIMIT ?';
  params.push(limit);
  
  return db.prepare(sql).all(...params);
}

module.exports = router;
