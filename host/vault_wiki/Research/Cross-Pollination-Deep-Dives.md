---
id: "58c4c8a9-79c1-41da-96b2-06c075d3c17c"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Cross-Pollination Deep Dives
tags: [research, cross-pollination, patterns, architecture]
source: session-2026-04-07
---

# Cross-Pollination Deep Dives

Detailed analysis of 30+ repos and 50+ patterns. Researched 2026-04-07.

## claude-task-master (25.3k stars)
- 36 MCP tools (configurable: all/standard/core/custom)
- TDD workflow state machine (PREFLIGHT→BRANCH→SUBTASK_LOOP→FINALIZE)
- Loop presets (default, test-coverage, linting, duplication, entropy)
- Storage abstraction (IStorage: file vs API backends)
- Task expansion service (async background with jobId tracking)
- Callback-based output separation (business logic vs presentation)
- Task implementation metadata (relevantFiles, codebasePatterns, scopeBoundaries, acceptanceCriteria)

## PAUL Framework
- Plan-Apply-Unify mandatory loop with STATE.md
- Evidence-before-claims enforcement (must run verify, read output)
- Decimal phase interruptions (8.1, 8.2 for urgent work)
- Task verification: files/action/verify/done — if can't specify all four, task too vague
- Token economics: targets 2-3 tasks per plan (quality degrades past 50% context)

## claude-code-harness
- 13 TypeScript guardrail rules (R01-R13) with Deny/Warn/Ask actions
- Parallel workers with preflight self-checks
- 4-perspective review: Security, Performance, Quality, Accessibility
- Agent trace JSONL for validating plans against actual changes
- Effort control (low/medium/high) in agent frontmatter

## Phantom (ghostwright)
- Self-evolution: observe→critique→generate→validate→apply→consolidate
- Triple-judge validation with minority veto
- Dynamic MCP tool registration at runtime (survives restarts)
- Three-tier vector memory (Qdrant)
- Shareable artifacts with public URLs + auth

## gstack (Garry Tan, YC CEO)
- 23 specialist agent roles, 600K LOC shipped in 60 days
- Conductor manages 10-15 concurrent sprints
- /freeze and /guard for blocking destructive operations
- Staff engineer code review skill
- Browser automation with anti-bot stealth + live QA

## Knowledge Systems
- claude-memory-compiler: hook-based capture → daily compilation → index injection
- llm-wiki-compiler: topic synthesis, coverage indicators (high/medium/low), 84% token reduction
- codesight: blast radius analysis, hot file detection, 11.2x token reduction, MCP server mode
- graphify: multimodal knowledge graphs, 71.5x token reduction, god node detection

## Agent Frameworks
- open-multi-agent: auto task DAG decomposition, loop detection, structured observability
- autoresearch: metric-driven iteration, git as experiment log, multi-persona analysis
- crewAI (20k stars): role-based agent teams, delegation patterns
- langgraph (7k stars): graph workflows, durable execution, typed state channels
- mastra: TypeScript-first, durable execution, 40+ model providers
- ruflo: Claude-native swarm orchestration, distributed agents

## Memory & Knowledge Graphs
- graphiti (getzep): temporal knowledge graphs, validity windows, hybrid search
- mem0 (4k stars): universal memory layer, episodic/semantic/procedural
- code-review-graph: 6.8x fewer tokens on reviews, 49x on daily coding

## Key Resources
- MCP Registry: registry.modelcontextprotocol.io (200+ servers)
- Claude Agent SDK: anthropics/claude-agent-sdk-python + typescript
- PromptWizard (Microsoft Research): feedback-driven self-evolving prompts
- Peritext: CRDT for collaborative rich text
- Reflexion pattern: episodic memory buffer for agent self-improvement
