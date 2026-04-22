---
agent: researcher
type: performance
updated: 2026-04-10
source: agent:main
title: "Researcher Agent Performance Profile"
created: 2026-03-16
status: active
confidence: 0.85
confidence_updated: 2026-04-10
tags: [agents, performance, researcher, openclaw]
summary: "Performance profile for the researcher agent — handles research tasks dispatched by the OpenClaw system, runs on Claude Sonnet 4.6."
---

# Researcher Agent Performance Profile

## Agent Overview

The **researcher** is one of the core agents in the [[Agent Roster|OpenClaw multi-agent system]]. It runs on `anthropic/claude-sonnet-4-6` with a 1M context window and 16K max output tokens, dispatched from the main orchestrator to handle research-oriented tasks. Its workspace lives at `~/.openclaw/agents/researcher/workspace/` and it follows the shared [[SOUL.md]] personality framework — concise, opinionated, resourceful before asking.

The researcher agent's primary loop is: receive a dispatched task (typically via JSON task files), conduct research using available tools (web search, web fetch, vault search, file reads), synthesize findings, and write output to vault notes or workspace files. It posts notable findings to a Discord `#research-feed` channel via webhook (though this webhook has been a recurring reliability problem — see Known Issues below).

## Configuration

| Property | Value |
|---|---|
| Model | `anthropic/claude-sonnet-4-6` |
| Context Window | 1,000,000 tokens |
| Max Output | 16,000 tokens |
| Heartbeat | disabled |
| Skills | 0 (no custom skills registered) |
| Workspace | `~/.openclaw/agents/researcher/workspace/` |
| Identity | Not yet personalized (IDENTITY.md is template) |

## Performance Log

### Entry 1 — 2026-03-18
- **Task**: ClawHub skill discovery and evaluation
- **Outcome**: partial
- **Corrections**: 0
- **Duration**: 8min
- **Notes**: Rate-limited on external APIs. Needs generous timeout for tasks involving multiple web fetches.

### Entry 2 — 2026-03-18 (56 sessions observed)
- **Task**: Bulk research dispatch — overnight batch of topic research, feed monitoring, arxiv analysis
- **Outcome**: mixed
- **Corrections**: N/A (automated batch)
- **Duration**: ~12 hours continuous
- **Notes**: 56 sessions logged on 2026-03-18 alone, running roughly every 30 minutes. Sessions ranged from 7KB/6 messages (quick timeouts or simple lookups) to 312KB/59 messages (deep multi-source research). The reflexion loop ("Lessons From Past Runs") was active on every session, indicating the dispatch engine injects prior outcome summaries before each run.

### Entry 3 — 2026-04-05 (32 sessions observed)
- **Task**: Continued research dispatch
- **Outcome**: operational
- **Corrections**: N/A
- **Duration**: Full day
- **Notes**: 32 sessions logged. The researcher remains the most heavily dispatched agent by session count in the OpenClaw system.

## Strengths

- **High throughput**: Consistently handles 30-50+ sessions per day in automated dispatch mode, making it the most active agent by volume.
- **Reflexion integration**: Every session begins with a "Lessons From Past Runs" summary injected by the dispatch engine, enabling basic learning across sessions.
- **Versatile task handling**: Successfully processes arxiv paper analysis, technology evaluations, feed monitoring, skill discovery, and competitive intelligence tasks.
- **Graceful degradation**: When external APIs are rate-limited or unreachable, the agent logs the limitation rather than hallucinating results.

## Weaknesses and Known Issues

### WEBHOOK_RESEARCHER Reliability (Critical, Recurring)
The Discord webhook for `#research-feed` (`WEBHOOK_RESEARCHER` in `discord-webhooks-v2.env`) has been documented as returning HTTP 404 / error code 10015 ("Unknown Webhook") across at least **12 separate source files** between 2026-03-25 and 2026-03-30. The webhook gets deleted or invalidated in Discord, the fix is applied, and it recurs. When the webhook fails, the agent falls back to bot token direct API posting — but that path has also been blocked by Cloudflare (error 1010). This means researcher findings are **silently dropped** when both paths fail, with dedup not registering the post, causing infinite retry loops.

**Impact**: Research output is lost without notification. This is the single highest-priority operational issue for the researcher agent.

### Rate Limiting on External APIs
The first logged task (ClawHub skill discovery) only achieved partial completion due to API rate limits. Tasks involving multiple sequential web fetches need longer timeouts than the default.

### No Custom Skills
Unlike agents like [[Agents/Performance/scout|scout]] which have been through the [[agent-tester]] suite, the researcher has 0 registered skills. This means it relies entirely on the base Claude Code toolset plus whatever MCP tools are available at dispatch time, with no specialized research workflows encoded as reusable skills.

### Identity Not Configured
The IDENTITY.md in the researcher workspace is still the blank template. While this doesn't affect task execution, it means the researcher has no persistent persona across sessions, which could matter for consistency in how findings are formatted and communicated.

### YouTube Research Degraded
As of 2026-03-26, `yt-dlp` is not installed on the host, so any YouTube-sourced research tasks fall back to title+channel inference at ~0.55 confidence. Transcripts are unavailable, silently degrading research quality for video sources.

## Comparative Performance

Based on [[Operations/Post-Mortems/compare-researcher-vs-coder-20260319|agent-replay analysis]] (2026-03-19):

| Metric | Researcher | Coder |
|---|---|---|
| Tasks Completed | 61 | 24 |
| Tasks Failed | 11 | 5 |
| Success Rate | 84% | 82% |
| Avg Duration | 10m 39s | 11m 40s |

The researcher is the **highest-volume agent** in the system by a factor of ~2.5x compared to coder. Its 84% success rate at that volume is solid, though the 11 failures suggest reliability improvements are possible (see Recommendations).

## Evolution Status

The researcher's [[Agents/Evolution/researcher|evolution log]] shows **11 proposal cycles** between 2026-03-16 and 2026-03-19, all with action `skipped` — meaning the context-evolution system has generated proposals but none met the confidence threshold for auto-application. One proposal (2026-03-19T00:32:23Z) reached confidence 0.72, the highest observed, suggesting the system is approaching but not yet crossing the auto-apply threshold for this agent.

This stagnation in evolution is likely connected to the researcher having **0 registered skills** — the evolution system has limited surface area to mutate when there are no custom skills or identity configuration to refine.

## Operational Patterns

- **Dispatch cadence**: ~30 minute intervals during overnight batch runs, more sporadic during daytime.
- **Session size distribution**: Bimodal — small sessions (6-12 messages, 7-14KB) for quick lookups or timeouts, large sessions (30-90+ messages, 100-300KB) for deep research.
- **Output destinations**: Vault notes under `~/vault/Research/`, Discord `#research-feed` (when webhook is functional), and workspace checkpoint files.
- **Error recovery**: The dispatch engine's reflexion loop surfaces prior failures, but the agent itself has no persistent memory between sessions beyond what the dispatch engine injects.

## Recommendations

1. **Fix webhook reliability**: Implement a health check that validates the webhook URL before dispatch, or switch to a more reliable posting mechanism (e.g., Discord bot API with proper token rotation).
2. **Install yt-dlp**: Restore YouTube transcript capability for video-source research tasks.
3. **Add research skills**: Encode common research patterns (arxiv analysis, competitive intelligence, technology evaluation) as reusable skills to improve consistency.
4. **Extend timeouts**: Set researcher-specific timeout configuration for tasks involving multiple web fetches (recommend 15-20 minute default vs current ~10 minutes).
5. **Run agent-tester suite**: The [[Agents/Performance/scout|scout agent]] has a full test suite with edge-case, helpfulness, persona-consistency, safety, and tool-usage scenarios. The researcher should go through the same evaluation.

## Related Notes

- [[Agent Roster]] — Full list of configured agents
- [[Agents/Performance/scout|Scout Performance]] — Example of a fully tested agent profile
- [[Trajan/Aspirational Agent System]] — Architecture for task dispatch
- [[System/Intelligence Extractions]] — Extracted insights from researcher sessions
- [[Agents/Evolution/researcher|Researcher Evolution Log]] — Proposal history and mutation tracking
- [[Operations/Post-Mortems/compare-researcher-vs-coder-20260319|Researcher vs Coder Comparison]] — Head-to-head performance analysis
- [[SOUL.md]] — Shared personality framework used by all agents
