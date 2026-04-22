# AI Knowledge Hub

> Tools and configuration for my Claude Code + Obsidian stack.
> Decisions dated: 2026-03-11
> Last verified: 2026-04-16

---

## [[My Stack Decisions]] — What I'm Using

---

## My Stack

| Layer | Tool | Status |
|---|---|---|
| Obsidian Chat | [[Claudian]] | **CHOSEN** |
| MCP Bridge | [[obsidian-claude-code-mcp]] | **CHOSEN** |
| Format Skills | [[obsidian-skills (kepano)]] | **CHOSEN** |
| CLI Access | [[Obsidian CLI]] | **CHOSEN** |
| Semantic Search | [[QMD]] | **CHOSEN** |
| Memory | [[claude-mem]] | **CHOSEN** |
| Session Export | [[sync-claude-sessions]] | **CHOSEN** |
| Goal Cascade | [[obsidian-claude-pkm]] | **CHOSEN** |
| Skills Pack | [[everything-claude-code]] | **CHOSEN** |
| Task Management | [[Claude Task Master]] | **CHOSEN** |
| Auto-Approve | [[Dippy]] | **CHOSEN** |
| Injection Defense | [[Lasso claude-hooks]] | **CHOSEN** |
| Existing Plugins | Superpowers, Context7, Frontend Dev/Design, CodeGraphContext | **KEEPING** |
| Web UI | [[CloudCLI]] | **ARCHIVED** — replaced by [[JarvisAI]] (Mission Control + OpenClaw in KVM VM) |
| Voice Model | claude-sonnet (voice contexts) | **ACTIVE** — see [[Voice Model Selection]] |

---

## Knowledge Areas

### [[Obsidian Integration MOC|Obsidian Integration]]
Claudian, MCP bridge, CLI, skills, PKM — connecting Obsidian to Claude Code.

### [[Claude Code Plugins MOC|Claude Code Plugins & Configuration]]
Skills, memory, task management, safety hooks, CLAUDE.md optimization.

### [[Research - AI Spec-Driven Development Patterns 2026]]
Practical patterns for writing specs AI agents can execute: Kiro three-file structure (requirements → design → tasks), BMAD agent roles, 16-field component spec framework, backend API templates with OpenAPI-first pattern, animation/state machine specification, multi-session continuity via CLAUDE.md and steering files.

### [[Research - Zen Browser Extensions and Mods 2026]]
72 Zen Mods catalogued with UUIDs and relevance ratings. Firefox extension stacks for privacy, developer tools, AI integration, keyboard navigation (Tridactyl vs Vimium-FF verdict), and container+workspace integration pattern for 10+ concurrent projects.

### [[Research - Modern Browser Capabilities 2025-2026]]
Web platform APIs for local-first, no-login executive management apps. Storage (OPFS + SQLite WASM), AI (Gemini Nano, ONNX), WebGPU, PWA, View Transitions, and more.

### [[Creative Web Design Patterns - Executive App Inspiration]]
Surface-level analysis of 10 boundary-pushing sites. Patterns: windowed workspace, density slider, progressive disclosure, context-aware nav.

### [[Research - place.org Experimental UI Inspiration Deep Dive]]
Deep technical analysis for place.org. Concrete implementation details for: Poolsuite OS metaphor (window manager, boot sequence), Cameron's World (CSS absolute positioning, Photoshop-first layout), Almost Studio Draw feature (cursor-painting canvas), Mobbin (OCR search, Prototype Mode), 6 Awwwards experimental winners (Gen-02/WebGPU, Bruno Simon/vehicle nav, Jordan Breton/fixed-point camera), web OS window manager architecture (react-rnd, CSS containment, process state), terminal portfolios (jQuery Terminal), local-first storage (IndexedDB, SQLite WASM), Web Audio API patterns. Includes navigation pattern taxonomy (7 types).

---

## Current Setup

- **Web UI:** [[JarvisAI]] (Mission Control + OpenClaw in KVM VM)
- **Knowledge Base:** This Obsidian vault
- **CLI:** Claude Code
- **Node:** v22.22.1 (via nvm)
- **MCP:** CodeGraphContext (FalkorDB), QMD

---

## Evaluating (Docker Self-Hosting)

| Tool | Type | Status | Notes |
|---|---|---|---|
| [[builderz-labs Mission Control]] | Agent orchestration dashboard | ==INSTALLED== | Running in JarvisAI VM (:3000), zero deps, Claude Code session discovery |
| [[OpenClaw]] | AI assistant (20+ platforms) | ==INSTALLED== | Running in JarvisAI VM, isolated in KVM |

See [[Research - Self-Hosted AI Agent Platforms 2026]] for full comparison.

#ai #claude-code #my-stack
