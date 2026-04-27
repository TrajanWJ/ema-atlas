# System Graph

Single rendered view of the lineage graph. Generated from `graph/nodes/` and
`graph/edges/`. When a node frontmatter changes, regenerate this file.

> **Reading order for a fresh agent:**
> 1. `README.md`
> 2. `MACBOOK_AGENT_HANDOFF_MASTER.md`
> 3. `AGENT_TRAVERSAL.md` (how to load context efficiently)
> 4. This file
> 5. `AGENT_BOOTSTRAP.md` if your machine does not yet have EMA installed

---

## Eras (vertical lineage)

```
place-org ────► claudeforge ────► ema-daemon ────► (mesh-p2p, future)
   │                │                  ▲
   │                │                  │
   └────► openclaw ─┴──────────────────┘
                                  ▲
                                  └── docs / vault / planning corpus
```

| Era | Status in v1 | Branches |
|---|---|---|
| `place-org` | doctrine-only (UX metaphor donor) | codebase-place-org, codebase-place-companion, codebase-place-org-openclaw, docs-place-org-era-research |
| `openclaw` | doctrine-only (already absorbed) | lineage-openclaw, lineage-openclaw-agent-workspaces, lineage-openclaw-archive-subprojects |
| `claudeforge` | doctrine-only (interface contract) | codebase-claudeforge, codebase-frontend-layer, codebase-mission-control-claude |
| `ema-daemon` | **canonical** | codebase-ema, lineage-original-elixir-ema, docs-ema-next-steps |
| `mesh-p2p` | strategic future | (no code yet — see docs-host-vault-agent-modules-routing) |
| `hybrid` | inspiration / pattern | agent-os-*, executive, multi-agent-expirements, execudeck, agentgpt, superman, t3code-fork |
| `meta` | maps & framing | main, lineage-index, design-review-fresh-context, docs-frontend-interface-inspirations, git-history-extracts, github-legacy-repos |

---

## Concept edges (load by topic, not by branch)

See `graph/edges/` for the full per-topic node lists. Quick map:

| Topic | Primary nodes | Secondary nodes |
|---|---|---|
| **authority / control plane** | codebase-ema, lineage-original-elixir-ema, docs-ema-next-steps | lineage-index, design-review-fresh-context |
| **execution / harness** | codebase-ema (`hermes_client.ex`), codebase-claudeforge (`hermes-provider.ts`) | codebase-agent-os-bridge, docs-clis-mcps-integrations, docs-host-vault-agent-modules-routing |
| **surfaces** | codebase-claudeforge, codebase-frontend-layer, codebase-mission-control-claude | codebase-place-org, codebase-place-companion, codebase-agent-os-demo*, codebase-execudeck, docs-frontend-interface-inspirations, docs-host-system-launchpad-hq |
| **shared workspace** | codebase-ema (`workspace/shared/`), docs-ema-next-steps | lineage-openclaw-agent-workspaces |
| **collaboration (docs/wiki/canvas)** | docs-ema-next-steps (`ULTIMATE-WIKI-ARCHITECTURE.qmd`), design-review-fresh-context | docs-vault-wiki, docs-host-obsidian-vault |
| **identity (org/space/project)** | design-review-fresh-context (`05-fresh-context-project-app-model.md`), docs-ema-next-steps | (no implementation yet anywhere) |
| **orchestration / multi-agent** | lineage-openclaw, codebase-multi-agent-expirements | codebase-executive, codebase-superman, codebase-mission-control-claude |
| **memory / vault / second-brain** | docs-vault-wiki, docs-host-obsidian-vault, docs-host-vault-context | codebase-ema (`second_brain/indexer.ex`) |
| **transport / p2p** | (none implemented) | docs-host-vault-agent-modules-routing (routing prior art) |
| **ux-metaphor (Launchpad/HQ/Desktop)** | codebase-place-org, docs-host-system-launchpad-hq, design-review-fresh-context | codebase-place-companion, codebase-agent-os-demo, docs-frontend-interface-inspirations |
| **recovery / fixtures** | recovery-old-agent-vm-vault-system | git-history-extracts, github-legacy-repos |

---

## Load-priority bands

| Priority | Branches | When to load |
|---|---|---|
| 1 — read first | main, lineage-index, design-review-fresh-context, codebase-ema, docs-ema-next-steps | Always. These are the spine. |
| 2 — read second | lineage-original-elixir-ema, codebase-claudeforge | When designing daemon or surface seam. |
| 3 — read on demand | lineage-openclaw, docs-vault-wiki, docs-host-vault-context, docs-host-system-launchpad-hq, docs-host-vault-agent-modules-routing, docs-clis-mcps-integrations, codebase-place-org, codebase-place-org-openclaw | When the topic edge points here. |
| 4 — pattern reference | codebase-place-companion, codebase-agent-os-*, codebase-frontend-layer, codebase-mission-control-claude, codebase-executive, codebase-multi-agent-expirements, docs-host-obsidian-vault, docs-place-org-era-research, docs-frontend-interface-inspirations, lineage-openclaw-agent-workspaces | Inspiration only. |
| 5 — archive | codebase-agentgpt, codebase-superman, codebase-t3code-fork, codebase-execudeck, codebase-agent-os-demo-pages, lineage-openclaw-archive-subprojects, recovery-old-agent-vm-vault-system, git-history-extracts, github-legacy-repos | Fixtures / archaeology only. |

---

## Inheritance edges (preserves_from / inspires)

```
lineage-original-elixir-ema  ──preserves──►  codebase-ema
lineage-openclaw             ──preserves──►  codebase-ema           (doctrine merged)
codebase-claudeforge         ──preserves──►  codebase-ema           (hermes-provider seam)
codebase-place-org           ──inspires────►  codebase-place-companion
codebase-place-org           ──inspires────►  docs-host-system-launchpad-hq
lineage-openclaw             ──inspires────►  lineage-openclaw-agent-workspaces
                                              lineage-openclaw-archive-subprojects
codebase-agent-os-demo       ──inspires────►  codebase-agent-os-v8
                                              codebase-agent-os-bridge
                                              codebase-agent-os-demo-pages
codebase-place-org           ──merges-with──  lineage-openclaw       ──►  codebase-place-org-openclaw
docs-ema-next-steps          ──refines──►    codebase-ema (target spec)
design-review-fresh-context  ──refines──►    docs-ema-next-steps    (newest user framing)
```

---

## Canonical rule (do not break)

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

Any node whose `status` is `canonical` enforces this rule.
Any node whose `status` is `doctrine-only` or `inspiration` may be cited but
must not be re-introduced as state authority.

---

## Updating this graph

1. Edit or add a `graph/nodes/<branch>.qmd` file.
2. If it creates a new cross-cutting connection, add a line to the relevant
   `graph/edges/<topic>.md`.
3. Update the topic table and the inheritance edge diagram above.
4. Update both endpoints' `referenced_in_docs:` frontmatter so the edge is
   reciprocal — the graph must remain navigable in both directions.
