---
title: "dashboard-testing-plan"
created: 2026-03-17
updated: 2026-03-17
type: project
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: project
tags: [knowledge, openclaw, ops, prompts, research, skills]
summary: "1. Dashboard loads without errors"
---
# Dashboard Testing Plan

## Testing Stack

### Visual Testing
- **Playwright** (already installed) — browser automation, screenshot comparison
- [[OpenClaw]]'s browser tool — snapshot/screenshot capabilities built in
- Screenshot baseline comparisons for regression testing

### Functional Testing
- **[[Agent-tester]] skill** — adapted for dashboard-specific scenarios
- API endpoint testing (if dashboard has a backend)
- WebSocket connection testing (for live updates)

### Test Protocol

#### Phase 1: Smoke Tests
1. Dashboard loads without errors
2. All sections render data (not empty states)
3. System metrics are accurate (compare to CLI output)
4. Page is responsive (mobile/tablet/desktop)

#### Phase 2: Data Accuracy
1. Agent count matches `openclaw status`
2. Cron status matches `openclaw cron list`
3. Disk/CPU/RAM matches `df`/`uptime`/`free`
4. Usage pace matches `.claude-pace.json`
5. Project list matches host machine scan

#### Phase 3: Interaction Tests
1. Any interactive elements work (buttons, filters, refresh)
2. Auto-refresh doesn't leak memory
3. WebSocket reconnects on disconnect
4. Error states display correctly

#### Phase 4: Visual Review
1. Screenshots at 3 viewport sizes
2. Dark/light theme (if applicable)
3. Screenshot comparison with baseline
4. Accessibility check (contrast, keyboard nav)

### Specialized Testing Agent

Create a `dashboard-tester` role that:
1. Spawns Playwright browser
2. Navigates to dashboard URL
3. Takes screenshots of each section
4. Compares rendered data to CLI truth sources
5. Reports discrepancies
6. Runs after every dashboard code change

### Meta-Prompting for Quality

Use the prompt-optimizer approach:
1. **Define success criteria** — what does "good dashboard" mean for Trajan?
2. **Score each iteration** — usefulness (1-10), visual appeal (1-10), accuracy (1-10)
3. **Iterate** — each round addresses the lowest-scoring dimension
4. **Final review** — Devil's Advocate red-team before presentation
