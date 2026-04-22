---
id: "e842f897-5c71-4c98-8276-82a342da60e2"
title: ""
space: wiki
tags: []
source: manual
---

---
title: TUI & CLI Inspiration
tags: [research, tui, cli, ux, terminal]
source: session-2026-04-07
---

# TUI & CLI Inspiration — 32 Tools Analyzed

## Elixir TUI Stack for EMA
- **Owl** (already used) — tables, select menus, progress bars, live blocks, spinners
- **Ratatouille** (805 stars) — Elm Architecture TUI, declarative DSL, production-ready
- **Garnish** — SSH-based remote TUI for agent access

## Key Design Principles (from lazygit, k9s, btop)
1. Single-screen overviews (show related data without drilling)
2. Keyboard-driven entirely (but mouse support helpful)
3. Real-time updates with visual diff (highlight what changed)
4. Fuzzy filtering everywhere (fzf pattern)
5. Streaming + staged approval (show WIP, require confirmation)
6. Visual feedback (spinners, progress bars for long ops)

## EMA TUI Implementations

### ema watch → Live Dashboard
- Left: task kanban | Center: agent status + sparklines | Right: proposal queue
- Arrow keys navigate, r refresh, p drill proposal, a jump agent

### ema now → Interactive Advisor
- Owl select menus with fuzzy filtering
- Streaming recommendations with priority scores
- Pick → Confirm → Execute

### ema briefing → Daily Summary
- Structured sections (wins, open proposals, recommended actions)
- Sparklines for velocity/success trends
- Color-coded warnings

### ema board → Kanban TUI
- Columns: Proposed → In Review → Executing → Done
- Arrow keys to move cards, Enter for detail
- Card age sparklines

### ema proposal review → Inline Workflow
- Fuzzy-searchable proposal list
- Delta-style syntax-highlighted diffs
- Approve/Kill/Redirect with confirmation

## Immediate Upgrades (Owl-only, no new deps)
1. ema now with Owl.IO.select menus
2. Progress bars for agent work
3. Live blocks for streaming updates
4. Spinners for long operations
