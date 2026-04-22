# Discord Restructuring Plan — House vs Vacant Land

## Goal
Reorganize the Discord workspace so house wholesaling and vacant land wholesaling are clearly separated while preserving a shared command layer.

---

## Keep shared command category
### Category: RE Shared Command
Keep / use these channels:
- `#re-hq`
- `#opportunity-intake-agent`
- `#lead-enrichment-agent`
- `#strategy-router-agent`
- `#follow-up-orchestrator-agent`
- `#kpi-intelligence-agent`

Optional add:
- `#portfolio-director-agent`

---

## Rename / repurpose wholesaling category
### Current category
- `RE Wholesaling`

### New purpose
This becomes **House Wholesaling** specifically unless you want a more general parent category with house + land subcategories.

### Recommended rename
- `RE House Wholesaling`

### Keep / use these channels as house-specific lanes
- `#off-market-list-builder-agent` → rename to `#house-list-builder-agent`
- `#distress-monitoring-agent` → rename to `#house-distress-monitoring-agent`
- `#seller-motivation-scoring-agent` → rename to `#house-seller-motivation-scoring-agent`
- `#outreach-agent` → rename to `#house-outreach-agent`
- `#fast-underwriting-agent` → rename to `#house-fast-underwriting-agent`
- `#buyer-match-dispo-agent` → rename to `#house-buyer-match-dispo-agent`

### Add / create
- `#seller-response-triage-agent`

---

## Use land category as a distinct wholesaling flow
### Current category
- `RE Land Development`

### Recommended rename
- `RE Vacant Land Wholesaling`
  or
- `RE Land Development` if you want it broader than wholesaling

### Keep / use these channels
- `#land-sourcing-agent`
- `#zoning-entitlement-agent`
- `#gis-parcel-constraints-agent`
- `#highest-best-use-agent`
- `#development-underwriting-agent`
- `#municipality-planning-monitor-agent`

### Add / create land-specific buyer-first lanes
- `#land-buyer-criteria-agent`
- `#land-seller-qualification-agent`
- `#land-buyer-match-agent`

---

## Suggested final Discord shape

### RE Shared Command
- re-hq
- opportunity-intake-agent
- lead-enrichment-agent
- strategy-router-agent
- follow-up-orchestrator-agent
- kpi-intelligence-agent
- portfolio-director-agent (optional)

### RE House Wholesaling
- house-list-builder-agent
- house-distress-monitoring-agent
- house-seller-motivation-scoring-agent
- house-outreach-agent
- seller-response-triage-agent
- house-fast-underwriting-agent
- house-buyer-match-dispo-agent

### RE Vacant Land Wholesaling
- land-buyer-criteria-agent
- land-sourcing-agent
- zoning-entitlement-agent
- gis-parcel-constraints-agent
- land-seller-qualification-agent
- highest-best-use-agent
- development-underwriting-agent
- land-buyer-match-agent
- municipality-planning-monitor-agent

---

## Why this layout is better
### Benefits
- keeps shared intake and reporting clean
- stops house logic and land logic from mixing
- makes routing clearer
- makes SOPs easier to write and enforce
- makes future agent automation more modular

### Main principle
Shared front-end, separate execution verticals.
