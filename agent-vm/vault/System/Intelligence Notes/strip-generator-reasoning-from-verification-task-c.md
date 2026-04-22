---
title: "Strip Generator Reasoning from Verification Task Context"
type: reference
created: 2026-03-27
updated: 2026-04-15
confidence: high
source: best-practices-enrichment-001.txt, CoVe research, multi-agent debate literature
tags: [intelligence, best-practice, verification, confirmation-bias, multi-agent]
summary: "Passing a generator's chain-of-thought to a verifier causes confirmation bias — verifiers must receive only the artifact and success criteria for independent checking."
---

# Strip Generator Reasoning from Verification Task Context

Passing the original generator's chain-of-thought to the verifier causes confirmation bias, not independent checking. This is a foundational principle for any multi-agent verification pipeline: **the verifier must evaluate the output on its own terms, not through the lens of the generator's reasoning**.

## The Problem: Anchoring and Sycophancy in Verification

When a verification agent receives both the output artifact and the generator's reasoning trace, two failure modes emerge:

1. **Anchoring bias**: The verifier's evaluation is anchored to the generator's framing. If the generator explained *why* it chose approach X, the verifier unconsciously evaluates X more favorably — it has already been primed with a justification. Research on Chain of Verification (CoVe) confirms that when a model can see its own draft while answering verification checks, it copies the same hallucination again, because the reasoning trace acts as a persuasive anchor.

2. **Sycophancy / rubber-stamping**: LLM-based agents exhibit a strong tendency toward sycophancy — uncritically adopting the prior agent's conclusions rather than forming independent judgments. Research on multi-agent debate systems (Arxiv 2510.07517) found that sycophancy is far more common than self-bias: agents are particularly susceptible to being influenced by *who* proposed an idea (or that it was proposed at all) rather than evaluating merit objectively.

The combination means a verifier that sees the generator's reasoning is doing **confirmation**, not **verification**. It starts from "this is probably right" and looks for reasons to agree, rather than starting from the artifact itself and looking for reasons it might be wrong.

## The Solution: Blind Verification

Strip the generator's reasoning from the verification context. Pass only:

- **The output artifact** (code, text, data — whatever was produced)
- **The success criteria** (what "correct" looks like, specified independently)
- **The original task specification** (what was asked for)

Do **not** pass:
- The generator's chain-of-thought or intermediate steps
- The generator's self-assessment or confidence signals
- Any metadata that reveals the generator's identity or approach

This mirrors the principle of **blind review** in academic peer review and **double-blind testing** in clinical trials — the reviewer's judgment is more reliable when they cannot be influenced by the author's reputation or self-justification.

## Evidence and Quantification

- **CoVe research** shows that factored execution — where each verification question is processed without exposure to the initial answer — reduces factual hallucinations by 50–70% on QA and long-form generation benchmarks.
- **Identity Bias Coefficient (IBC)** research demonstrates that response anonymization (removing identity markers from prompts) forces agents to evaluate content rather than source, measurably reducing bias in multi-agent systems.
- In practice, the [[rubber-stamp-reviewer-problem-verifiers-that-see-g|rubber-stamp reviewer problem]] is the downstream symptom: verifiers that see generator reasoning output just agree rather than independently verify.

## Implementation in Dispatch Engine

In `dispatch-engine.sh` or task handoff scripts, when spawning a verification/peer-review task:

```
# WRONG: passes full context including reasoning
task_context="$generator_output\n$generator_reasoning\n$success_criteria"

# RIGHT: passes only artifact and criteria
task_context="$generator_output\n$success_criteria\n$original_spec"
```

Additional hardening:
- **Require disagreement-first review**: The verification prompt should instruct the reviewer to state at least one concern or potential issue *before* giving approval. This counteracts the default sycophantic tendency.
- **Separate context windows**: Use a fresh agent instance for verification, not the same agent that generated. Even with reasoning stripped, same-session agents retain implicit context from the [[lost-in-middle-phenomenon-confirmed-in-agentic-wor|lost-in-middle phenomenon]] and attention patterns.
- **Structured verification output**: Require the verifier to produce a structured assessment (pass/fail per criterion, specific evidence for each judgment) rather than free-form approval.

## Broader Principle

This is an instance of a general rule in adversarial evaluation design: **the strength of a check is inversely proportional to the information shared between generator and checker**. Maximum verification strength comes from maximum information asymmetry — the checker knows what "correct" looks like but nothing about how the current answer was produced.

This principle applies beyond LLM agents to any system with generator-verifier architecture: code review (don't read the PR description before reviewing the diff), QA testing (test from the spec, not the implementation notes), and audit (examine records without management's narrative).

## Related

- [[rubber-stamp-reviewer-problem-verifiers-that-see-g|Rubber-stamp reviewer problem]]
- [[lost-in-middle-phenomenon-confirmed-in-agentic-wor|Lost-in-middle phenomenon in agentic work]]
- [[pipeline-smoke-test-pattern-verify-all-layers-disp|Pipeline smoke test pattern]]

## Sources

- Meta AI, "Chain-of-Verification Reduces Hallucination in Large Language Models" (2023)
- "When Identity Skews Debate: Anonymization for Bias-Reduced Multi-Agent Reasoning" (arXiv:2510.07517)
- "Unveiling Confirmation Bias in Chain-of-Thought Reasoning" (ACL 2025 Findings)

---
Category: best-practice
Applied: 2026-03-27T06:28:40Z
Impact: 4/5
Project: Auto Delegator Layer
