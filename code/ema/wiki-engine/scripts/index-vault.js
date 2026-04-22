#!/usr/bin/env node
/**
 * Vault Indexer — bulk import ~/vault/ into wiki SQLite database
 * 
 * Usage:
 *   node scripts/index-vault.js              → full index
 *   node scripts/index-vault.js --dry-run   → report only, no writes
 *   node scripts/index-vault.js --validate  → check for issues
 */

const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { v4: uuidv4 } = require('uuid');

// Setup DB path before requiring db module
const DB_PATH = path.join(__dirname, '..', 'wiki.db');
process.env.WIKI_DB = DB_PATH;

const { getDb } = require('../server/db');
const { extractWikilinks, vaultPathToWikiPath, extractH1, slugify } = require('../server/utils/markdown');
const { inferTypeFromPath, inferProjectFromPath, VAULT_ROOT } = require('../server/utils/frontmatter');

const VAULT_ROOT_PATH = VAULT_ROOT;
const DRY_RUN = process.argv.includes('--dry-run');
const VALIDATE = process.argv.includes('--validate');

// Directories to skip
const SKIP_DIRS = new Set([
  '.git', '.archive', 'node_modules', '.graph-memory',
  'LCM Summaries', 'Session Summaries', 'Claude-Code-Sessions',
  'Claude-Code-Memory', 'Claude-Code-Bot',
]);

// Files to skip
const SKIP_FILES = new Set([
  'README.md', 'Welcome.md', 'Wiki.md', 'index.md',
]);

let stats = {
  total: 0,
  indexed: 0,
  skipped: 0,
  errors: 0,
  by_type: {},
  by_folder: {},
  wikilinks_created: 0,
  projects_created: 0,
};

let warnings = [];

/**
 * Walk directory recursively, yield .md files
 */
function* walkDir(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath, baseDir);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield fullPath;
    }
  }
}

/**
 * Parse date from frontmatter or filesystem
 */
function parseDate(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'number') return value;
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.getTime();
  } catch (_) {}
  return fallback;
}

/**
 * Main indexing function
 */
async function indexVault() {
  const db = getDb();
  
  console.log(`\n📚 Wiki Vault Indexer`);
  console.log(`   Vault: ${VAULT_ROOT_PATH}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : VALIDATE ? 'VALIDATE' : 'FULL INDEX'}`);
  console.log('');
  
  // Collect all files first (for dry run reporting)
  const allFiles = [...walkDir(VAULT_ROOT_PATH)];
  stats.total = allFiles.length;
  
  if (DRY_RUN) {
    console.log(`Found ${allFiles.length} markdown files\n`);
    // Count by folder
    for (const filePath of allFiles) {
      const relative = path.relative(VAULT_ROOT_PATH, filePath);
      const folder = relative.split('/')[0];
      stats.by_folder[folder] = (stats.by_folder[folder] || 0) + 1;
      const inferredType = inferTypeFromPath(relative);
      stats.by_type[inferredType] = (stats.by_type[inferredType] || 0) + 1;
    }
    console.log('By folder:');
    Object.entries(stats.by_folder).sort(([,a],[,b]) => b-a).forEach(([f, c]) => {
      console.log(`  ${f.padEnd(30)} ${c}`);
    });
    console.log('\nBy inferred type:');
    Object.entries(stats.by_type).sort(([,a],[,b]) => b-a).forEach(([t, c]) => {
      console.log(`  ${t.padEnd(20)} ${c}`);
    });
    return;
  }
  
  // Ensure default space
  const existingSpace = db.prepare('SELECT id FROM wiki_spaces WHERE id = ?').get('default');
  if (!existingSpace) {
    db.prepare(`INSERT INTO wiki_spaces (id, name, slug, type, created_at, updated_at) VALUES ('default','Default','default','personal',?,?)`).run(Date.now(), Date.now());
  }
  
  // Track path→id mapping for edge creation
  const pathToId = new Map();
  // Track wikilink pairs for second pass
  const wikilinkPairs = []; // {fromPath, toTitle}
  
  // === PASS 1: Scan Projects/ folders → create wiki_projects ===
  console.log('Pass 1: Creating project entries...');
  const projectsDir = path.join(VAULT_ROOT_PATH, 'Projects');
  if (fs.existsSync(projectsDir)) {
    const projectFolders = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory());
    
    for (const folder of projectFolders) {
      const slug = slugify(folder.name);
      const existing = db.prepare('SELECT id FROM wiki_projects WHERE slug = ? AND space_id = ?').get(slug, 'default');
      if (!existing) {
        const projId = uuidv4();
        db.prepare(`
          INSERT OR IGNORE INTO wiki_projects (id, space_id, name, slug, status, created_at, updated_at)
          VALUES (?, 'default', ?, ?, 'active', ?, ?)
        `).run(projId, folder.name, slug, Date.now(), Date.now());
        stats.projects_created++;
        console.log(`  + project: ${folder.name}`);
      }
    }
  }
  
  // === PASS 2: Index all pages ===
  console.log('\nPass 2: Indexing pages...');
  
  const insertPage = db.prepare(`
    INSERT OR REPLACE INTO wiki_pages 
    (id, space_id, project_id, title, slug, path, type, content, frontmatter, fields, 
     author, status, tags, file_path, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  const batchInsert = db.transaction((pages) => {
    for (const p of pages) {
      try {
        insertPage.run(
          p.id, p.space_id, p.project_id, p.title, p.slug, p.wikiPath, p.type,
          p.content, p.frontmatterJson, p.fieldsJson, p.author, p.status,
          p.tagsJson, p.filePath, p.createdAt, p.updatedAt
        );
      } catch (err) {
        if (!err.message.includes('UNIQUE')) {
          console.error(`  ✗ Error inserting ${p.wikiPath}:`, err.message);
          stats.errors++;
        }
      }
    }
  });
  
  const BATCH_SIZE = 100;
  let batch = [];
  let processed = 0;
  
  for (const filePath of allFiles) {
    const relative = path.relative(VAULT_ROOT_PATH, filePath);
    const folder = relative.split('/')[0];
    const filename = path.basename(filePath, '.md');
    
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      let parsed;
      try {
        parsed = matter(raw);
      } catch (parseErr) {
        parsed = { data: {}, content: raw };
      }
      
      const fm = parsed.data || {};
      const content = parsed.content || '';
      
      // Title: frontmatter > H1 > filename
      const title = fm.title || extractH1(content) || filename.replace(/-/g, ' ').replace(/_/g, ' ');
      
      // Type inference
      const type = fm.type || inferTypeFromPath(relative);
      
      // Status
      const status = fm.status || fm.draft ? 'draft' : 'active';
      
      // Tags
      let tags = fm.tags || fm.tag || [];
      if (typeof tags === 'string') tags = tags.split(',').map(t => t.trim());
      if (!Array.isArray(tags)) tags = [];
      
      // Author
      const author = fm.author || 'trajan';
      
      // Dates
      const fileStat = fs.statSync(filePath);
      const createdAt = parseDate(fm.created || fm.date, fileStat.birthtimeMs || fileStat.ctimeMs);
      const updatedAt = parseDate(fm.updated || fm.modified, fileStat.mtimeMs);
      
      // Wiki path (relative to vault root, no extension)
      const wikiPath = vaultPathToWikiPath(filePath, VAULT_ROOT_PATH + '/');
      
      // Project inference
      let projectId = null;
      const projectName = inferProjectFromPath(relative);
      if (projectName) {
        const projSlug = slugify(projectName);
        const proj = db.prepare('SELECT id FROM wiki_projects WHERE slug = ? AND space_id = ?').get(projSlug, 'default');
        if (proj) projectId = proj.id;
      }
      
      // Extract wikilinks for second pass
      const links = extractWikilinks(content);
      if (links.length > 0) {
        wikilinkPairs.push({ fromPath: wikiPath, links });
      }
      
      // Fields (type-specific data from frontmatter)
      const fields = extractFields(fm, type);
      
      const pageId = uuidv4();
      
      batch.push({
        id: pageId,
        space_id: 'default',
        project_id: projectId,
        title,
        slug: slugify(title),
        wikiPath,
        type,
        content,
        frontmatterJson: JSON.stringify(fm),
        fieldsJson: JSON.stringify(fields),
        author,
        status,
        tagsJson: JSON.stringify(tags),
        filePath,
        createdAt: Math.round(createdAt),
        updatedAt: Math.round(updatedAt),
      });
      
      pathToId.set(wikiPath, pageId);
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      stats.indexed++;
      
      if (batch.length >= BATCH_SIZE) {
        batchInsert(batch);
        batch = [];
        process.stdout.write(`\r  Indexed ${stats.indexed}/${stats.total}...`);
      }
      
    } catch (err) {
      console.error(`\n  ✗ Error processing ${relative}:`, err.message);
      stats.errors++;
    }
    processed++;
  }
  
  // Flush remaining batch
  if (batch.length > 0) {
    batchInsert(batch);
  }
  
  console.log(`\r  Indexed ${stats.indexed}/${stats.total} pages${stats.errors ? ` (${stats.errors} errors)` : ''}`);
  
  // === PASS 3: Create wikilink edges ===
  console.log('\nPass 3: Building wikilink graph...');
  
  // Build a title-to-id lookup for resolving [[Page Name]] links
  const titleToId = new Map();
  const allPages = db.prepare('SELECT id, title, path FROM wiki_pages').all();
  for (const p of allPages) {
    titleToId.set(p.title.toLowerCase(), p.id);
    // Also index by last path segment
    const lastSeg = p.path.split('/').pop();
    if (lastSeg && !titleToId.has(lastSeg.toLowerCase())) {
      titleToId.set(lastSeg.toLowerCase(), p.id);
    }
  }
  
  const insertEdge = db.prepare(`
    INSERT OR IGNORE INTO wiki_edges (id, from_page_id, to_page_id, relation_type, created_at)
    VALUES (?, ?, ?, 'wikilink', ?)
  `);
  
  const batchEdges = db.transaction((edges) => {
    for (const e of edges) {
      try {
        insertEdge.run(uuidv4(), e.fromId, e.toId, Date.now());
      } catch (_) {}
    }
  });
  
  let edgeBatch = [];
  let edgesCreated = 0;
  
  for (const { fromPath, links } of wikilinkPairs) {
    const fromId = pathToId.get(fromPath);
    if (!fromId) continue;
    
    for (const linkTitle of links) {
      const toId = titleToId.get(linkTitle.toLowerCase());
      if (toId && toId !== fromId) {
        edgeBatch.push({ fromId, toId });
        edgesCreated++;
      }
      
      if (edgeBatch.length >= BATCH_SIZE) {
        batchEdges(edgeBatch);
        edgeBatch = [];
      }
    }
  }
  
  if (edgeBatch.length > 0) {
    batchEdges(edgeBatch);
  }
  
  stats.wikilinks_created = edgesCreated;
  console.log(`  Created ${edgesCreated} wikilink edges`);
  
  // === Summary ===
  console.log('\n✅ Indexing complete!\n');
  console.log(`Pages indexed:     ${stats.indexed}`);
  console.log(`Wikilink edges:    ${stats.wikilinks_created}`);
  console.log(`Projects created:  ${stats.projects_created}`);
  console.log(`Errors:            ${stats.errors}`);
  console.log('\nBy type:');
  Object.entries(stats.by_type).sort(([,a],[,b]) => b-a).forEach(([t, c]) => {
    console.log(`  ${t.padEnd(20)} ${c}`);
  });
  
  if (VALIDATE) {
    console.log('\n🔍 Validation report:');
    // Check for broken wikilinks (links to pages that don't exist)
    const allEdges = db.prepare('SELECT from_page_id, to_page_id FROM wiki_edges').all();
    const allPageIds = new Set(db.prepare('SELECT id FROM wiki_pages').all().map(p => p.id));
    const brokenEdges = allEdges.filter(e => !allPageIds.has(e.to_page_id));
    console.log(`  Broken wikilinks: ${brokenEdges.length}`);
    console.log(`  Total edges: ${allEdges.length}`);
    
    // Pages without content
    const emptyPages = db.prepare("SELECT COUNT(*) as n FROM wiki_pages WHERE content = '' OR content IS NULL").get().n;
    console.log(`  Empty pages: ${emptyPages}`);
  }
}

function extractFields(fm, type) {
  const fields = {};
  
  switch (type) {
    case 'project':
      if (fm.status) fields.status = fm.status;
      if (fm.github_repo || fm.repo) fields.github_repo = fm.github_repo || fm.repo;
      if (fm.stack) fields.stack = Array.isArray(fm.stack) ? fm.stack : [fm.stack];
      if (fm.start_date) fields.start_date = fm.start_date;
      if (fm.target_date) fields.target_date = fm.target_date;
      break;
    case 'research':
      if (fm.query) fields.query = fm.query;
      if (fm.depth) fields.depth = fm.depth;
      if (fm.confidence) fields.confidence = fm.confidence;
      break;
    case 'meeting':
      if (fm.date) fields.date = fm.date;
      if (fm.attendees) fields.attendees = fm.attendees;
      break;
    case 'decision':
      if (fm.date) fields.date = fm.date;
      if (fm.context) fields.context = fm.context;
      break;
    case 'intent':
      if (fm.objective) fields.objective = fm.objective;
      if (fm.constraints) fields.constraints = fm.constraints;
      if (fm.success_criteria) fields.success_criteria = fm.success_criteria;
      if (fm.current_state) fields.current_state = fm.current_state;
      if (fm.next_milestone) fields.next_milestone = fm.next_milestone;
      if (fm.agent_context) fields.agent_context = fm.agent_context;
      break;
  }
  
  return fields;
}

indexVault().catch(err => {
  console.error('\n✗ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
