---
title: "Firefox Snap Cache Accumulates Silently — Needs Cleanup Automation"
type: reference
created: 2026-04-17
confidence: high
source: system-observation
tags: [intelligence, config-change, snap, firefox, disk-cleanup, automation]
summary: "Firefox snap stores cache/profile data under ~/snap/firefox/ outside normal cleanup paths — 251MB observed in one cycle"
---

# Firefox Snap Cache Accumulates Silently at ~/snap/firefox/

## Problem

On Ubuntu systems where Firefox is distributed as a snap package (default since Ubuntu 22.04), the browser stores its cache and profile data entirely within the `~/snap/firefox/` directory tree. This location falls outside the reach of standard cache cleanup tools like `bleachbit`, `apt clean`, or manual `~/.cache/` sweeps. The result is silent disk accumulation that grows unbounded unless explicitly addressed.

During a routine disk audit (2026-04-17), **251MB** of accumulated data was observed in a single cleanup cycle. While not catastrophic on its own, this compounds over time — especially on systems with SSDs or limited home partition sizes — and represents a gap in existing [[Disk Cleanup Automation]] strategies.

## Where the Data Lives

The snap confinement model isolates Firefox data into two key locations:

### `~/snap/firefox/common/`

This is the **persistent** data directory shared across snap revisions:

- **`.cache/`** — GTK/GIO module caches (gio-modules, immodules). Currently small (~96K) but can grow with plugin use.
- **`.mozilla/firefox/<profile>/`** — The full Firefox profile, including:
  - `storage/` — IndexedDB, localStorage, service worker caches (observed: 29MB)
  - `security_state/` — OCSP/certificate caches (observed: 14MB)
  - `places.sqlite` — History and bookmarks database (observed: 5MB)
  - `favicons.sqlite` — Site icon cache (observed: 5MB)
  - `datareporting/` — Telemetry data (observed: 1.1MB)
  - `sessionstore-backups/` — Session restore data

### `~/snap/firefox/<revision>/`

This is **revision-specific** data that can accumulate across snap updates:

- `.config/` — fontconfig, GTK settings, dconf, ibus, PulseAudio configs
- `.local/share/` — Desktop data

Old revisions are retained by snapd (default: 3 revisions), each potentially carrying its own config data.

## Why This Matters

1. **Invisible growth**: Unlike `~/.cache/mozilla/`, the snap path isn't on anyone's mental model for cache cleanup. Standard tools don't target it.
2. **Snap revision stacking**: Each snap update can leave behind an old revision directory. With `snap set system refresh.retain=3` (default), three full copies of config data persist.
3. **No built-in expiry**: Firefox's internal cache management (`browser.cache.disk.capacity`) controls the HTTP cache, but doesn't touch IndexedDB, localStorage, or service worker caches in `storage/`.
4. **Compounds with other snaps**: Chromium snap (`~/snap/chromium/common/.cache/` — observed: 2.6MB) and other snap applications follow the same pattern.

## Recommended Cleanup Approach

### Safe to clean periodically

```bash
# Clear the .cache directory (GTK module caches regenerate automatically)
rm -rf ~/snap/firefox/common/.cache/*

# Clear old snap revisions (keeps current + 1 previous)
snap list --all firefox | awk '/disabled/{print $3}' | xargs -I {} sudo snap remove firefox --revision={}

# Clear browser caches via Firefox itself (preserves bookmarks/passwords)
# about:preferences#privacy → Clear Data → Cached Web Content
```

### Safe to add to weekly cron

```bash
# Add alongside existing npm/uv/docker cleanup
rm -rf ~/snap/firefox/common/.cache/*
rm -rf ~/snap/chromium/common/.cache/*
```

### Do NOT clean without care

- `~/snap/firefox/common/.mozilla/firefox/<profile>/` — Contains bookmarks, passwords, extensions. Only clean specific subdirectories like `storage/default/*/cache/`.
- `places.sqlite` — Deleting this destroys browsing history and bookmarks.

## Integration with Existing Cleanup

This note is part of a pattern of discovered cleanup gaps. Related automation targets identified in the same audit cycle:

- [[config-uv-cache-111mb-and-tmp-node-compile-cachejiti-accu|UV/Node cache cleanup]] — Python uv cache and Node compile caches
- [[config-docker-danglingunused-images-accumulated-167gb--la|Docker image pruning]] — Dangling images accumulating 1.67GB

A unified weekly disk cleanup cron job should consolidate all three targets rather than creating separate entries for each. The current crontab only has stale task cleanup — no disk maintenance automation exists yet.

## Current State

- **Impact**: 2/5 (low urgency, high compounding risk)
- **Status**: Auto-flagged for application. Snap `.cache/` directory has been cleaned since initial observation (now 96K). Profile data under `.mozilla/` remains at ~64MB.
- **Action needed**: Add snap cache clearing to a consolidated weekly disk cleanup cron job.

## Sources

- Direct filesystem observation on this system (2026-04-17)
- [Snapcraft documentation: snap data locations](https://snapcraft.io/docs/data-locations)
- [Ubuntu Wiki: Firefox as a Snap](https://wiki.ubuntu.com/DesktopTeam/Firefox/Snap)
- [Mozilla Support: Profile folder contents](https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data)
