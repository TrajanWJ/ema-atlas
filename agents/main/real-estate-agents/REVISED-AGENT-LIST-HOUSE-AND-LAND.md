# Revised Agent List — House Wholesaling and Vacant Land Wholesaling

## Shared command agents

### 1. Portfolio Director Agent
Strategic coordinator across both verticals.

### 2. Opportunity Intake Agent
Normalizes raw leads into a common schema.

### 3. Lead Enrichment Agent
Adds owner, parcel, occupancy, distress, and base context.

### 4. Strategy Router Agent
Splits opportunities into house wholesale, land wholesale, other strategy, or nurture/dead.

### 5. Follow-Up Orchestrator Agent
Maintains next actions and prevents pipeline leakage.

### 6. KPI Intelligence Agent
Tracks performance, list quality, and bottlenecks across both flows.

---

## House Wholesaling agents

### 7. House List Builder Agent
Builds house-focused ICP lists such as:
- vacant absentee
- high equity
- tired landlord
- tax delinquent
- pre-foreclosure

### 8. House Distress Monitoring Agent
Tracks house-related distress signals:
- foreclosure
- probate
- tax delinquent
- vacancy
- code violations
- landlord distress

### 9. House Seller Motivation Scoring Agent
Scores house-owner motivation based on pain, urgency, discount-likelihood, and context.

### 10. House Outreach Agent
Handles outbound seller contact for house leads.

### 11. Seller Response Triage Agent
Interprets seller responses from outbound campaigns and routes the lead to the next action.

### 12. House Fast Underwriting Agent
Runs rough house wholesale math:
- ARV
- rehab
- MAO
- spread

### 13. House Buyer Match / Dispo Agent
Matches viable house deals to flippers, landlords, and cash buyers.

---

## Vacant Land Wholesaling agents

### 14. Land Buyer Criteria Agent
Identifies what buyer types want first:
- builders / developers
- land bankers
- trailer park / affordable-housing land buyers
- mineral-rights buyers

### 15. Land Sourcing Agent
Pulls parcels based on buyer criteria, market, zoning, lot size, and infill potential.

### 16. Zoning / Entitlement Agent
Evaluates zoning, use permissions, split potential, and development viability.

### 17. GIS / Parcel Constraints Agent
Checks access, water, sewage/septic, power, floodplain, and physical constraints.

### 18. Land Seller Qualification Agent
Asks the land-specific seller questions:
- lot size
- zoning
- why selling
- water
- sewage/septic
- power
- buildability

### 19. Highest Best Use Agent
Determines the most valuable realistic use and likely buyer type for the parcel.

### 20. Land Underwriting Agent
Comps land using:
- land comps
- house-value percentage fallback
- tax assessed value
and prices the deal against buyer demand.

### 21. Land Buyer Match Agent
Matches land deals to builders, land bankers, trailer owners, or mineral-rights buyers.

### 22. Municipality Planning Monitor Agent
Tracks planning agendas, zoning cases, permits, and infrastructure signals that may affect land value.

---

## Key difference between the two verticals

### House Wholesaling logic
Motivation + ARV + rehab + MAO + flipper/landlord dispo

### Vacant Land Wholesaling logic
Buyer criteria + lot/zoning/buildability + utilities + land comping + builder/land-banker dispo

---

## Best operating principle
Shared intake and oversight at the top, then separate specialized flows once asset type is known.
