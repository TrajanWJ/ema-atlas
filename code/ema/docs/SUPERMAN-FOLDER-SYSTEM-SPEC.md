# SUPERMAN FOLDER SYSTEM — Final Specification

> **Version:** 1.0 FINAL  
> **Date:** 2026-04-03  
> **Status:** APPROVED — Ready for W8 Implementation  
> **Author:** Architect Agent  
> **Scope:** Filesystem layout for EMA project intent/proposal lifecycle

---

## Overview

The Superman Folder System is EMA's on-disk representation of the intent→proposal→accepted pipeline. It gives every project a structured folder layout that:

1. Captures **intent** (what we want to accomplish) with rich context (examples, research, diagrams)
2. Organizes **proposals** as first-class folder objects with visual previews
3. Tracks **accepted** proposals as the canonical approved plan
4. Accumulates **reflexions** written by Honcho post-execution
5. Provides a `metadata.json` machine-readable project/folder index for Superman workflows
6. Enables **LLM context injection** by co-locating markdown + images in a structured layout
7. Powers **proposal preview cards** in HQ with thumbnail rendering
8. Supports a **redirect mechanism** (yellow light UI → redirect button → new generator spawn)

Every field, folder, and file named here is FINAL. Do not rename without a spec version bump.

## Authority Boundaries (Bootstrap Clarification)

For Day 1 / bootstrap behavior, keep authority split explicit:

- **wiki / vault = semantic truth** (`what this means`, rationale, constraints, decisions)
- **intents DB / control-plane records = runtime truth** (`what state this is in right now`)
- **`.superman/` folders + `metadata.json` = execution scratchpad/index**, not global canonical truth

`metadata.json` should be treated as the **folder-local machine index/cache for Superman workflows**, not as the single source of truth for the whole EMA pipeline.

---

## 1. Root Project Folder Layout

```
~/Projects/{project-slug}/
├── .superman                    ← Project semantic config (see superman-architecture.md)
├── metadata.json                ← Machine-readable project + pipeline index
├── intent/                      ← What we're trying to accomplish
├── proposals/                   ← Generated proposals (each = a folder)
├── accepted/                    ← Approved proposals moved here
└── reflexions/                  ← Post-execution lessons (Honcho appends here)
```

### Path Resolution Rules

- `project-slug` is kebab-case, matches the `slug` field in EMA's `projects` DB table.
- `~/Projects/` is the root for all user projects. For the EMA self-build project: `~/Projects/ema/projects/ema-phase2-build/`.
- The daemon reads these paths from `project.linked_path` + `/proposals/`, `/accepted/`, etc. — never hardcode `~/Projects/`.

---

## 2. `intent/` Folder

The `intent/` folder defines the **immutable goal** of the project or current sprint phase. It's read-only once written — no in-place edits. If the intent changes, version it (`intent-v2/`).

### Structure

```
intent/
├── README.md                ← PRIMARY: intent definition, acceptance criteria, scope
├── examples/                ← Concrete examples of desired output or prior art
│   ├── example-01.md        ← Markdown example (linked from README)
│   ├── example-02.png       ← Screenshot or mockup
│   └── ...
├── research/                ← Background research, references, constraints
│   ├── prior-art.md
│   ├── constraints.md       ← Non-negotiables (always injected into LLM context)
│   └── ...
└── diagrams/                ← Architecture or flow diagrams
    ├── flow.png             ← Main flow diagram
    ├── data-model.md        ← Mermaid/text diagram if not using image
    └── ...
```

### `intent/README.md` Required Sections

```markdown
# Intent: {Feature Name}

## Description
[What this accomplishes. 2-4 sentences. No jargon.]

## Acceptance Criteria
- [ ] [Specific, binary, testable]
- [ ] [Each maps to a test or observable behavior]
- [ ] [Use imperative: "Returns 200", "Renders within 2s", "Passes mix test"]

## Deliverables
- [File paths to create]
- [API endpoints to implement]
- [Tests to write]

## Scope
**IN SCOPE:**
- [explicit list]

**OUT OF SCOPE:**
- [explicit list — prevents scope creep]

## Technical Context
[Relevant source files, existing modules, database tables. Links OK.]

## Research Index
[Links to research/ and examples/ that agents should load]

## Diagram
[Embed or reference diagrams/ folder]
```

### Intent Versioning

If the intent changes after proposals have been generated:
- Copy `intent/` → `intent-v1/` (archive)
- Create a fresh `intent/` with the new definition
- Existing proposals in `proposals/` are invalidated — add `STALE=true` to their `metadata.json` entries
- `metadata.json` records the version bump with timestamp

---

## 3. `proposals/` Folder

Each proposal is a **self-contained folder** — never a single file. This enables image attachments, assets, and multi-file plans without collision.

### Structure

```
proposals/
├── {proposal-id}/               ← e.g., prop-abc123/
│   ├── README.md                ← Primary: summary, problem, solution, tradeoffs
│   ├── preview.png              ← Thumbnail image (required for HQ card rendering)
│   ├── plan.md                  ← Implementation plan (steps, code blocks, tests)
│   ├── assets/                  ← Supporting files (diagrams, mocks, reference code)
│   │   ├── flow-diagram.png
│   │   ├── mockup.png
│   │   └── reference.ex         ← Reference code snippets (not production code)
│   └── metadata.json            ← Per-proposal machine metadata
├── {proposal-id-2}/
│   └── ...
└── .index                       ← Auto-generated index of all proposals in this folder
```

### `proposals/{id}/README.md` Required Sections

```markdown
# Proposal: {Title}

**ID:** {proposal-id}  
**Status:** draft | ready | accepted | rejected | stale  
**Generated:** {ISO8601}  
**Generator:** {agent-id or "human"}  
**Score:** {0-100 if scored, null if not}  

## Problem Statement
[What problem or gap this proposal addresses. 1-3 sentences.]

## Proposed Solution
[Clear description of what will be built/changed. Focus on the WHAT, not the HOW.]

## Implementation Approach
[High-level HOW. Not the detailed plan — that's plan.md.]

## Tradeoffs
| Upside | Downside |
|--------|----------|
| [pro]  | [con]    |

## Estimated Effort
- **Time:** {Xh}
- **Tokens:** {estimate}
- **Risk:** low / medium / high

## Acceptance Criteria (from intent)
- [ ] {copied from intent/README.md — confirms alignment}

## Preview
![Preview](preview.png)

## Full Plan
See [plan.md](plan.md) for implementation details.
```

### `proposals/{id}/plan.md` Structure

```markdown
# Implementation Plan: {Title}

## Prerequisites
- [What must be true before starting]
- [Migrations to run, services to start, etc.]

## Steps

### Step 1: {Name}
**Files:** `path/to/file.ex`  
**Action:** [edit | create | delete | run]

```elixir
# Code block for this step
```

**Test:**
```bash
mix test test/path/to/test.exs
```

### Step 2: ...

## Rollback
[How to undo this if it goes wrong. Git commands, migration rollbacks, etc.]

## Definition of Done
- [ ] All acceptance criteria checked
- [ ] Tests pass: `mix test`
- [ ] No new warnings: `mix compile --warnings-as-errors`
```

### `proposals/{id}/metadata.json` Schema

```json
{
  "id": "prop-abc123",
  "proposal_slug": "feature-name-short",
  "project_slug": "my-project",
  "intent_version": "v1",
  "status": "draft",
  "stale": false,
  "generated_at": "2026-04-03T22:00:00Z",
  "generator": "ProposalEngine.Generator",
  "generator_agent_id": "coder",
  "score": null,
  "score_breakdown": null,
  "tags": [],
  "preview_image": "preview.png",
  "has_plan": true,
  "has_assets": true,
  "asset_count": 2,
  "estimated_effort_hours": 3,
  "estimated_tokens": 50000,
  "risk_level": "medium",
  "accepted_at": null,
  "rejected_at": null,
  "rejection_reason": null,
  "redirect_from": null,
  "redirect_to": null
}
```

### Proposal ID Format

```
prop-{6 random chars}

Examples:
  prop-abc123
  prop-x9f2k1
  prop-m7jq4r
```

Generated via: `:crypto.strong_rand_bytes(4) |> Base.url_encode64(padding: false) |> String.slice(0, 6)`

### `proposals/.index` Format

Auto-regenerated by the daemon whenever a proposal folder is added/removed/updated:

```json
{
  "generated_at": "2026-04-03T22:00:00Z",
  "count": 3,
  "proposals": [
    {
      "id": "prop-abc123",
      "title": "Feature Name",
      "status": "ready",
      "score": 82,
      "preview_image": "prop-abc123/preview.png",
      "generated_at": "2026-04-03T22:00:00Z"
    }
  ]
}
```

---

## 4. `accepted/` Folder

When a proposal is approved, its folder is **moved** from `proposals/` into `accepted/`. The original location is gone — no symlinks, no copies. This is a hard move.

### Structure

```
accepted/
├── {proposal-id}/               ← Moved from proposals/{id}/
│   ├── README.md                ← Unchanged from proposals/
│   ├── preview.png
│   ├── plan.md
│   ├── assets/
│   └── metadata.json            ← Updated: status="accepted", accepted_at={ISO8601}
├── execution-log.md             ← Append-only log of all accepted proposals + outcomes
└── .index                       ← Auto-generated index of accepted proposals
```

### Acceptance Protocol

```elixir
# In Ema.Proposals context or equivalent:
def accept_proposal(proposal_id, project_slug) do
  src = "#{project_path}/proposals/#{proposal_id}"
  dst = "#{project_path}/accepted/#{proposal_id}"
  
  File.rename!(src, dst)  # atomic move
  
  # Update metadata.json
  meta_path = "#{dst}/metadata.json"
  meta = File.read!(meta_path) |> Jason.decode!()
  updated = Map.merge(meta, %{
    "status" => "accepted",
    "accepted_at" => DateTime.utc_now() |> DateTime.to_iso8601()
  })
  File.write!(meta_path, Jason.encode!(updated, pretty: true))
  
  # Append to execution-log.md
  entry = """
  ## #{DateTime.utc_now() |> Calendar.strftime("%Y-%m-%d %H:%M:%S")} — #{meta["proposal_slug"]}
  - **Proposal ID:** #{proposal_id}
  - **Score:** #{meta["score"]}
  - **Accepted by:** human (HQ approval)
  """
  File.write!("#{project_path}/accepted/execution-log.md", entry, [:append])
  
  # Regenerate indexes
  regenerate_index("#{project_path}/proposals")
  regenerate_index("#{project_path}/accepted")
  
  # Update project metadata.json
  update_metadata(project_slug, :accepted_proposal, proposal_id)
  
  {:ok, dst}
end
```

### `accepted/execution-log.md` Format

Append-only. Never edited after the fact.

```markdown
# Execution Log — {Project Name}

## 2026-04-03 22:00:00 — dispatch-board-react-graph
- **Proposal ID:** prop-abc123
- **Score:** 82/100
- **Accepted by:** human (HQ approval)
- **Outcome:** (filled by reflexion system post-execution)
- **Files changed:** (filled post-execution)
- **Tokens used:** (filled post-execution)

## 2026-04-02 15:30:00 — ...
```

---

## 5. `reflexions/` Folder

Honcho (or the LocalFallback reflexion system if Honcho is not deployed) auto-appends reflexion entries here after each task execution. This folder is **write-once** per reflexion — no editing existing entries.

### Structure

```
reflexions/
├── {ISO8601-date}/              ← e.g., 2026-04-03/
│   ├── {proposal-id}.md         ← One file per completed execution
│   └── ...
└── summary.md                   ← Rolling summary (updated weekly by ops cron)
```

### `reflexions/{date}/{proposal-id}.md` Format

```markdown
# Reflexion: {Proposal Title}

**Proposal ID:** {proposal-id}  
**Execution Date:** {ISO8601}  
**Trigger:** task_completed | agent_failure | scope_violation | proposal_rejected  
**Agent:** {agent-id}  
**Project:** {project-slug}  

## What Worked
{Free text. What succeeded, what was faster than expected, what to repeat.}

## What Failed
{Free text. Errors, wrong assumptions, scope issues.}

## What Slowed Us Down
{Bottlenecks. Where time was lost. Estimation misses.}

## Lesson
{One-sentence takeaway. Will be injected into next similar task's prompt.}

## Would Do Differently
{Concrete change. Actionable. Specific.}

## Metrics
- Duration: {Xmin actual} / {Xmin estimated}
- Tokens: {X actual} / {X estimated}
- Files modified: {X}
- Scope violations: {X}
- Outcome: success | partial | failure
```

### Honcho Append Protocol

```elixir
defmodule Ema.Reflexion.FileWriter do
  @moduledoc "Writes reflexion entries to the project filesystem"
  
  def write(reflexion, project_slug) do
    project_path = Ema.Projects.path_for(project_slug)
    date = Date.utc_today() |> Date.to_iso8601()
    dir = Path.join([project_path, "reflexions", date])
    File.mkdir_p!(dir)
    
    filename = "#{reflexion.proposal_id || "manual"}.md"
    path = Path.join(dir, filename)
    
    content = render_reflexion(reflexion)
    File.write!(path, content)
    
    # Update project metadata
    Ema.Superman.MetadataWriter.record_reflexion(project_slug, reflexion)
    
    {:ok, path}
  end
end
```

### LocalFallback (when Honcho unavailable)

When Honcho is not deployed, the reflexion system writes identical files using the same format. The file path and content are identical — only the source differs (Honcho Deriver vs. EMA's own `Reflexion.Templates`). The writer module is the same.

---

## 6. `metadata.json` — Project Root Index

The root `metadata.json` is the machine-readable single source of truth for the entire project pipeline. Updated by the daemon on every significant state change.

```json
{
  "$schema": "https://ema.app/schemas/project-metadata/v1",
  
  "project": {
    "id": "pro_abc123",
    "slug": "my-project",
    "name": "My Project",
    "description": "Short description.",
    "status": "active",
    "linked_path": "~/Projects/my-project",
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-03T22:00:00Z",
    "icon": "🏗️",
    "color": "#3B82F6"
  },
  
  "intent": {
    "version": "v1",
    "path": "intent/README.md",
    "last_modified": "2026-04-01T10:00:00Z",
    "has_examples": true,
    "has_research": true,
    "has_diagrams": true,
    "example_count": 2,
    "diagram_count": 1
  },
  
  "proposals": {
    "total": 5,
    "by_status": {
      "draft": 2,
      "ready": 1,
      "accepted": 1,
      "rejected": 1,
      "stale": 0
    },
    "last_generated_at": "2026-04-03T20:00:00Z",
    "highest_score": 87,
    "pending_review": ["prop-abc123", "prop-def456"]
  },
  
  "accepted": {
    "total": 1,
    "last_accepted_at": "2026-04-02T15:00:00Z",
    "proposal_ids": ["prop-xyz789"]
  },
  
  "reflexions": {
    "total": 3,
    "last_written_at": "2026-04-03T21:00:00Z",
    "outcomes": {
      "success": 2,
      "partial": 1,
      "failure": 0
    },
    "avg_lesson_density": 0.8
  },
  
  "pipeline": {
    "current_phase": "proposal_review",
    "active_proposal": "prop-abc123",
    "redirect_active": false,
    "redirect_reason": null,
    "last_redirect_at": null
  },
  
  "llm_context": {
    "strategy": "intent_first",
    "include_diagrams": true,
    "include_examples": true,
    "max_tokens": 4000,
    "priority_files": [
      "intent/README.md",
      "intent/research/constraints.md",
      "accepted/execution-log.md"
    ],
    "excluded_paths": ["proposals/*/assets/*.png"]
  }
}
```

---

## 7. LLM Context Injection Strategy

When an agent is dispatched for a task, EMA injects the project's Superman Folder content into its system prompt. The strategy is **intent-first, budget-aware, image-aware**.

### Injection Priority Order

```
Priority 1 (always inject):
  - intent/README.md — full content
  - intent/research/constraints.md — if exists
  
Priority 2 (inject if budget allows):
  - accepted/execution-log.md — last 3 entries
  - reflexions/{latest}/ — last 2 reflexions
  
Priority 3 (inject if budget allows):
  - intent/examples/*.md — up to 2 examples
  - accepted/{latest}/plan.md — most recent accepted plan
  
Priority 4 (references only, no content injection):
  - intent/diagrams/ — filenames listed, content described
  - proposals/ — pending review list
  - intent/examples/*.png — filenames listed, thumbnails described
```

### Image Handling

EMA uses Claude models that support multimodal input. Images are injected as base64 attachments when the model supports them.

**Rules:**
- `intent/diagrams/*.png` — inject as image if under 2MB, else describe filename only
- `proposals/{id}/preview.png` — never inject into agent prompt (UI-only)
- `intent/examples/*.png` — inject as image if labeled as "reference screenshot"
- `accepted/{id}/assets/*.png` — describe filename, inject if explicitly labeled in plan.md

**Image injection format:**

```elixir
defmodule Ema.Superman.ContextInjector do
  def inject_image(path, label) do
    case File.read(path) do
      {:ok, binary} when byte_size(binary) < 2_000_000 ->
        encoded = Base.encode64(binary)
        %{
          type: "image",
          source: %{type: "base64", media_type: "image/png", data: encoded},
          label: label
        }
      {:ok, _too_large} ->
        %{type: "text", text: "[Image: #{label} — #{path} — too large to embed, see file]"}
      {:error, _} ->
        %{type: "text", text: "[Image: #{label} — not found]"}
    end
  end
end
```

### Context Assembly Module

```elixir
defmodule Ema.Superman.ProjectContext do
  @max_tokens 4000
  @priority_order [:intent_readme, :constraints, :execution_log, :reflexions, :examples, :accepted_plan]
  
  def build(project_slug, opts \\ []) do
    max_tokens = Keyword.get(opts, :max_tokens, @max_tokens)
    path = Ema.Projects.path_for(project_slug)
    meta = read_metadata(path)
    
    sections = @priority_order
    |> Enum.map(&load_section(&1, path, meta))
    |> Enum.reject(&is_nil/1)
    |> apply_token_budget(max_tokens)
    
    images = load_diagrams(path, opts)
    
    %{
      text_sections: sections,
      images: images,
      token_estimate: estimate_tokens(sections),
      source: "superman_folder/#{project_slug}"
    }
  end
  
  defp load_section(:intent_readme, path, _meta) do
    readme = Path.join([path, "intent", "README.md"])
    case File.read(readme) do
      {:ok, content} -> %{priority: 1, label: "PROJECT INTENT", content: content}
      {:error, _} -> nil
    end
  end
  
  defp load_section(:constraints, path, _meta) do
    constraints = Path.join([path, "intent", "research", "constraints.md"])
    case File.read(constraints) do
      {:ok, content} -> %{priority: 1, label: "HARD CONSTRAINTS", content: content}
      {:error, _} -> nil
    end
  end
  
  defp load_section(:execution_log, path, _meta) do
    log = Path.join([path, "accepted", "execution-log.md"])
    case File.read(log) do
      {:ok, content} ->
        last_3 = content |> String.split("## ") |> Enum.take(-3) |> Enum.join("## ")
        %{priority: 2, label: "RECENT EXECUTIONS (last 3)", content: last_3}
      {:error, _} -> nil
    end
  end
  
  defp load_section(:reflexions, path, _meta) do
    date = Date.utc_today() |> Date.to_iso8601()
    dir = Path.join([path, "reflexions", date])
    
    reflexions = case File.ls(dir) do
      {:ok, files} ->
        files
        |> Enum.take(2)
        |> Enum.map(&File.read!(Path.join(dir, &1)))
        |> Enum.join("\n---\n")
      {:error, _} -> nil
    end
    
    if reflexions do
      %{priority: 2, label: "TODAY'S REFLEXIONS", content: reflexions}
    else
      nil
    end
  end
  
  # ... other sections
  
  defp apply_token_budget(sections, max_tokens) do
    Enum.reduce_while(sections |> Enum.sort_by(& &1.priority), {[], 0}, fn section, {acc, used} ->
      section_tokens = estimate_tokens([section])
      if used + section_tokens <= max_tokens do
        {:cont, {[section | acc], used + section_tokens}}
      else
        {:halt, {acc, used}}
      end
    end)
    |> elem(0)
    |> Enum.reverse()
  end
end
```

---

## 8. Proposal Preview Rendering (HQ Card)

Each proposal renders as a card in the HQ "Proposals" view. The card has:
- Thumbnail image (`preview.png`)
- Title + score badge
- Status indicator
- Quick-action buttons (Approve / Reject / Redirect)

### Card Data Contract

```typescript
interface ProposalCard {
  id: string;                    // "prop-abc123"
  title: string;                 // from README.md H1
  status: "draft" | "ready" | "accepted" | "rejected" | "stale";
  score: number | null;          // 0-100
  previewImageUrl: string;       // "/api/proposals/prop-abc123/preview"
  generatedAt: string;           // ISO8601
  estimatedEffortHours: number;
  riskLevel: "low" | "medium" | "high";
  tags: string[];
  isRedirectCandidate: boolean;  // true if status=draft + score < 40
}
```

### Preview Image Generation

`preview.png` is generated at proposal creation time. If the generator agent cannot produce an image, the system generates a text-based fallback using an SVG renderer.

**Generation strategy:**

```elixir
defmodule Ema.ProposalEngine.PreviewGenerator do
  @doc "Generate preview.png for a proposal folder"
  def generate(proposal_folder_path, proposal) do
    # Strategy 1: If plan.md has a diagram reference, screenshot that
    # Strategy 2: Generate a structured card as SVG → PNG
    # Strategy 3: Fallback — use a standardized template PNG with text overlay
    
    output_path = Path.join(proposal_folder_path, "preview.png")
    
    generate_card_svg(proposal)
    |> svg_to_png(output_path)
  end
  
  defp generate_card_svg(proposal) do
    """
    <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="360" rx="12" fill="#0f1117"/>
      <rect x="0" y="0" width="640" height="4" rx="2" fill="#{risk_color(proposal.risk_level)}"/>
      <text x="32" y="56" font-family="Inter, sans-serif" font-size="24" font-weight="600" fill="#f1f5f9">#{truncate(proposal.title, 40)}</text>
      <text x="32" y="88" font-family="Inter, sans-serif" font-size="14" fill="#64748b">#{truncate(proposal.problem_statement, 80)}</text>
      <!-- Score badge -->
      <rect x="32" y="280" width="72" height="32" rx="16" fill="#{score_color(proposal.score)}"/>
      <text x="68" y="300" font-family="Inter" font-size="14" font-weight="600" fill="white" text-anchor="middle">#{proposal.score || "?"}/100</text>
      <!-- Effort badge -->
      <text x="128" y="299" font-family="Inter" font-size="13" fill="#64748b">~#{proposal.estimated_effort_hours}h</text>
    </svg>
    """
  end
end
```

### HQ Card Component

```tsx
// app/src/features/Proposals/ProposalCard.tsx

interface ProposalCardProps {
  proposal: ProposalCard;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRedirect: (id: string) => void;
}

export function ProposalCard({ proposal, onApprove, onReject, onRedirect }: ProposalCardProps) {
  return (
    <div className="proposal-card glass-card" data-status={proposal.status}>
      {/* Thumbnail */}
      <div className="proposal-card__preview">
        <img
          src={proposal.previewImageUrl}
          alt={`Preview of ${proposal.title}`}
          className="proposal-card__thumbnail"
          onError={(e) => (e.currentTarget.src = "/assets/proposal-fallback.png")}
        />
        <ScoreBadge score={proposal.score} />
        <StatusPill status={proposal.status} />
      </div>

      {/* Content */}
      <div className="proposal-card__body">
        <h3 className="proposal-card__title">{proposal.title}</h3>
        <div className="proposal-card__meta">
          <span>~{proposal.estimatedEffortHours}h</span>
          <RiskTag level={proposal.riskLevel} />
          <span className="proposal-card__date">
            {formatRelative(proposal.generatedAt)}
          </span>
        </div>
        {proposal.tags.length > 0 && (
          <div className="proposal-card__tags">
            {proposal.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="proposal-card__actions">
        <button
          className="btn btn--success"
          onClick={() => onApprove(proposal.id)}
          disabled={proposal.status !== "ready"}
        >
          ✓ Approve
        </button>
        <button
          className="btn btn--danger btn--ghost"
          onClick={() => onReject(proposal.id)}
        >
          ✕ Reject
        </button>
        {/* Redirect button — shown when proposal is low-score or redirectable */}
        {proposal.isRedirectCandidate && (
          <RedirectButton proposalId={proposal.id} onRedirect={onRedirect} />
        )}
      </div>
    </div>
  );
}
```

---

## 9. Redirect Mechanism

The **redirect mechanism** handles the case where a generated proposal is wrong in direction — not just low quality (which would be rejected) but fundamentally misaligned. A redirect says "don't just try again, go a different way."

### Trigger Conditions (Yellow Light)

The yellow light appears on a proposal card when ANY of:
- Score < 40 (below threshold despite scoring)
- `redirect_candidate: true` in the proposal's metadata (set by Scorer)
- User explicitly clicks "Redirect" button
- Proposal has been revised 2+ times without quality improvement

### Yellow Light UI

```tsx
// app/src/features/Proposals/RedirectButton.tsx

export function RedirectButton({ proposalId, onRedirect }: RedirectButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [redirectReason, setRedirectReason] = useState("");
  const [redirectHint, setRedirectHint] = useState("");

  return (
    <>
      {/* Yellow light indicator */}
      <div className="redirect-indicator">
        <span className="redirect-light" aria-label="Redirect available">🟡</span>
        <button
          className="btn btn--warning btn--ghost"
          onClick={() => setShowModal(true)}
        >
          ↩ Redirect
        </button>
      </div>

      {showModal && (
        <Modal title="Redirect Proposal Generator" onClose={() => setShowModal(false)}>
          <p className="modal__body-text">
            Redirect tells the generator to try a different approach entirely.
            Use this when the proposal is fundamentally wrong, not just low-quality.
          </p>

          <FormField label="What was wrong with this approach?" required>
            <Textarea
              value={redirectReason}
              onChange={(e) => setRedirectReason(e.target.value)}
              placeholder="The proposal focused on X but we actually need Y..."
              rows={3}
            />
          </FormField>

          <FormField label="Hint for the new generator (optional)">
            <Textarea
              value={redirectHint}
              onChange={(e) => setRedirectHint(e.target.value)}
              placeholder="Try a simpler approach that avoids Z..."
              rows={2}
            />
          </FormField>

          <div className="modal__actions">
            <button
              className="btn btn--warning"
              onClick={() => {
                onRedirect(proposalId, { reason: redirectReason, hint: redirectHint });
                setShowModal(false);
              }}
              disabled={!redirectReason.trim()}
            >
              🟡 Spawn New Generator
            </button>
            <button className="btn btn--ghost" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
```

### Redirect Backend Protocol

```elixir
defmodule Ema.ProposalEngine.RedirectHandler do
  @moduledoc "Handles proposal redirects — spawns new generator with learned context"
  
  def handle_redirect(proposal_id, redirect_params) do
    proposal = Proposals.get_proposal!(proposal_id)
    
    # 1. Update the redirected proposal's metadata
    update_proposal_metadata(proposal_id, %{
      status: "rejected",
      rejected_at: DateTime.utc_now(),
      rejection_reason: "redirect: #{redirect_params.reason}",
      redirect_to: nil  # Will be filled when new proposal is created
    })
    
    # 2. Build redirect context (teaches the new generator what NOT to do)
    redirect_context = build_redirect_context(proposal, redirect_params)
    
    # 3. Write redirect context to a temp file in proposals/
    context_path = write_redirect_context(proposal.project_slug, redirect_context)
    
    # 4. Spawn new generator with redirect context injected
    new_proposal_id = generate_proposal_id()
    
    Task.Supervisor.async_nolink(Ema.ProposalEngine.TaskSupervisor, fn ->
      Ema.ProposalEngine.Generator.generate(
        proposal.project_slug,
        proposal.intent_id,
        proposal_id: new_proposal_id,
        redirect_context_path: context_path,
        redirect_from: proposal_id
      )
    end)
    
    # 5. Update redirected proposal to point to new one (will fill when generator completes)
    {:ok, %{redirected_from: proposal_id, new_proposal_id: new_proposal_id}}
  end
  
  defp build_redirect_context(proposal, params) do
    """
    # Redirect Context
    
    ## Previous Proposal (REJECTED — DO NOT REPEAT)
    Title: #{proposal.title}
    Why rejected: #{params.reason}
    
    ## What to Avoid
    The previous proposal focused on: #{extract_approach(proposal)}
    This approach was rejected because: #{params.reason}
    
    ## Hint for New Approach
    #{params.hint || "No specific hint provided. Try a fundamentally different approach."}
    
    ## Constraint
    Your proposal MUST NOT use the same fundamental approach as the rejected one.
    Think from scratch. Start from the acceptance criteria, not from the rejected solution.
    """
  end
  
  defp write_redirect_context(project_slug, context) do
    path = Ema.Projects.path_for(project_slug)
    redirect_path = Path.join([path, "proposals", ".redirect-context.md"])
    File.write!(redirect_path, context)
    redirect_path
  end
end
```

### Generator Redirect Injection

When the generator receives a `redirect_context_path`, it prepends this context BEFORE the intent README in the LLM prompt:

```
=== REDIRECT CONTEXT (READ FIRST) ===
{redirect_context contents}
=== END REDIRECT CONTEXT ===

=== PROJECT INTENT ===
{intent/README.md contents}
=== END PROJECT INTENT ===

Generate a NEW proposal that is fundamentally different from the rejected approach.
```

### Redirect Chain Tracking

Redirects form a chain tracked in `metadata.json`:

```json
{
  "pipeline": {
    "redirect_chain": ["prop-abc123", "prop-def456"],
    "redirect_count": 2,
    "redirect_active": false
  }
}
```

After 3 consecutive redirects, the system shows a warning: "You've redirected this proposal 3 times. Consider revising the intent definition."

---

## 10. Implementation Notes for W8

### What W8 Coder Must Build

| Component | Files | Effort |
|---|---|---|
| Folder scaffold on project create | `lib/ema/projects.ex` — `create_superman_folders/1` | 1h |
| `metadata.json` writer | `lib/ema/superman/metadata_writer.ex` | 2h |
| Proposal folder writer | `lib/ema/proposal_engine/folder_writer.ex` | 2h |
| `accepted/` move protocol | `lib/ema/proposals.ex` — `accept_proposal/2` | 1h |
| Reflexion file writer | `lib/ema/reflexion/file_writer.ex` | 1h |
| Context injector | `lib/ema/superman/project_context.ex` | 3h |
| Preview generator | `lib/ema/proposal_engine/preview_generator.ex` | 2h |
| HQ ProposalCard component | `app/src/features/Proposals/ProposalCard.tsx` | 2h |
| RedirectButton + modal | `app/src/features/Proposals/RedirectButton.tsx` | 2h |
| `/api/proposals/:id/preview` endpoint | `lib/ema_web/controllers/proposal_controller.ex` | 1h |
| Redirect backend handler | `lib/ema/proposal_engine/redirect_handler.ex` | 2h |

**Total: ~19h — fits in W8 Days 1-3 alongside other tracks**

### Scaffolding: Auto-Create on Project Create

```elixir
# In Ema.Projects.create_project/1, after DB insert:
def create_superman_folders(project) do
  base = project.linked_path
  
  dirs = [
    "intent",
    "intent/examples",
    "intent/research",
    "intent/diagrams",
    "proposals",
    "accepted",
    "reflexions"
  ]
  
  Enum.each(dirs, fn dir ->
    full = Path.join(base, dir)
    File.mkdir_p!(full)
  end)
  
  # Initialize metadata.json
  Ema.Superman.MetadataWriter.initialize(project)
  
  # Create intent/README.md stub
  File.write!(
    Path.join([base, "intent", "README.md"]),
    "# Intent: #{project.name}\n\n_Fill in intent definition here._\n"
  )
  
  :ok
end
```

---

*This document is the single source of truth for Superman Folder System layout. Do not deviate from folder names, file formats, or metadata schemas without bumping version and updating this spec.*
