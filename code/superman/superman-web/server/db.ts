import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.sqlite');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
    migrateSchema(db);
    seedPrompts(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      last_analyzed TEXT,
      health_score INTEGER DEFAULT 0,
      gap_count INTEGER DEFAULT 0,
      file_count INTEGER DEFAULT 0,
      function_count INTEGER DEFAULT 0,
      flow_count INTEGER DEFAULT 0,
      flows_json TEXT DEFAULT '[]',
      gaps_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS build_queue (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'feature',
      priority TEXT NOT NULL DEFAULT 'P1',
      complexity TEXT NOT NULL DEFAULT 'M',
      status TEXT NOT NULL DEFAULT 'backlog',
      description TEXT,
      generated_prompt TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Custom',
      description TEXT,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      starred INTEGER DEFAULT 0,
      last_used TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      gaps_found INTEGER DEFAULT 0,
      gaps_fixed INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
}

function migrateSchema(db: Database.Database) {
  // Add flows_json and gaps_json columns if they don't exist
  const cols = db.prepare("PRAGMA table_info(projects)").all() as any[];
  const colNames = cols.map((c: any) => c.name);
  if (!colNames.includes('flows_json')) {
    db.exec("ALTER TABLE projects ADD COLUMN flows_json TEXT DEFAULT '[]'");
  }
  if (!colNames.includes('gaps_json')) {
    db.exec("ALTER TABLE projects ADD COLUMN gaps_json TEXT DEFAULT '[]'");
  }
}

function seedPrompts(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM prompts').get() as { c: number };
  if (count.c > 0) return;

  const prompts = [
    {
      id: 'p1',
      title: 'ProSlync Full Build',
      category: 'Feature Building',
      description: 'Full React Native build prompt for ProSlync MVP',
      content: 'Build out the full ProSlync MVP with 5 user roles (Athlete, Brand, Agent, Fan, Admin). Each role has a bottom tab navigator with 5 screens. Use dark theme, glass cards, and cyan/violet accents.',
      tags: JSON.stringify(['proslync', 'react-native', 'mvp']),
    },
    {
      id: 'p2',
      title: 'Superman MCP Fix',
      category: 'Bug Fixes',
      description: 'Fix MCP server session management and transport',
      content: 'Fix the Superman IDE MCP server dual-format transport. Handle both NDJSON (Claude Desktop) and Content-Length framed (Claude Code) messages. Add auto-session recovery.',
      tags: JSON.stringify(['superman', 'mcp', 'transport']),
    },
    {
      id: 'p3',
      title: 'Retrieval Engine Upgrade',
      category: 'Architecture',
      description: 'BM25 + embeddings + cross-encoder retrieval pipeline',
      content: 'Upgrade the retrieval pipeline with multi-stage ranking: TF-IDF candidate generation, BM25 full-text search, OpenAI embeddings for semantic similarity, graph expansion for context, and cross-encoder re-ranking for final precision.',
      tags: JSON.stringify(['superman', 'retrieval', 'embeddings']),
    },
    {
      id: 'p4',
      title: 'Approach B Engine Upgrade',
      category: 'Architecture',
      description: 'Incremental parsing, React analyzer, contract validator, test generator',
      content: 'Upgrade Superman IDE engine with: 1) Incremental parsing via file hash cache, 2) React component analyzer (props, hooks, render tree, context), 3) API contract validator (match client calls to server routes), 4) Test generation MCP tool.',
      tags: JSON.stringify(['superman', 'engine', 'upgrade']),
    },
    {
      id: 'p5',
      title: 'Superman Self Analysis',
      category: 'Analysis & Audit',
      description: 'Use Superman on itself to find gaps',
      content: 'Run analyze_repo on /Users/will/Desktop/superman-ide. Then run get_gaps to find all issues. Fix every critical and high severity gap. Run vitest after each fix.',
      tags: JSON.stringify(['superman', 'self-analysis', 'gaps']),
    },
    {
      id: 'p6',
      title: 'ProSlync Gap Analysis',
      category: 'Analysis & Audit',
      description: 'Analyze ProSlync and fix top issues',
      content: 'Run analyze_repo on the ProSlync project. Run get_gaps. Focus on: missing navigation between screens, dead-end buttons, search bars that don\'t filter, settings that don\'t persist.',
      tags: JSON.stringify(['proslync', 'analysis', 'gaps']),
    },
    {
      id: 'p7',
      title: 'Fix All Stub Screens',
      category: 'Bug Fixes',
      description: 'Replace stub/placeholder screens with full implementations',
      content: 'Find all screens that are stubs (just a title and placeholder text). Replace each with a fully implemented screen with real mock data, interactive elements, and proper styling.',
      tags: JSON.stringify(['proslync', 'screens', 'stubs']),
    },
    {
      id: 'p8',
      title: 'Dev Login + Local DB',
      category: 'Feature Building',
      description: 'Dev login screen with role switching and local storage',
      content: 'Build a dev login screen that lets you quickly switch between all 5 roles during a demo. Store the selected role in AsyncStorage. Show role-specific avatar and color. Add a floating dev button to switch roles without logging out.',
      tags: JSON.stringify(['proslync', 'auth', 'dev-tools']),
    },
    {
      id: 'p9',
      title: 'Contract Coach Chat',
      category: 'Feature Building',
      description: 'AI contract coach chat interface for athletes',
      content: 'Build an AI Contract Coach chat screen. Athlete can ask questions about their deal terms. Show a chat bubble interface with pre-loaded suggestions. Mock AI responses that explain contract clauses in plain language.',
      tags: JSON.stringify(['proslync', 'ai', 'chat']),
    },
    {
      id: 'p10',
      title: 'E-Sign Flow',
      category: 'Feature Building',
      description: 'Electronic signature flow for deals',
      content: 'Build the full e-sign flow: Deal review → Compliance check → Contract preview → Signature pad → Success confetti animation. Each step should be a separate screen in a stack navigator.',
      tags: JSON.stringify(['proslync', 'esign', 'deals']),
    },
  ];

  const insert = db.prepare(
    'INSERT OR IGNORE INTO prompts (id, title, category, description, content, tags) VALUES (@id, @title, @category, @description, @content, @tags)',
  );

  const insertMany = db.transaction((items: typeof prompts) => {
    for (const item of items) insert.run(item);
  });

  insertMany(prompts);
}
