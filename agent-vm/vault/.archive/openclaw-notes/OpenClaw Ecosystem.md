---
title: "OpenClaw Ecosystem"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [ecosystem, openclaw, plugins, research]
summary: "See [[OpenClaw Discord Setup]] for configuration details."
---
# OpenClaw Ecosystem

> Community plugins, tools, and integrations for [[OpenClaw]]. Researched 2026-03-14.

---

## Awesome Lists & Directories

| Project | Stars | What |
|---|---|---|
| [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) | 37k | 5,400+ skills filtered from ClawHub registry |
| [hesamsheikh/awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases) | 24.5k | Real-world workflows and [[usage patterns]] |
| [vincentkoc/awesome-openclaw](https://github.com/vincentkoc/awesome-openclaw) | -- | Most comprehensive meta-list of everything |
| [OpenClaw Directory](https://openclawdir.com/) | -- | Third-party directory for skills, plugins, jobs |
| [ClawHub](https://clawhub.ai) | -- | Official skill registry (13,700+ skills) |

---

## Discord Integration

See [[OpenClaw Discord Setup]] for configuration details.

### Official

| Project | What | Install |
|---|---|---|
| [steipete/discord](https://clawhub.ai/skills/discord) | Official Discord skill — messages, reactions, polls, threads, moderation, role/channel info | ClawHub skill |
| [avatarneil/discord-voice](https://github.com/avatarneil/discord-voice) | Voice channels with 6+ TTS providers (OpenAI, ElevenLabs, Deepgram, Polly, Edge, Kokoro), barge-in, auto-reconnect | ClawHub skill |

### Community

| Project | What | Install |
|---|---|---|
| [SaseQ/discord-mcp](https://github.com/SaseQ/discord-mcp) (206 stars) | MCP server with 30+ Discord functions — server ops, channels, roles, webhooks | Docker / MCP config |
| [alexerm/disclawd](https://github.com/openclaw/skills/blob/main/skills/alexerm/disclawd/SKILL.md) | Discord-clone protocol for AI agent-to-agent chat | ClawHub skill |
| [0xChris-Defi/openclaw-dashboard](https://github.com/0xChris-Defi/openclaw-dashboard) | Multi-channel dashboard with Discord status monitoring | Self-hosted |

---

## Memory & Context

| Project | Stars | What | Why |
|---|---|---|---|
| [CortexReach/memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro) | 2.3k | Hybrid BM25 + vector retrieval with cross-encoder reranking | Best-in-class memory plugin |
| [Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw) | -- | DAG-based summarization replacing sliding-window compaction | Never loses context |
| [MemTensor/MemOS-Cloud-OpenClaw-Plugin](https://github.com/MemTensor/MemOS-Cloud-OpenClaw-Plugin) | 263 | MemOS Cloud integration — recalls context before execution | First-party memory OS |
| [GustyCube/membrane](https://github.com/GustyCube/membrane) | 59 | Selective learning with typed, revisable memory | Fine-grained control |
| [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | 9.1k | Context database for AI agents (ByteDance) | Production infrastructure |

---

## Security & Governance

| Project | Stars | What | Why |
|---|---|---|---|
| [prompt-security/clawsec](https://github.com/prompt-security/clawsec) | 750 | SOUL.md drift detection, automated audits, skill integrity, NIST NVD feed | Gold standard security suite |
| [adversa-ai/secureclaw](https://github.com/adversa-ai/secureclaw) | 256 | OWASP-aligned security plugin | Standards-based |
| [knostic/openclaw-shield](https://github.com/knostic/openclaw-shield) | 53 | Prevents secret leaks, PII exposure, destructive execution | Data loss prevention |

---

## Multi-Agent & Orchestration

| Project | Stars | What | Why |
|---|---|---|---|
| [cft0808/edict](https://github.com/cft0808/edict) | 9k | 9 specialized AI agents, real-time dashboard, full audit trails | Production-grade multi-agent |
| [marian2js/opengoat](https://github.com/marian2js/opengoat) | 285 | Agent organizations coordinating across tools | Agent-to-agent coordination |
| [win4r/openclaw-a2a-gateway](https://github.com/win4r/openclaw-a2a-gateway) | 215 | Google A2A protocol plugin — bidirectional agent comms | Standard agent protocol |
| [JIGGAI/ClawRecipes](https://github.com/JIGGAI/ClawRecipes) | 85 | Launch agent teams with 1 command (15+ recipes) | Quick-start multi-agent |

---

## Self-Healing & Monitoring

| Project | What | Why |
|---|---|---|
| [LeoYeAI/openclaw-guardian](https://github.com/LeoYeAI/openclaw-guardian) | Watchdog: auto-monitor, self-repair, git rollback, daily snapshots, Discord alerts | Production [[Hardening]] |
| [bokonon23/clawdbot-cost-monitor](https://github.com/bokonon23/clawdbot-cost-monitor) | Cost and spending monitor | Financial oversight |

---

## MCP Bridges

| Project | What | Why |
|---|---|---|
| [Helms-AI/openclaw-mcp-server](https://github.com/Helms-AI/openclaw-mcp-server) | Exposes Gateway tools to Claude Code via MCP | Full gateway in your IDE |
| [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp) | Claude Desktop → self-hosted [[OpenClaw]] bridge with OAuth2 | Desktop integration |
| [ComposioHQ/openclaw-composio](https://github.com/ComposioHQ/openclaw-composio) | 860+ tools via single auth framework | Massive tool catalog |

---

## Self-Improving Agents

| Project | Stars | What | Why |
|---|---|---|---|
| [Gen-Verse/OpenClaw-RL](https://github.com/Gen-Verse/OpenClaw-RL) | -- | Reinforcement learning from conversations (arXiv 2603.10165) | Agents that improve from use |
| [lekt9/openclaw-foundry](https://github.com/lekt9/openclaw-foundry) | -- | Self-writing meta-extension that crystallizes patterns into tools | Agent that builds agents |
| [slhleosun/EvoClaw](https://github.com/slhleosun/EvoClaw) | 162 | Structured SOUL evolution with reflection | Personality evolution |

---

## Voice & Telephony

| Project | What | Why |
|---|---|---|
| [Voice Call Plugin](https://docs.openclaw.ai/plugins/voice-call) (Official) | Phone calls via Twilio/Telnyx/Plivo — inbound + outbound | Your agent makes phone calls |
| [Deepgram + OpenClaw](https://deepgram.com/learn/call-your-open-claw-over-the-phone-with-deepgram-voice-agent-api) | Phone calls via Deepgram Voice Agent API | High-quality voice |

---

## Home Automation & IoT

| Project | What | Why |
|---|---|---|
| [techartdev/OpenClawHomeAssistant](https://github.com/techartdev/OpenClawHomeAssistant) | Home Assistant add-on — 2000+ device protocols (Zigbee, Matter, Thread) | Smart home via natural language |
| MimiClaw (ESP32-S3) | $5 microcontroller [[OpenClaw]] with GPIO, sensors, relays | AI on $5 hardware |

---

## Crypto & DeFi

| Project | What | Why |
|---|---|---|
| [BankrBot/openclaw-skills](https://github.com/BankrBot/openclaw-skills) | Polymarket, crypto trading, DeFi ops across 5 chains | Complete crypto skill set |
| [Crossmint/openclaw-crossmint-plugin](https://github.com/Crossmint/openclaw-crossmint-plugin) | On-chain wallet and payments | Web3 payments |

---

## DevOps & Kubernetes

| Project | What | Why |
|---|---|---|
| [openclaw-rocks/k8s-operator](https://github.com/openclaw-rocks/k8s-operator) | K8s operator with Prometheus metrics, seccomp, NetworkPolicy | Production K8s deployment |
| [serhanekicii/openclaw-helm](https://github.com/serhanekicii/openclaw-helm) | Helm chart | Standard K8s packaging |

---

## Workflow Automation

| Project | What | Why |
|---|---|---|
| [caprihan/openclaw-n8n-stack](https://github.com/caprihan/openclaw-n8n-stack) | [[OpenClaw]] + n8n in Docker | Brain + hands in one stack |

---

## Dashboards & Developer Tools

| Project | Stars | What |
|---|---|---|
| [grp06/openclaw-studio](https://github.com/grp06/openclaw-studio) | -- | Web dashboard for agent management |
| [dreamwing/clawbridge](https://github.com/dreamwing/clawbridge) | 191 | Mobile dashboard — monitor from phone |
| [farion1231/cc-switch](https://github.com/farion1231/cc-switch) | 27.9k | Universal desktop app for Claude Code, Codex, [[OpenClaw]], Gemini |
| [OpenKnots/openclaw-extension](https://github.com/OpenKnots/openclaw-extension) | -- | VS Code extension |

---

## Productivity Integrations

| Integration | What |
|---|---|
| Notion via Composio MCP | Query databases, create pages, manage projects |
| Linear via Composio MCP | Issues, sprints, assignments via GraphQL |
| Google Workspace (Gog skill) | Gmail, Calendar, Drive, Contacts, Sheets, Docs |
| [ComposioHQ/secure-openclaw](https://github.com/ComposioHQ/secure-openclaw) (1.4k stars) | 500+ app integrations with scheduled reminders |

---

## Economic Agents

| Project | What | Why |
|---|---|---|
| [HKUDS/ClawWork](https://github.com/HKUDS/ClawWork) | Agents earn by completing tasks — "$15K in 11 hours" | Agents that must earn to survive |
| [ertugrulakben/cashclaw](https://github.com/ertugrulakben/cashclaw) | Autonomous freelance business operator | Sell, deliver, collect payment |

---

## Coding Agent Plugins

| Project | What | Why |
|---|---|---|
| [13rac1/openclaw-plugin-claude-code](https://github.com/13rac1/openclaw-plugin-claude-code) | Claude Code in isolated Podman containers | See [[Reference/OpenClaw Claude Code Plugin]] |
| [rustyrayzor/anthropic-max-proxy](https://github.com/rustyrayzor/anthropic-max-proxy) | Proxy using Claude Code auth | See [[Reference/Claude Max Proxy]] — installed |

---

## See Also

- [[OpenClaw Research]] — core platform evaluation
- [[Reference/OpenClaw Extensions]] — everything installed and configured
- [[Reference/OpenClaw Claude Code Plugin]] — container coding delegation
- [[Reference/Headless OAuth Recovery]] — emergency re-auth tool
- [[Reference/System Services]] — gateway systemd service
- [[Research/OpenClaw Discord Setup]] — Discord channel config

#openclaw #ecosystem #plugins #research

## Related

- [[GitHub]]
- [[Intel]]
- [[-]]
- [[OpenClaw Extensions Deep Dive]]
- [[research]]
- Favorites
- Deep
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Advancement]]
- [[Analysis]]
