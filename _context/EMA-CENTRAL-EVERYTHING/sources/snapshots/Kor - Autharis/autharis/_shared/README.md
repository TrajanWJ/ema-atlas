# _shared — Autharis swarm workspace

This folder is the control plane for parallel Autharis work inside `/Users/tawj/Desktop/Kor - Autharis/autharis/`.

It exists to keep multiple agents from colliding while the Autharis prototype is being rebuilt into the real Next.js app that lives in this repo.

## What this workspace owns

- `lanes.md` — live lane lock sheet
- `decisions.md` — append-only change log for swarm-level decisions
- `handoffs/` — cross-agent asks, blockers, and follow-ups
- `dispatch/` — copy-paste prompts for launching lane-specific agents

## What the swarm is building around

The real implementation target is the Next.js 16 app in this folder:

- `/Users/tawj/Desktop/Kor - Autharis/autharis/app/**`
- `/Users/tawj/Desktop/Kor - Autharis/autharis/lib/**`
- `/Users/tawj/Desktop/Kor - Autharis/autharis/styles/**`

There is also a prototype/reference export at the workspace root:

- `/Users/tawj/Desktop/Kor - Autharis/index.html`
- `/Users/tawj/Desktop/Kor - Autharis/src/**`

Those root-level files are **reference-only** for now. Agents may read them to mirror design intent, but they should not edit them unless the dispatching user explicitly asks.

## Routing rule

This project uses a single control plane:

- If you are writing inside `autharis/`, you coordinate here.
- If your write scope overlaps another lane, stop and resolve that in `lanes.md` first.
- If a file is marked protected or user-owned, do not touch it unless your lane explicitly owns reconciliation.

## Protected files right now

At the moment, treat these as protected until the reconciliation lane opens or the user says otherwise:

- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `components/Marketing.tsx`
- `components/ClientApp.tsx`
- `components/AppContext.tsx`
- `components/TweaksPanel.tsx`
- `components/Icons.tsx`
- `styles/**`
- `lib/tweaks.ts`
- `lib/data.ts`

Reason: these files already form one in-flight prototype/design-system lane and should not be churned by multiple agents at once.

## Hard rules

1. One agent per lane.
2. Claim your lane in `lanes.md` before writing code.
3. Stay inside your lane's file scope.
4. Read `AGENTS.md` before touching Next.js code.
5. For Next.js 16 behavior, read the relevant guide under `node_modules/next/dist/docs/` before using unfamiliar APIs.
6. Every landed lane appends one short entry to `decisions.md`.
7. Do not rewrite protected files from a non-reconciliation lane.
8. Do not edit the root prototype export unless the user explicitly asks for that output.

## Stagnation protocol

If a lane goes stale or proves too large, the control tower should actively intervene instead of waiting:

1. If a lane is still `held` after a long interval with no meaningful artifact progress, treat it as stalled.
2. If a lane needs protected files, shared rewrites, or a much broader scope than originally assigned, do not stretch the lane. File a handoff and decompose it.
3. Close the stale worker thread, preserve its useful notes, and reopen the work as smaller derivative lanes with tighter write scopes.
4. Prefer replacing one vague lane with two or three concrete leaf lanes.
5. Keep at least six active workers whenever the thread limit allows it.

## Suggested execution order

1. Fire the isolated build lanes in parallel:
   - A1 shell primitives
   - B1 marketing surface
   - B2 client surface
   - B3 talent surface
   - B4 admin surface
2. Hold reconciliation on the protected files until the team is ready to integrate.
3. Fire C1 integration once the isolated surfaces are ready and protected-file ownership is clear.
4. Fire V1 verification after C1 lands.

## Session naming

Use a simple session id when claiming a lane:

- `codex-s1`
- `claude-s2`
- `codex-s3`

That id becomes the `Holder` in `lanes.md` and should appear in any handoff file you create.
