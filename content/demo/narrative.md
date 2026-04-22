# Demo narrative — staged walkthrough

A scripted 7-act tour of EMA. Designed for the `/demo` route to render as
a paginated narrative with auto-advance and chapter markers. Each act
ends on a hard question instead of an answer — that's the point.

> Drives the `app/demo/page.tsx` route (currently a stub). The narrative
> is **not** a roadmap and **not** a marketing pitch. It's a staged
> reading order that takes a fresh viewer from "what is this" to "what
> would I have to decide".

---

## Act 1 — The room

> EMA is a shared human-agent operating environment. Humans and agents
> inhabit the same workspace state.

Open with the canonical rule, in 32-point type, alone on screen:

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

Cut to the lineage map ([`SYSTEM_GRAPH.md`](../../SYSTEM_GRAPH.md)) —
four eras feeding into one daemon. Hold for 5 seconds. The viewer
should feel "this has history".

**Question that lingers:** *what does "owns truth" actually mean for a
running system?*

---

## Act 2 — The state planes

The three planes diagram (control / runtime / collab / workspace) from
[`AGENT_QUICKREF.md`](../../AGENT_QUICKREF.md) "The three state planes".
Animate each plane appearing in turn, with one example artifact each
(an `event_log` entry, a Hermes session, a doc, a workspace plan).

End on: surfaces *render* all of these and *own* none of them.

**Question that lingers:** *if surfaces don't own state, what's a surface
even for?*

---

## Act 3 — The 8 parts

Cycle through the 8 EMA parts ([`lib/ema-atlas.ts`](../../lib/ema-atlas.ts)):
authority, execution, workspace, coordination, semantic layer, shells,
identity, mesh. Each part gets a 3-second card with title + strapline.

After all 8, show them as one constellation laid out in the same shape
as the SYSTEM_GRAPH topic table.

**Question that lingers:** *which part is the smallest provable slice
of EMA, the one that could ship first?*

---

## Act 4 — The triptych

Land on Authority/Control Plane. Render the [VisionTriptych](../../components/vision-triptych.tsx)
showing its three futures: Operator Cathedral / Living Workspace / Mesh
Commonwealth. Read the `bet`, `tension`, and `question` aloud (or in
text) for each.

Then repeat the *exact* triptych shape for one more part — Identity. Show
the user that the same three futures rebind to a different domain.

**Question that lingers:** *do the three futures actually compete, or
will the final EMA be a layered version of all three?*

---

## Act 5 — The open questions

Render the 10 questions from [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
as a board with red/amber/green readiness badges (heuristic from
[`/decisions`](../../app/decisions/page.tsx)).

Hover-reveal Q1: *"Are agent identities first-class members of Org/Space?"*
Hold the question alone for 3 seconds. Then Q2: *"Is collaboration state
in `event_log` or adjacent?"* Hold. Continue through Q3.

After Q3, fade in: *"v0.0.3 needs a minimum answer to four of these
before code is written."*

**Question that lingers:** *which of these four am I willing to commit
to first?*

---

## Act 6 — The Gleam pivot

Cut to [`GLEAM_NOTES.md`](../../GLEAM_NOTES.md). Render the line:

> *"Gleam is just amazing and almost like it's built for this. BEAM as
> well... Erlang and Elixir compatibility, ideal."*

Then the canonical rule, restated in Gleam terms (from
[`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) P1/P2). Show a
typed `Subject(Msg)` snippet for one driver actor.

End on the supervision tree sketch from
[`EMA_V0_0_3_PREP.md`](../../EMA_V0_0_3_PREP.md).

**Question that lingers:** *what does it mean to "lean into" a language?*

---

## Act 7 — Where you come in

The viewer is now informed. Show three call-to-action chips:

1. **Decide one open question.** [`/decisions`](../../app/decisions/page.tsx)
2. **Pressure-test a vApp.** [`howto/add-a-vapp.md`](../../howto/add-a-vapp.md)
3. **Mine doctrine from a legacy branch.** [`howto/extract-doctrine-from-a-legacy-branch.md`](../../howto/extract-doctrine-from-a-legacy-branch.md)

Below the chips, the closing text:

> The atlas is here so the build doesn't lose the shape. The build is
> coming. Pick a question and start.

End on the canonical rule again, alone on screen.

---

## Implementation notes (for the route)

- Each act is a section with `data-act="<n>"`.
- Auto-advance optional (8s per act) but the viewer can pin/scrub.
- Pull live counts from [`graph.json`](../../graph.json):
  parts (8), futures (24 = 8×3), open questions (10),
  glossary terms (33+), vault candidates (15).
- The "questions that linger" are styled distinctly (italic, large
  serif, generous whitespace).
- The hard cuts (e.g. between Act 5's open-questions board and Act 6's
  Gleam pivot) should feel deliberate, not transitional. EMA is a
  layered project; the demo should signal that visually.

## When this changes

When Q1-Q5 actually settle, replace Act 5 with a "decisions made"
sequence. When v0.0.3 ships, replace Act 6 with a "what we built"
sequence. Don't delete the previous version of this narrative — move
it under `content/demo/archive/<date>-narrative.md` so the evolution
of the pitch stays legible.

## Cross-references

- [`VISION.md`](../../VISION.md) — north star paragraph (open Act 1 with this if you prefer)
- [`AGENT_QUICKREF.md`](../../AGENT_QUICKREF.md) — single-page everything
- [`ROADMAP.md`](../../ROADMAP.md) — what each stage looks like
- [`howto/add-a-deliverable.md`](../../howto/add-a-deliverable.md) — to ship Act 7's
  chips you'll first need a deliverable that matches each chip's link
