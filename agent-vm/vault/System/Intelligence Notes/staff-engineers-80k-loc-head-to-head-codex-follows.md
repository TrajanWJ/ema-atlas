---
title: "Staff Engineer's 80K LOC Head-to-Head: Codex vs Claude Code Rule Adherence and Context Discipline"
type: research
created: 2026-04-13
updated: 2026-04-14
confidence: medium
source: multi-source synthesis (HN threads, blog comparisons, context compaction research)
summary: "Codex CLI follows instruction files more consistently in autonomous mode; Claude Code needs more oversight but produces higher quality output. 1M context window degrades quality when filled — compact context discipline outperforms context maximalism."
tags: [ai-coding, codex, claude-code, context-engineering, best-practice]
---

# Staff Engineer's 80K LOC Head-to-Head: Codex Follows CLAUDE.md Rules More Consistently

## Core Finding

In large codebase scenarios (80K+ LOC), Codex CLI and Claude Code exhibit fundamentally different tradeoffs around instruction adherence, autonomy, and context management. Codex follows configuration rules more consistently in autonomous operation but produces lower-quality code. Claude Code produces superior output (67% blind-test win rate) but requires active developer oversight — "babysitting" — to stay on track in long sessions.

## Instruction Adherence

**Codex CLI** uses explicit TOML-based profiles switched with `--profile` flags, making the active configuration immediately auditable. Its `full-auto` mode runs without approval gates, and the explicit profile system prevents conflicts between user-level and project-level settings. This design means Codex reliably follows whatever rules are loaded because the configuration surface is small and deterministic.

**Claude Code** reads CLAUDE.md through a five-layer hierarchy (managed settings, command line, local project, shared project, user defaults), plus Skills, hooks, and rules directories. This layering is powerful but introduces ambiguity — user-level CLAUDE.md overrides can silently conflict with project settings. In practice, Claude Code sometimes drifts from instructions during long sessions, especially after context compaction events, requiring the developer to re-anchor it.

The tradeoff: Codex's auditability vs Claude Code's automation. For staff engineers running agents on large codebases with specific architectural constraints, Codex's predictable rule-following matters. For complex multi-file refactoring requiring deep reasoning, Claude Code's quality advantage matters more.

## The 1M Context Window Trap

The 1M token context window available on Opus 4.6 is described as a "noob trap" that degrades output quality when filled. The mechanism:

1. **Planning bloat**: Plan mode exploration fills 50-90% of context with tool calls, file reads, and architectural reasoning before implementation begins.
2. **Drag cost**: Implementation then re-reads the entire planning discussion as `cache_read` on every message — paying for context that's no longer relevant.
3. **Quality degradation**: Models perform worse with bloated context. Multiple compactions cause cumulative information loss, and auto-compaction mid-task can cause the model to "go off the rails."
4. **Cost explosion**: CLAUDE.md sent on every API call means a 10K-token file costs 10K x (number of messages) in cache_read per session. See [[claudemd-file-bloat-is-the-dominant-token-driver-9]].

The research on context compaction across tools (Claude Code, Codex CLI, OpenCode, Amp) shows divergent strategies:

| Tool | Compaction Trigger | Strategy |
|------|-------------------|----------|
| Claude Code | ~95% capacity | LLM summary, manual recommended at 85-90% |
| Codex CLI | 180K-244K tokens | Retains recent ~20K tokens + summary |
| OpenCode | Context limit minus output buffer | Protects last 40K tokens of tool output |
| Amp | Manual only | Short, focused conversations preferred |

Amp's manual-first philosophy — "keep conversations short and focused" — aligns with the "compact context discipline" finding: treating context as a budget, not a feature.

## Practical Implications

Boris Cherny, Staff Engineer at Anthropic and creator of Claude Code, publicly shared a CLAUDE.md of only ~100 lines — demonstrating that effective configuration is minimal, not maximal. This contradicts the instinct to stuff CLAUDE.md with every possible instruction.

The actionable takeaway for working with either tool on large codebases:

- **Prefer compact, focused context** over filling the window. Context is a budget.
- **Trigger manual compaction at 85-90%** capacity, not 95%.
- **Break work into 30-45 minute chunks** with tests after each step.
- **Use explicit task breakdown** to prevent hallucination in long sessions.
- **Extract infrequently-needed instructions** from CLAUDE.md into on-demand files. See [[claude-code-cache-bugs-causing-10-20x-api-cost-inf]] for cost implications.

## Benchmark Context

On SWE-bench, Claude Code (Opus 4.6) scores 80.9% vs Codex CLI (GPT-5.4) at ~80% — a statistical tie. But in blind developer evaluations, Claude Code wins 67% of matchups on code quality vs 25% for Codex. Codex leads on Terminal-Bench 2.0 (77.3% vs 65.4%) and uses ~4x fewer tokens for equivalent tasks.

The best staff engineers use both: Claude Code for architecture, complex features, and frontend; Codex CLI for autonomous tasks, DevOps, and cost-sensitive workflows.

## Sources

- [Codex CLI vs Claude Code in 2026: Architecture Deep Dive](https://blakecrosley.com/blog/codex-vs-claude-code-2026)
- [Context Compaction Research: Claude Code, Codex CLI, OpenCode, Amp](https://gist.github.com/badlogic/cd2ef65b0697c4dbe2d13fbecb0a0a5f)
- [Claude Code vs Codex CLI 2026 (NxCode)](https://www.nxcode.io/resources/news/claude-code-vs-codex-cli-terminal-coding-comparison-2026)
- [HN: A staff engineer's journey with Claude Code](https://news.ycombinator.com/item?id=45107962)
- [Claude Code Best Practices: Inside the Creator's 100-Line Workflow](https://mindwiredai.com/2026/03/25/claude-code-creator-workflow-claudemd/)
