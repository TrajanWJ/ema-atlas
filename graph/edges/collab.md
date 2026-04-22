# Edge: collaboration (docs / wiki / canvas / threads)

**Rule:** Live collaboration objects need their own sync substrate, separate
from `control_plane/event_log`. Daemon is the auth/permission gateway.

## Primary
- `docs-ema-next-steps` — `ULTIMATE-WIKI-ARCHITECTURE.qmd`,
  `ULTIMATE-WIKI-SOURCE-MAP.qmd`
- `design-review-fresh-context` — `05-fresh-context-project-app-model.md`
  §1 (Wiki), §3 (Threads/Server)

## Secondary
- `docs-vault-wiki`, `docs-host-obsidian-vault`, `docs-host-vault-context`
  — what the wiki currently looks like in Obsidian/markdown form

## Open design questions
- CRDT (Yjs/Automerge) vs event-log vs hybrid
- How collab objects reference control-plane execution records
- Inline-prompting model: agent op = proposal referencing object_id+range
