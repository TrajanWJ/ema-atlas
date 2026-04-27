# Deliverables Index

Live tracker of every deliverable expressed across the EMA Atlas. The
catalog mirrors the format inventory in [`howto/add-a-deliverable.md`](howto/add-a-deliverable.md).
Status is **status-honest** — stub means stub.

> Regenerate the count summary by running `./scripts/index.sh` (which
> doesn't track deliverables yet — TODO add a `scripts/deliverables.sh`
> emitter). For now, this file is hand-maintained when shipping a new
> deliverable; see [`howto/add-a-deliverable.md`](howto/add-a-deliverable.md)
> step 7.

## By format

### Briefs (Markdown, screen + print)

Located at `content/briefs/<slug>.md`; rendered by `app/briefs/[slug]/page.tsx`.

| Slug | Status | Words | Notes |
|---|---|---|---|
| authority-control-plane | shipped | ~1366 | full structure |
| harness-execution | shipped | ~1360 | full structure |
| shared-workspace | shipped | ~1330 | full structure |
| coordination-environment | shipped | ~1255 | full structure |
| semantic-layer | shipped | ~1113 | full structure |
| shells-surfaces | shipped | ~985 | full structure |
| identity-project-space | shipped | ~1064 | full structure |
| mesh-replication | shipped | ~1240 | references new vault candidate terms (Ghost Space, Distributed AI Delegation, MCP Gateway) |

### Slides (Next.js page route)

Located at `app/slides/[slug]/page.tsx` (single dynamic template).

| Part | Status | Notes |
|---|---|---|
| all 8 parts | sketched | template renders 4 slides per part (intro + 3 visions). Could expand. |

### Canvas boards (Next.js page route)

Located at `app/canvas/[slug]/page.tsx`.

| Part | Status | Notes |
|---|---|---|
| all 8 parts | sketched | 3 vision cards on a thread-style layout. Could integrate Mermaid SVG. |

### Mermaid diagrams

Located at `content/diagrams/<slug>/<name>.mmd` (3 per part).

| Part | now.mmd | three-futures.mmd | decisions.mmd |
|---|---|---|---|
| authority-control-plane | shipped | shipped | shipped |
| harness-execution | shipped | shipped | shipped |
| shared-workspace | shipped | shipped | shipped |
| coordination-environment | shipped | shipped | shipped |
| semantic-layer | shipped | shipped | shipped |
| shells-surfaces | shipped | shipped | shipped |
| identity-project-space | shipped | shipped | shipped |
| mesh-replication | shipped | shipped | shipped |

SVG renders via `scripts/build-mermaid-svg.sh` (requires `mmdc`).

### Printable PDFs

Located at `content/briefs/pdf/<slug>.pdf` (after running `scripts/build-pdfs.sh`).

| Slug | Status |
|---|---|
| all | not yet generated — script is wired, no run yet |

### Codebase reference embed

Located at `app/desktop/page.tsx` (place.org-inspired spatial surface).

| Status | Notes |
|---|---|
| sketched | route exists; embed of `codebase-place-org` references is TBD |

### Decision cards

Located at `components/decision-card.tsx`; rendered on `/decisions`.

| Status | Notes |
|---|---|
| shipped | red/amber/green readiness heuristic per Q1-Q10 |

### Futures grid

Located at `components/futures-grid.tsx`; rendered on `/futures-board`.

| Status | Notes |
|---|---|
| shipped | 24 cards (8 parts × 3 visions), groupable by stance |

### Excalidraw embeds

| Status |
|---|
| planned — no content yet |

### Remotion animations

| Status |
|---|
| planned — no content yet |

### Mockup images

| Status |
|---|
| planned — no content yet |

### vApp briefs

Located at `content/vapps/<slug>.md` (one per named app surface).

| Slug | Status |
|---|---|
| wiki | planned |
| chat | planned |
| threads | planned |
| agent-venv | planned |
| blueprint | planned |
| launchpad | planned |
| hq | planned |
| virtual-desktop | planned |

(Wave 4 subagent J is writing these; flip to `shipped` when landed.)

### Research docs (Gleam/BEAM, collab plane)

Located under `research/`.

| File | Status |
|---|---|
| `research/GLEAM_BEAM_FIT.md` | in flight (subagent G) |
| `research/parts/<slug>.md` × 8 | in flight (subagent H) |
| `research/COLLAB_PLANE_OPTIONS.md` | in flight (subagent I) |
| `research/raw/` | as-needed by subagents |

## By route

| Route | Renders | Status |
|---|---|---|
| `/` | hero + featured parts + featured triptych | shipped |
| `/parts` | all 8 parts list | shipped |
| `/parts/[slug]` | single part with hard questions + visions + deliverable chips | shipped |
| `/briefs/[slug]` | brief markdown render | sketched (currently uses Part data, not yet content/briefs/) |
| `/slides/[slug]` | 4-slide deck | sketched |
| `/canvas/[slug]` | 3-card thinking board | sketched |
| `/artifacts` | inventory of deliverable formats | sketched |
| `/demo` | staged narrative walkthrough | planned (mentioned in ATLAS_NOTES) |
| `/showroom` | gallery wall of deliverables | planned (mentioned in ATLAS_NOTES) |
| `/program` | cross-part program map | planned (mentioned in ATLAS_NOTES) |
| `/graph` | constellation view | sketched |
| `/desktop` | place.org-inspired surface | sketched |
| `/docs` | linked local knowledge pack | sketched |
| `/questions` | OPEN_QUESTIONS.md rendered | shipped |
| `/timeline` | TIMELINE.md rendered | shipped |
| `/futures-board` | 24-vision grid | shipped |
| `/decisions` | decision pressure board | shipped |
| `/research` | research/ tree | in flight |
| `/research/[slug]` | single research doc | in flight |
| `/vapps` | named app surface list | in flight |

## Update protocol

When you ship a deliverable, edit the relevant table here:
- flip `planned` → `sketched` → `shipped`
- prepend a `CHANGELOG.md` entry under the current wave/pass
- if the deliverable introduces a new format, add a row to the matching
  table in [`howto/add-a-deliverable.md`](howto/add-a-deliverable.md)

## Cross-references

- [`howto/add-a-deliverable.md`](howto/add-a-deliverable.md) — recipe
- [`ATLAS_NOTES.md`](ATLAS_NOTES.md) — atlas data model
- [`ROADMAP.md`](ROADMAP.md) — what stages each deliverable serves
- [`CHANGELOG.md`](CHANGELOG.md) — when each landed
