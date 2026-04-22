# MVP Build Order

## Goal
Begin autonomous build-out without trying to operationalize all 29+ lanes at once.

## Phase 1 — Shared backbone
Build first:
1. Opportunity Intake Agent
2. Lead Enrichment Agent
3. Strategy Router Agent
4. Follow-Up Orchestrator Agent
5. KPI Intelligence Agent

Deliverables:
- common lead schema
- routing logic
- status model
- summary/report templates

## Phase 2 — Wholesaling MVP
Build next:
1. Off-Market List Builder Agent
2. Distress Monitoring Agent
3. Seller Motivation Scoring Agent
4. Acquisitions Triage Agent
5. Fast Underwriting Agent

Deliverables:
- list criteria packs
- distress scoring rules
- motivation scoring rules
- MAO / ARV summary template

## Phase 3 — Rental underwriting lane
Build:
1. Rental Market Intelligence Agent
2. Buy Box Filter Agent
3. Rental Underwriting Agent
4. Rehab Turn Scope Agent
5. Portfolio Fit Agent

## Phase 4 — Commercial lane
Build:
1. Deal Intake OM Parser Agent
2. Commercial Underwriting Agent
3. Diligence Agent

## Phase 5 — Land/development lane
Build:
1. Land Sourcing Agent
2. Zoning Entitlement Agent
3. GIS Parcel Constraints Agent
4. Highest Best Use Agent
5. Development Underwriting Agent

## Operator recommendation
Autonomy should increase in layers:
- Layer A: analysis only
- Layer B: internal posting and task creation
- Layer C: operator-approved outreach/actions
- Layer D: selective autonomous execution under guardrails
