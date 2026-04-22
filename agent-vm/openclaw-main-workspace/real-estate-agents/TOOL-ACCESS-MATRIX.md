# Tool Access Matrix

This defines the intended OpenClaw-facing tool posture for each class of agent.

## Rule of thumb
Agents should start with the minimum tools required.
Only shared command or operator-approved execution agents should be allowed to write externally or trigger costly automations.

## Shared command layer

### Opportunity Intake Agent
Allowed:
- message (read/send within designated Discord lanes)
- read (local schema/docs)
- write (normalized lead files or reports)

### Lead Enrichment Agent
Allowed:
- web_search
- web_fetch
- read
- write
- message

### Strategy Router Agent
Allowed:
- read
- write
- message

### Follow-Up Orchestrator Agent
Allowed:
- read
- write
- message

### KPI Intelligence Agent
Allowed:
- read
- write
- message

## Wholesaling

### Off-Market List Builder Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Distress Monitoring Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Seller Motivation Scoring Agent
Allowed:
- read
- write
- message

### Outreach Agent
Allowed:
- read
- write
- message
Notes:
- outbound messaging or campaign actions should remain human-approved until compliance rails are defined.

### Acquisitions Triage Agent
Allowed:
- read
- write
- message

### Fast Underwriting Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Buyer Match Dispo Agent
Allowed:
- read
- write
- message

## Buy & Hold / Rental

### Rental Market Intelligence Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Buy Box Filter Agent
Allowed:
- read
- write
- message

### Rental Underwriting Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Rehab Turn Scope Agent
Allowed:
- read
- write
- message

### Portfolio Fit Agent
Allowed:
- read
- write
- message

### Asset Management Agent
Allowed:
- read
- write
- message

## Multifamily / Commercial

### Deal Intake OM Parser Agent
Allowed:
- read
- write
- pdf
- image
- message

### Commercial Underwriting Agent
Allowed:
- read
- write
- web_search
- web_fetch
- pdf
- message

### Distress Loan Maturity Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Broker Relationship Agent
Allowed:
- read
- write
- message

### Diligence Agent
Allowed:
- read
- write
- pdf
- image
- message

### Asset Optimization Agent
Allowed:
- read
- write
- message

## Land / Development

### Land Sourcing Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Zoning Entitlement Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### GIS Parcel Constraints Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message
- image

### Highest Best Use Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

### Development Underwriting Agent
Allowed:
- read
- write
- web_search
- web_fetch
- pdf
- message

### Municipality Planning Monitor Agent
Allowed:
- read
- write
- web_search
- web_fetch
- message

## Deferred tool classes
Do not enable by default until governance is in place:
- browser automation for login-bound data providers
- exec for arbitrary host commands
- autonomous external outreach beyond approved channels
- destructive moderation/admin actions
