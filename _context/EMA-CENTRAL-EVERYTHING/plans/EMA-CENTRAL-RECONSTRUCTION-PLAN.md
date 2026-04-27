# EMA Central Reconstruction Plan

This plan is for rebuilding one clean EMA-centered filesystem on the Desktop
without losing the useful structure and lineage already present.

## Goal

Create one obvious root:

`/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING`

Inside it, separate EMA into clean domains instead of mixing:

- active code
- doctrine
- donor material
- archives
- temporary planning

## Proposed end-state layout

```text
EMA-CENTRAL-EVERYTHING/
├── README.md
├── doctrine/
│   ├── master/
│   │   ├── EMA-DESIGN-DOC.md
│   │   ├── EMA-PROJECT-OVERVIEW.md
│   │   ├── EMA-TECHNICAL-DESIGN.md
│   │   └── EMA-GRAPHIC-DESIGN-SYSTEM.md
│   ├── planning/
│   │   ├── EMA-0.0.5-PASSOVER-AND-PREP.md
│   │   ├── TOPOLOGY-DECISION.md
│   │   ├── PEER-AUTHORITY-MODEL.md
│   │   └── BLUEPRINT-VAPP-SPEC.md
│   └── research/
│       ├── donor-extracts/
│       ├── atlas-notes/
│       └── online-research/
├── docs -> doctrine
├── runtime/
│   └── EMA-0.0.5--4-24/
├── atlas/
│   └── ema-atlas/
├── donors/
│   ├── autharis-extracts/
│   └── other-donors/
├── data-model/
├── archive/
│   ├── ema-0.0.3/
│   ├── transfer-packs/
│   └── deprecated-workspaces/
├── sources/
│   └── snapshots/
├── inventory/
├── plans/
└── links/
```

## Core rules for reconstruction

1. `EMA-CENTRAL-EVERYTHING` becomes the human home.
2. `runtime/EMA-0.0.5--4-24/` becomes the actual new codebase home.
3. `atlas/ema-atlas/` stays a separate repo, even if it lives under the central
   root later.
4. `doctrine/master/` becomes the clean canonical doc home for EMA 0.0.5
   onward.
5. `archive/` stores older packs instead of letting them float on the Desktop.
6. donor repos stay donor repos until selectively extracted.

## Recommended migration phases

### Phase 1 — Stabilize and name things

Do now:

- create this central root
- inventory what exists
- classify every EMA-related folder by role
- stop creating new EMA docs inside unrelated roots

Success condition:
- there is one obvious place to resume EMA work

### Phase 2 — Promote docs into the central root

Move or copy into `docs/`:

- the current 0.0.5 prep docs from `ema 3.0.-1`
- the master design doc we are building in chat
- selected synthesis docs from `ema 0.0.3`

Best practice:
- copy first, do not delete originals yet
- leave breadcrumbs pointing to where each source came from

Success condition:
- the most important EMA planning and doctrine no longer depends on memory of
  scattered folder names

### Phase 3 — Start the real 0.0.5 repo

Create:

- `runtime/EMA-0.0.5--4-24/`

This repo should be:

- daemon-first
- native-first
- Organization -> Space -> Project
- one vApp first: Blueprint
- with full org/space/project/settings/invite surfaces from day one

Success condition:
- implementation starts in a clean folder, not inside an archive or donor repo

### Phase 4 — Curate donor imports

From `autharis`, extract only what is truly valuable:

- lane concepts
- handoff rigor
- dispatch/work ownership ideas
- shell posture ideas

Do not import:

- product-specific routes
- unrelated business logic
- messy current working tree state

Success condition:
- EMA inherits the discipline, not the clutter

### Phase 5 — Archive and compress the old world

Once the central structure is proven:

- move `ema 0.0.3` under `archive/`
- optionally move `ema-atlas` under `atlas/`
- retire the loose `ema 3.0.-1` folder after confirming all needed docs landed
  in `docs/`

Success condition:
- your Desktop stops being the system map

## Immediate next steps I recommend

1. Make `EMA-CENTRAL-EVERYTHING/doctrine/master/` and start placing the real
   EMA
   design docs there.
2. Copy `EMA-0.0.5-PASSOVER-AND-PREP.md` into `doctrine/planning/`.
3. Create the clean new runtime repo at
   `EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/`.
4. Keep `ema-atlas` where it is for the moment, but treat it as a linked source,
   not the active runtime root.
5. Do not build EMA inside `Kor - Autharis` anymore.

## Biggest anti-patterns to avoid

- using `autharis` as if it is EMA
- using `ema-atlas` as if it is the runtime repo
- leaving 0.0.5 planning inside unrelated parent folders
- mixing archive material into the first implementation repo
- moving everything at once before a central structure exists

## Clean interpretation of the current system

Right now you do not have "too many EMA repos."

You have four different kinds of EMA material jammed together:

- doctrine
- research
- donor logic
- future implementation prep

The central reconstruction should preserve all four, but stop pretending they
are the same thing.
