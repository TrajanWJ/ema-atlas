# Lane G6 — Tauri desktop admin shell

**Wave 5 · Breadth deliverable · Status: dispatched**

## Goal

Scaffold a Tauri 2 + React desktop app that wraps the admin surface (review queue, roster, disputes, reports) as a native shell. Target macOS first; Windows/Linux configs present but untested from this sandbox.

## Scope (strict)

- `apps/desktop/**` only.
- Do NOT touch `autharis/**`, `packages/**`, `services/**`, `pnpm-workspace.yaml`, root turbo.json.
- This lane cannot actually run `cargo build` in the sandbox — deliver a well-formed project that compiles on a dev machine with the Rust toolchain installed.

## Stack

- Tauri 2 (latest stable). `src-tauri/Cargo.toml`, `tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/build.rs`.
- Frontend: React 19 + Vite 5 + TypeScript. No Next.js (Tauri expects static SPA output).
- Pull `@autharis/sdk` as workspace dep to call the F6 Fastify API at `http://localhost:4010` during dev.
- No Tailwind; use `@autharis/tokens` CSS vars directly. Optional: import `@autharis/ui` primitives.

## Deliverables

1. `apps/desktop/package.json` — replace the placeholder. Scripts: `dev` (vite), `build` (vite build), `tauri:dev` (tauri dev), `tauri:build` (tauri build), `typecheck`.
2. `apps/desktop/vite.config.ts`, `tsconfig.json`, `index.html`.
3. `apps/desktop/src/main.tsx`, `src/App.tsx`, `src/views/{Queue,Roster,Disputes,Reports}.tsx`.
4. `apps/desktop/src-tauri/Cargo.toml` — Tauri 2 deps.
5. `apps/desktop/src-tauri/tauri.conf.json` — window 1280×800, identifier `com.autharis.desktop`, title "Autharis Admin", devUrl http://localhost:5174, frontendDist `../dist`.
6. `apps/desktop/src-tauri/src/main.rs` — minimal `tauri::Builder::default().run(...)`.
7. `apps/desktop/src-tauri/build.rs`, `src-tauri/icons/*` (placeholder PNG/ICO ok — can be empty or use a 1×1 transparent).
8. `apps/desktop/README.md` — explain Rust toolchain prerequisite + how to run.

## Constraints

- Vite dev server on port **5174** (distinct from all other surfaces).
- React 19 + react-dom 19 peers. TypeScript ^5.6.
- Add `@autharis/sdk: workspace:*` and `@autharis/tokens: workspace:*` as deps.
- `@tauri-apps/api@^2`, `@tauri-apps/cli@^2` as devDep.
- The Rust crate name: `autharis_desktop`.
- Pure SPA fetch the API — no SSR, no Node runtime in prod binary.

## Done when

- All files above written. `package.json` is a valid workspace member.
- `pnpm -w install` on a fresh clone does not crash parsing this workspace.
- `README.md` documents: install Rust → `pnpm --filter @autharis/desktop tauri:dev`.

## Out of scope

- Signing, notarization, auto-updater, installers.
- Actual Rust compilation (sandbox lacks toolchain).
- IPC handlers beyond the default Tauri scaffolding.
