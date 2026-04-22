---
title: "Tool Integration — March 2026"
created: 2026-03-18
updated: 2026-03-18
type: project
status: active
source: unknown
---

# Tool Integration — March 2026

**Date:** 2026-03-18
**Status:** In progress

## Installation Status

### ✅ Installed & Configured

| Tool | Source | Status | Notes |
|------|--------|--------|-------|
| **agent-fs** | [@desplega.ai/agent-fs](https://github.com/desplega-ai/agent-fs) | ✅ Installed via bun | Added to `~/.claude/settings.json` MCP servers. Binary at `~/.bun/bin/agent-fs` |
| **host-bridge-mcp** | [roll-w/host-bridge-mcp](https://github.com/roll-w/host-bridge-mcp) | ✅ Built | Binary at `~/tools/host-bridge-mcp/target/release/host-bridge-mcp`. Needs policy YAML config. |
| **Vane** | [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane) | ✅ Docker deployed | Running on port 3001. Needs AI provider configuration at http://localhost:3001 |

### 📝 Documented (Not Yet Installed)

| Tool | Source | Status | Notes |
|------|--------|--------|-------|
| **Harbor** | [av/harbor](https://github.com/av/harbor) | 📝 Documented | Local LLM stack orchestrator. Consider for SearXNG + Ollama. NOTE: "oSealtic/harbor" was 404 — correct repo is av/harbor |
| **Kali MCP** | [Wh0am123/MCP-Kali-Server](https://github.com/Wh0am123/MCP-Kali-Server) | 📝 Documented | Needs Kali VM/container. 577+ stars. AI-assisted pentesting. |

### ❓ Unresolved

| Item | Status | Notes |
|------|--------|-------|
| **OCD** | ❓ Unknown | Could not identify this tool. No GitHub results for "OCD" + AI/agents/CLI/coding. **Trajan:** What is OCD? Full name or URL? |
| **oSealtic/harbor** | ❌ 404 | Repo doesn't exist. Resolved to [av/harbor](https://github.com/av/harbor) instead |

## Conceptual Frameworks Absorbed

### 1. SciTeX Scientific Method
**Source:** [ywatanabe1989/scitex-python](https://github.com/ywatanabe1989/scitex-python)

Key takeaways integrated:
- **Clew verification:** Every claim needs a traceable evidence chain (SHA-256 hash DAGs → source URL chains for us)
- **Session model:** Every agent run = structured experiment with inputs/outputs/status
- **Confidence levels:** High/Medium/Low on all findings
- **Methodology documentation:** "How I found this" in every research output
- **Paradigm shift:** "Has this been verified?" not "could this be reproduced?"

Vault docs:
- `vault/Research/scitex-concepts.md` — Full concept breakdown
- `vault/Architecture/scientific-method-for-agents.md` — Integration design

### 2. AdalFlow Prompt Optimization
**Source:** [SylphAI-Inc/AdalFlow](https://github.com/SylphAI-Inc/AdalFlow) · [arXiv 2501.16673](https://arxiv.org/abs/2501.16673)

Key takeaways integrated:
- **SOUL.md = trainable parameters:** Agent prompts are the "weights" of the system
- **Textual gradients:** Natural language feedback used to iteratively improve prompts
- **Self-evolution loop = manual LLM-AutoDiff:** Our existing protocol is the manual version; automate it
- **Eval functions per agent:** Define measurable "good" for each agent
- **Few-shot in SKILL.md = DEMOS parameters:** Curate examples that improve task performance
- **Start with Researcher:** Most measurable outputs for first automated optimization

Vault docs:
- `vault/Research/adalflow-concepts.md` — Full library analysis
- `vault/Architecture/auto-prompt-optimization.md` — Integration design

## Next Steps (Priority Order)

1. **Configure Vane** — Set AI provider at localhost:3001, create `~/bin/vane-search.sh` wrapper
2. **Wire host-bridge-mcp** — Create `host-bridge.yaml` policy, test with Claude Code
3. **Test agent-fs MCP** — Verify in Claude Code session
4. **Add confidence levels** — Update Researcher + Scout SOUL.md to require confidence levels on all findings
5. **Add source tracking** — Standardize source URL format in all vault writes
6. **Design eval functions** — Start with Researcher agent metrics
7. **Prototype feedback loop** — Semi-automated: auto-critique → proposed SOUL.md diff → human approval
8. **Kali MCP** — Set up Kali container when security work is needed
9. **Harbor evaluation** — Consider for local LLM + SearXNG deployment

## Vault Files Created/Updated

- `vault/Research/scitex-concepts.md` — SciTeX deep dive
- `vault/Research/adalflow-concepts.md` — AdalFlow deep dive
- `vault/Research/harbor-llm-stack.md` — Harbor documentation
- `vault/Research/kali-mcp.md` — Kali MCP documentation
- `vault/Architecture/scientific-method-for-agents.md` — Agent methodology design
- `vault/Architecture/auto-prompt-optimization.md` — Self-evolution automation design
- `vault/Operations/vane-search.md` — Vane deployment + usage
- `vault/Projects/tool-integration-march-2026.md` — This file
