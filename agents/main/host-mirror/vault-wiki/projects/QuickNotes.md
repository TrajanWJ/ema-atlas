---
type: project
wiki_id: projects/QuickNotes
imported_from: vault/Projects/QuickNotes.md
imported_at: '2026-04-04T00:23:56.889Z'
tags: []
summary: ''
---
# QuickNotes

> Minimal, modern, persistent markdown note app for KDE Linux.

---

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/quicknotes/` |
| **Stack** | Python 3.12, PySide6 (Qt 6) |
| **Status** | Phase 1 — Initial Build |
| **Created** | 2026-03-13 |

---

## Architecture Overview

Single-window PySide6 desktop app with markdown editing and preview.

### Components
- **Main Window** — title bar, tab bar, tree panel, editor/preview area
- **Tab Manager** — scrollable pill tabs with open/close, persistence across sessions
- **Tree Panel** — collapsible folder browser supporting multiple locations
- **Editor** — plain text QTextEdit for markdown editing
- **Preview** — QTextBrowser rendering markdown with `[[wikilink]]` support (Obsidian-compatible)
- **State Persistence** — JSON config in `~/.config/quicknotes/` for open tabs, locations, window geometry

### Theme: Deep Void
- Near-black base (#08080c)
- Monochrome with steel blue accent (rgba 140,180,255) at low opacity
- Colored traffic lights, ultra-thin typography, wide letter-spacing
- Rounded pill tabs (16px radius), frosted glass borders

### Key Features
- Notes stored as `.md` files, default location `~/Notes/`
- New note dialog with name + folder location picker
- Edit/preview toggle renders markdown including `[[wikilinks]]`
- Clicking wikilinks navigates to the linked note
- All open tabs persist and restore on launch
- Multiple folder locations as collapsible groups in tree
- New window support
- Scrollable tab bar for many open notes

---

## Current Phase

### Phase 1 — Initial Build (In Progress)
- [x] Design finalized (Deep Void theme, Split Header layout)
- [ ] Core app structure
- [ ] Tab management with persistence
- [ ] Markdown editor + preview with toggle
- [ ] Wikilink rendering and navigation
- [ ] Collapsible file tree with multi-location support
- [ ] State persistence (tabs, locations, geometry)
- [ ] New note dialog
- [ ] New window support

---

## Related Notes

*(will grow as the project develops)*

---

#quicknotes #python #pyside6 #desktop-app
