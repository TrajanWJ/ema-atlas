# Map

A one-screen orientation. If `INDEX.md` is the long-form index, this is
the wall map.

```
ema-atlas/
│
├── 🧭 Read-first docs
│   ├── README.md                    "what this repo is"
│   ├── VISION.md                    one-paragraph north star
│   ├── MACBOOK_AGENT_HANDOFF_MASTER single-file passover brief
│   ├── AGENT_QUICKREF.md            single-page everything
│   ├── FAQ.md                       anticipated questions
│   └── PROJECT_STATUS.md            what's shippable today
│
├── 🧱 Architecture & doctrine
│   ├── ARCHITECTURE.md              7-layer stack + OTP sketch
│   ├── DESIGN_PRINCIPLES.md         P1-P10 invariants
│   ├── EMA_V0_0_3_PREP.md           build-readiness for Gleam/BEAM
│   ├── GLEAM_NOTES.md               language orientation
│   ├── ROADMAP.md                   stages 1-6
│   ├── SECURITY_PRIVACY.md          working assumptions A1-A8
│   └── ATLAS_NOTES.md               atlas data contract
│
├── ❓ Open + decided
│   ├── OPEN_QUESTIONS.md            Q1-Q10 with status + blast radius
│   ├── GLOSSARY.md                  33 canonical + 15 vault candidate terms
│   └── content/decisions/           draft decision matrices (none yet)
│
├── 🗺  Lineage graph
│   ├── SYSTEM_GRAPH.md              eras + topic table + load-priority
│   ├── TIMELINE.md                  chronological skeleton
│   ├── INDEX.md                     auto-generated lookup
│   ├── BRANCH_MAP.md / BRANCH_MAP_EXPANDED.md
│   ├── graph/SCHEMA.md              node frontmatter + tag vocab
│   ├── graph/nodes/<branch>.qmd × 36
│   ├── graph/edges/<topic>.md × 11  (authority, execution, surfaces, …)
│   ├── graph.json                   machine-readable view
│   └── SYSTEM_MANIFEST.json         lighter index
│
├── 📜 Long-form handoff (numbered reading order)
│   ├── 01-best-prompt-and-answer.md
│   ├── 02-project-transfer-brief.md
│   ├── 03-architectural-evolution-and-major-decisions.md
│   ├── 04-agent-orchestration-and-shared-workspace-briefing.md
│   └── 05-fresh-context-project-app-model.md
│
├── 🧪 Research (Gleam/BEAM oriented)
│   ├── research/GLEAM_BEAM_FIT.md          capability + library survey
│   ├── research/COLLAB_PLANE_OPTIONS.md    CRDT/OT/hybrid for Q2/Q8
│   ├── research/parts/<slug>.md × 8        per-part Gleam mappings
│   ├── research/build-steps/01-04.md       v0.0.3 build-step starters
│   └── research/scaffold/                  Gleam project sketch (in flight)
│
├── 📦 Atlas content
│   ├── content/briefs/<slug>.md × 8        editorial briefs per part
│   ├── content/diagrams/<slug>/*.{mmd,svg} 24 Mermaid + 24 SVG renders
│   ├── content/vapps/<slug>.md × 8         per-vApp briefs
│   ├── content/demo/narrative.md           7-act walkthrough
│   ├── content/decision-matrix-template.md
│   ├── content/decisions/index.md
│   └── content/swarm/                      user-owned coordination doctrine
│
├── 🎨 Atlas Next.js app
│   ├── app/                                ~22 routes (parts, briefs, slides,
│   │                                       canvas, futures-board, decisions,
│   │                                       questions, timeline, research,
│   │                                       vapps, docs, desktop, graph, demo,
│   │                                       artifacts, showroom, program,
│   │                                       launchpad, api/graph, …)
│   ├── components/{site-shell,vision-triptych,futures-grid,decision-card,
│   │              graph-map}.tsx
│   └── lib/{ema-atlas,markdown,decisions}.ts
│
├── 🛠 Process + onboarding
│   ├── CONTRIBUTORS.md                     reading orders + invariants
│   ├── CONTRIBUTING_TO_GRAPH.md            graph-side workflows
│   ├── CHANGELOG.md                        wave-by-wave
│   ├── DELIVERABLES_INDEX.md               live tracker by format
│   └── howto/ × 9                          add-a-{branch,driver,vapp,…}
│
├── ⚙️  Scripts
│   ├── scripts/probe.sh                    machine state detection
│   ├── scripts/check-graph.sh              graph integrity
│   ├── scripts/manifest.sh                 regen SYSTEM_MANIFEST.json
│   ├── scripts/graph-json.sh               regen graph.json
│   ├── scripts/index.sh                    regen INDEX.md
│   ├── scripts/regen-all.sh                chain all four
│   ├── scripts/build-pdfs.sh               briefs → PDF
│   └── scripts/build-mermaid-svg.sh        diagrams → SVG
│
└── 🌳 36 lineage branches (other than main)
    │   See SYSTEM_GRAPH.md for the full era table.
    ├── codebase-* × 17                     code snapshots (canonical/inspiration/archive)
    ├── lineage-* × 5                       doctrine + workspace residue
    ├── docs-* × 8                          vault, host, era research, inspirations
    ├── recovery-* × 1                      fixture data
    ├── git-history-extracts                provenance
    ├── github-legacy-repos                 external pointers
    ├── design-review-fresh-context         newest user PRD framing
    └── lineage-index                       inventory of where every branch came from
```

## Use this map when

- You want to find a doc by category, not by name.
- You're orienting a new agent or contributor and they need a wall they
  can scan in 60 seconds.
- You're proposing a new file and need to confirm it has a category
  to live in (if not, you may be creating a new category — pause and
  ask whether it's needed).

## Cross-references

- [`INDEX.md`](INDEX.md) — the long-form lookup (auto-generated)
- [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md) — one-page everything (tables)
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — what's shippable today
- [`CONTRIBUTORS.md`](CONTRIBUTORS.md) — three reading orders
