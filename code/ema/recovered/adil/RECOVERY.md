# Adil Recovery — old OpenClaw → EMA/Hermes

Date: 2026-04-20/21 UTC
Machine verified: `agent-vm`

## Boundary
- This recovery was performed on `agent-vm`.
- The recoverable source-of-truth I could access here is the old OpenClaw workspace and session history under:
  - `/home/trajan/.openclaw/agents/main/workspace/real-estate-agents`
  - `/home/trajan/.openclaw/agents/main/sessions/e7024a7d-0d91-4ba2-8ad1-f1b54f341d6d.jsonl`
- EMA live control-plane import is **not** complete yet because the EMA daemon is currently unreachable from this machine:
  - `Cannot reach EMA daemon at localhost:4488`

## What I recovered
I copied the old real-estate AI workspace into EMA-owned recovery space:
- `recovered/adil/real-estate-ai-openclaw-src/`

This contains the old scaffold for Adil's real-estate agent system, including:
- `MASTER-ARCHITECTURE.md`
- `AGENT-REGISTRY.yaml`
- `WORKFLOW-SET.md`
- `MVP-BUILD-ORDER.md`
- `TOOL-ACCESS-MATRIX.md`
- per-agent specs under `agents/`

## Strong evidence this belonged to Adil's old lane
From old OpenClaw session history:
- Discord lane: `#adil`
- old channel id: `1493476631812112504`
- Adil user id seen in session metadata: `1248013170493362196`

The recovered workspace doctrine also explicitly says Adil owned:
- wholesaling AI
- wholesaling houses
- wholesaling land

## Recovered design shape
### Shared backbone
- Opportunity Intake Agent
- Lead Enrichment Agent
- Strategy Router Agent
- Follow-Up Orchestrator Agent
- KPI Intelligence Agent

### Business divisions
- Wholesaling
- Buy & Hold / Rental
- Multifamily / Commercial
- Land / Development

### Old operating model
Old OpenClaw design assumed Discord/OpenClaw lanes as the main interaction surface.
That is the part I would modernize for EMA/Hermes.

## How this should map into the modern EMA/Hermes stack
### Keep
- shared lead schema
- agent registry and workflow definitions
- route/handoff logic
- underwriting and follow-up roles

### Replace / modernize
Old model:
- Discord categories/channels as primary operating topology
- OpenClaw lanes as durable workflow identity

Modern EMA/Hermes model:
- EMA = source of truth for intent, execution lineage, routing policy, and review state
- Hermes = execution substrate for sessions, tools, providers, delegation, and messaging
- Discord = mirrored surface, not the durable state container

### Recommended import target
1. Import the old real-estate docs as **reference artifacts** only.
2. Re-express the old agent lanes as:
   - EMA intents / workflows / execution templates
   - Hermes execution targets / session bindings
3. Start with the shared backbone first:
   - intake
   - enrichment
   - routing
   - follow-up orchestration
   - KPI summaries
4. Then revive only the first business lane:
   - wholesaling MVP

## Immediate next build recommendation
Use the recovered `MVP-BUILD-ORDER.md` as the sequence, but modernize the runtime contract:
- operator-facing state in EMA
- agent execution in Hermes
- surface updates streamed outward to Discord/web

## Gaps still unresolved
- I have not created a real Discord category from here.
- I have not live-imported this into EMA daemon state because the EMA daemon is down/unreachable.
- I have not recovered any separate Adil-specific personal docs yet beyond the old `#adil` lane evidence.

## Suggested next step
When EMA daemon is reachable again, create a formal EMA recovery/import note for this project and bind the recovered artifact folder into the control plane as a project reference.