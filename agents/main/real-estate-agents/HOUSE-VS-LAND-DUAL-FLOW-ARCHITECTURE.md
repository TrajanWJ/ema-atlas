# House vs Vacant Land Dual-Flow Architecture

## Core decision
The system should share a common front-end command layer, then split into two distinct wholesaling workflows:
- House Wholesaling Flow
- Vacant Land Wholesaling Flow

This is necessary because houses and land differ materially in:
- buyer type
- lead-list logic
- qualification questions
- underwriting method
- disposition path

---

## Shared command layer
These agents remain shared across both verticals:

### 1. Opportunity Intake Agent
Purpose:
- normalize raw leads from PropStream, public records, spreadsheets, manual notes, and inbound seller data

### 2. Lead Enrichment Agent
Purpose:
- add owner, mailing, parcel, occupancy, distress, equity, and base context

### 3. Strategy Router Agent
Purpose:
- decide whether the lead belongs in house wholesaling, vacant land wholesaling, another strategy, or nurture/dead

### 4. Follow-Up Orchestrator Agent
Purpose:
- ensure every active lead has a next action and no opportunity dies from neglect

### 5. KPI Intelligence Agent
Purpose:
- track list quality, response rates, underwriting pass rate, bottlenecks, and source conversion

### 6. Portfolio Director Agent
Purpose:
- monitor performance across both verticals and adjust focus based on results

---

# Flow A: House Wholesaling

## Objective
Find discounted off-market houses where seller motivation, conservative math, and buyer demand create assignable spread.

## Main logic
House wholesaling is primarily driven by:
- seller distress or inconvenience
- absentee ownership / tired landlord / vacancy
- ARV + rehab + MAO math
- buyer demand from flippers and landlords

## House workflow
1. House List Builder Agent builds lead lists
2. House Distress Monitoring Agent adds urgency/distress signals
3. House Seller Motivation Scoring Agent ranks seller quality
4. House Outreach Agent contacts top leads
5. Seller Response Triage Agent interprets seller replies
6. House Fast Underwriting Agent checks ARV / rehab / MAO / spread
7. House Buyer Match / Dispo Agent validates buyer exit
8. Follow-Up + KPI loop keeps the pipeline moving and improving

## House-specific key questions
- Why is the seller selling?
- What is the property condition?
- What does rehab likely cost?
- Is there enough spread after ARV and repairs?
- Is the seller realistic enough to get to MAO?

---

# Flow B: Vacant Land Wholesaling

## Objective
Find buildable, buyer-matched land opportunities where lot utility, zoning, and buyer criteria create an assignable spread.

## Main logic
Vacant land wholesaling is primarily driven by:
- buyer criteria first
- lot size, zoning, utilities, and buildability
- infill / split-lot / development potential
- builder / land banker / trailer / mineral-rights buyer fit

## Land workflow
1. Land Buyer Criteria Agent identifies what buyers want first
2. Land Sourcing Agent pulls parcels matching buyer criteria
3. Zoning / Entitlement Agent checks legal use and split potential
4. GIS / Parcel Constraints Agent checks utilities, access, water, septic, power, floodplain, and physical blockers
5. Land Seller Qualification Agent asks the 7 must-know seller questions
6. Land Underwriting Agent comps and prices the parcel
7. Land Buyer Match Agent validates actual end-buyer demand
8. Follow-Up + KPI loop keeps the pipeline moving and improving

## Land-specific key questions
- What is the lot size?
- What is the zoning?
- Why is the seller selling?
- Is water available (city or well)?
- Is it on sewage or septic?
- Is there power access?
- Is the parcel actually buildable?

---

## Split point
The split occurs at the Strategy Router Agent.

### If the lead is a house
Send to House Wholesaling Flow.

### If the lead is vacant land
Send to Vacant Land Wholesaling Flow.

---

## Why this architecture is correct
If the two are merged too far downstream, the system makes bad assumptions:

### House logic incorrectly applied to land
- ARV-first thinking where no real house exists
- rehab-first logic where utilities/buildability matter more
- generic house-buyer assumptions instead of builder criteria

### Land logic incorrectly applied to houses
- overemphasis on zoning and utility checks too early
- buyer-first logic when seller distress + spread matter more
- parcel complexity where standard housing disposition is enough

---

## Shared doctrine
Both verticals still share the same high-level purpose:
- source better off-market opportunities
- reduce wasted effort
- move faster on real motivated sellers
- underwrite conservatively
- keep pipeline follow-up disciplined

But they should not share the same detailed workflow once asset type is known.
