---
title: "Discord Rich Output Patterns"
created: 2026-03-14
updated: 2026-04-15
type: reference
status: active
confidence: 0.75
confidence_updated: 2026-04-15
source: reference
tags: [discord, ui-patterns, openclaw]
summary: "Discord Components v2 patterns for rich bot output — containers, buttons, selects, modals, media galleries"
---
# Discord Rich Output Patterns

## Philosophy

Every Discord message should use the **richest appropriate format** for its context. Plain markdown walls are a last resort. Agents should automatically choose buttons, selects, polls, containers, threads, or reactions based on what they're communicating.

## Quick Decision Guide

- **Confirmation needed?** → Buttons (success/danger)
- **Multiple choices?** → Select dropdown
- **Structured input?** → Modal form
- **Community opinion?** → Native poll
- **Status/dashboard?** → Container with accent color
- **Simple ack?** → Reaction emoji, not a message
- **Deep topic?** → Create a thread
- **File delivery?** → Media gallery or file block

## Components v2 System

[[OpenClaw]] uses Discord's Components v2 for rich UI. Key elements:

### Containers
Wrap blocks in a container with `accentColor` for visual context:
- `#57F287` green = success
- `#ED4245` red = error/danger
- `#FEE75C` yellow = warning
- `#5865F2` blurple = info/neutral

### Blocks
- `text` — markdown text
- `section` — text + accessory (button/thumbnail)
- `separator` — visual divider
- `actions` — buttons (up to 5) or select menu
- `media-gallery` — image grid
- `file` — file attachment

### Interactive Elements
- **Buttons:** `primary`, `secondary`, `success`, `danger`, `link`
- **Selects:** `string`, `user`, `role`, `mentionable`, `channel`
- **Modals:** text fields, selects, checkboxes (up to 5 fields)

### Reusable Components
Set `"reusable": true` for persistent UI (dashboards, toolbars).
Default is single-use (disappears after interaction).

## Interaction Flow

Button/select clicks route back to the agent as normal messages. Handle them contextually — don't just acknowledge the click, perform the action.

## Anti-Patterns

1. Walls of markdown when interactive elements exist
2. "Type 1, 2, or 3" when a dropdown works
3. "OK done" when ✅ reaction suffices
4. URL dumps when media galleries exist
5. Inline yes/no questions when buttons work

## Related

- [[OpenClaw Discord Setup]]
- [[OpenClaw Extensions]]
- Skill: `discord-rich-output` in workspace

---

*Created: 2026-03-14*
*Verified: 2026-04-15 — patterns still current for Discord Components v2*
*Source: Training session in #cool-discord*

> **Status (2026-04-15):** These patterns remain valid. OpenClaw is still installed (`/usr/bin/openclaw`) and the Discord bot uses these output patterns. Components v2 API is stable.
