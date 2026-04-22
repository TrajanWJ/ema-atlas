// routes/wiki.js — Wiki API proxy routes
// Proxies to the wiki engine at http://localhost:8093
// Provides both new /api/wiki/* endpoints and backward-compat /api/vault/* aliases

import { Router } from 'express';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { exec as execCb } from 'child_process';

const router = Router();

const WIKI_API = process.env.WIKI_API_URL || 'http://localhost:8093';
const VAULT_DIR = join(process.env.HOME, 'vault');

// ---------------------------------------------------------------------------
// Helper: proxy fetch to wiki API
// ---------------------------------------------------------------------------
async function wikiGet(path) {
  const resp = await fetch(`${WIKI_API}${path}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw Object.assign(new Error(`Wiki API error ${resp.status}: ${text}`), { status: resp.status });
  }
  return resp.json();
}

async function wikiPost(path, body) {
  const resp = await fetch(`${WIKI_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw Object.assign(new Error(`Wiki API error ${resp.status}: ${text}`), { status: resp.status });
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// GET /api/wiki/search?q=QUERY&type=TYPE&limit=20
// ---------------------------------------------------------------------------
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ results: [], count: 0, query: '' });
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const type = req.query.type || '';
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (type) params.set('type', type);
    const data = await wikiGet(`/api/search?${params}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/page/:id — single page (URL-encoded ID)
// ---------------------------------------------------------------------------
router.get('/page/*', async (req, res, next) => {
  try {
    const id = req.params[0];
    if (!id) return res.status(400).json({ error: 'page id required' });
    const data = await wikiGet(`/api/pages/${encodeURIComponent(id)}`);
    res.json(data);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'page not found' });
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/pages?type=TYPE&project=PROJECT&limit=50
// ---------------------------------------------------------------------------
router.get('/pages', async (req, res, next) => {
  try {
    const params = new URLSearchParams();
    if (req.query.type) params.set('type', req.query.type);
    if (req.query.project) params.set('project', req.query.project);
    if (req.query.limit) params.set('limit', req.query.limit);
    if (req.query.offset) params.set('offset', req.query.offset);
    const qs = params.toString();
    const data = await wikiGet(`/api/pages${qs ? `?${qs}` : ''}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/graph/:id — knowledge graph for a page
// ---------------------------------------------------------------------------
router.get('/graph/*', async (req, res, next) => {
  try {
    const id = req.params[0];
    if (!id) return res.status(400).json({ error: 'page id required' });
    const data = await wikiGet(`/api/graph/${encodeURIComponent(id)}`);
    res.json(data);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'page not found' });
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/wiki/prompt — AI prompt against wiki content
// Body: { page_id, instruction } or { prompt }
// ---------------------------------------------------------------------------
router.post('/prompt', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || (!body.page_id && !body.prompt)) {
      return res.status(400).json({ error: 'page_id + instruction, or prompt required' });
    }
    const data = await wikiPost('/api/wiki/prompt', body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/project/:id/context — project intents/context
// ---------------------------------------------------------------------------
router.get('/project/:id/context', async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await wikiGet(`/api/projects/${encodeURIComponent(id)}/intents`);
    res.json(data);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'project not found' });
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/stats — aggregate wiki stats
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    // Fetch a broad page listing to compute stats
    const data = await wikiGet('/api/pages?limit=2000');
    const pages = data.pages || [];

    // Compute by_type counts
    const by_type = {};
    const spaces = new Set();
    for (const p of pages) {
      const t = p.type || 'unknown';
      by_type[t] = (by_type[t] || 0) + 1;
      // Extract space from path (spaces/<space>/...)
      const spaceMatch = p.path && p.path.match(/^spaces\/([^/]+)\//);
      if (spaceMatch) spaces.add(spaceMatch[1]);
    }

    // Find most recent updated_at as indexed_at proxy
    let indexed_at = null;
    for (const p of pages) {
      if (p.updated_at && (!indexed_at || p.updated_at > indexed_at)) {
        indexed_at = p.updated_at;
      }
    }

    res.json({
      total_pages: data.count || pages.length,
      by_type,
      spaces: Array.from(spaces),
      indexed_at,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/recent?limit=20 — pages sorted by updated_at desc
// ---------------------------------------------------------------------------
router.get('/recent', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    // Fetch a large set and sort client-side since API doesn't guarantee sort order
    const data = await wikiGet(`/api/pages?limit=500`);
    const pages = (data.pages || [])
      .filter(p => p.updated_at)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, limit);
    res.json({ pages, count: pages.length });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/wiki/types — list of content types with counts
// ---------------------------------------------------------------------------
router.get('/types', async (req, res, next) => {
  try {
    const data = await wikiGet('/api/pages?limit=2000');
    const pages = data.pages || [];
    const type_counts = {};
    for (const p of pages) {
      const t = p.type || 'unknown';
      type_counts[t] = (type_counts[t] || 0) + 1;
    }
    const types = Object.entries(type_counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    res.json({ types });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// Backward-compat vault aliases — proxy to wiki where possible
// ===========================================================================

// GET /api/vault/search?q=QUERY — proxy to wiki search
router.get('/vault-search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json([]);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const data = await wikiGet(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    // Normalize to vault-compat format
    const results = (data.results || []).map(r => ({
      docid: r.id,
      score: r.rank || 0,
      path: r.path || r.id,
      title: r.title || '',
      snippet: r.snippet || '',
      context: r.snippet || '',
      wiki_id: r.id,
    }));
    res.json(results);
  } catch (err) {
    // Fall back to empty on wiki failure
    console.warn('[wiki] vault-search fallback to empty:', err.message);
    res.json([]);
  }
});

// GET /api/vault/note?path=PATH — try wiki first, fall back to direct file read
router.get('/vault-note', async (req, res, next) => {
  try {
    const notePath = req.query.path;
    if (!notePath) return res.status(400).json({ error: 'path required' });

    // Try wiki API first: page id is derived from path
    // Wiki paths look like "spaces/default/..." — strip to get ID
    const wikiId = notePath
      .replace(/^vault\//, '')
      .replace(/\.md$/, '')
      .replace(/\s+/g, '-');

    try {
      const data = await wikiGet(`/api/pages/${encodeURIComponent(wikiId)}`);
      // Reshape into vault-note format
      return res.json({
        path: notePath,
        content: data.content || '',
        frontmatter: data.frontmatter || {},
        wikilinks: data.forward_links || [],
        backlinks: (data.backlinks || []).map(b => b.id || b),
        wordCount: data.word_count || 0,
        modified: data.updated_at || data.created_at || null,
        source: 'wiki',
      });
    } catch (_wikiErr) {
      // Fall through to direct file read
    }

    // Direct file read fallback
    const resolved = join(VAULT_DIR, notePath);
    if (!resolved.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });
    if (!existsSync(resolved)) return res.status(404).json({ error: 'not found' });

    const content = await readFile(resolved, 'utf8');
    const fileStat = await stat(resolved);

    let frontmatter = {};
    let body = content;
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      body = fmMatch[2];
      fmMatch[1].split('\n').forEach(line => {
        const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
        if (m) frontmatter[m[1]] = m[2].replace(/^["']|["']$/g, '');
      });
    }

    const wikilinks = [];
    const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let lm;
    while ((lm = linkRegex.exec(content)) !== null) {
      wikilinks.push({ target: lm[1].trim(), alias: lm[2] ? lm[2].trim() : null });
    }

    res.json({
      path: notePath,
      content: body,
      frontmatter,
      wikilinks,
      backlinks: [],
      wordCount: body.trim().split(/\s+/).filter(Boolean).length,
      modified: fileStat.mtime.toISOString(),
      source: 'file',
    });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    next(err);
  }
});

// GET /api/vault/recent — proxy to wiki recent
router.get('/vault-recent', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const data = await wikiGet(`/api/pages?limit=500`);
    const pages = (data.pages || [])
      .filter(p => p.updated_at)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, limit)
      .map(p => ({ path: p.path || p.id, modified: p.updated_at, title: p.title, type: p.type }));
    res.json(pages);
  } catch (err) {
    console.warn('[wiki] vault-recent fallback:', err.message);
    res.json([]);
  }
});

// GET /api/vault/stats — wiki stats + vault file stats
router.get('/vault-stats', async (req, res, next) => {
  try {
    // Fetch wiki stats
    let wikiStats = { total_pages: 0, by_type: {}, spaces: [], indexed_at: null };
    try {
      const data = await wikiGet('/api/pages?limit=2000');
      const pages = data.pages || [];
      const by_type = {};
      const spaces = new Set();
      let indexed_at = null;
      for (const p of pages) {
        const t = p.type || 'unknown';
        by_type[t] = (by_type[t] || 0) + 1;
        const spaceMatch = p.path && p.path.match(/^spaces\/([^/]+)\//);
        if (spaceMatch) spaces.add(spaceMatch[1]);
        if (p.updated_at && (!indexed_at || p.updated_at > indexed_at)) indexed_at = p.updated_at;
      }
      wikiStats = { total_pages: data.count || pages.length, by_type, spaces: Array.from(spaces), indexed_at };
    } catch (_e) { /* wiki may be down */ }

    // Count vault .md files
    let vault_notes = 0;
    let vault_last_updated = null;
    try {
      vault_notes = await new Promise(resolve => {
        execCb(`find "${VAULT_DIR}" -name "*.md" -type f 2>/dev/null | wc -l`,
          { timeout: 10000 }, (err, stdout) => resolve(parseInt(stdout) || 0));
      });
      vault_last_updated = await new Promise(resolve => {
        execCb(`find "${VAULT_DIR}" -name "*.md" -type f -printf "%T@ " 2>/dev/null | tr ' ' '\n' | sort -rn | head -1`,
          { timeout: 10000 }, (err, stdout) => {
            const ts = parseFloat(stdout);
            resolve(ts ? new Date(ts * 1000).toISOString() : null);
          });
      });
    } catch (_e) { /* vault may be unavailable */ }

    res.json({
      ...wikiStats,
      vault_notes,
      vault_last_updated,
      source: 'wiki+vault',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Wiki health check helper (exported for WS bridge)
// ---------------------------------------------------------------------------
export async function getWikiHealth() {
  try {
    const data = await wikiGet('/api/pages?limit=5');
    return {
      healthy: true,
      page_count: data.count || 0,
      last_indexed: null,
    };
  } catch (err) {
    return { healthy: false, page_count: 0, last_indexed: null };
  }
}

export async function wikiSearch(query, options = {}) {
  const limit = options.limit || 10;
  const type = options.type || '';
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (type) params.set('type', type);
  return wikiGet(`/api/search?${params}`);
}

export default router;
