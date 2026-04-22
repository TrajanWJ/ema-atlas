---
title: 'Reddit Intel: Claude Code Cache Bugs + Hidden Features + Qwen3.5 Autoresearch'
type: research
created: '2026-03-30'
confidence: 0.85
tags:
  - claude-code
  - llm
  - local-llm
  - obsidian
  - reddit-intel
summary: >-
  3 high-signal Reddit posts: Claude Code cache bugs (10-20x cost), Boris
  Cherny's 15 hidden CC features, Qwen3.5-397B perf tuning
wiki_id: research/reddit-intel-2026-03-30
imported_from: vault/Research/reddit-intel-2026-03-30.md
imported_at: '2026-04-04T00:23:57.171Z'
---

# Reddit Intel — 2026-03-30

## Posts Selected

### 1. [Reddit/r/ClaudeCode] PSA: Two cache bugs silently 10-20x your API costs
**URL:** https://reddit.com/r/ClaudeCode/comments/1s7mitf/
**Stars:** ★148

Two distinct caching bugs actively draining usage limits as of late March 2026.

**Bug 1: Prompt cache write broken (v2.1.59+)**
- Cache writes broken — files re-read from scratch every request
- Users hitting weekly limits in hours; $500+ API costs in single sessions
- GitHub issue #28899 (resolved)
- Workarounds: downgrade, add CLAUDE.md instructions to minimize reads, use MCP dependency graph server (~70% token reduction)

**Bug 2: Stale KV cache after context compaction (v2.1.62+)**
- Post-compaction cached prefixes stay stale but keep being served
- Model asserts files don't exist, continues stale task plans, resists redirection
- Server-side only change — binary identical to v2.1.61
- GitHub issue #29230 (closed "not planned", locked)
- Workarounds: `--no-compaction` flag, fresh sessions instead of resuming compacted ones

**Impact on agentic setups:** Long-running autonomous sessions hit hardest. 1M context window makes Bug 1 especially expensive.

---

### 2. [Reddit/r/ClaudeCode] 15 New Claude Code Hidden Features from Boris Cherny (creator)
**URL:** https://www.reddit.com/gallery/1s7j9f2
**Stars:** ★182
**Original source:** Boris Cherny (@bcherny) X thread, March 30 2026

1. **Mobile App** — iOS/Android apps; write code and review PRs from phone
2. **Teleport Sessions** — `claude --teleport` or `/teleport` to pull cloud session to local machine
3. **Remote Control** — `/remote-control` to manage local session from any device
4. **/loop and /schedule** — Automate tasks on intervals (minutes to a week):
   - `/loop 5m /babysit` — auto-address code review, shepherd PRs
   - `/loop 30m /slack-feedback` — auto-PR for Slack feedback
   - `/loop /post-merge-sweeper` — address missed review comments
   - `/loop 1h /pr-pruner` — close stale PRs
5. **Hooks** — lifecycle hooks: SessionStart, PreToolUse, PermissionRequest, Stop
6. **Dispatch (Cowork)** — secure remote control for Claude Desktop; uses your MCPs/browser
7. **Chrome Extension** — browser verification for frontend work
8. **Desktop App Web Server Testing** — auto starts web servers and tests with integrated browser
9. **/branch** — fork sessions via `/branch` or `claude --resume <id> --fork-session`
10. **/btw** — side questions without interrupting active work; ephemeral, cached, no tools
11. **Git Worktrees** — deep built-in support; `claude -w` or Desktop checkbox; run dozens in parallel
12. **/batch** — fans work to many worktree agents (dozens to thousands); for large migrations
13. **--bare flag** — skip auto-loading CLAUDE.md/settings/MCPs; up to 10x startup speedup for SDK/CI
14. **--add-dir** — grant access to additional repos beyond primary working dir
15. **Custom Agents** — define in `.claude/agents/` with restricted tools, custom models, colors
    - **Bonus: /voice** — hold spacebar to speak; rolling out to all users

---

### 3. [Reddit/r/LocalLLaMA] Autoresearch on Qwen3.5-397B: 36 experiments → 20.34 tok/s on M5 Max
**URL:** https://reddit.com/r/LocalLLaMA/comments/1s7g8ov/
**Stars:** ★118

*Note: Reddit post inaccessible to crawler; content from T1/T2 adjacent sources.*

- Qwen3.5-397B-A17B: 397B params sparse MoE, ~17B active per token, released 2026-02-16
- Full checkpoint ~807GB; Q8_0 GGUF fits in ~113GB RAM
- 20.34 tok/s on M5 Max is consistent with community benchmarks (~19.98 tok/s tg128)
- M5 Max ~2.3x perf of M4 Max, 1.5x M3 Ultra

Key optimizations documented in adjacent T1 sources:
- **Sparse V dequantization** (TurboQuant): skip dequant for softmax weights <1e-6; +22.8% decode at 32K context
- **IQ/smol quantization**: smol-IQ2_XS fits in 113.41 GiB
- **TurboQuant KV compression** (ICLR 2026): q8_0-K + turbo3-V, ~2% perplexity loss at 4-5x compression
- Metal thread config tuning, `--no-mmap` effects

---

## Posting Status
BLOCKED — Discord researcher webhook returning 404 (webhook deleted/regenerated). Posts not delivered.
