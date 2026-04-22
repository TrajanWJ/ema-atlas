# EMA v0.0.3 — scaffold sketch

This directory is a **reference scaffold**, not a working Gleam project.
It exists so the user can see the shape of the v0.0.3 module tree —
file names, `Subject(Msg)` contracts, supervision-tree composition — in
one place before opening the real `TrajanWJ/ema` repo and starting to
code.

**Nothing here compiles end-to-end.** Every actor body is `todo as
"wired in step NN"`. The type sketches do match
`research/build-steps/01..04-*.md` and the supervision shape matches
`ARCHITECTURE.md`, but the imports cross-reference only what the
scaffold itself defines — `gleam_otp`, `mist`, `wisp`, `sqlight`,
`parrot`, `gleam_qcheck` are referenced but not exercised.

## What's here

```
research/scaffold/
├── gleam.toml                   project manifest with pinned deps
├── manifest.toml                placeholder; gleam regenerates
├── README.md                    this file
├── src/
│   ├── ema.gleam                main(): boots the 7 subtrees
│   └── ema/
│       ├── control_plane.gleam        rest_for_one supervisor
│       ├── control_plane/
│       │   └── event_log.gleam        Subject(EventLogMsg) + opaque IDs
│       ├── identity.gleam             rest_for_one supervisor
│       ├── identity/
│       │   └── registry.gleam         Subject(RegistryMsg)
│       ├── drivers.gleam              one_for_one supervisor
│       ├── drivers/
│       │   ├── registry.gleam         Subject(RegistryMsg) + Driver record
│       │   └── simulated_tui.gleam    minimal pure-Gleam driver
│       ├── sessions.gleam             rest_for_one supervisor
│       ├── babysitter.gleam           one_for_one supervisor
│       ├── surfaces.gleam             mist + wisp wiring stub
│       └── collab.gleam               empty supervisor (Q2/Q8 TBD)
└── test/
    └── ema_test.gleam           one qcheck property per subsystem
```

## How to use this in the real repo

1. `gleam new ema` (in a fresh dir; produces a working skeleton).
2. Replace the generated `gleam.toml` with this scaffold's `gleam.toml`,
   then audit version pins. Anything marked `# UNVERIFIED — verify
   against hex` in `gleam.toml` should be re-checked at
   <https://hex.pm/> before `gleam deps download`.
3. `rm -rf src/ test/` in the new project, then copy `src/` and `test/`
   from this scaffold across.
4. `gleam deps download`.
5. Open `research/build-steps/01-control-plane-skeleton.md` and start
   filling in the `todo as "..."` bodies — `event_log`, `persistence`,
   `store`, `command_bus`, `replay`, `supervisor` — until step 1's
   acceptance criteria pass.
6. Repeat for build-steps 02 (identity), 03 (drivers), 04 (sessions +
   babysitter). Each step lists what gets stubbed and what the
   step-NN+1 step depends on.
7. The `surfaces` and `collab` modules wait on later decisions:
   - `surfaces` lands once AGENT-CONTRACT verb routing is being wired.
   - `collab` waits on OPEN_QUESTIONS Q2/Q8 (CRDT vs event-log doc model).

## What's deliberately missing

- No `priv/migrations/` — schema files live in `ema_control_plane/
  persistence.gleam` per build-step 01 (a real migration table is
  deferred per `EMA_V0_0_3_PREP.md` notes).
- No `priv/FFI_INVENTORY.md` — gate from
  `research/GLEAM_BEAM_FIT.md` §"Verification gates Gleam-side" #7;
  user-owned, not scaffolded.
- No `claude_cli`, `codex_cli`, `peer_remote`, `hermes_native` driver
  files — only `simulated_tui` is scaffolded. The other four land in
  build-step 03 (three of them as `Deferred`-returning stubs, per Q5
  and Q9).
- No `bridge_to_event_log.gleam` — referenced from the drivers
  supervisor as a TODO comment; full module is build-step 03 work.
- No `policy_evaluator.gleam`, `personal_ai_resolver.gleam`,
  `ttl_sweeper.gleam`, `schema.gleam` — all build-step 02 work.
- No babysitter actors (`stream_ticker`, `chain_scheduler`,
  `takeover_manager`, `tick_router`, `command_router`, `lane_registry`)
  — all build-step 04 work.
- No `ema_execution/` subtree — build-step 04 work.

## Cross-links

- `ARCHITECTURE.md` — the seven-layer stack and OTP supervision tree
  this scaffold composes.
- `EMA_V0_0_3_PREP.md` — what changes vs the Elixir lineage; the 12
  verification gates the real implementation has to satisfy.
- `research/GLEAM_BEAM_FIT.md` — library + version research that
  justifies every dep in `gleam.toml`.
- `research/build-steps/01-control-plane-skeleton.md` — fill order
  starts here.
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/03-driver-registry-skeleton.md`
- `research/build-steps/04-sessions-and-babysitter.md`
- `OPEN_QUESTIONS.md` — Q1, Q2, Q4, Q5, Q6, Q8, Q9, Q10 are all held
  open inside this scaffold's `todo` strings; resolve them before the
  module they touch is finalized.
