---
date: 2026-03-20T00:00:00.000Z
tags:
  - research
  - sync
  - local-first
  - sqlite
  - browser
  - wasm
  - opfs
status: active
type: research
wiki_id: >-
  research/AI-Knowledge/Research_-_Local-First_Sync_for_SQLite_Browser_Apps_2025-2026
imported_from: >-
  vault/Research/AI-Knowledge/Research - Local-First Sync for SQLite Browser
  Apps 2025-2026.md
imported_at: '2026-04-04T00:23:56.980Z'
summary: ''
---

# Research: Local-First Sync for SQLite Browser Apps (2025–2026)

> Research conducted 2026-03-20. Context: browser app using wa-sqlite + OPFS, planning optional Google OAuth sync.

Related: [[My Stack Decisions]]

---

## Question

What is the best pattern for adding optional cloud sync to a local-first browser app built on wa-sqlite + OPFS? Requirements: works offline-first, integrates with Google OAuth, reasonable complexity to implement, good conflict handling for single-user.

---

## Candidates Evaluated

| Tool | Stars (GitHub) | Last Release | Self-Hostable | Score |
|------|---------------|-------------|--------------|-------|
| ElectricSQL | ~8k | v1.1 Aug 2025 | Yes (Elixir) | 62/100 |
| PowerSync | ~3k | Active 2025 | Yes (Docker) | 72/100 |
| Turso/libSQL | ~10k+ | Active 2026 | Yes (Rust) | 55/100 |
| Yjs / Automerge (CRDTs) | 15k / 4k | Automerge 3.0 Aug 2025 | Self-built infra | 40/100 |
| Simple REST LWW | N/A — DIY | N/A | Any server | 78/100 |
| Supabase Realtime | ~60k | Active | Yes | 50/100 |

---

## Detailed Evaluations

### 1. ElectricSQL

**What it is:** Read-path sync engine for Postgres that fans out data to local clients via "Shapes" (partial table subscriptions). Uses an Elixir service in front of Postgres consuming the logical replication stream.

**Critical caveat (2024 pivot):** ElectricSQL fundamentally changed direction in 2024. The current v1.x is **read-path only** — it syncs data OUT of Postgres into local clients. It does NOT do write-path sync. You must implement your own write-back pattern (REST, GraphQL, etc.) separately. The bidirectional CRDT-based SQLite sync of the original v0.x product was deprecated.

**Browser integration:**
- Works with PGlite (Postgres in WASM) rather than SQLite WASM
- `@electric-sql/pglite-sync` plugin syncs Shapes into PGlite tables
- Does NOT natively integrate with wa-sqlite — you would need to port data between PGlite and wa-sqlite, which defeats the purpose

**Conflict resolution:** None built-in for writes. You implement it yourself. For reads it's authoritative server state.

**Cost:**
- Electric Cloud: free in public BETA (Q1 2025), usage-based pricing planned end of Q3 2025, with generous free tier
- Self-hosted: free, requires Elixir/Postgres infrastructure

**Complexity:** High — read path is relatively simple, but you must also build the entire write path separately. Mismatch with wa-sqlite (PGlite is the supported client).

**Verdict:** Not the right fit for a wa-sqlite + OPFS app without significant adaptation work.

---

### 2. PowerSync

**What it is:** Bidirectional sync engine (Postgres, MySQL, MongoDB, SQL Server → SQLite). Two components: a service layer handling partial replication and a client SDK managing local SQLite persistence, reactivity, and sync. Uses a server-authoritative checkpoint model for consistency.

**Browser integration:**
- PowerSync client SDKs **explicitly support wa-sqlite** (both OPFSCoopSyncVFS and IDBBatchAtomicVFS) since early 2025
- Browser is now a first-class target per their 2025 roadmap
- Works with your existing wa-sqlite + OPFS setup without migration

**Conflict resolution:** Server-authoritative — last write from the server wins. Client writes queue locally, sync when online. For single-user this is essentially perfect.

**Cost:**
- Cloud: Free tier (deactivated after 1 week inactivity), Pro (usage-based), Enterprise (custom)
- Self-hosted: PowerSync Open Edition is free, source-available (Functional Source License), Docker-deployable, production-ready (same codebase as Cloud)
- Client SDKs: Apache 2.0 open source

**Complexity:** Medium — you configure sync rules (what data each user sees), point it at your backend DB, and the SDK handles the rest. Requires a backend DB (Postgres is ideal with Supabase or similar).

**Verdict:** Best managed-sync option that directly supports wa-sqlite + OPFS. The self-hosted Open Edition is compelling for keeping costs zero.

---

### 3. Turso / libSQL

**What it is:** libSQL is an open-contribution SQLite fork by Turso. Supports embedded replicas that sync from a primary cloud instance. In 2025 Turso launched browser/WASM support via `@tursodatabase/sync-wasm` with a push/pull sync model.

**Browser integration:**
- `@tursodatabase/sync-wasm` is a full rewrite for browser-native use, not just SQLite compiled to WASM
- Sync model: write offline, sync to Turso Cloud on demand
- BUT: this is Turso's own WASM runtime, not wa-sqlite. You would be **replacing** wa-sqlite with Turso's runtime.

**Conflict resolution:** Simple push/pull — not CRDT-based, no fine-grained conflict resolution. Last write wins at the row level.

**Cost:**
- Free tier (as of March 31, 2025): 500M rows read/month, 10M rows written/month, 5GB storage, no cold starts
- Developer plan: $4.99/month for 2.5B rows read, 1,000 databases
- Embedded replicas: 10GB/month sync bandwidth on paid plans

**Complexity:** Low — but only if you're willing to swap wa-sqlite for Turso's WASM runtime. If you want to keep wa-sqlite, there's no official sync bridge.

**Verdict:** Attractive pricing and simple sync model, but requires abandoning wa-sqlite. If you were starting fresh, this would rank higher. For an existing wa-sqlite app, the migration cost is high.

---

### 4. CRDTs — Yjs and Automerge

**What they are:** Data structure libraries that guarantee conflict-free merges without a central authority.

**Yjs:** Optimized for text and collaborative editing. Requires bringing your own realtime infrastructure (WebSocket server, etc.). Bundle overhead from WASM-generated internals.

**Automerge 3.0** (Aug 2025): New compressed runtime representation — handles Moby Dick-scale documents using 1.3MB where v2.0 used 700MB. JSON document model. Multi-language support. Still requires your own sync infrastructure.

**For single-user sync:** CRDTs are genuinely overkill here. The canonical "CRDT benefits" (concurrent multi-user edits, no locking, merge without coordination) are non-issues for a single user on multiple devices. You cannot truly have concurrent conflicting writes from one user — the probability is near zero in normal usage.

**Real-world signal:** PowerSync published a case study "Why Cinapse Moved Away From CRDTs For Sync" — the complexity cost outweighed the benefits for most product apps.

**Complexity:** Very high — months of work to handle data sync, UI, presence, and infrastructure from scratch. Automerge/Yjs are data structure libraries, not complete sync solutions.

**Verdict:** Wrong tool for single-user sync. Reserve for truly collaborative multi-user editing of the same document simultaneously (like Google Docs). Not appropriate here.

---

### 5. Simple REST Sync (Last-Write-Wins with Timestamps)

**What it is:** Each record has an `updated_at` timestamp. On sync, compare local vs server timestamps per record. Highest timestamp wins. Mark records with a `synced` boolean. POST diffs, GET server state.

**Schema pattern:**
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,          -- UUID
  title TEXT,
  content TEXT,
  updated_at INTEGER NOT NULL,  -- Unix ms timestamp
  device_id TEXT,               -- tiebreaker for same-ms conflicts
  deleted INTEGER DEFAULT 0,    -- soft delete flag
  synced INTEGER DEFAULT 0      -- local sync status
);
```

**Conflict resolution:** LWW is entirely sufficient for single-user. True conflicts (same user editing same record on two offline devices simultaneously, then both syncing) are extremely rare and the consequence is losing one version — acceptable for most personal apps.

**Upgrade path to better conflict resolution:** Add per-field timestamps (CRDT-lite) only if needed. The LWW map pattern (each field is a {value, timestamp} tuple) gives you field-level merge without a full CRDT library.

**Server infrastructure needed:** Any HTTP server with a Postgres/SQLite database. A simple Hono/Express API on a $5 VPS or Cloudflare Workers handles this easily. With Google OAuth you already have a user identity — attach all records to user_id.

**Cost:** Near zero. A $5/month VPS or Cloudflare Workers free tier handles thousands of users.

**Complexity:** Low — 2-4 days of implementation for a complete single-user sync system.

**Verdict:** Best effort-to-value ratio for a single-user app. Linear, Notion, and Figma all started with simpler sync and added complexity only as needed. The architecture is: local SQLite is the truth, server is the backup and cross-device bridge.

---

### 6. Supabase Realtime

**What it is:** Postgres change streaming over WebSockets. Broadcasts row-level changes via logical replication. Has a Broadcast channel for custom real-time events.

**For local SQLite sync:** Supabase Realtime is not a local-first sync layer — it broadcasts Postgres changes to connected clients. It does NOT sync to local SQLite. The integration story is:
1. Your app writes to local SQLite
2. A background worker pushes writes to Supabase Postgres
3. Supabase Realtime streams those changes back to other connected clients

This is essentially "REST sync with a Postgres backend and WebSocket push." It works, but you're building the SQLite-to-Postgres bridge yourself. PowerSync is the officially-recommended way to bridge Supabase with local SQLite.

**RxDB + Supabase Replication Plugin** is a workable pattern — RxDB manages local persistence and the plugin handles push/pull + Realtime streaming — but RxDB is another abstraction layer on top of your wa-sqlite.

**Complexity:** Medium-high when targeting local SQLite. You're composing multiple pieces.

**Verdict:** Fine as a backend for the REST approach (Option 5), but not a turnkey local-SQLite sync solution on its own.

---

## What People Are Actually Using (2025–2026)

From community research (LogRocket, debugg.ai, PowerSync blog, HN threads):

1. **PowerSync** has the most production traction for browser + SQLite apps with a managed backend
2. **REST LWW** is the dominant pattern for single-user and simple multi-device apps — it's what most indie developers ship
3. **ElectricSQL** is gaining traction for read-heavy apps (dashboards, feeds) but few use it for bidirectional sync due to the write-path gap
4. **Turso** is popular for new greenfield apps starting fresh, not for apps with existing wa-sqlite
5. **CRDTs** are used almost exclusively in collaborative editing tools (not personal apps)

**OPFS + wa-sqlite + Web Workers remains the 2025-2026 consensus** for browser SQLite performance. PowerSync explicitly targeted this stack.

---

## How Notion, Linear, and Figma Do It

Source: "The Hard Things About Sync" (Joy Gao), community research.

**Linear:** Custom in-house sync engine. Loads all issues into memory/IndexedDB on startup — search is 0ms because it's filtering a JavaScript array. Client writes to local KV store, background process pushes "Mutations" to server, client rebases on server state. Not CRDT — it's mutation-queue + server-authoritative rebase. This is essentially the REST LWW pattern with a more sophisticated mutation queue.

**Figma:** Custom sync with operational transforms for the vector canvas. The multiplayer piece is OT, not CRDT. Local-first for single user experience, sync happens continuously while online.

**Notion:** Initially simple REST with optimistic updates. Added more sophisticated sync only years into production as collaboration requirements grew.

**Key lesson:** All three started simple. None used a CRDT library off the shelf for their core sync. Complexity was added incrementally when product requirements demanded it.

---

## Single-User vs Multi-User Sync

For single-user (one person, multiple devices), the fundamental insight is:

> "For a single user scenario, data conflicts can't happen if data only has one owner." — SQLite sync research

True concurrent conflicts require: two devices offline simultaneously, both editing the same record, both syncing at the same time. For a personal app this is a rare edge case, not the common path.

**Appropriate conflict strategies for single-user, ranked by simplicity:**
1. **LWW by row** — `updated_at` timestamp, highest wins. 2 hours to implement.
2. **LWW by field** — per-field timestamps. 1 day to implement. Survives same-record edits to different fields.
3. **Mutation queue with server rebase** — what Linear does. 1-2 weeks to implement. Correct even for rapid concurrent edits.
4. **CRDTs** — only if you add real-time multi-user collaboration later.

---

## Recommendation Matrix

| Approach | Effort | Sync Quality | Infra Cost | wa-sqlite Compat | Best For |
|----------|--------|-------------|------------|-----------------|----------|
| REST LWW | Low (2-4d) | Good (single-user) | ~$0-5/mo | Native — no changes | Single-user, shipping fast |
| PowerSync (managed) | Medium (1-2wk) | Excellent | Free-tier → usage | Native (explicit support) | Multi-device, want robustness |
| PowerSync (self-hosted) | Medium-high (2-3wk) | Excellent | Docker, VPS | Native | Control-conscious, multi-user later |
| Turso sync-wasm | Low-Medium | Good | Free tier generous | Requires migration off wa-sqlite | Greenfield apps |
| ElectricSQL | High | Read-only (write DIY) | Free beta → usage | Requires PGlite migration | Read-heavy dashboards |
| CRDTs (Yjs/Automerge) | Very High (months) | Best (multi-user) | Self-built infra | Manual integration | Collaborative editing |
| Supabase Realtime | Medium | Good | Free tier | Manual bridge needed | Already using Supabase |

---

## Concrete Recommendation

**For the wa-sqlite + OPFS app with optional Google OAuth sync:**

### Phase 1 — Ship (Week 1-2): REST LWW

Build a minimal sync API:
- Google OAuth gives you `user_id`
- Each table gets `updated_at` (Unix ms) + `device_id` + `deleted` (soft delete)
- Sync endpoint: `POST /sync` takes a batch of dirty records, returns server records newer than `last_sync_at`
- Client: after OAuth login, pull server state → merge with LWW → push local dirty records
- No new dependencies on the client — pure SQLite queries + `fetch()`

This is the correct starting point. It handles the real use case (user logs in on second device, gets their data) with near-zero infrastructure.

**Server options sorted by zero-to-running time:**
1. Cloudflare Workers + D1 (Postgres-compatible SQLite in cloud, free tier)
2. Supabase (hosted Postgres + Auth, free tier handles OAuth)
3. Hono on Fly.io ($3/month)

### Phase 2 — If you need more (Later): PowerSync

If Phase 1 conflict handling proves insufficient (real concurrent offline edits), or you add a second user/collaboration, PowerSync's Open Edition can slot in:
- It explicitly supports wa-sqlite OPFSCoopSyncVFS
- Self-host via Docker
- You keep your existing local SQLite schema

**Do not adopt CRDTs unless you add real-time collaborative editing.** The complexity tax is not worth it for single-user sync.

---

## Sources

- [ElectricSQL — Writes Guide (read-path limitation)](https://electric-sql.com/docs/guides/writes)
- [ElectricSQL v1.1 release (Aug 2025)](https://electric-sql.com/blog/2025/08/13/electricsql-v1.1-released)
- [Electric Cloud public BETA (Apr 2025)](https://electric-sql.com/blog/2025/04/07/electric-cloud-public-beta-release)
- [Sync Engines Compared: ElectricSQL vs Convex vs Zero (2025)](https://merginit.com/blog/24082025-sync-engines-guide-electricsql-convex-zero)
- [PowerSync Pricing](https://www.powersync.com/pricing)
- [PowerSync Open Edition (new open era)](https://www.powersync.com/blog/new-open-era-for-powersync)
- [PowerSync 2025 Roadmap: SQLite, Web, Speed](https://www.powersync.com/blog/powersync-2025-roadmap-sqlite-web-speed-and-versatility)
- [PowerSync: Current State of SQLite Persistence on the Web (Nov 2025)](https://www.powersync.com/blog/sqlite-persistence-on-the-web)
- [Why Cinapse Moved Away From CRDTs For Sync](https://www.powersync.com/blog/why-cinapse-moved-away-from-crdts-for-sync)
- [Turso: Introducing Turso in the Browser](https://turso.tech/blog/introducing-turso-in-the-browser)
- [Turso: Introducing Databases Anywhere with Turso Sync](https://turso.tech/blog/introducing-databases-anywhere-with-turso-sync)
- [Turso Pricing](https://turso.tech/pricing)
- [@tursodatabase/sync-wasm on npm](https://www.npmjs.com/package/@tursodatabase/sync-wasm)
- [Automerge 3.0 memory improvements (Aug 2025)](https://biggo.com/news/202508071934_Automerge_3.0_Memory_Improvements)
- [Zero (Rocicorp) — not local-first, no offline writes](https://zero.rocicorp.dev/docs/when-to-use)
- [Offline-first frontend apps in 2025 — LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Local-First Apps in 2025: CRDTs, Replication Patterns](https://debugg.ai/resources/local-first-apps-2025-crdts-replication-edge-storage-offline-sync)
- [The Hard Things About Sync — Joy Gao](https://expertofobsolescence.substack.com/p/the-hard-things-about-sync)
- [Conflict Resolution: LWW vs CRDTs — DZone](https://dzone.com/articles/conflict-resolution-using-last-write-wins-vs-crdts)
- [SQLiteSync — CRDT-based SQLite extension](https://github.com/sqliteai/sqlite-sync)

#research #sync #local-first #sqlite #browser #wasm #opfs #electricsql #powersync #turso
