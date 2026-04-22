---
title: "Multilingual Tool Calling Failure Mode (arXiv 2601.05366)"
type: research
created: 2026-03-27
updated: 2026-04-07
confidence: 0.85
source: "https://arxiv.org/abs/2601.05366"
tags: [tool-calling, multilingual, agent-failure-modes, llm-robustness, best-practice]
summary: "Parameter value language mismatch is the dominant tool-calling failure in non-English contexts — models understand intent correctly but emit parameter values in the user's language, causing silent execution failures."
---

# Multilingual Tool Calling Failure Mode

**Paper:** [Lost in Execution: On the Multilingual Robustness of Tool Calling in Large Language Models](https://arxiv.org/abs/2601.05366)
**Authors:** Zheng Luo, T Pranav Kutralingam, Ogochukwu N Okoani, Wanpeng Xu, Hua Wei, Xiyang Hu
**Category:** best-practice / agent-failure-modes
**Applied:** 2026-03-27T06:39:17Z
**Impact:** 2/5
**Project:** Auto Delegator Layer

## Core Finding

When users interact with LLM agents in non-English languages, models correctly understand intent and select the right tool — but generate parameter values in the user's language rather than the English expected by tool interfaces. This is a **system-level interface mismatch**, not a model understanding failure. The parameter value language mismatch is the single dominant failure cause across all tested models and languages.

The failure is particularly insidious because it looks correct from the LLM's perspective: the model understood the query, chose the right function, and produced semantically accurate arguments. But `location="纽约市"` fails where `location="New York City"` succeeds.

## The MLCL Benchmark

The paper introduces the Multilingual Cross-Lingual (MLCL) benchmark built on BFCL V4, testing single-turn tool-calling queries with multiple candidate functions. Tool interfaces remain English-only (as in real production systems).

**Languages tested:** English (baseline), Chinese (high-resource, logographic), Hindi (mid-resource, Devanagari script), Igbo (low-resource, Latin script).

**Diagnostic axes:**
- **Query Language Composition:** NT (English original), PAR (partially translated — parameter values kept in English), FT (fully translated)
- **Semantic Perturbation:** NO (none), PARA (paraphrase), SYNO (synonym substitution)

## Error Taxonomy

The paper defines an 8-level error taxonomy ordered by severity:

| Severity | Category | Example |
|----------|----------|---------|
| Highest | Syntax Error | Unparseable output |
| High | Function-Level Error | Wrong function or missing params |
| **Medium** | **Lang Mismatch: Wrong Value** | `location="纽约地铁站"` (NYC subway) |
| **Medium** | **Lang Mismatch: Related but Incorrect** | `location="纽约万豪酒店"` (NYC Marriott) |
| **Medium** | **Lang Mismatch: Same Meaning** | `location="纽约市"` (correct meaning, wrong language) |
| Lower | Wrong Value (English) | `location="Los Angeles"` |
| Lower | Related but Incorrect (English) | `location="New York"` (underspecified) |
| Lowest | Same Meaning (English) | `location="NYC"` vs. "New York City" |

The "Same Meaning" language mismatch row is the key insight: the model got everything right except the output language of the value.

## Quantitative Results

**14 models tested** across 5 families: GPT-5 (3 variants), DeepSeek V3.2, Llama 3.1 (8B/70B), Qwen 3 (5 variants including MoE), Granite 4 (2 variants).

Error rates roughly **double to quadruple** moving from English to fully translated queries:

| Model | English | Chinese (FT) | Hindi (FT) | Igbo (FT) |
|-------|---------|--------------|------------|-----------|
| DeepSeek V3.2 | ~10% | ~54% | ~44% | ~26% |
| GPT-5 | ~14% | ~47% | ~38% | ~29% |
| Llama 3.1-70B | ~14% | ~52% | ~38% | ~31% |
| Qwen3-32B | ~19% | ~46% | ~36% | ~36% |

**Language-specific patterns:**
- **Chinese:** Highest language mismatch rates. Models fluently mirror Chinese tokens into parameters because of abundant training data — high fluency makes the mismatch *more* likely.
- **Hindi:** Moderate mismatch plus transliteration errors (Devanagari → Latin).
- **Igbo:** Lowest language mismatch but highest semantic/understanding errors. Models don't copy Igbo tokens into parameters (too unfamiliar), but they fail to understand the query itself.

**Partial translation (PAR)** substantially reduces errors — when English parameter strings are preserved in the query, models handle non-English context well, approaching English baselines.

## Inference-Time Mitigations

Three strategies tested:

| Strategy | Mechanism | Stage |
|----------|-----------|-------|
| **PT** (Prompt Instruction) | System prompt: "Pass all parameter values in English" | During generation |
| **PRE** (Pre-Translation) | Translate user query to English before tool calling | Before generation |
| **POST** (Post-Translation) | Translate generated parameter values to English | After generation |

**Results for DeepSeek V3.2 on Chinese:**

| Setting | Error Rate |
|---------|-----------|
| FT (no mitigation) | ~55% |
| PT (prompt instruction) | ~37% |
| POST (post-translate) | ~27% |
| PRE (pre-translate) | ~25% |
| English baseline | ~10% |

**PRE is the most effective single mitigation** but still leaves a ~15 percentage point gap vs. English. It introduces semantic drift — translation can alter surface forms (e.g., "queen size bed" becomes "king-size bed" after round-trip).

For **Igbo, mitigations provide limited or negative benefit** — translation-based strategies can increase errors because the underlying problem is query understanding, not language mismatch.

## Practical Implications

1. **System prompt instruction** ("All tool parameter values must be in English regardless of input language") is the lowest-effort guard — already applied to our agent prompt templates as of 2026-03-27.
2. **Pre-translate user queries** before tool calling for the best single mitigation, but expect semantic drift on ~15% of cases.
3. **Different language tiers need different strategies:** high-resource languages suffer language mismatch (fixable with translation); low-resource languages suffer understanding failures (requires better base models).
4. **Monitor for "correct meaning, wrong language"** errors in production telemetry — they indicate the model understands the user but the interface rejects valid intent.
5. **Design tool interfaces to accept multilingual parameter values** where feasible — this eliminates the root cause entirely.
6. **MoE models show non-monotonic scaling** for multilingual tool calling — larger doesn't always mean better.

## Open Questions

- Combined strategies (PRE + POST together) were not tested.
- Only 3 non-English languages evaluated; European languages, Arabic, Japanese untested.
- Single-turn only — multi-turn agentic settings with error recovery remain unexplored.
- No evaluation of whether [[fine-tuning]] on multilingual tool-calling data closes the gap.

## Applied Action

Added explicit instruction to agent SOUL.md / prompt templates: "All tool parameter values must be in English regardless of input language." Low-effort guard against a documented failure mode. See [[2026-03-27-arxiv-digest]] for the broader research context.

## Related Notes

- [[2026-03-27-arxiv-digest]] — ArXiv digest where this paper was first reviewed
- [[Auto Delegator Layer]] — project where the mitigation was applied
- [[tool-calling]] — general tool-calling patterns and failure modes

---

## Source Context

- **Primary:** [arXiv 2601.05366](https://arxiv.org/abs/2601.05366) (T1 — direct paper)
- **Secondary:** arxiv-second-pass-001.txt (original extraction)

Tags: #intelligence #best-practice #auto-applied #tool-calling #multilingual #agent-failure-modes
