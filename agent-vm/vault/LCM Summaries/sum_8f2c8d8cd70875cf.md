# LCM Summary sum_8f2c8d8cd70875cf

Created: 2026-03-18 02:40:29
Kind: leaf
Depth: 0
Conversation: 257
Tokens: 1215
Descendants: 0
Earliest: 2026-03-18T02:35:07.000Z
Latest: 2026-03-18T02:35:08.000Z

## Content

[2026-03-18 02:35 UTC]
# Agent Performance Log

*Track every delegation outcome. Consult before delegating.*

## Fitness Scoring Framework

Each agent has a **fitness score** calculated from three components:

```
fitness = (success_rate × 0.6) + (speed_score × 0.2) + (quality_score × 0.2)
```

**Components:**
- **success_rate** — Completed tasks / Total tasks (0.0–1.0). Timeouts count as 0.5, failures as 0.
- **speed_score** — 1.0 if avg_runtime ≤ default_timeout × 0.5, scales down to 0.0 at 2× timeout.
- **quality_score** — Average quality rating (1–5) normalized to 0.0–1.0.

**How to use:** Before dispatch, check the agent's fitness score for the relevant task type. Prefer agents with fitness ≥ 0.7 for critical tasks. Below 0.5 = try a different agent or tighter scope.

### Agent Fitness Scores (Updated Per Dispatch)

| Agent | Tasks | ✅ | ⏰ | ❌ | Success Rate | Avg Runtime | Speed Score | Avg Quality | Quality Score | **Fitness** |
|---|---|---|---|---|---|---|---|---|---|---|
| 🎯 Prompt Engineer | 1 | 1 | 0 | 0 | 1.00 | 1m50s | 1.00 | 5.0 | 1.00 | **1.00** |
| ⚙️ Ops | 1 | 1 | 0 | 0 | 1.00 | 3m21s | 0.80 | 4.0 | 0.80 | **0.92** |
| 📚 Vault Keeper | 2 | 0 | 2 | 0 | 0.50 | 5m+ | 0.40 | 4.0 | 0.80 | **0.54** |
| 🔬 Researcher | 1 | 0 | 1 | 0 | 0.50 | 5m+ | 0.30 | — | 0.50 | **0.46** |
| 💻 Coder | 1 | 0 | 0 | 1 | 0.00 | — | 0.50 | — | 0.50 | **0.20** |
| 🛡️ Security | 0 | — | — | — | — | — | — | — | — | **untested** |
| 🔭 Scout | 0 | — | — | — | — | — | — | — | — | **untested** |
| 😈 Devil's Advocate | 0 | — | — | — | — | — | — | — | — | **untested** |
| 🛎️ Concierge | 0 | — | — | — | — | — | — | — | — | **untested** |
| 🧠 Strategist | 0 | — | — | — | — | — | — | — | — | **untested** |

### Per-Task-Type Performance

| Task Type | Best Agent | Avg Latency | Notes |
|---|---|---|---|
| Prompt/SOUL edits | Prompt Engineer (1.00) | ~2min | Fast, reliable, first choice |
| System health/crons | Ops (0.92) | ~3min | Thorough, finds real issues |
| Vault audits (≤50 files) | Vault Keeper (0.54) | ~5min+ | Must scope tightly, needs long timeout |
| External API research | Researcher (0.46) | ~8min+ | Rate-limited, needs generous timeout |
| Feature building | Coder (0.20) | unknown | Only failure was infra (gateway restart), not agent fault |
| Security scanning | Security (untested) | untested | — |

### Failure Mode Tracking

| Agent | Common Failure Modes | Mitigation |
|---|---|---|
| Vault Keeper | Timeout on large scopes, no incremental writes | Scope ≤50 files, require partial writes every 2min |
| Researcher | External API rate limits, timeout | 8min+ timeout, retry with narrower query |
| Coder | Infra failures (gateway restart mid-task) | Always write CONTINUE.md, prefer atomic subtasks |

---

## Decision Heuristics

| Agent | Best For | Avoid For | Default Timeout | Avg Runtime |
|---|---|---|---|---|
| 🎯 Prompt Engineer | SOUL/AGENTS edits, prompt patterns | Long-running file ops | 3min | ~2min |
| ⚙️ Ops | Cron fixes, health checks, service ops | Creative/design tasks | 5min | ~3min |
| 📚 Vault Keeper | Targeted audits (≤50 files), link fixes | Full-vault scans | 10min | ~8min |
| 🔬 Researcher | Web research, evaluations, ClawHub | Simple lookups | 10min | ~5min |
| 💻 Coder | Feature building, protocol writing, code tasks | Quick one-liner fixes | 8min | ~5min |
| 🛡️ Security | Scanning, hardening, agent safety | — | 5min | untested |
| 🔭 Scout | Web scraping, feed monitoring | — | 5min | untested |
| 😈 Devil's Advocate | Reviewing proposals, challenging assumptions | — | 3min | untested |
| 🛎️ Concierge | Personal requests, recommendations | System tasks | 5min | untested |
| 🧠 Strategist | Multi-perspective analysis, decision frameworks | Simple questions | 5min | untested |

## Dispatch Rules (Learned the Hard Way)

1. **Vault Keeper: max 50 files per dispatch.** Full-vault scans (293 files) guarantee timeout.
2. **Researcher: expect 8min+ for ClawHub/external APIs.** Rate limits add unpredictable latency.
3. **Every agent MUST write partial results every 2min.** If it dies, partial work survives.
4. **On timeout: halve scope and retry once.** Then try different agent. Then handle directly.
5. **Gateway restarts kill ALL sub-agents.** Write CONTINUE.md before any restart.
6. **Tight scope + clear deliverable = success.** "Edit X file with Y changes" >> "audit everything."

## Performance History

### 2026-03-16 08:05 | prompt-engineer | ✅ COMPLETED
- **Task:** Apply 5 Claude production patterns to SOUL.md + fix AGENTS.md roster
- **Runtime:** 1m50s · **Quality:** 5/5
- **Lesson:** Fast and reliable for targeted prompt edits. Best agent.

### 2026-03-16 08:05 | ops | ✅ COMPLETED
- **Task:** Verify crons, health check, fix dead entries
- **Runtime:** 3m21s · **Quality:** 4/5
- **Lesson
[LCM fallback summary; truncated for context management]
