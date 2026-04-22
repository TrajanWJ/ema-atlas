# v0.1 Desktop Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the desktop OS shell — boot sequence, ambient bar, dock, window manager, desktop surface — with SQLite WASM database and one working app (Brain Dump). This validates the entire core architecture.

**Architecture:** Next.js 16 App Router with `/(desktop)` route group. SQLite WASM (wa-sqlite) running in a Web Worker with OPFS persistence. Zustand for window manager state. react-rnd for draggable/resizable windows. Motion v12 for animations. Tailwind v4 for styling.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind v4, Zustand 5, wa-sqlite, react-rnd, Motion v12, Serwist (PWA), Biome, pnpm, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-20-place-org-design.md`

---

## File Structure

```
place.org/
├── app/
│   ├── layout.tsx                    Root layout (fonts, metadata, providers)
│   ├── (desktop)/
│   │   ├── layout.tsx                Desktop layout shell (ambient bar + dock + surface)
│   │   └── page.tsx                  Desktop entry point (boot → desktop)
│   └── globals.css                   Tailwind imports + CSS custom properties + @layer
│
├── src/
│   ├── components/
│   │   ├── boot/
│   │   │   └── BootSequence.tsx      Boot animation (SSR frame + client hydration)
│   │   ├── desktop/
│   │   │   ├── AmbientBar.tsx        Top bar: date, weather, metrics, one-thing
│   │   │   ├── Dock.tsx              Bottom dock: app icons, page links, system tray
│   │   │   ├── DockIcon.tsx          Individual dock icon with magnification
│   │   │   ├── DesktopSurface.tsx    Background, cursor light, right-click menu
│   │   │   └── CursorLight.tsx       Radial gradient following pointer
│   │   ├── window-manager/
│   │   │   ├── WindowManager.tsx     Renders all open windows from process state
│   │   │   ├── Window.tsx            Single window: title bar, drag, resize, close
│   │   │   ├── WindowTitleBar.tsx    Drag handle, app name, min/max/close buttons
│   │   │   └── SnapZones.tsx         Edge snap highlight zones
│   │   ├── apps/
│   │   │   └── brain-dump/
│   │   │       ├── BrainDumpApp.tsx  Main app: input + queue + process mode
│   │   │       ├── CaptureInput.tsx  Text input + voice mic button
│   │   │       ├── InboxQueue.tsx    List of unprocessed items
│   │   │       ├── InboxItem.tsx     Single item with action buttons
│   │   │       └── ProcessMode.tsx   Full-screen card-by-card processing
│   │   └── ui/
│   │       ├── GlassPanel.tsx        Reusable frosted glass surface
│   │       ├── IconButton.tsx        Standard icon button
│   │       └── ContextMenu.tsx       Right-click menu (Popover API wrapper)
│   │
│   ├── stores/
│   │   ├── window-store.ts           Zustand: open windows, positions, z-index, focus
│   │   ├── desktop-store.ts          Zustand: boot state, ambient data, theme, sound
│   │   └── inbox-store.ts            Zustand: brain dump items (synced with SQLite)
│   │
│   ├── db/
│   │   ├── worker.ts                 Web Worker: wa-sqlite + OPFS init
│   │   ├── client.ts                 Main thread client: postMessage API to worker
│   │   ├── migrations.ts             Schema versioning + migration runner
│   │   ├── schema.ts                 v1 schema DDL (inbox, window_state, settings, _meta)
│   │   └── queries/
│   │       ├── inbox.ts              CRUD for inbox table
│   │       ├── window-state.ts       CRUD for window_state table
│   │       └── settings.ts           CRUD for settings table
│   │
│   ├── hooks/
│   │   ├── use-db.ts                 Hook: database client access
│   │   ├── use-window-manager.ts     Hook: open/close/focus/minimize/maximize
│   │   ├── use-keyboard-shortcuts.ts Hook: global keyboard shortcut registration
│   │   ├── use-cursor-light.ts       Hook: pointer position tracking
│   │   └── use-time-of-day.ts        Hook: current time period for color shifts
│   │
│   ├── lib/
│   │   ├── id.ts                     nanoid wrapper for generating IDs
│   │   ├── time.ts                   Time-of-day calculation, relative timestamps
│   │   └── constants.ts              App IDs, default window sizes, shortcut keys
│   │
│   └── types/
│       ├── window.ts                 Window, Process, AppId types
│       ├── inbox.ts                  InboxItem type
│       └── db.ts                     Database message types (worker ↔ client)
│
├── public/
│   ├── sounds/
│   │   ├── boot.mp3                  Boot ambient sound
│   │   ├── click.mp3                 UI click
│   │   └── open.mp3                  Window open
│   └── db/
│       └── wa-sqlite-async.wasm      SQLite WASM binary (copied at build)
│
├── tests/
│   ├── db/
│   │   ├── migrations.test.ts        Schema versioning tests
│   │   └── inbox-queries.test.ts     Inbox CRUD tests
│   ├── stores/
│   │   ├── window-store.test.ts      Window manager state tests
│   │   └── inbox-store.test.ts       Inbox store tests
│   ├── components/
│   │   ├── boot-sequence.test.tsx    Boot flow tests
│   │   ├── window.test.tsx           Window rendering + interaction tests
│   │   ├── dock.test.tsx             Dock rendering + click tests
│   │   └── brain-dump.test.tsx       Brain dump capture + process tests
│   └── setup.ts                      Vitest setup (jsdom, mocks)
│
├── biome.json                        Biome config
├── next.config.ts                    Next.js config (headers, PWA)
├── tailwind.config.ts                Tailwind v4 config
├── tsconfig.json                     TypeScript strict config
├── package.json
├── pnpm-lock.yaml
├── .gitignore
└── docs/
    ├── design/
    │   └── architecture-v2.html
    └── superpowers/
        ├── specs/
        │   └── 2026-03-20-place-org-design.md
        └── plans/
            └── 2026-03-20-v01-desktop-shell.md (this file)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `biome.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/(desktop)/layout.tsx`, `app/(desktop)/page.tsx`, `tests/setup.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd ~/Desktop/place.org
pnpm create next-app@latest . --ts --tailwind --eslint=false --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

Note: This will scaffold into the existing directory. Say yes to overwrite if prompted.

- [ ] **Step 2: Remove default ESLint, install Biome + project dependencies**

```bash
pnpm remove eslint eslint-config-next
pnpm add zustand @anthropic-ai/sdk react-rnd motion
pnpm add -D biome @biomejs/biome vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react happy-dom
```

- [ ] **Step 3: Configure Biome**

Create `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "formatter": { "indentStyle": "tab", "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error" }
    }
  }
}
```

- [ ] **Step 4: Configure TypeScript strict mode**

Update `tsconfig.json` — ensure these compiler options:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
});
```

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Set up globals.css with design tokens**

Replace `app/globals.css`:
```css
@import 'tailwindcss';

@layer base {
  :root {
    --bg-deep: #060610;
    --bg-surface: #0a0e1a;
    --bg-glass: rgba(80, 130, 220, 0.06);
    --text-primary: #e8eaf0;
    --text-secondary: #8088a0;
    --accent-blue: #5b9cf5;
    --accent-success: #38c97a;
    --accent-warm: #e8a84c;
    --accent-urgent: #ef6b6b;
    --border: rgba(100, 160, 255, 0.08);
    --border-hover: rgba(100, 160, 255, 0.18);
    --glow: rgba(91, 156, 245, 0.15);
    --glass-blur: 16px;
    --ease-smooth: cubic-bezier(0.65, 0.05, 0, 1);
  }

  body {
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
    height: 100dvh;
    width: 100dvw;
  }
}

@layer components {
  .glass {
    background: var(--bg-glass);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--border);
  }

  .glass:hover {
    border-color: var(--border-hover);
  }
}
```

- [ ] **Step 7: Create root layout**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'place.org',
  description: 'Personal operating system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create desktop layout shell (placeholder)**

Create `app/(desktop)/layout.tsx`:
```tsx
export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      {children}
    </div>
  );
}
```

Create `app/(desktop)/page.tsx`:
```tsx
export default function DesktopPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[var(--text-secondary)] font-mono text-sm">
        place.org v0.1.0 — booting...
      </p>
    </div>
  );
}
```

- [ ] **Step 9: Verify build + dev server**

```bash
pnpm dev
```

Open http://localhost:3000. Expect: dark screen with "place.org v0.1.0 — booting..." centered in muted text.

- [ ] **Step 10: Run tests (should pass with zero tests)**

```bash
pnpm vitest run
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Biome, Vitest, Tailwind, design tokens"
```

---

## Task 2: SQLite WASM Database Layer

**Files:**
- Create: `src/db/worker.ts`, `src/db/client.ts`, `src/db/migrations.ts`, `src/db/schema.ts`, `src/db/queries/inbox.ts`, `src/db/queries/window-state.ts`, `src/db/queries/settings.ts`, `src/types/db.ts`, `src/types/inbox.ts`, `src/lib/id.ts`
- Test: `tests/db/migrations.test.ts`, `tests/db/inbox-queries.test.ts`

- [ ] **Step 1: Install wa-sqlite**

```bash
pnpm add @aspect-build/aspect-core wa-sqlite
```

Note: wa-sqlite may need manual WASM file placement. Check `node_modules/wa-sqlite/dist/` for the `.wasm` file and copy to `public/db/`.

```bash
mkdir -p public/db
cp node_modules/wa-sqlite/dist/wa-sqlite-async.wasm public/db/ 2>/dev/null || echo "WASM file location may differ — check node_modules/wa-sqlite/"
```

- [ ] **Step 2: Write the DB message types**

Create `src/types/db.ts`:
```typescript
export type DbRequest =
  | { type: 'init' }
  | { type: 'exec'; sql: string; params?: unknown[] }
  | { type: 'query'; sql: string; params?: unknown[] }
  | { type: 'export' };

export type DbResponse =
  | { type: 'ready'; version: number }
  | { type: 'result'; rows: Record<string, unknown>[] }
  | { type: 'exec-done' }
  | { type: 'export-data'; data: Uint8Array }
  | { type: 'error'; message: string };
```

- [ ] **Step 3: Write the ID generator**

Create `src/lib/id.ts`:
```typescript
export function createId(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 4: Write the inbox type**

Create `src/types/inbox.ts`:
```typescript
export interface InboxItem {
  readonly id: string;
  readonly content: string;
  readonly source: 'text' | 'voice';
  readonly processed: boolean;
  readonly action: 'task' | 'journal' | 'archive' | null;
  readonly createdAt: string;
  readonly processedAt: string | null;
  readonly updatedAt: string;
}
```

- [ ] **Step 5: Write the v1 schema**

Create `src/db/schema.ts`:
```typescript
export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS _meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO _meta (key, value) VALUES ('schema_version', '0');

CREATE TABLE IF NOT EXISTS inbox (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'text',
  processed INTEGER NOT NULL DEFAULT 0,
  action TEXT,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS window_state (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  z_index INTEGER NOT NULL DEFAULT 0,
  minimized INTEGER NOT NULL DEFAULT 0,
  maximized INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
```

- [ ] **Step 6: Write the migration runner**

Create `src/db/migrations.ts`:
```typescript
import { SCHEMA_V1 } from './schema';

interface Migration {
  readonly version: number;
  readonly sql: string;
}

const MIGRATIONS: readonly Migration[] = [
  { version: 1, sql: SCHEMA_V1 },
];

export async function runMigrations(
  exec: (sql: string) => Promise<void>,
  query: (sql: string) => Promise<Record<string, unknown>[]>,
): Promise<number> {
  // Ensure _meta exists for bootstrapping
  await exec(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  await exec(`INSERT OR IGNORE INTO _meta (key, value) VALUES ('schema_version', '0')`);

  const rows = await query(`SELECT value FROM _meta WHERE key = 'schema_version'`);
  const currentVersion = Number(rows[0]?.value ?? 0);

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);

  for (const migration of pending) {
    const statements = migration.sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await exec(statement);
    }

    await exec(
      `UPDATE _meta SET value = '${migration.version}' WHERE key = 'schema_version'`,
    );
  }

  return pending.length > 0 ? pending[pending.length - 1]!.version : currentVersion;
}
```

- [ ] **Step 7: Write the Web Worker**

Create `src/db/worker.ts`:
```typescript
/// <reference lib="webworker" />

import * as SQLite from 'wa-sqlite';
import SQLiteAsyncESMFactory from 'wa-sqlite/src/wa-sqlite-async.mjs';
import { OPFSCoopSyncVFS } from 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js';
import { runMigrations } from './migrations';
import type { DbRequest, DbResponse } from '@/src/types/db';

let db: number;
let sqlite: SQLiteAPI;

async function init(): Promise<number> {
  const module = await SQLiteAsyncESMFactory();
  sqlite = SQLite.Factory(module);

  const vfs = await OPFSCoopSyncVFS.create('place-org-db', module);
  sqlite.vfs_register(vfs, true);

  db = await sqlite.open_v2('place-org');

  const exec = async (sql: string) => {
    await sqlite.exec(db, sql);
  };

  const query = async (sql: string): Promise<Record<string, unknown>[]> => {
    const results: Record<string, unknown>[] = [];
    await sqlite.exec(db, sql, (row, columns) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      results.push(obj);
    });
    return results;
  };

  const version = await runMigrations(exec, query);
  return version;
}

async function execSql(sql: string, params?: unknown[]): Promise<void> {
  if (params && params.length > 0) {
    const str = await sqlite.str_new(db, sql);
    const prepared = await sqlite.prepare_v2(db, sqlite.str_value(str));
    if (prepared) {
      sqlite.bind_collection(prepared.stmt, params);
      await sqlite.step(prepared.stmt);
      sqlite.finalize(prepared.stmt);
    }
    sqlite.str_finish(str);
  } else {
    await sqlite.exec(db, sql);
  }
}

async function querySql(
  sql: string,
  params?: unknown[],
): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  await sqlite.exec(db, sql, (row, columns) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    results.push(obj);
  });
  return results;
}

self.onmessage = async (event: MessageEvent<DbRequest>) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case 'init': {
        const version = await init();
        self.postMessage({ type: 'ready', version } satisfies DbResponse);
        break;
      }
      case 'exec': {
        await execSql(msg.sql, msg.params);
        self.postMessage({ type: 'exec-done' } satisfies DbResponse);
        break;
      }
      case 'query': {
        const rows = await querySql(msg.sql, msg.params);
        self.postMessage({ type: 'result', rows } satisfies DbResponse);
        break;
      }
      default:
        self.postMessage({ type: 'error', message: 'Unknown message type' } satisfies DbResponse);
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies DbResponse);
  }
};
```

- [ ] **Step 8: Write the main-thread DB client**

Create `src/db/client.ts`:
```typescript
import type { DbRequest, DbResponse } from '@/src/types/db';

let worker: Worker | null = null;
let requestId = 0;
const pending = new Map<number, {
  resolve: (value: DbResponse) => void;
  reject: (error: Error) => void;
}>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<DbResponse & { _id?: number }>) => {
      const id = event.data._id;
      if (id !== undefined && pending.has(id)) {
        const p = pending.get(id)!;
        pending.delete(id);
        if (event.data.type === 'error') {
          p.reject(new Error(event.data.message));
        } else {
          p.resolve(event.data);
        }
      }
    };
  }
  return worker;
}

function send(request: DbRequest): Promise<DbResponse> {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...request, _id: id });
  });
}

export async function initDb(): Promise<number> {
  const response = await send({ type: 'init' });
  if (response.type === 'ready') return response.version;
  throw new Error('Database initialization failed');
}

export async function dbExec(sql: string, params?: unknown[]): Promise<void> {
  const response = await send({ type: 'exec', sql, params });
  if (response.type === 'error') throw new Error(response.message);
}

export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const response = await send({ type: 'query', sql, params });
  if (response.type === 'result') return response.rows as T[];
  throw new Error('Query failed');
}
```

- [ ] **Step 9: Write inbox query functions**

Create `src/db/queries/inbox.ts`:
```typescript
import { dbExec, dbQuery } from '../client';
import { createId } from '@/src/lib/id';
import type { InboxItem } from '@/src/types/inbox';

interface InboxRow {
  id: string;
  content: string;
  source: string;
  processed: number;
  action: string | null;
  created_at: string;
  processed_at: string | null;
  updated_at: string;
}

function rowToItem(row: InboxRow): InboxItem {
  return {
    id: row.id,
    content: row.content,
    source: row.source as 'text' | 'voice',
    processed: row.processed === 1,
    action: row.action as InboxItem['action'],
    createdAt: row.created_at,
    processedAt: row.processed_at,
    updatedAt: row.updated_at,
  };
}

export async function addInboxItem(content: string, source: 'text' | 'voice' = 'text'): Promise<InboxItem> {
  const id = createId();
  const now = new Date().toISOString();
  await dbExec(
    `INSERT INTO inbox (id, content, source, processed, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?)`,
    [id, content, source, now, now],
  );
  return { id, content, source, processed: false, action: null, createdAt: now, processedAt: null, updatedAt: now };
}

export async function getUnprocessedItems(): Promise<InboxItem[]> {
  const rows = await dbQuery<InboxRow>(
    `SELECT * FROM inbox WHERE processed = 0 ORDER BY created_at DESC`,
  );
  return rows.map(rowToItem);
}

export async function getProcessedItems(limit = 50): Promise<InboxItem[]> {
  const rows = await dbQuery<InboxRow>(
    `SELECT * FROM inbox WHERE processed = 1 ORDER BY processed_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(rowToItem);
}

export async function processItem(
  id: string,
  action: 'task' | 'journal' | 'archive',
): Promise<void> {
  const now = new Date().toISOString();
  await dbExec(
    `UPDATE inbox SET processed = 1, action = ?, processed_at = ?, updated_at = ? WHERE id = ?`,
    [action, now, now, id],
  );
}

export async function deleteItem(id: string): Promise<void> {
  await dbExec(`DELETE FROM inbox WHERE id = ?`, [id]);
}

export async function getUnprocessedCount(): Promise<number> {
  const rows = await dbQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM inbox WHERE processed = 0`,
  );
  return rows[0]?.count ?? 0;
}
```

- [ ] **Step 10: Write window state queries**

Create `src/db/queries/window-state.ts`:
```typescript
import { dbExec, dbQuery } from '../client';

export interface WindowStateRow {
  id: string;
  app_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  minimized: number;
  maximized: number;
  updated_at: string;
}

export async function saveWindowState(state: WindowStateRow): Promise<void> {
  await dbExec(
    `INSERT OR REPLACE INTO window_state (id, app_id, x, y, width, height, z_index, minimized, maximized, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [state.id, state.app_id, state.x, state.y, state.width, state.height, state.z_index, state.minimized, state.maximized, state.updated_at],
  );
}

export async function loadWindowStates(): Promise<WindowStateRow[]> {
  return dbQuery<WindowStateRow>(`SELECT * FROM window_state ORDER BY z_index ASC`);
}

export async function deleteWindowState(id: string): Promise<void> {
  await dbExec(`DELETE FROM window_state WHERE id = ?`, [id]);
}

export async function clearAllWindowStates(): Promise<void> {
  await dbExec(`DELETE FROM window_state`);
}
```

- [ ] **Step 11: Write settings queries**

Create `src/db/queries/settings.ts`:
```typescript
import { dbExec, dbQuery } from '../client';

export async function getSetting<T>(key: string): Promise<T | null> {
  const rows = await dbQuery<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key],
  );
  if (rows.length === 0) return null;
  return JSON.parse(rows[0]!.value) as T;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await dbExec(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, JSON.stringify(value)],
  );
}
```

- [ ] **Step 12: Write migration tests**

Create `tests/db/migrations.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { runMigrations } from '@/src/db/migrations';

describe('runMigrations', () => {
  it('runs v1 migration on fresh database', async () => {
    const executed: string[] = [];
    const mockExec = vi.fn(async (sql: string) => {
      executed.push(sql);
    });
    const mockQuery = vi.fn(async () => [{ value: '0' }]);

    const version = await runMigrations(mockExec, mockQuery);

    expect(version).toBe(1);
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS inbox'))).toBe(true);
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS window_state'))).toBe(true);
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS settings'))).toBe(true);
  });

  it('skips already-applied migrations', async () => {
    const executed: string[] = [];
    const mockExec = vi.fn(async (sql: string) => {
      executed.push(sql);
    });
    const mockQuery = vi.fn(async () => [{ value: '1' }]);

    const version = await runMigrations(mockExec, mockQuery);

    expect(version).toBe(1);
    // Should only run bootstrap, not schema creation
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS inbox'))).toBe(false);
  });
});
```

- [ ] **Step 13: Run tests**

```bash
pnpm vitest run
```

Expected: 2 tests pass.

- [ ] **Step 14: Commit**

```bash
git add src/db/ src/types/ src/lib/id.ts tests/db/
git commit -m "feat: add SQLite WASM database layer with migrations and inbox queries"
```

---

## Task 3: Zustand Stores

**Files:**
- Create: `src/stores/window-store.ts`, `src/stores/desktop-store.ts`, `src/stores/inbox-store.ts`, `src/types/window.ts`, `src/lib/constants.ts`
- Test: `tests/stores/window-store.test.ts`, `tests/stores/inbox-store.test.ts`

- [ ] **Step 1: Write window types**

Create `src/types/window.ts`:
```typescript
export type AppId =
  | 'brain-dump'
  | 'journal'
  | 'focus'
  | 'tasks'
  | 'dashboard'
  | 'review'
  | 'calendar'
  | 'habits'
  | 'terminal'
  | 'settings';

export interface WindowPosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ProcessWindow {
  readonly id: string;
  readonly appId: AppId;
  readonly position: WindowPosition;
  readonly zIndex: number;
  readonly minimized: boolean;
  readonly maximized: boolean;
}
```

- [ ] **Step 2: Write constants**

Create `src/lib/constants.ts`:
```typescript
import type { AppId, WindowPosition } from '@/src/types/window';

export const DEFAULT_WINDOW_SIZES: Record<AppId, WindowPosition> = {
  'brain-dump': { x: 100, y: 80, width: 480, height: 560 },
  journal: { x: 200, y: 60, width: 700, height: 600 },
  focus: { x: 300, y: 100, width: 400, height: 500 },
  tasks: { x: 150, y: 70, width: 550, height: 550 },
  dashboard: { x: 100, y: 50, width: 800, height: 600 },
  review: { x: 120, y: 60, width: 700, height: 600 },
  calendar: { x: 180, y: 50, width: 750, height: 600 },
  habits: { x: 250, y: 80, width: 500, height: 500 },
  terminal: { x: 150, y: 100, width: 600, height: 400 },
  settings: { x: 250, y: 100, width: 500, height: 450 },
};

export const APP_LABELS: Record<AppId, string> = {
  'brain-dump': 'Brain Dump',
  journal: 'Journal',
  focus: 'Focus Timer',
  tasks: 'Tasks',
  dashboard: 'Dashboard',
  review: 'Review',
  calendar: 'Calendar',
  habits: 'Habits',
  terminal: 'Terminal',
  settings: 'Settings',
};
```

- [ ] **Step 3: Write window store**

Create `src/stores/window-store.ts`:
```typescript
import { create } from 'zustand';
import { createId } from '@/src/lib/id';
import { DEFAULT_WINDOW_SIZES } from '@/src/lib/constants';
import type { AppId, ProcessWindow, WindowPosition } from '@/src/types/window';

interface WindowState {
  readonly windows: ReadonlyMap<string, ProcessWindow>;
  readonly zCounter: number;
  readonly activeWindowId: string | null;
  openWindow: (appId: AppId, position?: Partial<WindowPosition>) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  getWindowsByApp: (appId: AppId) => ProcessWindow[];
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: new Map(),
  zCounter: 1,
  activeWindowId: null,

  openWindow: (appId, position) => {
    const id = createId();
    const defaults = DEFAULT_WINDOW_SIZES[appId];
    const zCounter = get().zCounter + 1;
    const win: ProcessWindow = {
      id,
      appId,
      position: { ...defaults, ...position },
      zIndex: zCounter,
      minimized: false,
      maximized: false,
    };
    set((state) => {
      const windows = new Map(state.windows);
      windows.set(id, win);
      return { windows, zCounter, activeWindowId: id };
    });
    return id;
  },

  closeWindow: (id) => {
    set((state) => {
      const windows = new Map(state.windows);
      windows.delete(id);
      const activeWindowId = state.activeWindowId === id ? null : state.activeWindowId;
      return { windows, activeWindowId };
    });
  },

  focusWindow: (id) => {
    set((state) => {
      const win = state.windows.get(id);
      if (!win) return state;
      const zCounter = state.zCounter + 1;
      const windows = new Map(state.windows);
      windows.set(id, { ...win, zIndex: zCounter, minimized: false });
      return { windows, zCounter, activeWindowId: id };
    });
  },

  minimizeWindow: (id) => {
    set((state) => {
      const win = state.windows.get(id);
      if (!win) return state;
      const windows = new Map(state.windows);
      windows.set(id, { ...win, minimized: true });
      const activeWindowId = state.activeWindowId === id ? null : state.activeWindowId;
      return { windows, activeWindowId };
    });
  },

  maximizeWindow: (id) => {
    set((state) => {
      const win = state.windows.get(id);
      if (!win) return state;
      const windows = new Map(state.windows);
      windows.set(id, { ...win, maximized: !win.maximized });
      return { windows };
    });
  },

  restoreWindow: (id) => {
    set((state) => {
      const win = state.windows.get(id);
      if (!win) return state;
      const zCounter = state.zCounter + 1;
      const windows = new Map(state.windows);
      windows.set(id, { ...win, minimized: false, maximized: false, zIndex: zCounter });
      return { windows, zCounter, activeWindowId: id };
    });
  },

  moveWindow: (id, x, y) => {
    set((state) => {
      const win = state.windows.get(id);
      if (!win) return state;
      const windows = new Map(state.windows);
      windows.set(id, { ...win, position: { ...win.position, x, y } });
      return { windows };
    });
  },

  resizeWindow: (id, width, height) => {
    set((state) => {
      const win = state.windows.get(id);
      if (!win) return state;
      const windows = new Map(state.windows);
      windows.set(id, { ...win, position: { ...win.position, width, height } });
      return { windows };
    });
  },

  getWindowsByApp: (appId) => {
    return Array.from(get().windows.values()).filter((w) => w.appId === appId);
  },
}));
```

- [ ] **Step 4: Write desktop store**

Create `src/stores/desktop-store.ts`:
```typescript
import { create } from 'zustand';

type BootPhase = 'loading' | 'booting' | 'ready';
type TimeOfDay = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'sunset' | 'evening';

interface DesktopState {
  readonly bootPhase: BootPhase;
  readonly dbReady: boolean;
  readonly timeOfDay: TimeOfDay;
  readonly soundEnabled: boolean;
  readonly inboxCount: number;
  setBootPhase: (phase: BootPhase) => void;
  setDbReady: (ready: boolean) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  toggleSound: () => void;
  setInboxCount: (count: number) => void;
}

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 5) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 17) return 'afternoon';
  if (hour < 19) return 'sunset';
  return 'evening';
}

export const useDesktopStore = create<DesktopState>((set) => ({
  bootPhase: 'loading',
  dbReady: false,
  timeOfDay: getTimeOfDay(new Date().getHours()),
  soundEnabled: false,
  inboxCount: 0,
  setBootPhase: (phase) => set({ bootPhase: phase }),
  setDbReady: (ready) => set({ dbReady: ready }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  setInboxCount: (count) => set({ inboxCount: count }),
}));
```

- [ ] **Step 5: Write inbox store**

Create `src/stores/inbox-store.ts`:
```typescript
import { create } from 'zustand';
import type { InboxItem } from '@/src/types/inbox';
import * as inboxQueries from '@/src/db/queries/inbox';

interface InboxState {
  readonly items: readonly InboxItem[];
  readonly loading: boolean;
  load: () => Promise<void>;
  add: (content: string, source?: 'text' | 'voice') => Promise<void>;
  process: (id: string, action: 'task' | 'journal' | 'archive') => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  items: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const items = await inboxQueries.getUnprocessedItems();
    set({ items, loading: false });
  },

  add: async (content, source = 'text') => {
    const item = await inboxQueries.addInboxItem(content, source);
    set((state) => ({ items: [item, ...state.items] }));
  },

  process: async (id, action) => {
    await inboxQueries.processItem(id, action);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  remove: async (id) => {
    await inboxQueries.deleteItem(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },
}));
```

- [ ] **Step 6: Write window store tests**

Create `tests/stores/window-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '@/src/stores/window-store';

describe('windowStore', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: new Map(),
      zCounter: 1,
      activeWindowId: null,
    });
  });

  it('opens a window with default position', () => {
    const id = useWindowStore.getState().openWindow('brain-dump');
    const win = useWindowStore.getState().windows.get(id);
    expect(win).toBeDefined();
    expect(win!.appId).toBe('brain-dump');
    expect(win!.minimized).toBe(false);
    expect(useWindowStore.getState().activeWindowId).toBe(id);
  });

  it('closes a window', () => {
    const id = useWindowStore.getState().openWindow('brain-dump');
    useWindowStore.getState().closeWindow(id);
    expect(useWindowStore.getState().windows.has(id)).toBe(false);
  });

  it('focuses a window and updates z-index', () => {
    const id1 = useWindowStore.getState().openWindow('brain-dump');
    const id2 = useWindowStore.getState().openWindow('journal');
    useWindowStore.getState().focusWindow(id1);

    const win1 = useWindowStore.getState().windows.get(id1)!;
    const win2 = useWindowStore.getState().windows.get(id2)!;
    expect(win1.zIndex).toBeGreaterThan(win2.zIndex);
    expect(useWindowStore.getState().activeWindowId).toBe(id1);
  });

  it('minimizes and restores a window', () => {
    const id = useWindowStore.getState().openWindow('brain-dump');
    useWindowStore.getState().minimizeWindow(id);
    expect(useWindowStore.getState().windows.get(id)!.minimized).toBe(true);
    expect(useWindowStore.getState().activeWindowId).toBeNull();

    useWindowStore.getState().restoreWindow(id);
    expect(useWindowStore.getState().windows.get(id)!.minimized).toBe(false);
    expect(useWindowStore.getState().activeWindowId).toBe(id);
  });

  it('moves a window', () => {
    const id = useWindowStore.getState().openWindow('brain-dump');
    useWindowStore.getState().moveWindow(id, 500, 300);
    const win = useWindowStore.getState().windows.get(id)!;
    expect(win.position.x).toBe(500);
    expect(win.position.y).toBe(300);
  });
});
```

- [ ] **Step 7: Run tests**

```bash
pnpm vitest run
```

Expected: All tests pass (migration tests + window store tests).

- [ ] **Step 8: Commit**

```bash
git add src/stores/ src/types/window.ts src/lib/constants.ts tests/stores/
git commit -m "feat: add Zustand stores for window manager, desktop state, and inbox"
```

---

## Task 4: Boot Sequence Component

**Files:**
- Create: `src/components/boot/BootSequence.tsx`
- Modify: `app/(desktop)/page.tsx`
- Test: `tests/components/boot-sequence.test.tsx`

- [ ] **Step 1: Write boot sequence test**

Create `tests/components/boot-sequence.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BootSequence } from '@/src/components/boot/BootSequence';

vi.mock('@/src/db/client', () => ({
  initDb: vi.fn(async () => 1),
}));

describe('BootSequence', () => {
  it('renders boot text', () => {
    render(<BootSequence onComplete={vi.fn()} />);
    expect(screen.getByText(/place\.org/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/components/boot-sequence.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write BootSequence component**

Create `src/components/boot/BootSequence.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { initDb } from '@/src/db/client';
import { useDesktopStore } from '@/src/stores/desktop-store';

interface BootSequenceProps {
  readonly onComplete: () => void;
}

const BOOT_LINES = [
  { text: 'place.org v0.1.0', delay: 0, color: 'var(--accent-success)' },
  { text: 'initializing workspace...', delay: 300, color: 'var(--text-secondary)' },
  { text: 'loading database...', delay: 600, color: 'var(--text-secondary)' },
];

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const setDbReady = useDesktopStore((s) => s.setDbReady);
  const setBootPhase = useDesktopStore((s) => s.setBootPhase);

  useEffect(() => {
    setBootPhase('booting');

    // Reveal boot lines progressively
    for (const [index, line] of BOOT_LINES.entries()) {
      setTimeout(() => {
        setLines((prev) => [...prev, line.text]);
      }, line.delay);
    }

    // Initialize database
    initDb()
      .then((version) => {
        setDbStatus('ready');
        setDbReady(true);
        setTimeout(() => {
          setLines((prev) => [...prev, `database ready (v${version})`]);
        }, 800);
        setTimeout(() => {
          setLines((prev) => [...prev, 'welcome to place.org']);
          setTimeout(onComplete, 600);
        }, 1200);
      })
      .catch(() => {
        setDbStatus('error');
        setLines((prev) => [...prev, 'error: database failed to initialize']);
      });
  }, [onComplete, setDbReady, setBootPhase]);

  return (
    <div
      className="flex h-full w-full flex-col justify-center px-12"
      role="status"
      aria-label="Loading place.org"
      onClick={dbStatus === 'ready' ? onComplete : undefined}
      onKeyDown={(e) => {
        if (e.key && dbStatus === 'ready') onComplete();
      }}
    >
      <div className="max-w-md font-mono text-sm leading-relaxed">
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                color: i === 0
                  ? 'var(--accent-success)'
                  : i === lines.length - 1 && line.includes('welcome')
                    ? 'var(--accent-blue)'
                    : 'var(--text-secondary)',
              }}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
        {dbStatus === 'loading' && (
          <motion.span
            className="inline-block"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ color: 'var(--text-secondary)' }}
          >
            _
          </motion.span>
        )}
      </div>
      {dbStatus === 'ready' && (
        <p className="mt-8 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          press any key to continue
        </p>
      )}
      {dbStatus === 'error' && (
        <div className="mt-8">
          <p className="font-mono text-xs" style={{ color: 'var(--accent-urgent)' }}>
            Failed to initialize. Try refreshing the page.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/components/boot-sequence.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Wire boot into desktop page**

Update `app/(desktop)/page.tsx`:
```tsx
'use client';

import { useState, useCallback } from 'react';
import { BootSequence } from '@/src/components/boot/BootSequence';
import { useDesktopStore } from '@/src/stores/desktop-store';

export default function DesktopPage() {
  const bootPhase = useDesktopStore((s) => s.bootPhase);
  const setBootPhase = useDesktopStore((s) => s.setBootPhase);
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBootPhase('ready');
    setBooted(true);
  }, [setBootPhase]);

  if (!booted) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
        Desktop ready. Window manager loading...
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

```bash
pnpm dev
```

Open http://localhost:3000. Expect: boot text appearing line by line, then "press any key to continue", then "Desktop ready."

- [ ] **Step 7: Commit**

```bash
git add src/components/boot/ app/ tests/components/
git commit -m "feat: add boot sequence with database initialization"
```

---

## Task 5: Window Manager + Window Component

**Files:**
- Create: `src/components/window-manager/WindowManager.tsx`, `src/components/window-manager/Window.tsx`, `src/components/window-manager/WindowTitleBar.tsx`, `src/components/ui/GlassPanel.tsx`, `src/hooks/use-window-manager.ts`
- Test: `tests/components/window.test.tsx`

- [ ] **Step 1: Write GlassPanel reusable component**

Create `src/components/ui/GlassPanel.tsx`:
```tsx
import type { HTMLAttributes } from 'react';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
}

export function GlassPanel({ children, className = '', ...props }: GlassPanelProps) {
  return (
    <div
      className={`glass rounded-xl ${className}`}
      style={{ contain: 'strict' }}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write WindowTitleBar**

Create `src/components/window-manager/WindowTitleBar.tsx`:
```tsx
'use client';

import { APP_LABELS } from '@/src/lib/constants';
import type { AppId } from '@/src/types/window';

interface WindowTitleBarProps {
  readonly appId: AppId;
  readonly onMinimize: () => void;
  readonly onMaximize: () => void;
  readonly onClose: () => void;
}

export function WindowTitleBar({ appId, onMinimize, onMaximize, onClose }: WindowTitleBarProps) {
  return (
    <div
      className="drag-handle flex h-9 cursor-grab items-center justify-between rounded-t-xl px-3 select-none active:cursor-grabbing"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid var(--border)',
      }}
      onDoubleClick={onMaximize}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {APP_LABELS[appId]}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onMinimize}
          className="flex h-3 w-3 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-warm)]"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          aria-label="Minimize"
        />
        <button
          type="button"
          onClick={onMaximize}
          className="flex h-3 w-3 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-success)]"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          aria-label="Maximize"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex h-3 w-3 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-urgent)]"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          aria-label="Close"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write Window component**

Create `src/components/window-manager/Window.tsx`:
```tsx
'use client';

import { Rnd } from 'react-rnd';
import { motion } from 'motion/react';
import { WindowTitleBar } from './WindowTitleBar';
import { useWindowStore } from '@/src/stores/window-store';
import type { ProcessWindow } from '@/src/types/window';

interface WindowProps {
  readonly window: ProcessWindow;
  readonly children: React.ReactNode;
}

export function Window({ window: win, children }: WindowProps) {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, moveWindow, resizeWindow } =
    useWindowStore();

  if (win.minimized) return null;

  const handleDragStop = (_e: unknown, data: { x: number; y: number }) => {
    moveWindow(win.id, data.x, data.y);
  };

  const handleResizeStop = (
    _e: unknown,
    _dir: unknown,
    ref: HTMLElement,
    _delta: unknown,
    position: { x: number; y: number },
  ) => {
    resizeWindow(win.id, ref.offsetWidth, ref.offsetHeight);
    moveWindow(win.id, position.x, position.y);
  };

  if (win.maximized) {
    return (
      <motion.div
        className="glass absolute inset-0 top-10 bottom-12 z-50 flex flex-col overflow-hidden rounded-xl"
        style={{ zIndex: win.zIndex }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
        onMouseDown={() => focusWindow(win.id)}
        role="dialog"
        aria-label={win.appId}
      >
        <WindowTitleBar
          appId={win.appId}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onClose={() => closeWindow(win.id)}
        />
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </motion.div>
    );
  }

  return (
    <Rnd
      position={{ x: win.position.x, y: win.position.y }}
      size={{ width: win.position.width, height: win.position.height }}
      dragHandleClassName="drag-handle"
      minWidth={300}
      minHeight={200}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => focusWindow(win.id)}
      style={{ zIndex: win.zIndex }}
      bounds="parent"
    >
      <motion.div
        className="glass flex h-full flex-col overflow-hidden rounded-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
        role="dialog"
        aria-label={win.appId}
      >
        <WindowTitleBar
          appId={win.appId}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onClose={() => closeWindow(win.id)}
        />
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </motion.div>
    </Rnd>
  );
}
```

- [ ] **Step 4: Write WindowManager**

Create `src/components/window-manager/WindowManager.tsx`:
```tsx
'use client';

import dynamic from 'next/dynamic';
import { Window } from './Window';
import { useWindowStore } from '@/src/stores/window-store';
import type { AppId } from '@/src/types/window';

// Lazy-load app components
const APP_COMPONENTS: Record<AppId, React.ComponentType> = {
  'brain-dump': dynamic(() =>
    import('@/src/components/apps/brain-dump/BrainDumpApp').then((m) => ({ default: m.BrainDumpApp })),
  ),
  // Placeholder for future apps
  journal: () => <PlaceholderApp name="Journal" />,
  focus: () => <PlaceholderApp name="Focus Timer" />,
  tasks: () => <PlaceholderApp name="Tasks" />,
  dashboard: () => <PlaceholderApp name="Dashboard" />,
  review: () => <PlaceholderApp name="Review" />,
  calendar: () => <PlaceholderApp name="Calendar" />,
  habits: () => <PlaceholderApp name="Habits" />,
  terminal: () => <PlaceholderApp name="Terminal" />,
  settings: () => <PlaceholderApp name="Settings" />,
};

function PlaceholderApp({ name }: { readonly name: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
        {name} — coming in v0.2
      </p>
    </div>
  );
}

export function WindowManager() {
  const windows = useWindowStore((s) => s.windows);

  return (
    <div className="absolute inset-0 top-10 bottom-12">
      {Array.from(windows.values()).map((win) => {
        const AppComponent = APP_COMPONENTS[win.appId];
        return (
          <Window key={win.id} window={win}>
            <AppComponent />
          </Window>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Write window component test**

Create `tests/components/window.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WindowTitleBar } from '@/src/components/window-manager/WindowTitleBar';

describe('WindowTitleBar', () => {
  const mockMinimize = vi.fn();
  const mockMaximize = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app name', () => {
    render(
      <WindowTitleBar
        appId="brain-dump"
        onMinimize={mockMinimize}
        onMaximize={mockMaximize}
        onClose={mockClose}
      />,
    );
    expect(screen.getByText('Brain Dump')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(
      <WindowTitleBar
        appId="brain-dump"
        onMinimize={mockMinimize}
        onMaximize={mockMaximize}
        onClose={mockClose}
      />,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 6: Run tests**

```bash
pnpm vitest run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/window-manager/ src/components/ui/ src/hooks/ tests/components/window.test.tsx
git commit -m "feat: add window manager with draggable, resizable glass windows"
```

---

## Task 6: Dock Component

**Files:**
- Create: `src/components/desktop/Dock.tsx`, `src/components/desktop/DockIcon.tsx`
- Test: `tests/components/dock.test.tsx`

- [ ] **Step 1: Write dock test**

Create `tests/components/dock.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dock } from '@/src/components/desktop/Dock';
import { useWindowStore } from '@/src/stores/window-store';

describe('Dock', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: new Map(), zCounter: 1, activeWindowId: null });
  });

  it('renders app icons', () => {
    render(<Dock />);
    expect(screen.getByLabelText('Brain Dump')).toBeInTheDocument();
  });

  it('opens a window when icon is clicked', () => {
    render(<Dock />);
    fireEvent.click(screen.getByLabelText('Brain Dump'));
    expect(useWindowStore.getState().windows.size).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/components/dock.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Write DockIcon**

Create `src/components/desktop/DockIcon.tsx`:
```tsx
'use client';

import { motion } from 'motion/react';

interface DockIconProps {
  readonly label: string;
  readonly icon: string;
  readonly isOpen: boolean;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly badge?: number;
}

export function DockIcon({ label, icon, isOpen, isActive, onClick, badge }: DockIconProps) {
  return (
    <motion.button
      type="button"
      className="relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors"
      style={{
        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
      }}
      whileHover={{ scale: 1.15, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      aria-label={label}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[9px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {isOpen && (
        <div
          className="absolute -bottom-1 h-1 w-1 rounded-full"
          style={{ background: 'var(--accent-blue)' }}
        />
      )}
      {badge !== undefined && badge > 0 && (
        <div
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
          style={{ background: 'var(--accent-blue)' }}
        >
          {badge}
        </div>
      )}
    </motion.button>
  );
}
```

- [ ] **Step 4: Write Dock**

Create `src/components/desktop/Dock.tsx`:
```tsx
'use client';

import { DockIcon } from './DockIcon';
import { useWindowStore } from '@/src/stores/window-store';
import { useDesktopStore } from '@/src/stores/desktop-store';
import type { AppId } from '@/src/types/window';

const DOCK_APPS: { id: AppId; icon: string; label: string }[] = [
  { id: 'brain-dump', icon: '🧠', label: 'Brain Dump' },
  { id: 'journal', icon: '📓', label: 'Journal' },
  { id: 'focus', icon: '◉', label: 'Focus' },
  { id: 'tasks', icon: '✓', label: 'Tasks' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'terminal', icon: '▸', label: 'Terminal' },
];

export function Dock() {
  const { windows, activeWindowId, openWindow, focusWindow, minimizeWindow, restoreWindow } =
    useWindowStore();
  const inboxCount = useDesktopStore((s) => s.inboxCount);

  const handleIconClick = (appId: AppId) => {
    // Find existing window for this app
    const existing = Array.from(windows.values()).find((w) => w.appId === appId);
    if (existing) {
      if (existing.minimized) {
        restoreWindow(existing.id);
      } else if (existing.id === activeWindowId) {
        minimizeWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
    } else {
      openWindow(appId);
    }
  };

  return (
    <div
      className="glass absolute bottom-2 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl px-3 py-1.5"
      role="toolbar"
      aria-label="Dock"
    >
      {DOCK_APPS.map((app) => {
        const isOpen = Array.from(windows.values()).some((w) => w.appId === app.id);
        const isActive = Array.from(windows.values()).some(
          (w) => w.appId === app.id && w.id === activeWindowId,
        );
        return (
          <DockIcon
            key={app.id}
            label={app.label}
            icon={app.icon}
            isOpen={isOpen}
            isActive={isActive}
            onClick={() => handleIconClick(app.id)}
            badge={app.id === 'brain-dump' ? inboxCount : undefined}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/desktop/Dock.tsx src/components/desktop/DockIcon.tsx tests/components/dock.test.tsx
git commit -m "feat: add dock with app icons, magnification, and badge counts"
```

---

## Task 7: Ambient Bar + Desktop Surface

**Files:**
- Create: `src/components/desktop/AmbientBar.tsx`, `src/components/desktop/DesktopSurface.tsx`, `src/components/desktop/CursorLight.tsx`, `src/hooks/use-cursor-light.ts`, `src/hooks/use-time-of-day.ts`, `src/lib/time.ts`

- [ ] **Step 1: Write time utility**

Create `src/lib/time.ts`:
```typescript
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

- [ ] **Step 2: Write use-time-of-day hook**

Create `src/hooks/use-time-of-day.ts`:
```typescript
'use client';

import { useEffect } from 'react';
import { useDesktopStore, getTimeOfDay } from '@/src/stores/desktop-store';

export function useTimeOfDay() {
  const timeOfDay = useDesktopStore((s) => s.timeOfDay);
  const setTimeOfDay = useDesktopStore((s) => s.setTimeOfDay);

  useEffect(() => {
    const update = () => setTimeOfDay(getTimeOfDay(new Date().getHours()));
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [setTimeOfDay]);

  return timeOfDay;
}
```

- [ ] **Step 3: Write cursor light hook**

Create `src/hooks/use-cursor-light.ts`:
```typescript
'use client';

import { useEffect, useRef } from 'react';

export function useCursorLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: PointerEvent) => {
      el.style.setProperty('--cursor-x', `${e.clientX}px`);
      el.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return ref;
}
```

- [ ] **Step 4: Write CursorLight**

Create `src/components/desktop/CursorLight.tsx`:
```tsx
'use client';

import { useCursorLight } from '@/src/hooks/use-cursor-light';

export function CursorLight() {
  const ref = useCursorLight();

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(91,156,245,0.04), transparent 70%)',
      }}
    />
  );
}
```

- [ ] **Step 5: Write AmbientBar**

Create `src/components/desktop/AmbientBar.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useDesktopStore } from '@/src/stores/desktop-store';
import { formatDate, formatTime } from '@/src/lib/time';

export function AmbientBar() {
  const inboxCount = useDesktopStore((s) => s.inboxCount);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="glass absolute top-0 right-0 left-0 z-50 flex h-10 items-center justify-between px-4 text-xs"
      role="banner"
    >
      <span className="font-medium" style={{ color: 'var(--accent-blue)' }}>
        place.org
      </span>

      <span style={{ color: 'var(--text-secondary)' }}>
        {formatDate(now)} &nbsp; {formatTime(now)}
      </span>

      <div className="flex items-center gap-4" style={{ color: 'var(--text-secondary)' }}>
        {inboxCount > 0 && (
          <span>
            🧠 {inboxCount} inbox
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write DesktopSurface**

Create `src/components/desktop/DesktopSurface.tsx`:
```tsx
'use client';

import { CursorLight } from './CursorLight';
import { useTimeOfDay } from '@/src/hooks/use-time-of-day';

const TIME_GRADIENTS: Record<string, string> = {
  night: 'from-[#0a0818] to-[#060610]',
  dawn: 'from-[#1a1020] to-[#0a0e1a]',
  morning: 'from-[#080c1a] to-[#060610]',
  midday: 'from-[#060a18] to-[#060610]',
  afternoon: 'from-[#080e20] to-[#060610]',
  sunset: 'from-[#120a1a] to-[#060610]',
  evening: 'from-[#080812] to-[#060610]',
};

export function DesktopSurface() {
  const timeOfDay = useTimeOfDay();
  const gradient = TIME_GRADIENTS[timeOfDay] ?? TIME_GRADIENTS.night;

  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient} transition-colors duration-[60000ms]`} />
      <CursorLight />
    </>
  );
}
```

- [ ] **Step 7: Wire everything into the desktop page**

Update `app/(desktop)/page.tsx`:
```tsx
'use client';

import { useState, useCallback } from 'react';
import { BootSequence } from '@/src/components/boot/BootSequence';
import { AmbientBar } from '@/src/components/desktop/AmbientBar';
import { Dock } from '@/src/components/desktop/Dock';
import { DesktopSurface } from '@/src/components/desktop/DesktopSurface';
import { WindowManager } from '@/src/components/window-manager/WindowManager';
import { useDesktopStore } from '@/src/stores/desktop-store';

export default function DesktopPage() {
  const setBootPhase = useDesktopStore((s) => s.setBootPhase);
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBootPhase('ready');
    setBooted(true);
  }, [setBootPhase]);

  if (!booted) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <>
      <DesktopSurface />
      <AmbientBar />
      <WindowManager />
      <Dock />
    </>
  );
}
```

- [ ] **Step 8: Verify in browser**

```bash
pnpm dev
```

Expect: Boot sequence → desktop with ambient bar (date/time), cursor light effect, dock at bottom. Clicking dock icons opens windows. Windows are draggable and resizable.

- [ ] **Step 9: Commit**

```bash
git add src/components/desktop/ src/hooks/ src/lib/time.ts app/(desktop)/page.tsx
git commit -m "feat: add ambient bar, desktop surface with cursor light, and time-of-day gradient"
```

---

## Task 8: Brain Dump App

**Files:**
- Create: `src/components/apps/brain-dump/BrainDumpApp.tsx`, `src/components/apps/brain-dump/CaptureInput.tsx`, `src/components/apps/brain-dump/InboxQueue.tsx`, `src/components/apps/brain-dump/InboxItem.tsx`
- Test: `tests/components/brain-dump.test.tsx`

- [ ] **Step 1: Write brain dump test**

Create `tests/components/brain-dump.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaptureInput } from '@/src/components/apps/brain-dump/CaptureInput';

describe('CaptureInput', () => {
  it('calls onCapture when submitting text', () => {
    const onCapture = vi.fn();
    render(<CaptureInput onCapture={onCapture} />);

    const input = screen.getByPlaceholderText(/type or speak/i);
    fireEvent.change(input, { target: { value: 'Test thought' } });
    fireEvent.submit(input.closest('form')!);

    expect(onCapture).toHaveBeenCalledWith('Test thought', 'text');
  });

  it('does not submit empty input', () => {
    const onCapture = vi.fn();
    render(<CaptureInput onCapture={onCapture} />);

    const input = screen.getByPlaceholderText(/type or speak/i);
    fireEvent.submit(input.closest('form')!);

    expect(onCapture).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/components/brain-dump.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Write CaptureInput**

Create `src/components/apps/brain-dump/CaptureInput.tsx`:
```tsx
'use client';

import { useState, useRef } from 'react';

interface CaptureInputProps {
  readonly onCapture: (content: string, source: 'text' | 'voice') => void;
}

export function CaptureInput({ onCapture }: CaptureInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onCapture(trimmed, 'text');
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type or speak..."
        className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--border-hover)]"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
        autoFocus
      />
      <button
        type="submit"
        className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          background: 'var(--accent-blue)',
          color: '#fff',
        }}
      >
        ⏎
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Write InboxItem component**

Create `src/components/apps/brain-dump/InboxItem.tsx`:
```tsx
'use client';

import { motion } from 'motion/react';
import { relativeTime } from '@/src/lib/time';
import type { InboxItem as InboxItemType } from '@/src/types/inbox';

interface InboxItemProps {
  readonly item: InboxItemType;
  readonly onProcess: (action: 'task' | 'journal' | 'archive') => void;
  readonly onDelete: () => void;
}

export function InboxItem({ item, onProcess, onDelete }: InboxItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass rounded-lg p-3"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
          {item.content}
        </p>
        <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          {relativeTime(item.createdAt)}
        </span>
      </div>
      <div className="flex gap-1.5">
        {(['task', 'journal', 'archive'] as const).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onProcess(action)}
            className="rounded px-2 py-0.5 text-[10px] font-medium capitalize transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {action}
          </button>
        ))}
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto rounded px-2 py-0.5 text-[10px] transition-colors hover:bg-[rgba(239,107,107,0.1)]"
          style={{ color: 'var(--accent-urgent)' }}
        >
          delete
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 5: Write InboxQueue**

Create `src/components/apps/brain-dump/InboxQueue.tsx`:
```tsx
'use client';

import { AnimatePresence } from 'motion/react';
import { InboxItem } from './InboxItem';
import type { InboxItem as InboxItemType } from '@/src/types/inbox';

interface InboxQueueProps {
  readonly items: readonly InboxItemType[];
  readonly onProcess: (id: string, action: 'task' | 'journal' | 'archive') => void;
  readonly onDelete: (id: string) => void;
}

export function InboxQueue({ items, onProcess, onDelete }: InboxQueueProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          Inbox zero. Nice.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-auto">
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        Unprocessed ({items.length})
      </p>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <InboxItem
            key={item.id}
            item={item}
            onProcess={(action) => onProcess(item.id, action)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 6: Write BrainDumpApp**

Create `src/components/apps/brain-dump/BrainDumpApp.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { CaptureInput } from './CaptureInput';
import { InboxQueue } from './InboxQueue';
import { useInboxStore } from '@/src/stores/inbox-store';
import { useDesktopStore } from '@/src/stores/desktop-store';

export function BrainDumpApp() {
  const { items, loading, load, add, process, remove } = useInboxStore();
  const setInboxCount = useDesktopStore((s) => s.setInboxCount);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setInboxCount(items.length);
  }, [items.length, setInboxCount]);

  return (
    <div className="flex h-full flex-col gap-4">
      <CaptureInput onCapture={add} />
      {loading ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : (
        <InboxQueue items={items} onProcess={process} onDelete={remove} />
      )}
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
pnpm vitest run
```

Expected: All pass.

- [ ] **Step 8: Verify in browser**

Open http://localhost:3000. Boot → desktop → click Brain Dump in dock → type a thought → press Enter → see it in the queue → click "archive" → it disappears. Badge count updates on dock icon.

- [ ] **Step 9: Commit**

```bash
git add src/components/apps/brain-dump/ tests/components/brain-dump.test.tsx
git commit -m "feat: add Brain Dump app with capture input, inbox queue, and process actions"
```

---

## Task 9: Keyboard Shortcuts

**Files:**
- Create: `src/hooks/use-keyboard-shortcuts.ts`
- Modify: `app/(desktop)/page.tsx`

- [ ] **Step 1: Write keyboard shortcuts hook**

Create `src/hooks/use-keyboard-shortcuts.ts`:
```typescript
'use client';

import { useEffect } from 'react';
import { useWindowStore } from '@/src/stores/window-store';
import type { AppId } from '@/src/types/window';

const APP_SHORTCUTS: Record<string, AppId> = {
  b: 'brain-dump',
  j: 'journal',
  f: 'focus',
  t: 'terminal',
  d: 'dashboard',
};

export function useKeyboardShortcuts() {
  const { openWindow, windows, activeWindowId, minimizeWindow, closeWindow, maximizeWindow, focusWindow } =
    useWindowStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+Key for app shortcuts
      if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
        const appId = APP_SHORTCUTS[e.key.toLowerCase()];
        if (appId) {
          e.preventDefault();
          const existing = Array.from(windows.values()).find((w) => w.appId === appId);
          if (existing) {
            focusWindow(existing.id);
          } else {
            openWindow(appId);
          }
          return;
        }
      }

      // Ctrl+K for command palette (future)
      if (e.ctrlKey && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        // TODO: open command palette
        return;
      }

      // Esc to minimize active window
      if (e.key === 'Escape' && activeWindowId) {
        e.preventDefault();
        minimizeWindow(activeWindowId);
        return;
      }

      // Ctrl+Shift+W to close active window
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeWindowId) closeWindow(activeWindowId);
        return;
      }

      // Ctrl+Shift+M to maximize/restore active window
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (activeWindowId) maximizeWindow(activeWindowId);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openWindow, windows, activeWindowId, minimizeWindow, closeWindow, maximizeWindow, focusWindow]);
}
```

- [ ] **Step 2: Wire into desktop page**

Add to `app/(desktop)/page.tsx` inside the component, after the `if (!booted)` block:

Import the hook:
```tsx
import { useKeyboardShortcuts } from '@/src/hooks/use-keyboard-shortcuts';
```

Call it inside the component before the return:
```tsx
useKeyboardShortcuts();
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000. After boot: Ctrl+Shift+B opens Brain Dump. Esc minimizes it. Ctrl+Shift+B again restores it. Ctrl+Shift+W closes it.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-keyboard-shortcuts.ts app/(desktop)/page.tsx
git commit -m "feat: add global keyboard shortcuts for apps and window management"
```

---

## Task 10: PWA Setup + Final Integration

**Files:**
- Create: `public/manifest.json`, PWA config in `next.config.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install Serwist**

```bash
pnpm add @serwist/next
pnpm add -D serwist
```

- [ ] **Step 2: Create manifest**

Create `public/manifest.json`:
```json
{
  "name": "place.org",
  "short_name": "place.org",
  "description": "Personal operating system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#060610",
  "theme_color": "#060610",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 3: Add manifest link to layout**

Update `app/layout.tsx` metadata:
```tsx
export const metadata: Metadata = {
  title: 'place.org',
  description: 'Personal operating system',
  manifest: '/manifest.json',
  themeColor: '#060610',
};
```

- [ ] **Step 4: Verify build succeeds**

```bash
pnpm build
```

Expected: Build completes without errors.

- [ ] **Step 5: Final commit for v0.1**

```bash
git add -A
git commit -m "feat: add PWA manifest and complete v0.1 desktop shell

v0.1 delivers: boot sequence, ambient bar, dock with magnification,
window manager (drag/resize/minimize/maximize/close/z-index), desktop
surface with cursor light and time-of-day gradient, Brain Dump app
with capture and process, keyboard shortcuts, SQLite WASM database,
and PWA manifest."
```

---

## v0.1 Completion Checklist

After all tasks are done, verify:

- [ ] Boot sequence plays, initializes SQLite, transitions to desktop
- [ ] Ambient bar shows date/time and inbox count
- [ ] Dock shows app icons with magnification hover effect
- [ ] Clicking Brain Dump in dock opens a draggable window
- [ ] Window can be dragged, resized, minimized, maximized, closed
- [ ] Brain Dump: type text → Enter → appears in queue
- [ ] Brain Dump: click task/journal/archive → item is processed
- [ ] Inbox count badge updates on dock icon
- [ ] Ctrl+Shift+B opens Brain Dump, Esc minimizes, Ctrl+Shift+W closes
- [ ] Cursor light follows mouse
- [ ] Background gradient matches time of day
- [ ] `pnpm build` succeeds
- [ ] `pnpm vitest run` all tests pass
