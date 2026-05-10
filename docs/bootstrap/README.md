# Bootstrap Docs

This directory holds bootstrap orchestration artifacts that must survive across
sprint handoffs. Keep these files tracked while Sprint 2.5 and Sprint 3 are
active.

| File pattern | Convention | Notes |
| --- | --- | --- |
| `ORCHESTRATOR-LOG.md` | Append-only | Halt evidence and phase progress log. Do not rewrite prior findings. |
| `ORCHESTRATOR-PROMPT.md` | Mutable by replacement only | Base prompt captured from conversation. Amend through patch files, not inline drift. |
| `ORCHESTRATOR-PROMPT-PATCH-*.md` | Mutable until applied | Prompt deltas for future reruns. Preserve prior patch rationale. |
| `CLI-VERB-INVENTORY.md` | Snapshot | Read-only inventory used to scope Sprint 2.5. Regenerate as a new dated file if needed. |
| `AWAITING-APPROVAL-*.md` | Ephemeral working artifact | Human approval markers. Remove or archive only after the corresponding approval is recorded. |
| `*-INT-*.md`, `*-PROP-*.md` | Sprint working artifact | Intent and proposal drafts until daemon-backed intent/proposal writers can own them. |

Do not place large runtime captures, Codex JSONL streams, or generated build
outputs here. Those belong under the runtime paths named by the relevant sprint.
