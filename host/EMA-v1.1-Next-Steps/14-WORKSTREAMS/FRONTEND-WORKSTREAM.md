---
id: WORKSTREAM-FRONTEND-BUILDOUT
type: workstream
layer: planning
title: "Workstream — Frontend GUI buildout (v1.1)"
status: active
created: 2026-04-13
owner: trajan
anchor_plan: "[[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]]"
related:
  - "[[14-WORKSTREAMS/WORKSTREAM-IDENTITY-DRAFT]]"
  - "[[14-WORKSTREAMS/WORKSTREAM-AND-MIRRORING-NOTES]]"
  - "[[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]]"
  - "[[05-WIKI/SETTINGS-OBJECT-SPEC]]"
  - "[[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]]"
  - "[[01-PLANS/2026-04-13-DAEMON-EXTRACTION-IMPL-NOTES]]"
  - "[[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]]"
tags: [workstream, frontend, gui, v1.1, active]
---

# Workstream — Frontend Buildout

> Thread-of-work identity for the v1.1 frontend GUI buildout track. This
> doc is the canonical index that CLI and renderer should agree on when
> this workstream gets bootstrapped into EMA.

## Scope

Everything in `apps/renderer/`, `apps/electron/` (shell-level only), and
the renderer-visible portion of the daemon extraction. Does NOT include:

- Services domain implementations (separate workstream)
- CLI decomposition (separate workstream — `CLI-DECOMP`)
- Sub-project A architecture (separate workstream — `SUBPROJECT-A`)
- Schema dedup (separate workstream — `SCHEMA-DEDUP`)

## Anchor artifacts (read-first for any session on this stream)

1. [[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]] — phase sequence F0→F6
2. [[05-WIKI/SETTINGS-OBJECT-SPEC]] — settings object model
3. [[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]] — shell top bar
4. [[01-PLANS/2026-04-13-DAEMON-EXTRACTION-IMPL-NOTES]] — daemon coupling surgery
5. [[13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13]] — per-route disposition
6. [[11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13]] — error-handling root causes

## Phases (from buildout plan)

| Phase | Goal | Session-count | Blocked on |
|---|---|---|---|
| F0 | Error honesty | 1-2 | nothing |
| F1 | Ghost purge | 0.5 | nothing |
| F2 | Shell top bar redesign | 1-2 | F0; daemon D0+D1 for status pill |
| F3 | Settings redesign | 1 | F0; needs `services/core/settings/` |
| F4 | Keep-and-wire vApps | 2-3 | F1, F2 |
| F5 | HQ decomposition | 1 | F1, F4 partial |
| F6 | Launchpad as real surface | 0.5 | F1 |

## Current session state

| Session | Date | What shipped | Open |
|---|---|---|---|
| S0 | 2026-04-13 am | Hub freeze + initial diagnostics | planning docs frozen |
| S1 | 2026-04-13 pm | Forensic audit + capture artifacts | all specs drafted, none implemented |
| S2 | (next) | User review of specs + F0 start? | gated on user |

## Entry criteria per session

Before starting any session on this workstream, read in order:

1. This doc (workstream identity)
2. Anchor plan
3. Any spec relevant to the phase being worked on
4. `git status` in `~/Projects/ema` — know what WIP exists
5. Most recent session log (if any)

## Exit criteria per session

Every session on this workstream must end with:

1. One coherent commit (or explicit "WIP, not committing")
2. A session log appended to `20-CHRONICLE-REVIEW/` or vault `Session Log/`
3. This doc's "Current session state" table updated
4. Any discovered gaps captured in
   [[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]]

## Decision log for this workstream

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-13 | Phase F0 is non-negotiable blocker for all other phases | GUI rot diagnostic root cause is error-swallowing; nothing built on top will be legible until F0 ships |
| 2026-04-13 | 10 `ConnectedDraftApp` routes get purged from launchpad, not deleted | Preserves rebuild path; keeps routing honest |
| 2026-04-13 | Top bar adds orgs + spaces + workstream + daemon status as four distinct regions | Per user directive "top bar with spaces and organizations needs work" |
| 2026-04-13 | Settings scoped to global/org/space, six categories | Avoids flat setting-soup; matches mental model |
| 2026-04-13 | Daemon extraction D0-D5 ships independently of sub-project A | Minimum decoupling does not require Effect/RPC rewrite |

## Handoff protocol

When this workstream is picked up by a fresh session (human or agent):

- Resume at the phase indicated in "Current session state"
- Do NOT skip F0 even if it feels done — verify with `grep -r "catch(() => {})" apps/renderer/`
- Do NOT expand scope into CLI or services without spawning a new workstream
- Capture any surprise findings in
  [[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]] with a row reference

## Bootstrap note

When this whole folder is ingested by `ema ingest bootstrap`, this
workstream doc should become an EMA Workstream object linked to:

- The anchor plan as its driving intent
- Each phase as a child intent
- Each spec as a canon reference
- Each gap ledger row as a gap object
