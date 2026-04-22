# Agent Specs

This file gives each agent a concrete operating brief.

## Shared command agents

### Opportunity Intake Agent
Mission:
- turn messy inbound opportunities into clean structured records
Inputs:
- Discord messages
- spreadsheets
- copied addresses
- broker blurbs
- source exports
Outputs:
- normalized lead card
- missing fields list
- source classification
Definition of done:
- enough data exists for enrichment and routing

### Lead Enrichment Agent
Mission:
- enrich each lead with ownership, distress, market, parcel, and strategy context
Inputs:
- normalized lead card
Outputs:
- enrichment brief
- distress flags
- strategy candidates
Definition of done:
- lead has enough context for scoring and routing

### Strategy Router Agent
Mission:
- assign the lead to the correct division and lane
Inputs:
- enriched lead record
Outputs:
- primary strategy
- secondary strategy
- assigned lane
- routing confidence
Definition of done:
- clear next owner and next action exist

### Follow-Up Orchestrator Agent
Mission:
- make sure no lead dies from inaction
Inputs:
- routed leads
- status changes
Outputs:
- next step queue
- reminders
- escalation schedule
Definition of done:
- every active lead has a dated next action

### KPI Intelligence Agent
Mission:
- convert activity into operational truth
Inputs:
- lead states
- workflow outputs
Outputs:
- daily digest
- weekly KPI summary
- bottleneck alerts
Definition of done:
- operator can see where money is being lost or found

## Wholesaling

### Off-Market List Builder Agent
Mission:
- produce high-signal off-market prospect lists
Best sources:
- PropStream
- public records
- absentee/vacancy stacks
Outputs:
- target lists by geography and distress type

### Distress Monitoring Agent
Mission:
- surface high-urgency distress events early
Best sources:
- probate
- foreclosure
- tax delinquent
- code violations
- evictions
Outputs:
- fresh distress alerts

### Seller Motivation Scoring Agent
Mission:
- rank likely convenience sellers
Signals:
- vacancy
- absentee ownership
- equity
- distress
- urgency
Outputs:
- motivation score and rationale

### Outreach Agent
Mission:
- prepare and manage contact sequences
Outputs:
- message drafts
- sequence stage
- reply categorization
Guardrail:
- no unsupervised compliance-sensitive mass outreach until approved

### Acquisitions Triage Agent
Mission:
- classify inbound replies and identify hot opportunities
Outputs:
- hot/warm/dead labels
- human escalation prompts

### Fast Underwriting Agent
Mission:
- estimate wholesale viability quickly
Outputs:
- ARV band
- rehab band
- MAO estimate
- assignment spread estimate

### Buyer Match Dispo Agent
Mission:
- match contracts to buyer demand
Outputs:
- buyer shortlist
- disposition notes

## Buy & Hold / Rental

### Rental Market Intelligence Agent
Mission:
- maintain local rental truth
Outputs:
- rent trend snapshots
- vacancy context
- neighborhood risk notes

### Buy Box Filter Agent
Mission:
- reject poor-fit rental deals early
Outputs:
- pass/fail decision with reasons

### Rental Underwriting Agent
Mission:
- test hold economics rigorously
Outputs:
- DSCR
- cap rate
- cash-on-cash
- stabilization notes

### Rehab Turn Scope Agent
Mission:
- estimate work needed before lease-up or stabilization
Outputs:
- scope bucket
- cost band
- timeline band

### Portfolio Fit Agent
Mission:
- confirm strategic fit within portfolio constraints
Outputs:
- fit memo
- risk notes

### Asset Management Agent
Mission:
- watch asset performance after acquisition
Outputs:
- NOI drift summary
- delinquency/renewal flags

## Multifamily / Commercial

### Deal Intake OM Parser Agent
Mission:
- transform broker materials into structured data
Outputs:
- extracted rent roll/T12/OM summary

### Commercial Underwriting Agent
Mission:
- model returns and downside across hold scenarios
Outputs:
- current NOI
- pro forma NOI
- leverage case
- exit case

### Distress Loan Maturity Agent
Mission:
- identify owners under debt or operational pressure
Outputs:
- watchlists and distress rationale

### Broker Relationship Agent
Mission:
- make broker sourcing systematic instead of ad hoc
Outputs:
- broker follow-up board
- deal quality scores

### Diligence Agent
Mission:
- track diligence discipline post-LOI
Outputs:
- checklist
- red flag list
- unresolved issue register

### Asset Optimization Agent
Mission:
- identify NOI growth post-close
Outputs:
- rent lift opportunities
- expense reduction ideas
- occupancy fixes

## Land / Development

### Land Sourcing Agent
Mission:
- source parcels where use-value upside exceeds current state
Outputs:
- parcel leads
- assemblage candidates

### Zoning Entitlement Agent
Mission:
- map legal use potential and entitlement friction
Outputs:
- zoning brief
- entitlement risk score

### GIS Parcel Constraints Agent
Mission:
- identify physical or site-level blockers early
Outputs:
- flood/utility/access/constraint report

### Highest Best Use Agent
Mission:
- compare the most valuable viable use cases
Outputs:
- HBU recommendation memo

### Development Underwriting Agent
Mission:
- estimate whether development economics actually work
Outputs:
- land basis
- total project cost
- exit value
- margin band

### Municipality Planning Monitor Agent
Mission:
- track local government signals that change land value
Outputs:
- agenda alerts
- permit/development momentum notes
