const { Hono } = require('hono');
const { getDb } = require('../db');

const router = new Hono();

// GET /api/wiki/pages/:id/graph?depth=2&relation_types=wikilink,relates
router.get('/pages/:id/graph', (c) => {
  const db = getDb();
  const { id } = c.req.param();
  const depth = Math.min(parseInt(c.req.query('depth') || '2'), 3);
  const relationTypesParam = c.req.query('relation_types');
  const relationTypes = relationTypesParam ? relationTypesParam.split(',') : null;
  
  const page = db.prepare('SELECT id, title, type, path FROM wiki_pages WHERE id = ?').get(id);
  if (!page) return c.json({ error: 'Not found' }, 404);
  
  // BFS traversal up to `depth`
  const visitedIds = new Set([id]);
  const nodes = [{ ...page }];
  const edges = [];
  let frontier = [id];
  
  for (let d = 0; d < depth; d++) {
    if (frontier.length === 0) break;
    const nextFrontier = [];
    
    for (const nodeId of frontier) {
      // Outgoing edges
      let outSql = `
        SELECT e.*, p.id as pid, p.title, p.type, p.path
        FROM wiki_edges e
        JOIN wiki_pages p ON p.id = e.to_page_id
        WHERE e.from_page_id = ?
      `;
      const outParams = [nodeId];
      if (relationTypes) {
        outSql += ` AND e.relation_type IN (${relationTypes.map(() => '?').join(',')})`;
        outParams.push(...relationTypes);
      }
      
      const outEdges = db.prepare(outSql).all(...outParams);
      for (const e of outEdges) {
        edges.push({ id: e.id, from: nodeId, to: e.pid, type: e.relation_type, label: e.label });
        if (!visitedIds.has(e.pid)) {
          visitedIds.add(e.pid);
          nodes.push({ id: e.pid, title: e.title, type: e.type, path: e.path });
          nextFrontier.push(e.pid);
        }
      }
      
      // Incoming edges
      let inSql = `
        SELECT e.*, p.id as pid, p.title, p.type, p.path
        FROM wiki_edges e
        JOIN wiki_pages p ON p.id = e.from_page_id
        WHERE e.to_page_id = ?
      `;
      const inParams = [nodeId];
      if (relationTypes) {
        inSql += ` AND e.relation_type IN (${relationTypes.map(() => '?').join(',')})`;
        inParams.push(...relationTypes);
      }
      
      const inEdges = db.prepare(inSql).all(...inParams);
      for (const e of inEdges) {
        edges.push({ id: e.id, from: e.pid, to: nodeId, type: e.relation_type, label: e.label });
        if (!visitedIds.has(e.pid)) {
          visitedIds.add(e.pid);
          nodes.push({ id: e.pid, title: e.title, type: e.type, path: e.path });
          nextFrontier.push(e.pid);
        }
      }
    }
    frontier = nextFrontier;
  }
  
  // Deduplicate edges
  const edgeMap = new Map();
  for (const edge of edges) {
    const key = `${edge.from}→${edge.to}:${edge.type}`;
    edgeMap.set(key, edge);
  }
  
  return c.json({ nodes, edges: [...edgeMap.values()], root_id: id });
});

// GET /api/wiki/graph/full?space=&project=&node_limit=200
router.get('/full', (c) => {
  const db = getDb();
  const { space, project, node_limit = '200' } = c.req.query();
  const limit = Math.min(parseInt(node_limit) || 200, 1000);
  
  let pageSql = 'SELECT id, title, type, path, space_id FROM wiki_pages WHERE status != ?';
  const pageParams = ['archived'];
  
  if (space) { pageSql += ' AND space_id = ?'; pageParams.push(space); }
  if (project) { pageSql += ' AND project_id = ?'; pageParams.push(project); }
  pageSql += ' ORDER BY updated_at DESC LIMIT ?';
  pageParams.push(limit);
  
  const nodes = db.prepare(pageSql).all(...pageParams);
  const nodeIds = new Set(nodes.map(n => n.id));
  
  // Only edges between included nodes
  const edges = db.prepare(`
    SELECT id, from_page_id as "from", to_page_id as "to", relation_type as type, label
    FROM wiki_edges
    WHERE from_page_id IN (${nodes.map(() => '?').join(',')})
      AND to_page_id IN (${nodes.map(() => '?').join(',')})
  `).all(...nodes.map(n => n.id), ...nodes.map(n => n.id));
  
  return c.json({ nodes, edges, total_nodes: nodes.length });
});

module.exports = router;
