---
name: context-degradation
description: Recognize the four ways agent context rots — lost-in-middle, poisoning, distraction, clash — and the symptom each one produces.
triggers:
  - hallucination
  - lost in middle
  - context poisoning
  - prompt clash
  - agent drift
  - confused output
---

# Goal

Diagnose why an agent gave a bad answer by classifying the failure as one of the four canonical context degradation modes, then apply the matching mitigation.

## Inputs

- The full prompt that was sent (system + history + user turn)
- The agent's actual output
- The expected output
- Token counts per section if available

## Workflow

1. **Lost-in-middle check.** Was the critical instruction or fact placed in the middle third of a long context? Models attend strongly to the start and end and forget the middle. Symptom: the agent ignored a clear instruction that was clearly stated.
2. **Poisoning check.** Did earlier turns contain a wrong assumption, a stale fact, or a misleading example? Models take prior turns as ground truth. Symptom: confidently wrong about something that contradicts the user's later correction.
3. **Distraction check.** Are there multiple unrelated tasks, tools, or topics in the same window? Symptom: the agent answers a different question than the one asked, or invokes the wrong tool.
4. **Clash check.** Do any two pieces of context contradict each other (system prompt vs. tool description, two skills with overlapping rules, two memory entries)? Symptom: oscillating answers, refusal, or hedging.
5. **Apply the matching fix:**
   - Lost-in-middle → move the instruction to the end of the user turn, or repeat it.
   - Poisoning → trim history, summarize earlier turns, restart the session if severe.
   - Distraction → split into focused sub-prompts, drop unrelated tools.
   - Clash → resolve at the source (edit the skill, fix the memory entry); never ask the model to "use the more recent one."

## Output Contract

When you diagnose a degradation, name the mode explicitly and cite the specific tokens that caused it. "The agent was confused" is not a diagnosis. "The system prompt says X, but skill `tool-design` says not-X — clash" is.

## Common Failure Modes

- **Treating all bad output as hallucination.** Most "hallucinations" in production are degradation, not training failures.
- **Adding more context to fix degradation.** More tokens makes lost-in-middle and distraction worse, not better.
- **Fixing in the prompt instead of the source.** A clash patched in the user turn will recur; fix the skill or memory entry.
- **Not measuring before/after.** If you cannot reproduce the failure, you cannot verify the fix.

## See Also

- `daemon/lib/ema/claude/context_manager.ex`
- Skill: `context-compression`
- Skill: `context-fundamentals`
