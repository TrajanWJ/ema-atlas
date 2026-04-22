---
title: "CellState — React Terminal Renderer"
source: https://github.com/nathan-cannon/cellstate
created: 2026-03-19
type: research
tags: [tui, terminal, react, rendering, dashboard]
confidence: 0.7
---

# CellState — React Terminal Renderer

## What It Is
React-based terminal renderer with cell-level diffing and double-buffered output. Uses a custom React reconciler that renders directly to a cell grid rather than generating ANSI escape sequences. Unlike traditional TUI frameworks, it doesn't use the alternate screen — meaning Cmd+F search, scroll, text selection, and copy-paste all work normally.

Frames are wrapped in DEC 2026 synchronized output sequences so terminals that support it paint atomically with zero tearing.

## Key Claims
- **Comparable to raw escape codes** in benchmark performance, substantially faster than Ink
- Benchmarks: 100 messages in 1.10ms, 250 in 2.54ms, 500 in 5.10ms
- Cell-level diffing with SGR state tracking and row-level damage detection
- Double-buffered: no flicker, smooth updates
- No alternate screen: terminal history preserved, native scrolling and text selection work
- Wide character support built-in

## Component API
- **Box** — flexbox-style layout container (flexDirection, gap, padding, margin, borderStyle, alignment)
- **Text** — styled text with auto-wrap, supports bold/italic/underline/color/dim/inverse, overflow modes (wrap, truncate, truncate-start, truncate-middle)
- **Divider** — full-width horizontal lines with customizable characters

## Hooks
- **useInput** — keyboard events, control keys, arrows, bracketed paste (multiline paste as single event)
- **useApp** — lifecycle control via exit(), waitUntilExit() promise
- **useFocus / useFocusManager** — Tab-based focus cycling with programmatic override
- **useDimensions** — terminal dimensions with auto re-render on resize

## Utilities
- **markdownToElements** — markdown to terminal UI components with Shiki syntax highlighting
- **highlightCode** — language-specific syntax highlighting for code blocks
- **measureElement** — rendered component dimensions after layout
- **decodeKeypress** — low-level keystroke decoding (UTF-8, escape sequences, bracketed paste)

## Installation
```
npm install cellstate react
```
Render via `render(<Component />)`, returns `{ unmount(), waitUntilExit(), dumpFrameLog() }`.

## Use Case for Our System
TUI agent monitoring dashboard for:
- Dispatch queue status (pending/running/done)
- Agent health (heartbeat, memory, last action)
- Subagent tree visualization
- Budget/spend tracking per agent
- Live log tailing per agent

Current monitoring: Discord posts + manual checks. A CellState dashboard would give real-time visibility. The markdownToElements utility is interesting for rendering vault notes directly in terminal.

## Status
**Monitor** — evaluate for stability before building dashboard. Check: npm package availability, React 18+ compatibility, API stability, community activity.

## Related
- [[agent-rendered-infrastructure]] — agents regenerating dashboards (alternative: static HTML vs live TUI)
- [[cycles-protocol-budget]] — budget data to display
