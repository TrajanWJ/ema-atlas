# Live Demo — 5 minutes at localhost:3000

A literal click-by-click script for showing someone the EMA Atlas in
five minutes. Use this when a stakeholder, collaborator, or new agent
sits down at your machine.

> Not a marketing demo. Not a product walkthrough. The point is to
> make the **shape of the project** legible — what EMA is, what it
> isn't yet, and what decisions are pending.

## Pre-flight (30 seconds)

```bash
cd ema-atlas
npm run dev
```

Open <http://localhost:3000>. Confirm:
- Atlas hero loads
- The canonical rule renders verbatim
- The featured triptych shows three stances

## The script

### 0:00 — `/` (atlas home, 30s)

> *"This is the EMA Atlas. The whole repo does two jobs at once: it's
> the lineage archive for everything we've built before, and it's the
> deliverables hub for the Gleam/BEAM rewrite happening now."*

Show the canonical rule (verbatim block). Click the featured triptych
once to land on `/parts/authority-control-plane`.

### 0:30 — `/parts/authority-control-plane` (30s)

> *"Every part of EMA carries three competing futures. Authority is
> the keystone — the daemon owning canonical truth. The three futures
> are Operator Cathedral, Living Workspace, Mesh Commonwealth. The
> hard questions in the middle are what we have to decide."*

Scroll past the visions to the Artifact Routes section. Note the chips:
brief, slides, canvas, diagrams.

### 1:00 — `/futures-board` (45s)

> *"All 24 futures across all 8 parts on one page. Toggle by stance to
> see what each universal stance means in each part."*

Click the three-tab nav. Show the same stance instantiated in different
parts (e.g. "Mesh Commonwealth" applied to authority vs to identity).

### 1:45 — `/decisions` (60s)

> *"Ten open questions, each rendered with a tradeoff axis and a
> red/amber/green readiness badge. Red blocks v0.0.3."*

Hover Q1 (red — agents as first-class members). Then Q5 (red — driver
contract surface). Click into Q1's matrix at `/docs/content--decisions--Q1-agents-as-first-class-members`.

### 2:45 — Q1 decision matrix (60s)

> *"Each open question has a matrix draft: options named, criteria
> scored, bets and costs per option, reversibility plan. The Decision
> section is blank — that's the user's job."*

Scroll to the Decision section. Show the blank placeholder. Then back
to `/decisions`.

### 3:45 — `/research/parts--authority-control-plane` (45s)

> *"For each part, there's a Gleam mapping: type sketches in real
> Gleam syntax, actor sketch with `Subject(Msg)` contracts, the OTP
> supervision tree fragment, FFI boundaries to Erlang/Elixir, the
> tests v0.0.3 needs."*

Scroll fast — the point is to show that the language-level work is
real, not vibes.

### 4:30 — `/docs/SHIP_CHECKLIST` or `/docs/PROJECT_STATUS` (30s)

> *"And here's the mechanical state: every box that has to be checked
> for v0.0.3 to ship, and the live snapshot of what's done now."*

End on the canonical rule again.

## Variations

### "I have 2 minutes" version

Cut to: home → `/decisions` → one matrix → done. The point is "this
is a serious system with real unresolved decisions".

### "I have 15 minutes" version

Add: `/timeline` (the eras), `/vapps/wiki` (a deeper brief), `/graph`
(when the constellation view ships), `/desktop` (when the place-org
embed ships), `/api/graph` (the JSON API).

### "Convince a skeptic" version

Use `/tour/for-skeptic` (user-built route). Then the doctrine extracts
on `/docs/graph--nodes--lineage-original-elixir-ema` to show the
existing Elixir code that v0.0.3 inherits.

### "Convince an engineer" version

Use `/tour/for-engineer` (user-built route). Then `/research/GLEAM_BEAM_FIT`
(the language survey) and `/docs/research--scaffold--gleam.toml` (the
project scaffold).

### "Show another agent how to act here" version

Use `/docs/AGENT_QUICKREF` (single-page everything) and `/docs/howto--load-context-for-a-task`
(the traversal protocol).

## Things to not say

- "Production-ready" — it's not. v0.0.3 hasn't been written yet.
- "AI-powered" — meaningless.
- "Comprehensive" — the atlas covers what we have; not everything that
  could exist.
- Anything that paraphrases the canonical rule.

## Things to say if asked

- *"What's the next step?"* — Pick a winner from one of the 5 drafted
  matrices. v0.0.3 starts when Q1, Q3, Q5 have minimum answers.
- *"When does v0.0.3 ship?"* — When SHIP_CHECKLIST.md is fully checked.
  Mechanical, not aspirational.
- *"Why Gleam?"* — typed `Subject(Msg)` mailboxes, OTP supervision,
  Erlang/Elixir interop, JS compile target for surfaces. See
  `research/GLEAM_BEAM_FIT.md`.
- *"What's the canonical EMA repo?"* — `TrajanWJ/ema`. This atlas is
  a presentation layer, not the daemon itself.

## When the script changes

This file gets refreshed when:
- New tier-1 routes ship (`/desktop` becomes real, `/graph` becomes
  real, `/showroom` becomes real).
- Open-question status changes (red → amber, amber → green) due to
  resolution.
- v0.0.3 ships (the script becomes "what we built" not "what we plan").

## Cross-references

- [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md) — single-page everything
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — what's shippable today
- [`content/demo/narrative.md`](content/demo/narrative.md) — long-form
  7-act version for a paginated walkthrough route
- [`MILESTONE_PREP_COMPLETE.md`](MILESTONE_PREP_COMPLETE.md) — the
  current milestone the demo lands on
