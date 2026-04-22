# Virtual File System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete virtual file system with disk-backed file storage, Photos/Documents apps, desktop file icons, multi-window Finder, file associations, clipboard operations, versioning, and Pipes automation — all per-user.

**Architecture:** Server-side SQLite (better-sqlite3) stores file metadata + binary content. A dedicated `/api/files` endpoint handles uploads/downloads with multipart support. The existing Finder app is extended to support user files alongside app-generated files. New `files` and `virtual_folders` tables in migration v10. Desktop icons render files from `~/Desktop` folder. New Photos and Document Viewer apps registered in the standard app system.

**Tech Stack:** better-sqlite3, Next.js API routes (multipart), Zustand stores, existing Finder/Desktop component patterns

---

## Phase Decomposition

This project is split into 5 independent phases. Each produces working, testable software.

| Phase | Scope | Depends On |
|-------|-------|-----------|
| **Phase 1** | DB schema + file store + upload/download API + Finder integration | Nothing |
| **Phase 2** | Desktop file icons + drag-drop from OS + context menus | Phase 1 |
| **Phase 3** | Photos app + Document Viewer app + file associations | Phase 1 |
| **Phase 4** | Clipboard (cut/copy/paste) + multi-window Finder + tabs | Phase 1 |
| **Phase 5** | Versioning + Pipes integration + sharing + storage management | Phase 1-3 |

---

## Phase 1: File Storage Foundation

### File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/db/queries/files.ts` | CRUD for files + virtual_folders tables |
| Create | `src/stores/file-store.ts` | Zustand store for file operations |
| Create | `app/api/files/route.ts` | Upload (POST multipart) + list (GET) |
| Create | `app/api/files/[id]/route.ts` | Download (GET) + delete (DELETE) + rename (PATCH) |
| Modify | `src/db/schema.ts` | Migration v10: files + virtual_folders tables |
| Modify | `src/stores/finder-store.ts` | Integrate user files into folder tree |
| Modify | `src/components/apps/finder/FinderApp.tsx` | Upload button, file type icons, thumbnail previews |
| Modify | `src/lib/app-registrations.ts` | Wire Finder to file store |
| Create | `src/lib/file-utils.ts` | MIME type detection, thumbnail generation, size formatting |
| Create | `tests/db/files.test.ts` | File query tests |

---

### Task 1: Database Schema — Migration v10

**Files:**
- Modify: `src/db/schema.ts` (append migration v10)

- [ ] **Step 1: Add migration v10 to schema.ts**

```typescript
{
  version: 10,
  sql: `
    CREATE TABLE IF NOT EXISTS virtual_folders (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL DEFAULT 'guest',
      name       TEXT NOT NULL,
      parent_id  TEXT,
      is_system  INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vfolders_user ON virtual_folders(user_id);
    CREATE INDEX IF NOT EXISTS idx_vfolders_parent ON virtual_folders(parent_id);

    CREATE TABLE IF NOT EXISTS files (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL DEFAULT 'guest',
      folder_id   TEXT NOT NULL DEFAULT 'desktop',
      filename    TEXT NOT NULL,
      mime_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
      size_bytes  INTEGER NOT NULL DEFAULT 0,
      data        BLOB,
      thumbnail   BLOB,
      metadata    TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
    CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
    CREATE INDEX IF NOT EXISTS idx_files_name ON files(filename);
  `,
},
```

- [ ] **Step 2: Verify migration runs**

Run: `curl -s http://localhost:3000/api/db -X POST -H 'Content-Type: application/json' -d '{"type":"query","sql":"SELECT name FROM sqlite_master WHERE type=\"table\" AND name IN (\"files\",\"virtual_folders\")","params":[]}'`

Expected: Both tables listed.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat(files): add migration v10 — files + virtual_folders tables"
```

---

### Task 2: File Queries

**Files:**
- Create: `src/db/queries/files.ts`

- [ ] **Step 1: Create file queries module**

```typescript
// src/db/queries/files.ts
import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { DbClient } from "../client";

export interface VirtualFolderRow {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly isSystem: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FileRow {
  readonly id: string;
  readonly userId: string;
  readonly folderId: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly metadata: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function rowToFolder(row: Record<string, unknown>): VirtualFolderRow { /* map columns */ }
function rowToFile(row: Record<string, unknown>): FileRow { /* map columns, exclude blob */ }

// Folder CRUD
export async function getUserFolders(db: DbClient): Promise<VirtualFolderRow[]> { /* WHERE user_id = ? */ }
export async function createFolder(db: DbClient, name: string, parentId: string | null): Promise<VirtualFolderRow> { /* INSERT */ }
export async function renameFolder(db: DbClient, id: string, name: string): Promise<void> { /* UPDATE */ }
export async function deleteFolder(db: DbClient, id: string): Promise<void> { /* DELETE cascade */ }
export async function ensureSystemFolders(db: DbClient): Promise<void> { /* Create desktop/documents/photos if missing */ }

// File CRUD (metadata only — blobs handled by /api/files)
export async function getFilesInFolder(db: DbClient, folderId: string): Promise<FileRow[]> { /* WHERE folder_id = ? AND user_id = ? */ }
export async function getFileById(db: DbClient, id: string): Promise<FileRow | null> { /* WHERE id = ? AND user_id = ? */ }
export async function createFileRecord(db: DbClient, opts: { filename: string; folderId: string; mimeType: string; sizeBytes: number; metadata?: string }): Promise<FileRow> { /* INSERT */ }
export async function renameFile(db: DbClient, id: string, filename: string): Promise<void> { /* UPDATE */ }
export async function moveFile(db: DbClient, id: string, folderId: string): Promise<void> { /* UPDATE folder_id */ }
export async function deleteFile(db: DbClient, id: string): Promise<void> { /* DELETE */ }
export async function searchFiles(db: DbClient, query: string): Promise<FileRow[]> { /* LIKE on filename */ }
```

All functions use `getCurrentUserId()` for user isolation.

- [ ] **Step 2: Commit**

```bash
git add src/db/queries/files.ts
git commit -m "feat(files): add file and folder query functions"
```

---

### Task 3: File Upload/Download API

**Files:**
- Create: `app/api/files/route.ts` (upload + list)
- Create: `app/api/files/[id]/route.ts` (download + delete + rename + move)

- [ ] **Step 1: Create upload endpoint**

`POST /api/files` — multipart form data with `file` field + `folderId` field.
- Reads binary data from the uploaded file
- Inserts metadata row via `better-sqlite3` directly (not through `/api/db`)
- Stores BLOB in the `data` column
- For images: generates a thumbnail (resized to 200px wide) and stores in `thumbnail` column
- Returns the file metadata JSON

`GET /api/files?folderId=xxx` — list files in a folder (metadata only, no blobs).

- [ ] **Step 2: Create download/manage endpoint**

`GET /api/files/[id]` — returns the raw binary data with correct Content-Type header.
`GET /api/files/[id]?thumbnail=1` — returns the thumbnail BLOB if available.
`DELETE /api/files/[id]` — deletes the file record and blob.
`PATCH /api/files/[id]` — rename (`{ filename }`) or move (`{ folderId }`).

All endpoints check `user_id` matches the authenticated user via `getCurrentUserId()` pattern (read from cookie/header or localStorage session).

- [ ] **Step 3: Commit**

```bash
git add app/api/files/route.ts app/api/files/\[id\]/route.ts
git commit -m "feat(files): add upload/download/manage API endpoints"
```

---

### Task 4: File Store (Zustand)

**Files:**
- Create: `src/stores/file-store.ts`

- [ ] **Step 1: Create the file store**

```typescript
interface FileStoreState {
  readonly files: readonly FileRow[];
  readonly folders: readonly VirtualFolderRow[];
  readonly currentFolderId: string;
  readonly loading: boolean;
}

interface FileStoreActions {
  loadFolder(folderId: string): Promise<void>;
  loadFolders(): Promise<void>;
  upload(file: File, folderId: string): Promise<void>;
  download(id: string): Promise<void>;
  rename(id: string, filename: string): Promise<void>;
  move(id: string, folderId: string): Promise<void>;
  remove(id: string): Promise<void>;
  createFolder(name: string, parentId: string | null): Promise<void>;
  renameFolder(id: string, name: string): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  rehydrate(): void;
}
```

Upload uses `fetch('/api/files', { method: 'POST', body: FormData })`.
Download uses `window.open('/api/files/{id}')` or creates a blob URL.
All other operations use the standard `/api/db` endpoint.

- [ ] **Step 2: Add to rehydrate-stores.ts**

Import `useFileStore` and call `void useFileStore.getState().loadFolders()` in `scheduleDbReload`.

- [ ] **Step 3: Commit**

```bash
git add src/stores/file-store.ts src/lib/rehydrate-stores.ts
git commit -m "feat(files): add file store with upload/download/folder management"
```

---

### Task 5: Integrate Files into Finder

**Files:**
- Modify: `src/stores/finder-store.ts` — add user files/folders alongside app folders
- Modify: `src/components/apps/finder/FinderApp.tsx` — upload button, thumbnails, file icons, drag-drop
- Create: `src/lib/file-utils.ts` — MIME icons, size formatting, thumbnail URL helper

- [ ] **Step 1: Update finder-store to include user folders**

Merge system folders (desktop, documents, photos) from `virtual_folders` table with app-generated folders. User-created folders appear under the appropriate parent in the tree.

`getFilesForFolder()` now checks: if folder is `app-*`, delegate to app registry. If folder is `desktop`/`documents`/`photos`/user-created, fetch from file store.

- [ ] **Step 2: Add upload UI to Finder**

- "Upload" button in Finder toolbar (opens native file picker)
- Drag-drop zone over the file list area (accepts files from native OS)
- Upload progress indicator
- After upload, refresh file list

- [ ] **Step 3: Add file type icons and thumbnails**

- Image files show thumbnail in the file list (loaded from `/api/files/{id}?thumbnail=1`)
- Other files show type-based icons (document, audio, video, archive, code, generic)
- File size column added to the list

- [ ] **Step 4: Add file operations to Finder**

- Right-click context menu on files: Open, Download, Rename, Move To, Delete
- Right-click on empty space: New Folder, Upload File
- Double-click file: opens in associated app (Phase 3) or downloads
- Rename inline (click selected filename)
- Delete with confirmation toast

- [ ] **Step 5: Commit**

```bash
git add src/stores/finder-store.ts src/components/apps/finder/ src/lib/file-utils.ts
git commit -m "feat(files): integrate file storage into Finder with upload/download/manage"
```

---

### Task 6: Ensure System Folders Per User

**Files:**
- Modify: `src/db/queries/files.ts` — `ensureSystemFolders`
- Modify: `src/stores/file-store.ts` — call on load

- [ ] **Step 1: Implement ensureSystemFolders**

On first load for a user, create rows in `virtual_folders` for: `desktop`, `documents`, `photos` (with `is_system = 1`). Idempotent — checks if they exist first.

- [ ] **Step 2: Call during loadFolders**

`loadFolders()` in the file store calls `ensureSystemFolders()` before querying.

- [ ] **Step 3: Commit**

```bash
git add src/db/queries/files.ts src/stores/file-store.ts
git commit -m "feat(files): auto-create system folders per user on first load"
```

---

## Phase 2: Desktop File Icons (separate plan after Phase 1)

- Files in `~/Desktop` folder render as draggable icons on DesktopShortcuts
- Drag files from native OS onto desktop → uploads to Desktop folder
- Right-click file icon → Open, Rename, Delete, Move To
- Double-click → open in associated app or download

## Phase 3: Photos App + Document Viewer + File Associations (separate plan)

- Photos gallery: grid of thumbnails, lightbox, slideshow, EXIF
- Document viewer: markdown/text/code with syntax highlighting, PDF via iframe
- File association registry: `.jpg`→Photos, `.md`→Notes, `.pdf`→Document Viewer
- "Open With" context menu

## Phase 4: Clipboard + Multi-Window Finder + Tabs (separate plan)

- Ctrl+C/X/V for files between folders
- Open multiple Finder windows
- Tab bar within Finder window
- Drag files between Finder windows

## Phase 5: Versioning + Pipes + Sharing + Storage (separate plan)

- Keep last 5 versions per file
- "Version History" panel in Finder
- Pipes: trigger on file add/move/delete
- Public share links with optional password
- Storage quota display in Settings
