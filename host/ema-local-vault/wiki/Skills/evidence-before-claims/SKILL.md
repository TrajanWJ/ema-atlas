---
name: evidence-before-claims
description: PAUL framework verification protocol — show output before claiming success, never assert confidence without artifact.
triggers:
  - verify
  - tests pass
  - it works
  - completion
  - done
  - success claim
---

# Goal

Stop the second-hand AI failure mode. Every claim of success must be backed by a verifiable artifact, not a confident assertion.

## Inputs

- A task that the agent (or a sub-agent) has just claimed to complete
- The acceptance criteria for that task
- The available verification commands

## Workflow

1. **Identify the verifiable artifact.** Every task has one: a passing test, a file with expected content, an HTTP 200, a row in a table, a screenshot. If you cannot name the artifact, you cannot claim completion.
2. **Run the verification command.** Do not infer from the agent's narration. Run the test. Read the file. Make the request.
3. **Compare output to acceptance criteria.** Literal comparison, not paraphrased. "All tests pass" is not a comparison; "23/23 green in `mix test`" is.
4. **Show the evidence in the response.** What you ran, what you observed, what you concluded. Three lines minimum.
5. **If the artifact is missing, the task is not done.** Report it as not-done, not as "almost done" or "done with caveats." Half-done is not-done.
6. **Repeat for every sub-agent claim.** When a Task tool returns "done," verify the artifact yourself. Never relay a claim you have not checked.

## Output Contract

A completion claim is acceptable only with all four lines:
1. **Ran**: the exact command
2. **Output**: the literal result (or a quoted excerpt)
3. **Compared to**: the acceptance criterion
4. **Conclusion**: pass / fail / partial

"I'm confident this works" is not in the contract. Delete it.

## Common Failure Modes

- **Inferring from logs.** "The compile output looked clean" is not verification. Run the tests.
- **Trusting sub-agent summaries.** Every handoff degrades. Verify the artifact, not the narration.
- **Verifying the wrong artifact.** Running unit tests does not verify integration. Pick the artifact that proves the criterion.
- **Verifying after the commit.** Verify before. A green test after a bad commit is still a bad commit.
- **Marking partial as complete to move on.** Future-you will pay for this. Mark partial as partial.
- **No reproducible command.** "I checked manually" is not verification. Future-you cannot rerun "manually".

## See Also

- `~/.claude/CLAUDE.md` Second-Hand AI Prevention section
- `daemon/lib/ema/claude/context_manager.ex` (verification_protocol/0)
- Skill: `multi-agent-patterns`
