---
id: "bee1ece9-f6b2-4b70-9e84-2f7a85e099b3"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Cross-Pollination Resources
tags: [research, cross-pollination, tools, patterns]
source: session-2026-04-07
---

# Cross-Pollination Resources

Curated list of high-signal repos and patterns for EMA improvement. Researched 2026-04-07.

## Tier 1: Battle-Tested, High-Signal

### claude-task-master (eyaltoledano)
- Task dependency DAGs, AI decomposition, MCP tools for task management
- https://github.com/eyaltoledano/claude-task-master

### PAUL Framework (ChristopherKahler)
- Plan-Apply-Unify loop, STATE.md, evidence-before-claims, mandatory reconciliation
- https://github.com/ChristopherKahler/paul

### claude-code-harness (Chachamaru127)
- Runtime guardrails (deny/warn/ask), parallel workers, 4-perspective code review, evidence packs
- https://github.com/Chachamaru127/claude-code-harness

### claude-memory-compiler (coleam00)
- Hook-based session capture, daily compilation, no-RAG at personal scale, index injection
- https://github.com/coleam00/claude-memory-compiler

### llm-wiki-compiler (ussumant)
- Topic-based synthesis, coverage indicators, staged adoption, concept articles, query filing
- https://github.com/ussumant/llm-wiki-compiler

### codesight (Houseofmvps)
- Blast radius analysis, hot file detection, dependency graphs, MCP server mode, 11x token reduction
- https://github.com/Houseofmvps/codesight

## Tier 2: Strong Patterns

### crm.cli (dzhng)
- Filesystem-first (FUSE mount), pipe-first JSON, hierarchical config, skill installation
- https://github.com/dzhng/crm.cli

### graphify (safishamsi)
- Multimodal knowledge graphs, 71x token reduction, god node detection, auto-sync watch mode
- https://github.com/safishamsi/graphify

### open-multi-agent (JackChen-me)
- Auto task decomposition, heterogeneous models, loop detection, structured observability
- https://github.com/JackChen-me/open-multi-agent

### autoresearch (uditgoenka)
- Metric-driven iteration loops, git as experiment log, multi-persona analysis, auto-rollback
- https://github.com/uditgoenka/autoresearch

### oauth-cli-coder (codeninja)
- TMux-based agent orchestration, persistent named sessions, stealth mode, output capture
- https://github.com/codeninja/oauth-cli-coder

### ai-codex (skibidiskib)
- Pre-generated reference files, 50K+ token savings, framework detection, git hook integration
- https://github.com/skibidiskib/ai-codex

## Tier 3: Specific Patterns

### gstack (garrytan) — https://github.com/garrytan/gstack
### skills (slavingia) — https://github.com/slavingia/skills
### viz-pack (joshua-heygen) — https://github.com/joshua-heygen/viz-pack
### phantom (ghostwright) — https://github.com/ghostwright/phantom
### minutes (silverstein) — https://github.com/silverstein/minutes
### Waza (tw93) — https://github.com/tw93/Waza
### Understand-Anything (Lum1104) — https://github.com/Lum1104/Understand-Anything
### claude-emotion-prompting (OuterSpacee) — https://github.com/OuterSpacee/claude-emotion-prompting
### github-optimization-skill (199-biotechnologies) — https://github.com/199-biotechnologies/github-optimization-skill
### harness-engineering (ZhangHanDong) — https://github.com/ZhangHanDong/harness-engineering-from-cc-to-ai-coding

## Top Patterns to Steal

### 1. Mandatory UNIFY/Reconciliation Phase (PAUL)
Force explicit closure after every work phase. Prevents context rot.

### 2. Runtime Guardrails with Deny/Warn Rules (Harness)
TypeScript-compiled rules that prevent destructive operations at runtime.

### 3. Topic-Based Knowledge Compilation (llm-wiki-compiler)
Synthesize raw files into topic articles with coverage indicators. 84% token reduction.

### 4. Blast Radius Analysis (codesight)
Before changing a file, show which routes/models/files are affected.

### 5. Auto Task Decomposition (open-multi-agent)
User provides goal; framework auto-breaks into task DAG and assigns agents.

### 6. Metric-Driven Improvement Loops (autoresearch)
Define measurable goal; agent iterates autonomously. Git as experiment log.

### 7. Filesystem-as-API (crm.cli)
Mount structured data as files; let agents use standard Unix tools.

### 8. Evidence-Before-Claims (PAUL)
No "it should work" — must run verify command and read output before claiming done.

### 9. Hook-Based Auto-Capture (claude-memory-compiler)
SessionEnd hooks capture conversations into daily logs; background compilation.

### 10. Persistent Knowledge Graphs (graphify)
Build permanent index reducing context window pressure by 71x.
