import { Router } from 'express';
import { getDb } from '../db.js';
import { randomUUID } from 'crypto';

export function promptsRoutes(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const db = getDb();
    const { category, search } = req.query;

    let sql = 'SELECT * FROM prompts';
    const params: any[] = [];

    if (category && typeof category === 'string' && category !== 'All') {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ' ORDER BY starred DESC, last_used DESC NULLS LAST, created_at DESC';

    const prompts = db.prepare(sql).all(...params);

    // Filter by search in-memory (simpler than complex SQL)
    let result = prompts as any[];
    if (search && typeof search === 'string') {
      const lower = search.toLowerCase();
      result = result.filter((p: any) =>
        p.title.toLowerCase().includes(lower) ||
        (p.description || '').toLowerCase().includes(lower) ||
        (p.tags || '').toLowerCase().includes(lower),
      );
    }

    res.json(result);
  });

  router.post('/', (req, res) => {
    const { title, category, description, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

    const db = getDb();
    const id = randomUUID();
    db.prepare(
      'INSERT INTO prompts (id, title, category, description, content, tags) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, title, category || 'Custom', description || '', content, JSON.stringify(tags || []));
    res.json({ id, title });
  });

  router.put('/:id', (req, res) => {
    const db = getDb();
    const { title, category, description, content, tags, starred } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
    if (starred !== undefined) { updates.push('starred = ?'); params.push(starred ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id);
    db.prepare(`UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ updated: true });
  });

  router.delete('/:id', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM prompts WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
  });

  return router;
}
