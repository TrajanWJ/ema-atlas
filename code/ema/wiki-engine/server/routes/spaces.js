const { Hono } = require('hono');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { slugify } = require('../utils/markdown');

const router = new Hono();

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseSpaceRow(row) {
  if (!row) return null;
  return {
    ...row,
    config: parseJson(row.config, {}),
  };
}

function parseProjectRow(row) {
  if (!row) return null;
  return {
    ...row,
    config: parseJson(row.config, {}),
  };
}

function getSpaceByIdentifier(db, identifier) {
  return db.prepare(`
    SELECT * FROM wiki_spaces
    WHERE id = ? OR slug = ?
    LIMIT 1
  `).get(identifier, identifier);
}

// GET /api/wiki/spaces
router.get('/', (c) => {
  const db = getDb();
  const spaces = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM wiki_projects p WHERE p.space_id = s.id) as project_count,
      (SELECT COUNT(*) FROM wiki_pages pg WHERE pg.space_id = s.id) as page_count
    FROM wiki_spaces s
    ORDER BY s.name
  `).all().map(parseSpaceRow);
  return c.json({ spaces });
});

// POST /api/wiki/spaces
router.post('/', async (c) => {
  const db = getDb();
  const body = await c.req.json();
  const { name, slug, type = 'personal', config = {} } = body;

  if (!name || !name.trim()) {
    return c.json({ error: 'name is required' }, 400);
  }

  const normalizedName = name.trim();
  const baseSlug = slugify(slug || normalizedName);
  if (!baseSlug) {
    return c.json({ error: 'name or slug must contain at least one alphanumeric character' }, 400);
  }

  let finalSlug = baseSlug;
  let suffix = 1;
  while (db.prepare('SELECT id FROM wiki_spaces WHERE slug = ?').get(finalSlug)) {
    finalSlug = `${baseSlug}-${suffix++}`;
  }

  const id = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO wiki_spaces (id, name, slug, type, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, normalizedName, finalSlug, type, JSON.stringify(config || {}), now, now);

  const created = db.prepare('SELECT * FROM wiki_spaces WHERE id = ?').get(id);
  return c.json({ space: parseSpaceRow(created) }, 201);
});

// GET /api/wiki/spaces/:space
router.get('/:space', (c) => {
  const db = getDb();
  const { space } = c.req.param();
  const row = getSpaceByIdentifier(db, space);

  if (!row) return c.json({ error: 'Space not found' }, 404);

  const spaceRecord = parseSpaceRow(row);
  const counts = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM wiki_projects WHERE space_id = ?) AS project_count,
      (SELECT COUNT(*) FROM wiki_pages WHERE space_id = ? AND status != 'archived') AS page_count,
      (SELECT COUNT(*) FROM wiki_pages WHERE space_id = ? AND project_id IS NULL AND status != 'archived') AS root_page_count,
      (SELECT MAX(updated_at) FROM wiki_pages WHERE space_id = ?) AS last_activity_at
  `).get(row.id, row.id, row.id, row.id);

  const recentPages = db.prepare(`
    SELECT id, project_id, title, path, type, status, updated_at
    FROM wiki_pages
    WHERE space_id = ? AND status != 'archived'
    ORDER BY updated_at DESC
    LIMIT 20
  `).all(row.id);

  return c.json({
    space: {
      ...spaceRecord,
      ...counts,
      recent_pages: recentPages,
    },
  });
});

// GET /api/wiki/spaces/:space/projects
router.get('/:space/projects', (c) => {
  const db = getDb();
  const { space } = c.req.param();
  const spaceRow = getSpaceByIdentifier(db, space);

  if (!spaceRow) return c.json({ error: 'Space not found' }, 404);

  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM wiki_pages pg WHERE pg.project_id = p.id AND pg.status != 'archived') as page_count
    FROM wiki_projects p
    WHERE p.space_id = ?
    ORDER BY p.name
  `).all(spaceRow.id).map(parseProjectRow);
  return c.json({ projects });
});

// POST /api/wiki/spaces/:space/projects
router.post('/:space/projects', async (c) => {
  const db = getDb();
  const { space } = c.req.param();
  const spaceRow = getSpaceByIdentifier(db, space);

  if (!spaceRow) return c.json({ error: 'Space not found' }, 404);

  const body = await c.req.json();
  const {
    name,
    slug,
    description = null,
    status = 'active',
    config = {},
  } = body;

  if (!name || !name.trim()) {
    return c.json({ error: 'name is required' }, 400);
  }

  const normalizedName = name.trim();
  const baseSlug = slugify(slug || normalizedName);
  if (!baseSlug) {
    return c.json({ error: 'name or slug must contain at least one alphanumeric character' }, 400);
  }

  let finalSlug = baseSlug;
  let suffix = 1;
  while (db.prepare('SELECT id FROM wiki_projects WHERE space_id = ? AND slug = ?').get(spaceRow.id, finalSlug)) {
    finalSlug = `${baseSlug}-${suffix++}`;
  }

  const id = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO wiki_projects (id, space_id, name, slug, description, status, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    spaceRow.id,
    normalizedName,
    finalSlug,
    description,
    status,
    JSON.stringify(config || {}),
    now,
    now
  );

  const created = db.prepare('SELECT * FROM wiki_projects WHERE id = ?').get(id);
  return c.json({ project: parseProjectRow(created) }, 201);
});

// GET /api/wiki/spaces/:space/tree
router.get('/:space/tree', (c) => {
  const db = getDb();
  const { space } = c.req.param();
  const spaceRow = getSpaceByIdentifier(db, space);

  if (!spaceRow) return c.json({ error: 'Space not found' }, 404);
  
  const projects = db.prepare(`
    SELECT id, name, slug FROM wiki_projects WHERE space_id = ? ORDER BY name
  `).all(spaceRow.id);
  
  const tree = projects.map(proj => {
    const pages = db.prepare(`
      SELECT id, title, path, type, status 
      FROM wiki_pages 
      WHERE project_id = ? AND space_id = ?
      ORDER BY title
    `).all(proj.id, spaceRow.id);
    return { ...proj, pages };
  });
  
  // Also get space-level pages (no project)
  const rootPages = db.prepare(`
    SELECT id, title, path, type, status 
    FROM wiki_pages 
    WHERE project_id IS NULL AND space_id = ?
    ORDER BY title
    LIMIT 200
  `).all(spaceRow.id);
  
  return c.json({ space: parseSpaceRow(spaceRow), projects: tree, root_pages: rootPages });
});

module.exports = router;
