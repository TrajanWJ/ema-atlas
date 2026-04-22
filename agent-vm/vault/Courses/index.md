---
title: "Codebase Courses"
created: 2026-04-01
type: reference
status: active
tags: [courses, learning, codebases, interactive]
summary: "Interactive courses generated from Trajan's codebases using codebase-to-course. Each course teaches how the codebase works through progressive modules."
---

# Codebase Courses

Interactive, offline-ready HTML courses generated from each codebase. Built using the `codebase-to-course` skill — they start from what the app does (user-facing) and progressively peel back layers to show how it works (code-level).

## Available Courses

| Project | Modules | Description | Browse |
|---|---|---|---|
| Free Claude Code | 4/4 | Claude Code proxy tool | [Open](free-claude-code/index.html) |
| DispoHub | 4/? | Disposable link hub | [Open](dispohub/index.html) |
| FlexiFocus (Pomodoro) | 3/6 | Focus timer with soft boundaries | [Open](pomodoro/index.html) |
| ProSlync | 2/5 | Professional compliance & matching | [Open](proslync/index.html) |
| XPressDrop | 1/6 | Express delivery platform | [Open](xpressdrop/index.html) |
| Claude Remote Discord | 0/? | Discord bot for Claude | 🔨 Generating |
| ExecuDeck | 0/? | Executive dashboard | 🔨 Generating |
| LetMeScale | 0/? | Scaling platform | 🔨 Generating |

*Courses auto-sync as modules complete. Check back for updates.*

## How to View

- **Via course server:** http://192.168.122.10:8091/ (browse directories)
- **Direct:** Click "Open" links above (if viewing in the wiki, links point to course server)
- Each course works offline — no internet required

## Course Design

Each course uses a consistent visual language:
- **Warm palette** — cream backgrounds, accent colors per project
- **Scroll animations** — content reveals as you scroll
- **Interactive elements** — quizzes, drag-and-drop, flow animations
- **Progressive modules** — start from UX, zoom into code
- **Glossary tooltips** — hover technical terms for definitions

### Module Arc

| Position | Purpose | Why it matters |
|---|---|---|
| 1 | What does this app do? | Start with the product, trace a user action |
| 2 | Meet the actors | Know which components exist |
| 3 | How the pieces talk | Understand data flow for debugging |
| 4 | The outside world | APIs, databases, external deps |
| 5+ | Advanced patterns | Caching, error handling, clever engineering |
