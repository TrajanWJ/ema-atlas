---
title: 'Executive AI Management, Second Brain PKM, Self-Hosted Storage — 2026 Survey'
type: research
date: 2026-03-31T00:00:00.000Z
confidence: 0.8
tags:
  - AI
  - PKM
  - second-brain
  - self-hosted
  - executive-tools
  - business-management
  - file-sync
summary: >-
  Survey of AI-integrated exec management tools, 2026-era PKM/second brain
  tools, and best self-hosted Google Drive alternatives for power users.
sources_total: 11
sources_t1: 5
sources_t2: 5
sources_t3: 1
related: >-
  [[Agent-OS-Business-Software-Paradigms]], [[Agent Memory Architectures]], [[AI
  Landscape 2026-03-16]]
wiki_id: research/ExecAI-Management-2026-03-31
imported_from: vault/Research/ExecAI-Management-2026-03-31.md
imported_at: '2026-04-04T00:23:57.026Z'
---

# Executive AI Management, Second Brain PKM, Self-Hosted Storage — 2026 Survey
*Sources: 11 total (5 primary/T1, 5 institutional/T2, 1 secondary/T3) | Confidence: 0.80 | Date: 2026-03-31*

## Summary

Three distinct trends are converging in 2026: (1) business management platforms are adding **query-layer AI agents** that answer cross-database business questions rather than just formatting text; (2) PKM tools are moving from AI-augmented note-taking toward **MCP-connected second brains** that feed context to external LLMs on demand; (3) self-hosted storage is bifurcating between **Nextcloud's kitchen-sink approach** and leaner, purpose-built options — with Syncthing emerging as the power-user default for pure file sync and Immich taking over the photo-management niche. No single tool wins all three categories; the pattern is a "best of breed + connectors" stack.

---

## Area 1 — AI-Integrated Executive/Business Management Systems

### Fibery Smart Agent: AI as query layer on business data (T2)

Fibery's "Smart Agent" mode frames AI not as a writing assistant but as a code-generating query engine over your structured workspace data. In a benchmark test published by Fibery founder Michael Dubakov, the agent answered 6/6 business questions correctly vs Notion's 3/6 — and ran ~2× faster. The mechanism: Fibery's agent writes JavaScript pipelines at query time and executes them against the workspace's schema, giving it accurate access to relations, dates, and calculations. Notion's AI frequently mishandled relational fields (returning IDs instead of names, missing cross-database links).

**Why this matters for execs:** Questions like "How many in-progress features per product area?" or "Who burned the most vacation days this quarter?" become answerable without building views. The AI is doing BI work, not copywriting.

**Source:** [Fibery vs Notion AI Agent benchmark](https://fibery.com/blog/fibery-vs-x/fibery-vs-notion-ai-agent/) — T2 (founder-written, self-benchmarked; incentive to favour Fibery, but methodology is transparent and replicable)

### Tana: AI-native knowledge graph with MCP and agents (T1)

Tana ships AI as a first-class architectural concern, not a bolt-on. Key capabilities (2026 feature state):
- **Supertags + fields as AI context**: structure you define on nodes becomes schema that AI uses to classify, fill, and search — the graph is queryable by AI, not just humans
- **Botless meeting notetaker**: captures system audio (not just mic) directly in Tana Desktop; transcribes, summarises, and auto-fills supertag fields in the meeting node
- **Multi-model routing**: OpenAI, Anthropic, Google — choose per workflow; volume pricing passed to users
- **AI Agents** (documented feature): agents can act on nodes, not just read them
- **Local API + MCP**: Tana exposes a local API and MCP endpoint, enabling Claude/other LLMs to reach into your Tana graph as a tool

The MCP integration is significant: Tana is positioning itself as a context source for external agents, not just an isolated app. An exec could have Claude use their Tana workspace as memory during a strategic planning session.

**Source:** [Tana AI docs](https://outliner.tana.inc/docs/tana-ai) — T1 (official product documentation)

### Fibery 2.0: Product discovery + development as one system (T2)

Fibery 2.0 reframes the product as a **company operating system** — combining product discovery (customer feedback, market signals, insight identification) with development tracking in a single workspace. The 2024 year review noted 530 paid customers, 450 features shipped, and an explicit pivot away from "productivity with AI button" toward a platform where AI queries the same structured data your team writes into.

This "company OS" positioning is conceptually distinct from Notion/Linear: rather than collaboration around documents or sprint tracking around issues, the unit is the **business system** itself — relationships between customers, features, feedback, revenue.

**Source:** [Fibery 2024 Year Review](https://fibery.com/blog/startup-diary/fibery-2024/) — T2

### Linear: Eng-focused, AI-enhanced (not researched in depth)

Linear's changelog was a listed source but not fetched due to fetch priority. Linear remains narrowly eng-workflow focused; less relevant to the "executive layer" framing. Noted for completeness.

### Assessment

The gap in this space is **AI that operates on cross-functional business data** rather than just one team's tasks or one knowledge type. Fibery + Tana are the two strongest bets for this in 2026. Notion has the user base but currently lags on AI query accuracy. Linear is best-in-class for eng but not an exec layer.

---

## Area 2 — Second Brain / PKM AI (2026 angles)

### Mem: MCP connector bridges notes ↔ LLMs (T1)

The most genuinely new 2026 PKM development I found: **Mem launched a Claude MCP connector** (March 18, 2026) that allows Claude to read, search, summarise, and write to your Mem notes directly from a Claude conversation. No copy-paste. Claude becomes the interface; Mem becomes the memory.

Use cases enabled:
- "Search my Mem notes for Q2 pricing strategy and summarise key decisions" — Claude finds and reads, no manual retrieval
- Weekly review: Claude surfaces open action items across notes, prioritised by urgency
- Conversation → note: Claude saves outcomes of a chat directly into Mem with action items
- Update notes mid-conversation without context switching

**The architectural shift:** Notes are no longer a place you write things down *then* copy-paste into AI. They become live context that AI can reason over. The human stops being the bridge.

Mem is also now SOC 2 Type II compliant (announced March 2026), making it viable for professional/business use.

**Source:** [Mem MCP connector announcement](https://get.mem.ai/blog/your-favorite-llms-can-now-use-your-second-brain-as-context) — T1 (official product blog)

### Capacities: Intentional AI — anti-hype, pro-depth (T2)

Capacities published a March 2026 piece on their AI philosophy that's worth reading for its explicit *counter-positioning*: they reject "endless AI-generated content" as a solution to information overwhelm, and focus AI on three specific roles: **discovery** (surfacing right notes at right time), **synthesis** (connecting messy material into clearer thinking), and **automation** (handling repetitive work so you focus on judgment-requiring tasks).

They're also explicit about privacy architecture: you choose which spaces AI can see; spaces are separated; GDPR-compliant, European team, data not sold. This is a meaningful differentiator vs US-based competitors for users with sensitive professional notes.

The Readwise integration (Oct 2025) emphasises intentionality in how highlights enter your workspace — not a firehose, but a curated pipeline. This is conceptually different from Mem's "dump everything" philosophy and represents a genuine fork in PKM approaches.

**Source:** [Capacities AI philosophy](https://capacities.io/blog/ai-for-meaningful-work) — T2 (official team blog)

### Tana PKM angle: structure-first beats folder/tag approaches (T1)

From the Tana AI docs: the key architectural bet is that **explicit schema (supertags + fields) gives AI dramatically more accurate context** than unstructured notes or loose tags. When you define a Meeting supertag with fields like Participants, Decisions, Action Items — AI can query and fill those fields reliably. This is a concrete answer to "what's genuinely new vs Obsidian + plugins": Obsidian's AI plugins work on prose in files; Tana's AI works on a typed knowledge graph. The difference matters at scale and for cross-note reasoning.

### Reflect.app: Speed + E2E encryption + AI (T2)

Reflect positions around three differentiators: end-to-end encryption (notes are yours only), backlinked networked notes with AI, and extreme speed/frictionlessness. Features include voice transcription, article outline generation from scattered thoughts, meeting note extraction, and custom prompt libraries. $10/month annually.

Reflect is notably *not* trying to be a company OS or team tool — it's a personal tool, deliberately. The E2E encryption is a genuine distinguisher vs Mem, Notion, and most others.

**Source:** [Reflect homepage](https://reflect.app) — T2

### Reor: offline/local AI PKM (blocked)

reor.app DNS resolution failed from this VM. Reor is an open-source, local-first AI note-taking app that runs models locally (Ollama/local inference). Not directly verifiable from this research session — would need a secondary fetch or manual check. Based on prior knowledge: it runs semantic search and AI on local notes without cloud, using Electron + local models. Flagging as *unverified for this report*.

### 2026 PKM differentiation map

| Tool | Core angle | AI approach | Privacy | Cloud/Local |
|---|---|---|---|---|
| Mem | Zero-effort capture, AI organises | MCP connector to Claude/external LLMs | Cloud, SOC 2 T2 | Cloud |
| Tana | Typed knowledge graph | Native AI on structured nodes, MCP | Cloud | Cloud |
| Capacities | Intentional depth, privacy | Selective AI on chosen spaces | GDPR, EU | Cloud |
| Reflect | Speed + E2E encryption | AI chat + voice + prompts | E2E encrypted | Cloud |
| Obsidian + plugins | File-based, local-first | Variable plugins | Local | Local/sync |
| Reor | Local-first open source | Local models (Ollama) | Local | Local |

**Assessment:** The Obsidian + plugins approach is increasingly being outperformed by purpose-built AI-native tools at specific workflows (especially meeting notes, weekly reviews, and LLM-connected knowledge retrieval). The Mem MCP connector is the highest-signal 2026 development — it's the first time a PKM tool has become a proper context *provider* to an LLM rather than just a consumer of AI features.

---

## Area 3 — Self-Hosted Google Drive Alternatives

### Nextcloud: Kitchen-sink platform, dominant mindshare (T1)

Nextcloud Server (GitHub: 29k+ stars) remains the most feature-complete self-hosted storage solution. Scope: files, contacts, calendars, mail, video chat, hundreds of apps. AGPLv3 license; strong enterprise/public sector positioning (Nextcloud GmbH provides commercial support).

For power users the appeal is breadth — you can replace Google Workspace entirely. The downside is operational complexity: it's a PHP application with a MySQL/PostgreSQL backend, and performance at scale requires tuning. The app ecosystem is large but uneven in quality.

**Not recommended as first choice** for power users who primarily want file sync and sharing — the operational overhead exceeds the benefit vs leaner options below. Best fit: teams/orgs that need the full collaboration stack and have ops capacity.

**Source:** [Nextcloud GitHub](https://github.com/nextcloud/server) — T1

### Syncthing: Best pure file sync for power users (T1)

Syncthing is the correct answer if the question is "I want my files to sync between my devices without trusting a cloud provider." Key properties:
- Peer-to-peer, no central server required (though relay servers exist for NAT traversal)
- Open source (MPLv2), actively maintained, [commercial support via Kastelo](https://kastelo.net)
- TLS encrypted in transit, data never touches third-party servers
- Works on Linux, macOS, Windows, Android
- No server to self-host — runs as a daemon on each device

What Syncthing is *not*: a web UI for browsing files from anywhere, a shared drive for colleagues, a replacement for the Google Drive web experience. It's sync, not storage-as-a-service.

**Recommendation for power user 2026:** Syncthing for personal file sync across devices. Pair with a VPS running Syncthing as a "always-on node" for availability when personal machines are offline.

**Source:** [Syncthing.net](https://syncthing.net) — T1

### Seafile: Performance-optimised, AI file properties (T2)

Seafile (seafile.com) pitches itself as "beyond just syncing and sharing" — new positioning around **AI-powered file property generation** and custom property views. You can add custom metadata to files and use AI to auto-generate those properties. The file organisation moves from folder-tree toward metadata/view-based.

This is the most interesting 2026 angle on self-hosted storage: treating files as objects with AI-enriched metadata rather than just bytes in a directory tree. Seafile has always been faster than Nextcloud for large file counts (block-level sync, not rsync-style). Now adding an AI metadata layer puts it in a distinct position.

Seafile CE (Community Edition) is free and open source. Pro adds features. Good fit for power users who want Nextcloud-level features without the Nextcloud operational pain.

**Source:** [Seafile homepage](https://www.seafile.com/en/home/) — T2

### ownCloud Infinite Scale (oCIS): Enterprise-grade, Go rewrite (T2)

oCIS is the complete rewrite of ownCloud in Go (vs PHP), positioned for scalability from Raspberry Pi to Kubernetes. Key features: single binary deployment, WebDAV + CS3 APIs, web office integration (Collabora, OnlyOffice, WOPI), OpenID Connect auth, scales horizontally. Apache 2.0 license.

For pure power user use: oCIS is overkill unless you need enterprise auth (Keycloak integration) or multi-user/multi-tenant deployment. The single binary is genuinely nice for small deployments but the Go build dependencies (CGO required) make custom builds non-trivial.

**Source:** [ownCloud oCIS GitHub](https://github.com/owncloud/ocis) — T2

### Immich: Self-hosted Google Photos replacement (T1)

Immich (GitHub: immich-app/immich) is not a Google *Drive* replacement but deserves mention as the best self-hosted **Google Photos** replacement. Feature parity is near-complete: auto-backup from mobile, facial recognition + clustering, CLIP search (search by objects/scenes, not just metadata), shared albums, partner sharing, memories, raw format support, OAuth. AGPL-3.0 license. Active development (star history chart shows rapid growth).

If Trajan has photo library concerns, Immich is the clear recommendation.

**Source:** [Immich GitHub](https://github.com/immich-app/immich) — T1

### 2026 Self-Hosted Stack Recommendation for Power User

| Need | Tool | Why |
|---|---|---|
| File sync across personal devices | Syncthing | Zero-trust P2P, no server required |
| Self-hosted shared storage + web UI | Seafile CE | Faster than Nextcloud, AI metadata features |
| Full collaboration suite (team) | Nextcloud | Best breadth, most support |
| Google Photos replacement | Immich | Near-parity features, active dev, AGPL |
| Enterprise-grade, scalable | oCIS | Go binary, Kubernetes-ready, OIDC |

---

## Key Takeaways

1. **Mem's Claude MCP connector** (March 2026) is the highest-signal PKM development — it makes your notes a live context source for external LLMs. If you use Claude heavily, evaluate Mem as your note/knowledge layer.

2. **Fibery Smart Agent** is the most honest "AI as executive layer" implementation currently available — it generates and executes code against your workspace schema rather than just prompting an LLM at plain text. 2× accuracy and speed vs Notion AI in direct benchmark.

3. **Tana's MCP + typed graph** is the best structured PKM for execs who want AI to query knowledge assets with high accuracy. Structure upfront → better AI output downstream. Higher setup cost than Mem but more precise retrieval.

4. **Syncthing + Seafile** is the 2026 power user self-hosted storage stack. Syncthing for personal device sync (no server required); Seafile CE for anything needing a web UI, sharing, or AI metadata features.

5. **Capacities** is worth watching for privacy-conscious users who want intentional AI rather than maximum automation — their explicit "AI for depth, not noise" positioning is a genuine philosophical alternative to the Mem/Tana AI-maximalist approaches.

---

## Contested / Uncertain

- **Reor**: Could not verify current state (DNS failure). Prior knowledge suggests it's the best local-model-only PKM option but this is unconfirmed from this session.
- **Fibery benchmark**: Self-reported by founder; methodology is transparent but not independently replicated.
- **Capacities AI features**: March 2026 article describes philosophy/intent; actual feature implementation depth not independently verified beyond blog claims.
- **Seafile AI properties**: Homepage-level claim; depth of AI feature not verifiable without a live instance.

## Open Questions

- Is Reor still actively maintained in 2026? (dns failure suggests possible domain change or deprecation)
- Has Tana shipped the AI Agents feature to general availability or still beta?
- Does Fibery's Smart Agent work on external data sources or only Fibery-native databases?
- What's the Nextcloud AI/smart features roadmap for 2026?

---

## Supplementary Research — Session 2 (exec-ai-mgmt-001)

*Additional findings discovered in a follow-up research pass on 2026-03-31.*

### NEW: Reor is Archived (March 7, 2026) — T1

The existing note flagged Reor as "DNS failure / unverifiable." Confirmed via GitHub: **Reor was archived on March 7, 2026** (read-only). 8.5K stars, 521 forks. Last release: v0.2.32 (April 2025). Architecture used Ollama + Transformers.js + LanceDB for fully local notes-as-RAG-corpus.

The archival is a meaningful signal: building a standalone local AI PKM editor (embedding pipeline + Ollama integration + editor) is hard to sustain as a small team. The concept was sound; the execution didn't hold momentum. SiYuan's approach—build a great PKM first, then expose it via MCP for AI agents to consume—appears more sustainable.

### NEW: Notion Custom Agents (Feb 24, 2026) — T1

Notion launched Custom Agents on 2026-02-24 (Notion 3.3). These are 24/7 autonomous agents described in plain language that Notion builds and runs. Key details from official release notes:
- 21,000+ agents created during early testing; Notion itself runs 2,800 agents internally
- MCP integration: connects to Linear, Figma, HubSpot, Slack, Notion Mail/Calendar
- Claimed >95% accuracy on task routing (vendor claim, not independently benchmarked)
- Remote IT ops team example: 20 hrs/week saved on ticket triage
- **Pricing shift: free through May 3, 2026; credit-based add-on starting May 4**

This is architecturally significant: Notion is positioning as the orchestration layer for enterprise knowledge work. The MCP integration means it connects to the same ecosystem as external AI agents.

### NEW: SiYuan v3.6.1 + MCP Server Layer (March 17, 2026) — T1

SiYuan (思源笔记) released v3.6.1 on March 17, 2026. Actively maintained. The key architectural development: **SiYuan now has a full MCP server layer** that transforms it from a passive PKM into a live knowledge source for AI agents.

What AI agents (Claude Desktop, Cursor, etc.) can do via SiYuan MCP:
- Manipulate individual content blocks (insert, update, delete)
- Execute SQL queries directly against the note database
- Manage custom metadata programmatically
- Create and structure new notes from external findings

The block-based architecture (every piece of content is a reference-able block) makes this more powerful than file-level access. For users who want full local control + AI agent workflows, SiYuan is the strongest current option.

Note: Primary dev community is Chinese-language; worth considering for enterprise evaluation.

### NEW: Fibery AI Context — Workspace-Aware AI (Feb 12, 2026) — T2

Previously documented Fibery's Smart Agent. New finding: Fibery shipped **AI Context** on Feb 12, 2026, making AI aware of the workspace's own schema (database names, views, rules, reports) without requiring users to describe them manually. Also added **Architect vs. User Mode** (Jan 22, 2026)—full design power for admins, clean user-facing interface for daily work.

### NEW: Immich v2.0 Stable (October 2025) — T1

Immich hit stable v2.0 in October 2025. The "still in beta" caveat is gone. AI features confirmed functional without GPU (though GPU accelerates them):
- DBSCAN-derived face clustering with CLIP-based semantic search ("beach sunset", "dog playing")
- ML pipeline as a separate Python service (swappable models)
- Hardware acceleration: CUDA, ROCm, OpenVINO, ARMNN/RKNN

Confirmed clear recommendation for self-hosted Google Photos replacement in 2026.

### NEW: AI Executive Assistant Market Context — T2

Market projection: $3.3B today → $21B by 2030 (MarketsandMarkets). Key new entrants:
- **Motion**: AI calendar that auto-schedules meetings + plans your full day
- **Ema (Universal AI Employee)**: agents take ownership of full operational roles, not just tasks
- **Sintra AI**: role-based autonomous agent teams

~40% of business workflows projected to be managed by agentic AI by 2026 (Google Cloud AI Trends Report). The accountability gap remains unresolved: governance tooling lags execution tooling.

### Additional Sources (Session 2)

13. [T1] [Notion Custom Agents Release Notes (Feb 24, 2026)](https://www.notion.com/releases/2026-02-24)
14. [T1] [Reor GitHub Repository (archived March 7, 2026)](https://github.com/reorproject/reor)
15. [T1] [SiYuan GitHub Repository (v3.6.1, March 17, 2026)](https://github.com/siyuan-note/siyuan)
16. [T1] [Immich GitHub (v2.0 stable)](https://github.com/immich-app/immich)
17. [T2] [Fibery AI Context Changelog (Feb 12, 2026)](https://community.fibery.io/t/february-12-2026-fibery-ai-context-create-and-update-reports-with-ai-tons-of-other-improvements/10385)
18. [T2] [Google Cloud AI Agent Trends 2026 Report](https://cloud.google.com/resources/content/ai-agent-trends-2026)
19. [T2] [SiYuan MCP Server Integration (Skywork)](https://skywork.ai/skypage/en/siyuan-mcp-server-ai-agents/1980486972900757504)
20. [T2] [Netbird: Immich Self-Hosting Guide](https://netbird.io/knowledge-hub/immich-guide-self-host-photos)

---

## Sources

1. [T2] [Fibery vs Notion AI Agent benchmark](https://fibery.com/blog/fibery-vs-x/fibery-vs-notion-ai-agent/) — Direct accuracy comparison, founder-written, transparent methodology
2. [T1] [Tana AI documentation](https://outliner.tana.inc/docs/tana-ai) — Official product docs covering AI features, MCP, meeting notetaker
3. [T2] [Fibery 2024 Year Review](https://fibery.com/blog/startup-diary/fibery-2024/) — Annual review with product positioning and metrics
4. [T1] [Mem MCP Claude connector announcement](https://get.mem.ai/blog/your-favorite-llms-can-now-use-your-second-brain-as-context) — Official Mem blog, March 18 2026
5. [T1] [Mem homepage](https://get.mem.ai) — Product overview, SOC 2 T2 compliance note
6. [T2] [Capacities AI philosophy](https://capacities.io/blog/ai-for-meaningful-work) — March 3 2026, intentional AI design principles
7. [T2] [Reflect.app homepage](https://reflect.app) — Product overview, E2E encryption, AI features
8. [T1] [Nextcloud GitHub](https://github.com/nextcloud/server) — Repository; feature list, license, deployment options
9. [T1] [Syncthing homepage](https://syncthing.net) — Product description, P2P sync, Kastelo commercial support
10. [T2] [Seafile homepage](https://www.seafile.com/en/home/) — AI file properties feature, positioning
11. [T2] [ownCloud oCIS GitHub](https://github.com/owncloud/ocis) — Go rewrite, single binary, Kubernetes scaling
12. [T1] [Immich GitHub](https://github.com/immich-app/immich) — Feature matrix, AGPL license, CLIP search
