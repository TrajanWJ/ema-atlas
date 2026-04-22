import { Router } from 'express';
import { getDb } from '../db.js';
import { randomUUID } from 'crypto';

export function projectsRoutes(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const db = getDb();
    const projects = db.prepare('SELECT * FROM projects ORDER BY last_analyzed DESC').all();
    res.json(projects);
  });

  router.post('/', (req, res) => {
    const { name, path: projectPath } = req.body;
    if (!name || !projectPath) return res.status(400).json({ error: 'name and path are required' });

    const db = getDb();
    const id = randomUUID();

    db.prepare('INSERT INTO projects (id, name, path) VALUES (?, ?, ?)').run(id, name, projectPath);
    res.json({ id, name, path: projectPath });
  });

  router.delete('/:id', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
  });

  // Build queue for a project
  router.get('/:id/queue', (req, res) => {
    const db = getDb();
    const items = db.prepare('SELECT * FROM build_queue WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(items);
  });

  router.post('/:id/queue', (req, res) => {
    const db = getDb();
    const { title, type, priority, complexity, description, status } = req.body;
    const id = randomUUID();
    db.prepare(
      'INSERT INTO build_queue (id, project_id, title, type, priority, complexity, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, req.params.id, title, type || 'feature', priority || 'P1', complexity || 'M', status || 'backlog', description || '');
    res.json({ id, title });
  });

  router.put('/:projectId/queue/:queueId', (req, res) => {
    const db = getDb();
    const { status, generated_prompt } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (generated_prompt) { updates.push('generated_prompt = ?'); params.push(generated_prompt); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.queueId);
    db.prepare(`UPDATE build_queue SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ updated: true });
  });

  return router;
}
