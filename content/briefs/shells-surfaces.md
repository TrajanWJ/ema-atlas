# Shells / Surfaces

## The frame

Shells and surfaces are the part of EMA that humans actually see and
touch. Launchpad, HQ, Threads/Server, Chat, and the Virtual Desktop are
the candidate top-level shells; vApps live inside them. The canonical
rule —
*EMA owns truth. Hermes owns execution. Surfaces do not own state.* —
makes this part dangerous: surfaces are simultaneously the most visible
thing in the product and the thing least permitted to hold authority.
Every prior era of this lineage drifted because a surface
(Discord, place.org, ClaudeForge) became the de facto state container.
The new architecture has to make surfaces *feel* primary while keeping
them strictly downstream of the daemon.

The frame question is therefore not "which surface should we build" but
"which surface gets to define the user's first mental model of EMA, and
how do we keep that surface honest about not owning what it shows?"

## What's already true

- The surfaces edge defines the rule and names the donors:
  `graph/edges/surfaces.md` lists `codebase-claudeforge`,
  `codebase-frontend-layer`, `codebase-mission-control-claude`, with
  UX-metaphor donors `codebase-place-org`, `codebase-place-companion`,
  `codebase-agent-os-demo`, `codebase-execudeck`.
- Launchpad and HQ have a docs node at
  `docs-host-system-launchpad-hq` (per `lib/ema-atlas.ts` part
  `branches`); vApp vision is captured in
  `docs-ema-next-steps/.../VAPP-FINAL-VISION-CHECKLIST.md`
  (cited in `GLOSSARY.md` row "vApp").
- ClaudeForge already proved a working surface↔Hermes seam with
  session continuity via `X-Hermes-Session-Id`
  (`MACBOOK_AGENT_HANDOFF_MASTER.md` §18).
- The fresh-context model document
  (`05-fresh-context-project-app-model.md`) names "native desktop app"
  and "website like place.org" without committing to a stack
  (`OPEN_QUESTIONS.md` Q7).
- Vault-candidate **Cognitive Cockpit** (in `GLOSSARY.md`,
  source `docs-host-obsidian-vault/.../Discord UX Philosophy.md`)
  encodes the calm-technology stance behind Launchpad/HQ/Threads.

## What's still open

- Q7: surface stack for Launchpad/HQ — native vs web parity story,
  deployment story (Vercel?), shared component library.
- Q6: Discord mirror direction — read-only, bidirectional, or EMA as
  superset with Discord as one rendering target.
- Whether HQ or the Virtual Desktop is the *home* surface (`lib/ema-atlas.ts`
  hard question 1 for this part).
- Whether Chat and Threads are distinct products or two views of one
  underlying model (hard question 2).
- How much place.org DNA should survive before the metaphor becomes
  nostalgia (hard question 3).

## The three futures, expanded

### Operator Shell Hierarchy (shells-operator-cathedral)

HQ is home. Launchpad is the launcher. The Virtual Desktop exists as an
"advanced mode" for users who want spatial control. Surfaces compose
hierarchically and the product reads as a serious tool first.

- **What this would force you to build first:** an HQ shell that renders
  per-user, per-project state from the daemon (per `GLOSSARY.md` HQ row);
  a Launchpad that hosts vApps as windowed, sandboxed clients; a single
  shared component library so HQ and Launchpad can't drift visually.
- **What this would force you to give up:** the emotional pull of
  arriving in a *place*; some of the place.org DNA that makes the
  product memorable.
- **Smallest provable slice:** in two weeks, an HQ that lists a user's
  Projects (read from the daemon), opens one vApp (Wiki) into Launchpad
  as a windowed client, and proves the surface holds zero durable
  state — refresh blows away local view and rehydrates from the daemon.

### Virtual Desktop as Center (shells-living-workspace)

The Virtual Desktop is the iconic surface. HQ and Launchpad are
instruments inside the desktop. The product is unforgettable because it
is a place. This is the strongest expression of the place.org / placeOS
inheritance and aligns with the **Cognitive Cockpit** UX stance.

- **What this would force you to build first:** a desktop runtime
  capable of hosting multiple vApps as movable windows with persistent
  layout; a presence model so other members of a Space see who is
  "in the room"; a per-user layout state that lives in workspace, not
  in the surface (or it relapses).
- **What this would force you to give up:** browser-first deployment
  velocity; the cleanest accessibility story (desktops are harder than
  forms).
- **Smallest provable slice:** in two weeks, a single Space's Virtual
  Desktop with two vApps (Wiki, Threads) as windows, persistent
  per-user layout stored as a workspace artifact, and a presence pill
  showing who else is in the desktop right now.

### Adaptive Role-Aware Surfaces (shells-mesh-commonwealth)

Surfaces shape-shift based on role, device, and peer context. The same
underlying model renders as a native desktop, a web HQ, a mobile feed,
or a peer's read-only mirror. This is the surface answer to the mesh
direction in `MACBOOK_AGENT_HANDOFF_MASTER.md` §10.

- **What this would force you to build first:** a surface contract that
  is genuinely client-side-rendering against a daemon API (no
  surface-side state); per-role view definitions that the daemon serves;
  a peer-rendering mode that lets a remote peer see a surface without
  granting write authority.
- **What this would force you to give up:** the visual ownership of
  having a single canonical product look; per-platform polish
  (everything becomes lowest-common-denominator unless you spend hard).
- **Smallest provable slice:** in two weeks, render the same Project's
  HQ in two surfaces (web HQ + native desktop window) backed by one
  daemon, with role-conditioned view differences (operator vs reviewer)
  proven by hiding the dispatch button for reviewers.

## Decision pressure

1. **HQ-as-home vs Desktop-as-home** — HQ wins legibility; Desktop wins
   memorability.
2. **Native-first vs web-first (Q7)** — Native wins feel; web wins
   distribution and deploy speed.
3. **Threads distinct from Chat vs unified** — Distinct surfaces match
   user mental models; unified reduces engineering surface area.
4. **Discord mirror bidirectional vs read-only (Q6)** — Bidirectional
   wins continuity with current habits; read-only protects EMA from
   becoming a Discord subordinate.
5. **One component library vs per-shell stacks** — One library forces
   coherence; per-shell stacks let each surface chase its own ceiling.
6. **Surface holds layout state vs daemon holds layout state** —
   Surface-side feels snappy; daemon-side keeps the rule that surfaces
   own no durable state.

## Read next

- `lib/ema-atlas.ts` — part `slug: "shells-surfaces"`, visions
  `shells-operator-cathedral`, `shells-living-workspace`,
  `shells-mesh-commonwealth`.
- `graph/edges/surfaces.md`
- `graph/edges/ux-metaphor.md`
- `graph/nodes/codebase-place-org.qmd`
- `graph/nodes/codebase-claudeforge.qmd`
- `graph/nodes/docs-host-system-launchpad-hq.qmd`
- `docs-ema-next-steps/.../VAPP-FINAL-VISION-CHECKLIST.md`
- `docs-host-obsidian-vault/.../Discord UX Philosophy.md` (Cognitive Cockpit)
- `OPEN_QUESTIONS.md` Q6, Q7
- `MACBOOK_AGENT_HANDOFF_MASTER.md` §18 (surface↔Hermes seam precedent)
