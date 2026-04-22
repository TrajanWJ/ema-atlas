---
title: "GUI V3 Pass"
intent_level: 3
intent_kind: feature
intent_status: planned
intent_priority: 1
project: ema
parent: "[[Knowledge-System]]"
capabilities: [intent, plan]
tags: ["feature", "gui", "design", "glass", "place.org"]
---

# GUI V3 Pass

Complete visual overhaul of EMA desktop app. Align with place.org design language. Make every surface feel like it belongs in the same system.

## Design Principles (from place.org)

1. **Blue-tinted glass** — not neutral gray glass. Every surface has a slight navy/indigo warmth
2. **Single window chrome** — AmbientStrip owns traffic lights. vApps get thin header bars, no duplicate controls
3. **Dock as primary nav** — left vertical dock with app icons, green dots for active. Not a sidebar with text
4. **Content density** — information-rich panels, small type (0.65-0.75rem body), tight spacing
5. **Accent per app** — each vApp has its own accent color from APP_CONFIGS. Headers, borders, icons tinted

## What Needs Work

### Launchpad (home screen)
- [ ] App tile grid needs glass cards with hover glow
- [ ] "One Thing" card should be prominent with accent border
- [ ] Greeting should use time-of-day context
- [ ] Quick stats row (tasks, proposals, intents, agents) with live counts

### Dock
- [ ] Icons should have subtle glow on hover (box-shadow with app accent)
- [ ] Active app indicator (green dot) needs to pulse gently
- [ ] Dock background should be glass-elevated with stronger blur

### AmbientStrip (top bar)
- [ ] Clock should be more prominent
- [ ] Add connection status indicator (daemon health dot)
- [ ] OrgSwitcher needs glass dropdown styling
- [ ] Traffic lights need hover tooltips

### Wiki Engine
- [ ] Article typography needs the full mw-parser-output treatment
- [ ] Sidebar namespace icons should be colored, not just emoji
- [ ] Search needs results dropdown with glass styling
- [ ] Infobox needs the proper Wikipedia right-float with glass background

### Intent Schematic View
- [ ] Tree should use indented lines (not just spaces) like a file tree
- [ ] Status colors should match the intent status palette
- [ ] Click intent → opens wiki page inline (not new window)
- [ ] Progress bars on each intent node

### Common Components Needed
- [ ] GlassCard — reusable card with glass-surface + hover state
- [ ] GlassButton — button with glass background, accent on hover
- [ ] GlassInput — input with glass field background, focus ring
- [ ] GlassDropdown — dropdown with glass-elevated, proper z-index
- [ ] StatusDot — colored dot with optional pulse animation
- [ ] AccentBadge — pill badge using app accent color

## Technical Approach

1. Extract shared glass components to `components/shared/`
2. Every component uses CSS vars from globals.css — no hardcoded colors
3. Every inline style converted to either a CSS class or CSS var reference
4. App accent colors flow through `--app-accent` CSS variable per vApp
5. All measurements in rem, consistent with Codex design tokens

## Success Criteria

- Zero hardcoded hex colors in component files
- Every glass surface uses the tier system (ambient/surface/elevated)
- AmbientStrip is the ONLY source of traffic lights
- Dock icons glow with their app's accent color on hover
- Wiki pages render with Wikipedia-grade typography
- Intent schematic is navigable and shows live status
