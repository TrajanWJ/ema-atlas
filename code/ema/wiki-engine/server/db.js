const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'wiki.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wiki_spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'personal',
      config TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS wiki_projects (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL DEFAULT 'default',
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      config TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      UNIQUE(space_id, slug)
    );

    CREATE TABLE IF NOT EXISTS wiki_pages (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL DEFAULT 'default',
      project_id TEXT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'knowledge',
      content TEXT DEFAULT '',
      frontmatter TEXT DEFAULT '{}',
      fields TEXT DEFAULT '{}',
      author TEXT DEFAULT 'trajan',
      status TEXT DEFAULT 'active',
      tags TEXT DEFAULT '[]',
      file_path TEXT,
      version INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(path)
    );

    CREATE TABLE IF NOT EXISTS wiki_edges (
      id TEXT PRIMARY KEY,
      from_page_id TEXT REFERENCES wiki_pages(id) ON DELETE CASCADE,
      to_page_id TEXT REFERENCES wiki_pages(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL DEFAULT 'wikilink',
      label TEXT,
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      UNIQUE(from_page_id, to_page_id, relation_type)
    );

    CREATE TABLE IF NOT EXISTS wiki_page_versions (
      id TEXT PRIMARY KEY,
      page_id TEXT REFERENCES wiki_pages(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content TEXT,
      frontmatter TEXT,
      fields TEXT,
      author TEXT,
      change_summary TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      UNIQUE(page_id, version)
    );

    CREATE INDEX IF NOT EXISTS idx_wiki_pages_space ON wiki_pages(space_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_pages_project ON wiki_pages(project_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_pages_type ON wiki_pages(type);
    CREATE INDEX IF NOT EXISTS idx_wiki_pages_status ON wiki_pages(status);
    CREATE INDEX IF NOT EXISTS idx_wiki_pages_updated ON wiki_pages(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_wiki_edges_from ON wiki_edges(from_page_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_edges_to ON wiki_edges(to_page_id);
  `);

  // FTS5 virtual table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS wiki_pages_fts USING fts5(
      title, content, tags,
      content=wiki_pages,
      content_rowid=rowid
    );
  `);

  // FTS triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS wiki_pages_fts_insert 
    AFTER INSERT ON wiki_pages BEGIN
      INSERT INTO wiki_pages_fts(rowid, title, content, tags) 
      VALUES (new.rowid, new.title, COALESCE(new.content,''), COALESCE(new.tags,''));
    END;

    CREATE TRIGGER IF NOT EXISTS wiki_pages_fts_update 
    AFTER UPDATE ON wiki_pages BEGIN
      INSERT INTO wiki_pages_fts(wiki_pages_fts, rowid, title, content, tags) 
      VALUES('delete', old.rowid, old.title, COALESCE(old.content,''), COALESCE(old.tags,''));
      INSERT INTO wiki_pages_fts(rowid, title, content, tags) 
      VALUES (new.rowid, new.title, COALESCE(new.content,''), COALESCE(new.tags,''));
    END;

    CREATE TRIGGER IF NOT EXISTS wiki_pages_fts_delete 
    AFTER DELETE ON wiki_pages BEGIN
      INSERT INTO wiki_pages_fts(wiki_pages_fts, rowid, title, content, tags) 
      VALUES('delete', old.rowid, old.title, COALESCE(old.content,''), COALESCE(old.tags,''));
    END;
  `);

  // Seed default space if not exists
  const existingSpace = db.prepare('SELECT id FROM wiki_spaces WHERE id = ?').get('default');
  if (!existingSpace) {
    db.prepare(`
      INSERT INTO wiki_spaces (id, name, slug, type, created_at, updated_at)
      VALUES ('default', 'Default', 'default', 'personal', ?, ?)
    `).run(Date.now(), Date.now());
  }
}

module.exports = { getDb };
