# GitHub Interesting — 2026-03-24

## 🚨 LiteLLM Supply Chain Attack
- **litellm 1.82.7–1.82.8** on PyPI compromised with credential stealer
- Malicious `.pth` file executes on Python startup, exfils SSH keys, cloud creds, wallets, env vars
- Exfil target: `litellm.cloud` (not `litellm.ai`)
- https://github.com/BerriAI/litellm/issues/24512

## 🧪 GPT-5.4 Pro Solves Open Math Problem
- Ramsey-style hypergraph problem from Epoch's FrontierMath
- Novel construction improving known lower bounds, confirmed by problem author
- Opus 4.6 and Gemini 3.1 Pro also solved it subsequently
- https://epoch.ai/frontiermath/open-problems/ramsey-hypergraphs

## 🧠 supermemoryai/supermemory (⭐ 18.5k)
- Memory and context engine, #1 on LongMemEval, LoCoMo, ConvoMem
- Hybrid RAG+memory, user profiles in ~50ms, connectors for Drive/Gmail/Notion/GitHub
- Plugins for Claude Code, OpenCode, OpenClaw
- https://github.com/supermemoryai/supermemory

## 🤖 NousResearch/hermes-agent (⭐ 12.5k)
- Self-improving agent with learning loop, skill creation from experience
- Multi-platform gateway (Telegram/Discord/Slack/WhatsApp/Signal)
- Six terminal backends including serverless (Modal, Daytona)
- https://github.com/NousResearch/hermes-agent

## 🔍 mvanhorn/last30days-skill (⭐ 5.5k)
- Agent skill for 30-day topic research across 9 platforms
- Multi-signal quality ranking, cross-platform convergence detection
- Claude Code skill and OpenClaw plugin
- https://github.com/mvanhorn/last30days-skill

## 💻 How I'm Productive with Claude Code
- Neil Kakkar's practical guide to agent-manager workflow
- Key patterns: automated PRs, parallel worktrees, agent self-verification
- https://neilkakkar.com/productive-with-claude-code.html

## 🖥️ Arm AGI CPU
- First Arm-designed silicon product in 35+ years
- Built for massively parallel agentic workloads at rack scale
- https://newsroom.arm.com/blog/introducing-arm-agi-cpu

## 🍷 Wine 11
- Kernel-level rewrite of Windows syscall handling on Linux
- Massive speed gains for gaming and Windows-only tools
- https://www.xda-developers.com/wine-11-rewrites-linux-runs-windows-games-speed-gains/
