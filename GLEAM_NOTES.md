# Gleam Notes

Framing doc for the Gleam/BEAM research and per-part mapping work that
EMA v0.0.3 will be built on. Hosts the wave-3 research outputs.

> The user has stated: **"Gleam is just amazing and almost like it's
> built for this. BEAM as well... Erlang and Elixir compatibility, ideal."**
> The orientation here is to lean into Gleam's nature, not to fight it.

## Why this directory exists

EMA v0.0.3 ships on Gleam/BEAM. The previous Elixir daemon
(`lineage-original-elixir-ema/code/daemon/lib/ema/`) provides shape and
proof; the rewrite lets us put the program on a typed substrate that the
existing OPEN_QUESTIONS can be answered against more sharply.

Three things this directory must do:

1. **Capture the research.** What's actually in Gleam, gleam_otp, the
   wider BEAM ecosystem? Where does it fit EMA, where does it not?
   → `research/GLEAM_BEAM_FIT.md` *(in flight)*

2. **Map each EMA part to Gleam idioms.** Type sketches, actor sketches,
   supervision-tree fragments per part. Concrete enough to start coding;
   non-prescriptive enough to keep open questions open.
   → `research/parts/<slug>.md` × 8 *(in flight)*

3. **Survey collab-plane substrates on BEAM.** OPEN_QUESTIONS Q2/Q8
   (where collaboration state lives, what sync model) hit hardest at the
   language level. The survey enumerates options without recommending.
   → `research/COLLAB_PLANE_OPTIONS.md` *(in flight)*

## What lives here

| File | Status | Owner |
|---|---|---|
| `research/GLEAM_BEAM_FIT.md` | wave-3 subagent | language + ecosystem capabilities, OTP libs, HTTP, persistence, FFI, gaps |
| `research/parts/<slug>.md` × 8 | wave-3 subagent | per-part type/actor/supervisor sketches |
| `research/COLLAB_PLANE_OPTIONS.md` | wave-3 subagent | CRDT/OT/hybrid options for Q2/Q8 |
| `research/raw/` | as needed | raw web fetches the subagents collected |
| `EMA_V0_0_3_PREP.md` (root) | done | preparation spec; OTP layout sketch |
| `howto/gleam-fit-review.md` | next | playbook for evaluating any new EMA part against Gleam fit |

## Stance

- Gleam's static types + algebraic data types map almost 1:1 onto EMA's
  primitives (`ProposalEvent`, `Dispatch`, `DispatchUpdate`,
  `Incident`, `SessionId`, `ExecutionId`). Lean into ADTs over loose
  maps.
- gleam_otp `Subject(Msg)` is the right shape for typed mailboxes —
  use it as the contract surface for every actor. No `Process` escape
  hatches in domain code.
- BEAM's "let it crash" + supervisor trees crystallize the existing
  Elixir `babysitter/` doctrine. Carry the doctrine, write the code
  fresh.
- Erlang/Elixir interop is the **bridge** to the lineage, not the
  long-term mode. FFI to call mature Erlang libs (mnesia, ets, ra,
  riak_dt) is fine; don't write business logic in interop code.
- JavaScript compile target (Lustre, etc.) is interesting for surfaces
  but doesn't change the daemon story. Surfaces stay separate from
  authority.

## The canonical rule, restated for Gleam

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

Translated to Gleam terms:

- "EMA owns truth" → all canonical mutations go through a typed module
  in the `control_plane` OTP application; no other actor calls
  `event_log.append/2` directly.
- "Hermes owns execution" → drivers implement a typed `Driver`
  contract via `Subject(DriverMsg)`; the registry owns the only
  sender-side reference per execution.
- "Surfaces do not own state" → surface-side code (mist/wisp routes,
  Lustre components, external clients) only consumes typed projections;
  no surface module exposes a `Subject` whose Msg variants mutate
  control-plane state directly.

## When research lands

Each completed research doc gets:
1. Linked from the table above with status flipped to `done`.
2. Cross-referenced from any affected `graph/edges/<topic>.md`.
3. Cited in the relevant `content/briefs/<slug>.md` Read next section.
4. A CHANGELOG entry under the current wave.

## Update protocol

When a Gleam fact in any research doc gets verified against the actual
runtime (e.g. a library version is locked, a Subject API call is
confirmed against `gleam_otp` source), prepend a `> verified
YYYY-MM-DD vs <citation>` line under the claim. Don't silently delete
unverified material — mark transitions explicitly.

## Cross-references

- [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md) — preparation spec
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — what blocks the build
- [`graph/edges/execution.md`](graph/edges/execution.md) — driver contract
- [`graph/edges/authority.md`](graph/edges/authority.md) — control plane
- [`graph/edges/collab.md`](graph/edges/collab.md) — CRDT/OT options
- [`ROADMAP.md`](ROADMAP.md) — stages 2-3 (v0.0.3 prep + build)
