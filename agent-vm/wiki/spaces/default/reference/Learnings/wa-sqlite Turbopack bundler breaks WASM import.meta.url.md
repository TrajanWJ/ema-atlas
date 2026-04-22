---
type: knowledge
wiki_id: reference/Learnings/wa-sqlite_Turbopack_bundler_breaks_WASM_import_meta_url
imported_from: >-
  vault/Reference/Learnings/wa-sqlite Turbopack bundler breaks WASM
  import.meta.url.md
imported_at: '2026-04-04T00:23:56.922Z'
tags: []
summary: ''
---
# wa-sqlite + Turbopack: bundler rewrites import.meta.url, breaking WASM load

**Context:** Next.js 16.2.0 with Turbopack. Web Worker that loads wa-sqlite with OPFS persistence.

**Problem:** Worker crashes on startup with "Worker error" from `worker.onerror`. Browser console shows a `WebAssembly.RuntimeError: Aborted(...)` or a 404 for `wa-sqlite-async.wasm`.

**Root cause:**
`wa-sqlite-async.mjs` (the Emscripten output) resolves its sibling `.wasm` file using `import.meta.url`:

```js
Ba = (new URL("wa-sqlite-async.wasm", import.meta.url)).href;
```

This works correctly when the `.mjs` file is loaded from its original location in `node_modules/`. When Turbopack bundles the worker (triggered by `new URL("./worker.ts", import.meta.url)` in the main thread), it collapses `wa-sqlite-async.mjs` into the generated chunk. `import.meta.url` inside that chunk becomes the chunk's URL (e.g., `/_next/static/chunks/[hash].js`), not the original `node_modules` path. The `.wasm` fetch therefore tries to load `/_next/static/chunks/wa-sqlite-async.wasm` — which doesn't exist — and Emscripten aborts.

Secondary problem: even if the URL were correct, `wa-sqlite-async.wasm` is not in `public/` and is not served by default.

Note: `/* @vite-ignore */` comments have no effect on Turbopack — the correct Turbopack equivalent is `/* turbopackIgnore: true */`, but even that only prevents the import from being statically analyzed, not from being bundled.

**Fix:**
1. Copy `wa-sqlite-async.mjs`, `wa-sqlite-async.wasm`, and the necessary `src/` files from `node_modules/wa-sqlite/` into `public/` preserving relative import paths.
2. Write a plain-JS worker file at `public/db-worker.js` that imports wa-sqlite via absolute `${origin}/...` URLs (not relative module specifiers that the bundler can resolve). This file is served statically — the browser loads it directly, no bundler involved.
3. In `client.ts`, pass the string `"/db-worker.js"` to the `Worker` constructor instead of `new URL("./worker.ts", import.meta.url)`. The string form tells Turbopack this is a pre-built external resource, not a module to bundle.
4. Migrations must be inlined into `db-worker.js` as plain JS (the TypeScript source can't be imported there).

**Files affected in place.org:**
- `public/db-worker.js` — new static worker (inlines migrations)
- `public/wa-sqlite-async.mjs` — copied from node_modules
- `public/wa-sqlite-async.wasm` — copied from node_modules
- `public/wa-sqlite/src/sqlite-api.js` — copied (preserving relative imports)
- `public/wa-sqlite/src/sqlite-constants.js` — copied
- `public/wa-sqlite/src/VFS.js` — copied
- `public/wa-sqlite/src/examples/AccessHandlePoolVFS.js` — copied
- `src/db/client.ts` — changed `getDbClient()` to use `"/db-worker.js"`

**Lesson:**
- Never reference WASM-loading Emscripten `.mjs` files via bundled module imports. Always serve them statically.
- Worker `.ts` files referenced via `new URL("./worker.ts", import.meta.url)` are fully bundled by Turbopack. If the worker needs pre-built assets that embed their own `import.meta.url` for sibling-file resolution, the only safe path is a static `.js` file in `public/`.
- When migrating schemas, remember to keep the inlined migrations in `public/db-worker.js` in sync with `src/db/schema.ts`. Consider adding a test or a lint rule to enforce this.

#gotcha #wa-sqlite #turbopack #wasm #web-worker #nextjs
