---
name: prompt-engineering
description: Anthropic best practices for prompts — role, structure, examples, constraints, and the persuasion principles that move models.
triggers:
  - prompt engineering
  - system prompt
  - few shot
  - prompt template
  - claude prompt
---

# Goal

Write a prompt that gets the desired output on the first try, with no follow-up coaching.

## Inputs

- The task and its acceptance criteria
- The model (Opus / Sonnet / Haiku — different prompts work)
- The expected output format
- Any examples of good and bad output

## Workflow

1. **State the role first, in one sentence.** "You are a proposal generator." Not a paragraph about being helpful and harmless.
2. **State the task next, with the success criterion embedded.** "Generate a proposal that includes a title, summary, and three risks."
3. **Provide structure with XML tags.** Claude attends strongly to XML. Wrap inputs in `<context>`, `<examples>`, `<task>`. Wrap your expected output schema in `<output_format>`.
4. **Use examples for shape, not content.** One or two examples is usually enough. More examples bias toward those specific solutions.
5. **Put constraints as imperatives, not prohibitions.** "Reply in JSON" beats "do not reply in plain text".
6. **Place the most important instruction at the very end.** Models attend strongly to the last lines of the user turn.
7. **Use persuasion principles when stakes are high:**
   - **Authority**: "As the senior reviewer, you..." gives the model a lane.
   - **Specificity**: "Return exactly 3 risks" beats "return some risks".
   - **Reasoning before answering**: "Think step by step, then answer in JSON" raises quality on hard tasks.
   - **Negative examples**: showing one wrong answer prevents the most common failure mode.
8. **Verify the output schema in code, not in the prompt.** Validate JSON with Zod / Ecto changesets and reject malformed responses, do not just hope.

## Output Contract

A prompt is shippable when:
- Role is one sentence
- Task is one sentence with embedded success criterion
- Inputs are XML-wrapped and labeled
- Output format is explicit (JSON schema preferred)
- The most important rule is the last line
- It has been tested on at least 5 inputs covering edge cases

## Common Failure Modes

- **Wall-of-text system prompts.** The model attends to the start and end; the middle is wasted.
- **Politeness padding.** "Please be sure to..." adds tokens, not compliance.
- **Conflicting instructions.** "Be concise but thorough." Pick one.
- **Schema in prose.** "Include a title and a summary and..." → use a JSON example.
- **No examples for novel tasks.** First-of-kind tasks fail without one example.
- **Trusting the prompt to enforce shape.** Always validate output in code.

## See Also

- Anthropic prompt engineering guide
- `daemon/lib/ema/claude/context_manager.ex` (assemble/3)
- Skill: `tool-design`
- Skill: `write-concisely`
