---
title: "EMA Best Practices"
space: wiki
tags: ["ops", "standards", "workflow"]
source: manual
---

# EMA Best Practices — Use EMA Like You Mean It

The system is only as good as the discipline used to feed it. This is the
canonical reference for how to use EMA correctly. The
`Ema.Standards.Enforcer` GenServer surfaces violations of these practices as
nudges; `ema standards check` runs the same checks on demand.

## Daily Ritual (5 minutes)

Morning:
- `ema brief` — see what's happening
- `ema now` — what should I do
- Brain dump 1-2 priorities into EMA

During day:
- `ema dump "thought"` — capture as you go
- `ema task assign` — delegate when you can

End of day:
- `ema proposal triage` — review queued
- `ema journal write "..." --mood good`

## Capture Everything Pattern

- Bug found? `ema dump "bug: ..."`
- Decision made? `ema dump "decision: ..."`
- Person mentioned? `ema dump "contact: ..."`
- Tool evaluated? `ema dump "stack: chose X over Y because ..."`

The auto-tagger will route these to the right downstream system based on
the prefix keyword. See `Ema.Standards.AutoTag`.

## Intent Hygiene

- Every goal should have a parent intent
- Every task should link to a goal or intent
- Use `ema intent tree` weekly to spot orphans
- The `check_orphaned_intents` enforcer check runs hourly

## Proposal Triage Pattern

- **Approve** — high confidence + matches current focus
- **Redirect** — good idea but wrong angle (creates 3 new seeds)
- **Kill** — bad pattern (`KillMemory` will prevent recurrence)

Triage queued proposals at least daily. Anything queued > 7 days is stale
and the enforcer will surface it.

## When to Open a Loop

- Outbound message waiting for response
- Promise made to someone
- Decision pending external input

```sh
ema loop open --type X --target Y
```

The `Loops.Escalator` ticks hourly and bumps levels for stale loops.

## Cost Discipline

- Check `ema tokens budget` weekly
- Tier auto-degradation kicks in at 50% / 75% / 90% of budget
- Use `haiku` for routine tasks, `sonnet` for decisions
- Cost governor runs on every Claude call (already wired)

## Trust the Calendar

- Calendar items in brain dumps drive autonomous work
- Don't override unless priorities actually changed
- Update intent timeframes when reality shifts

## Default Behaviors (Enforced Automatically)

These happen without you asking:

| Behavior | Where |
|----------|-------|
| Brain dumps auto-tagged from content prefix | `Ema.Standards.AutoTag` |
| Tasks created without project get the active project | `Ema.Standards.Defaults` |
| Proposals get a default `actor_id` (human) | `Ema.Standards.Defaults` |
| Executions get `origin` set | `Ema.Standards.Defaults` |
| Cost governor on every Claude call | `Ema.Intelligence.CostGovernor` |
| Hourly enforcer sweep with nudges | `Ema.Standards.Enforcer` |

## Standards CLI

```sh
ema standards check                # show all current findings
ema standards explain <check>      # what does this check look for?
```

## Pre-Commit Hooks

`ema install hooks` installs a git pre-commit hook in the current repo
that blocks commits containing:

- debug statements (`IO.inspect`, `console.log`, `dbg!`, `pp `)
- hardcoded API keys (sk-*, ghp_*, AKIA*, etc.)
- `TODO` / `FIXME` without an issue reference

Tags: #standards #workflow #ops
