---
type: research
confidence: 0.75
source: tiktok-video-analysis
tags: [life-os, ai-agent, productivity, vibe-coding, competitor-study]
date: 2026-03-20
---

# Jake Beau — AI Life OS ("Boost")

## Creator
- **Name:** Jake Beau (@jakebeau_ on TikTok/Instagram, @jakesdata on X)
- **GitHub:** jake17007
- **Location:** New York City
- **Company:** Boost Productivity, Inc. (2025)
- **Product:** "Boost Focus Timer" — native iPhone + Android app + desktop web app

## Source
- TikTok: https://www.tiktok.com/@jakebeau_/video/7610543476517735710
- "I built an AI Life OS" — 53s, 4.1K views, Feb 24 2026
- Source code on Gumroad (link via Instagram bio, comment "boost" to get link)
- Built primarily with Cursor ("I built a 3D life OS with Cursor")

## Architecture (from video frame analysis)

### App Structure
Dark-themed web + mobile app with 5 main tabs:
1. **Focus** — Pomodoro timer with session recording, configurable minutes (default 90), "Start Focus" button, "Record Session" toggle
2. **To-Dos** — Task list with time estimates per item (90min default), drag handles, "✨ Suggest" AI button, "+ Add" with minute estimates
3. **Habits** — Habit tracking (details not fully visible)
4. **Goals** — Metric goals with numeric data tracking (target vs actual)
5. **Boost** — AI chat agent ("Chat with Jake.0 — Jake's AI Agent")

### Key Features

#### AI Agent ("Jake.0")
- Chat interface embedded in the app (bottom-right panel)
- Can read the app's own source code (showed `tools.ts`, `tool-executor.ts`, `progress-messages.ts` in conversation)
- Creates workflows via natural language
- Has knowledge of what it can do — listed capabilities:
  - **Focus Sessions:** View focus session history and patterns
  - **Metrics:** Create metric goals to track numeric data over time, add/update data points (target vs actual)
  - **Integrations:** Oura Ring (sleep, activity, readiness, heart rate, workouts), Withings (weight, body composition, activity, sleep, heart), YouTube (channel stats, uploads, playlists, liked videos)
  - **Workflows:** Build automated data pipelines with Python nodes, schedulers, and AI processing; connect data sources to metrics for automatic tracking
  - **Custom Pages:** Create custom dashboards and visualizations
  - **Other:** Remember things across conversations, search and read app source code, submit feedback

#### Social Feed ("Boards")
- Internal social feed where user posts videos, prompts, motivational content
- Cards with "This helped me" reactions, Public/Private visibility, timestamps
- Shared knowledge board (prompts that help, AI coding tips, etc.)

#### Workflow Canvas
- Visual node-based workflow editor (left side of screen)
- Multiple connected nodes visible — appears to be a data pipeline builder
- "Reset Layout", "Auto Layout (1)", "+ Add Node" controls
- The AI agent can create these workflows through conversation

#### Mobile App
- Full iPhone app (shown on device stand)
- Same 5-tab navigation as desktop
- AI chat works on mobile
- Company footer: "© Boost Productivity, Inc. 2025"

### Integrations
- **Oura Ring** — sleep, activity, readiness, heart rate, workouts
- **Withings** — weight, body composition, activity, sleep, heart
- **YouTube** — channel stats, uploads, playlists, liked videos
- **Python nodes** — custom data pipelines
- **IPFS** — quantum-secure entity state system (boost-ipfs repo — CRYSTALS-Kyber/Dilithium encryption)

## GitHub Repos (jake17007)
| Repo | Description | Lang |
|---|---|---|
| boost-vlog-editor | Video editing tools (thumbnails, overlays, montages) | Python |
| boost-ipfs | Quantum-secure entity state on IPFS (Kyber/Dilithium) | Python |
| boost-node | Neo4j-backed API router | Python |
| boost-metrics | Metrics tracking | Python |
| boost-productivity-flutter | Flutter mobile app (fork of ecommerce template) | Dart |
| boost-get-helpful-content | Content curation | Python |
| connect-data-to-boost | Data integration connectors | Python |

## What's Interesting for Us

### Patterns Worth Studying
1. **AI agent that knows its own codebase** — the agent can read `tools.ts`, `tool-executor.ts`, and explain its own architecture. Self-aware tooling.
2. **Integrated workflow builder** — visual canvas + natural language to create data pipelines. The agent creates workflows, not just chat responses.
3. **Health data integrations** — Oura Ring + Withings → automatic metric tracking. Real-world data flowing into the personal OS.
4. **Social/knowledge feed** — internal board for saving helpful content, prompts, videos. Personal knowledge base with social features.
5. **Cross-platform** — web app + native iOS + native Android from one codebase (likely React Native or Flutter).
6. **Source code as product** — selling the code on Gumroad as a template for others to build on. "Use my source code as a starting point."

### Key Differences from Agent OS
- **Jake's approach:** Single monolithic app with embedded AI chat. The AI is one feature among many.
- **Our approach:** Discord-native multi-agent system. The agents ARE the OS, channels are the interface.
- **Jake's strength:** Polished consumer UI, mobile apps, health integrations.
- **Our strength:** Multi-agent orchestration, agent specialization, extensible skill system, self-evolution.

### Ideas to Steal
- **Health data connectors** — Oura Ring + Withings integration would be valuable for Trajan
- **"Suggest" button on tasks** — AI-powered task suggestion based on context
- **Workflow canvas** — visual pipeline builder for data flows (we have dispatch, but no visual representation)
- **Self-aware agent** — our agents CAN read their own code, but we don't explicitly expose this as a feature

## TikTok Study Workflow

### How to study TikTok videos without an account:
1. `yt-dlp -o "/tmp/tiktok-%(id)s.%(ext)s" --write-description --write-info-json "<URL>"` — downloads video + metadata
2. `ffmpeg -ss <time> -i <video> -frames:v 1 <output.jpg>` — extract frames at key timestamps
3. Read frames with the model's vision capability (use `Read` tool on jpg files)
4. Parse `info.json` for metadata (uploader, views, likes, tags, upload date)
5. Search for creator's other profiles via Google (TikTok profiles block scraping)

### Tools needed:
- `yt-dlp` (pre-installed)
- `ffmpeg` (pre-installed)
- Browser for Google searches when web_fetch fails
- `Read` tool for image analysis (works on jpg/png files)
