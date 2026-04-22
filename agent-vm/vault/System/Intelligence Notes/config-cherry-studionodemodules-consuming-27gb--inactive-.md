---
title: "Cherry Studio node_modules consuming 2.7GB — inactive project disk reclamation"
type: reference
created: 2026-04-16
updated: 2026-04-17
confidence: high
source: system-ops disk audit (task-49ee5872)
tags: [diREDACTED_TOKEN, node-modules, cherry-studio, cleanup, system-ops]
summary: "Inactive Cherry Studio project's node_modules is a 2.7GB reclaimable target — safe to trash and reinstall on demand"
---

# Cherry Studio node_modules: 2.7GB Reclaimable Disk Target

## Context

During a [[config-host-disk-grew-124gb-in-3-weeks-165gb289gb-2035-us|host disk growth audit]], the `~/cherry-studio/node_modules/` directory was identified as consuming approximately 2.7GB of disk space. Cherry Studio is a cross-platform desktop client for large language models (built on Electron + React), used for interacting with various AI providers. The project was cloned locally for evaluation but is no longer actively developed or used — making its dependency tree a pure waste of disk space.

## Why node_modules Gets So Large

Node.js dependency trees are notoriously deep and duplicative. A typical Electron + React project pulls in:

- **Electron binaries** — pre-built Chromium + Node.js runtime, often 150–300MB alone
- **Native module build artifacts** — compiled `.node` files, intermediate object files
- **Transitive dependencies** — a single top-level package can pull hundreds of sub-dependencies, each with their own nested `node_modules`
- **Dev dependencies** — bundlers (webpack/vite), testing frameworks, linters, TypeScript compiler — all needed at build time but not at runtime

For Cherry Studio specifically, which integrates multiple AI provider SDKs, model management tooling, and a full Electron shell, 2.7GB is unsurprising. Electron projects routinely exceed 2GB in `node_modules` alone.

## Remediation

### Immediate Action

```bash
trash ~/cherry-studio/node_modules
```

This reclaims 2.7GB instantly. The directory is fully reconstructible via `npm install` (or `yarn install` / `pnpm install`, depending on the project's lockfile) should the project ever be needed again. The source code, lockfile, and configuration remain untouched.

### Why `trash` Instead of `rm -rf`

Per system conventions, `trash` is preferred over `rm` for all deletions. This provides a safety net — if the project turns out to still be referenced by something, recovery is trivial. Given that `node_modules` is deterministically reproducible from the lockfile, even permanent deletion would be safe, but `trash` costs nothing extra.

### Broader Pattern: Inactive Project Dependency Cleanup

This is not an isolated finding. The same disk audit cycle identified several other large reclaimable targets:

- [[config-npm-npx-cache-silently-accumulated-22gb--largest-s|npm _npx cache: 2.2GB]] — stale npx execution caches with no periodic cleanup
- [[config-docker-danglingunused-images-accumulated-167gb--la|Docker dangling images: 1.67GB]] — unused image layers accumulating without pruning
- [[config-archiveopenclaw-consuming-38gb--archived-project-d|archive/openclaw: 3.8GB]] — another archived project's data

Together these represent ~10GB of easily reclaimable space from inactive projects and caches.

## Prevention: Systematic Approach

Rather than discovering these one-off, a recurring cleanup strategy should target:

1. **Stale `node_modules` directories** — any `node_modules/` where the parent project hasn't been touched in 30+ days. Detection: `find ~ -maxdepth 3 -name node_modules -type d -exec sh -c 'stat --format="%Y %n" "$1"' _ {} \;` compared against a threshold.
2. **Package manager caches** — `~/.npm/_npx`, `~/.npm/_cacache`, `~/.cache/yarn`, `~/.local/share/pnpm/store` all grow unbounded without periodic pruning.
3. **Electron download cache** — `~/.cache/electron/` stores multiple Electron version downloads; old versions are never auto-cleaned.

A weekly cron job scanning for `node_modules` directories in inactive projects would prevent this class of disk waste from recurring. The [[config-off-peak-dispatch-scheduling-route-non-urgent-p3p4|off-peak dispatch scheduling]] system could run this as a low-priority periodic task.

## Status

- **Suggested:** 2026-04-16T03:04:13Z
- **Impact:** 3/5 — significant disk savings, zero risk, fully reversible
- **Action:** Auto-flagged for application. Safe to apply without further verification — `node_modules` is always reconstructible from lockfiles.

## Related

- [[config-host-disk-grew-124gb-in-3-weeks-165gb289gb-2035-us|Host disk growth investigation]]
- [[config-npm-npx-cache-silently-accumulated-22gb--largest-s|npm cache cleanup]]
- [[config-docker-danglingunused-images-accumulated-167gb--la|Docker image pruning]]
