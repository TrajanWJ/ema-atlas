# Adil Discord + Real Estate System Setup

Date: 2026-04-21 UTC
Prepared on: `agent-vm`

## Reality first
This setup is based on recovered old OpenClaw material and should be treated as the **proper modern target** for Adil's system.

Two important constraints still exist:
- I do **not** currently have a Discord bot token with access to the target guild from this runtime for category/channel creation.
- EMA daemon is currently unreachable on this machine, so live EMA ingestion is still blocked.

So this document is the exact target structure and system mapping, ready to provision.

---

## 1. Surface model

### Category A — `ADIL — PERSONAL`
Purpose:
- private/general collaboration surface for Adil
- onboarding, loose notes, personal coordination

Channels:
1. `welcome`
   - topic: Welcome + operating context + where to start
2. `personal-hub`
   - topic: Adil-specific discussion that is not pipeline-specific
3. `handoff-log`
   - topic: concise updates, blockers, decisions, next actions

### Category B — `ADIL — WHOLESALING AI`
Purpose:
- shared intelligence layer and command layer for the whole real-estate AI system

Channels:
1. `ai-hq`
   - topic: high-level command, routing, priorities, architecture decisions
2. `opportunity-intake`
   - topic: normalized lead intake and source intake staging
3. `lead-enrichment`
   - topic: owner/parcel/distress/context enrichment outputs
4. `strategy-router`
   - topic: route lead to house, land, nurture, or dead
5. `follow-up-orchestrator`
   - topic: next touches, reminders, revive stale leads, escalation timing
6. `kpi-intelligence`
   - topic: conversion, throughput, bottlenecks, source quality
7. `queue`
   - topic: concrete assignable work items only
8. `done-feed`
   - topic: completed actions and closed loops

### Category C — `ADIL — WHOLESALING HOUSES`
Purpose:
- house-wholesaling execution flow

Channels:
1. `house-list-builder`
2. `house-distress-monitoring`
3. `house-seller-motivation`
4. `house-outreach`
5. `seller-response-triage`
6. `house-fast-underwriting`
7. `house-buyer-match-dispo`

### Category D — `ADIL — WHOLESALING LAND`
Purpose:
- land-wholesaling execution flow

Channels:
1. `land-buyer-criteria`
2. `land-sourcing`
3. `zoning-entitlement`
4. `gis-parcel-constraints`
5. `land-seller-qualification`
6. `highest-best-use`
7. `land-underwriting`
8. `land-buyer-match`
9. `municipality-planning-monitor`

### Category E — `ADIL — LEGACY / IMPORTED`
Purpose:
- old references preserved but visually downgraded

Channels:
1. `legacy-notes`
2. `legacy-architecture`
3. `legacy-archive`

Rule:
- legacy is reference, not command
- never let legacy surfaces compete with live operating channels

---

## 2. What should be active at launch
Only create channels that survive the old workspace doctrine test:
- clear owner
- clear purpose
- clear inputs
- clear outputs
- low overlap
- likely active usage

That means the launch set should be:

### Must-create now
- `welcome`
- `personal-hub`
- `handoff-log`
- `ai-hq`
- `opportunity-intake`
- `lead-enrichment`
- `strategy-router`
- `follow-up-orchestrator`
- `kpi-intelligence`
- `queue`
- `done-feed`
- `house-list-builder`
- `house-distress-monitoring`
- `house-seller-motivation`
- `house-outreach`
- `seller-response-triage`
- `house-fast-underwriting`
- `house-buyer-match-dispo`
- `land-buyer-criteria`
- `land-sourcing`
- `zoning-entitlement`
- `gis-parcel-constraints`
- `land-seller-qualification`
- `highest-best-use`
- `land-underwriting`
- `land-buyer-match`

### Create later only if active demand appears
- `municipality-planning-monitor`
- legacy channels beyond a single archive/log surface

---

## 3. Modern EMA/Hermes mapping

### EMA should own
- project identity
- workflow definitions
- intent/proposal/execution lineage
- review and approval state
- operator-visible durable status

### Hermes should own
- actual agent execution
- provider/runtime choice
- tools and delegation
- session continuity
- Discord/web streaming output

### Discord should own
- operator collaboration surface
- mirrored task and result visibility
- lightweight commands and follow-up discussion

So each Discord channel is a **surface**, not the canonical state holder.

---

## 4. Recovered source material already available
Recovered artifact root:
- `/home/trajan/Projects/ema/recovered/adil/real-estate-ai-openclaw-src`

Most important recovered files:
- `MASTER-ARCHITECTURE.md`
- `AGENT-REGISTRY.yaml`
- `WORKFLOW-SET.md`
- `MVP-BUILD-ORDER.md`
- `WHOLESALING-AI-WORKSPACE-DOCTRINE.md`
- per-agent docs under `agents/`

---

## 5. Proper system bootstrap order
1. Provision Discord categories/channels
2. Pin welcome + rules + source-of-truth message in `welcome`
3. Treat recovered files as imported reference docs
4. Recreate shared backbone first in EMA/Hermes terms:
   - intake
   - enrichment
   - routing
   - follow-up
   - KPI summaries
5. Stand up house-wholesaling flow first
6. Stand up land-wholesaling flow second
7. Import only the high-signal legacy artifacts into EMA project references
8. Leave the rest archived

---

## 6. Welcome message for Adil
`@AdilHilaly welcome — I recovered the old OpenClaw real-estate AI scaffold and mapped it into a cleaner EMA/Hermes structure. The live system should split into Personal, Wholesaling AI, Wholesaling Houses, and Wholesaling Land, with EMA holding durable state and Discord acting as the working surface. Next step is provisioning the actual channels and binding the shared backbone workflows.`

---

## 7. Current blockers
- no accessible Discord bot token for the target guild from this runtime
- EMA daemon unavailable at `localhost:4488`

Once those two are fixed, this setup can be provisioned cleanly.