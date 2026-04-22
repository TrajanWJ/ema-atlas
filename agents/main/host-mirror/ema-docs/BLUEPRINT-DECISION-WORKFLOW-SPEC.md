# Blueprint Decision Workflow Spec

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

Blueprint should expose explicit workflows for how design questions and planning artifacts become decisions, promotion candidates, and downstream work.

## Core workflows

### Workflow 1: GAC answer -> planning decision
1. user/agent answers GAC card
2. answer creates or updates a `decision_candidate` or planning node
3. result is visible in Blueprint's planning graph / promotion queue
4. later promoted into canon, operational planning, or proposal generation

### Workflow 2: GAC defer -> blocker/gap
1. GAC card is deferred
2. defer creates or links a blocker/gap record
3. Blueprint surfaces it in Gaps / Blockers
4. later resolution may reopen planning or create a decision candidate

### Workflow 3: aspiration -> candidate decision
1. aspiration is confirmed or linked
2. Blueprint shapes it into a candidate intent / planning node / decision candidate
3. if mature, emit promotion candidate

### Workflow 4: reviewed provenance -> planning decision
1. Chronicle-derived material is reviewed
2. approved candidate is surfaced to Blueprint as reviewed input
3. Blueprint can convert it into decision candidate / planning node / gap record
4. later handoff goes to canon, operational planning, or runtime work

### Workflow 5: planning decision -> operational handoff
1. decision candidate or planning node matures
2. Blueprint sends to promotion queue
3. human chooses target:
   - canon candidate
   - goal/calendar/buildout handoff
   - proposal generation
   - gap/blocker

## Key boundary rule

Blueprint shapes the workflow but does not erase boundary distinctions:
- Review still governs provenance-derived approval
- canon ratification still requires stronger promotion
- operational planning still owns scheduling and ownership
- runtime still owns execution

## Suggested Blueprint-visible statuses

For decision candidates / promotion candidates:
- `draft`
- `reviewed`
- `ready_for_promotion`
- `promoted`
- `deferred`
- `superseded`

## Suggested visible actions in Blueprint

- `Create decision candidate`
- `Link to existing decision`
- `Convert to planning node`
- `Send to promotion queue`
- `Mark as blocker/gap`
- `Hand off to goal`
- `Hand off to proposal`
- `Stage as canon candidate`

## Strong recommendation

Blueprint should make decision transitions legible as workflow steps, not hide them behind generic edit/save operations.
