# Master Architecture — Real Estate Agent System

## Intent
Build a coordinated AI agent system inside OpenClaw/Discord that can source, classify, underwrite, route, and manage real estate opportunities across multiple strategies.

## Shared objective
Acquire the highest-value real estate opportunities faster, with better consistency and lower operational slippage than a human-only team.

## Divisions

### 1. Wholesaling
Objective:
- Find distressed/off-market properties
- Qualify motivated sellers
- Lock up discount
- Assign to buyers

Core motions:
- list build
- distress detection
- outreach
- seller triage
- fast underwriting
- buyer disposition

### 2. Buy & Hold / Rental
Objective:
- Acquire durable cash-flowing rental properties
- Improve long-term portfolio quality and NOI

Core motions:
- market scan
- buy-box filtering
- rental underwriting
- rehab estimation
- portfolio fit
- post-close asset management

### 3. Multifamily / Commercial
Objective:
- Source and underwrite larger income-producing properties with value-add or yield optimization potential

Core motions:
- OM intake
- T12 / rent roll parsing
- commercial underwriting
- broker pipeline management
- diligence
- post-close optimization

### 4. Land / Development
Objective:
- Identify lots, land, assemblage, rezoning, and development opportunities where highest-and-best-use exceeds current use value

Core motions:
- parcel sourcing
- zoning check
- GIS/constraints analysis
- HBU evaluation
- development underwriting
- planning/municipal monitoring

## Shared command layer

### Opportunity Intake Agent
Normalizes inbound opportunities into common schema.

### Lead Enrichment Agent
Adds ownership, parcel, occupancy, distress, neighborhood, rent/comps, and context data.

### Strategy Router Agent
Routes opportunities to the correct division and workflow.

### Follow-Up Orchestrator Agent
Maintains next actions, cadences, reminders, and escalations.

### KPI Intelligence Agent
Tracks conversion, throughput, source quality, and performance by division.

## Shared object model
Every opportunity should be normalized into:
- lead_id
- source
- source_type
- property_address
- parcel_id
- asset_class
- sub_type
- market
- owner_name
- mailing_address
- occupancy_status
- distress_flags[]
- equity_band
- asking_price
- estimated_value
- rent_estimate
- strategy_candidates[]
- primary_strategy
- lead_score
- status
- next_action
- assigned_lane
- notes
- timestamps

## Routing rules

### Route to Wholesaling when
- off-market
- distress heavy
- motivation high
- disposition likely to investor buyer
- speed matters more than stabilization

### Route to Buy & Hold when
- property is financeable or stabilizable
- long-term cash flow is primary value driver
- rental demand and DSCR support hold thesis

### Route to Multifamily / Commercial when
- asset is 5+ units, mixed-use, office, retail, industrial, or other commercial class
- T12 / NOI / cap structure matters materially

### Route to Land / Development when
- parcel is vacant or underutilized
- teardown/rezoning/upzoning potential exists
- lot economics exceed current improvements value

## Human escalation triggers
Escalate to human/operator if:
- seller response is positive or urgent
- legal/compliance ambiguity appears
- underwriting confidence is low
- dollar value exceeds configured threshold
- title/liens/ownership conflict appears
- zoning/buildability ambiguity is material

## KPI framework
Track by division:
- new leads
- qualified leads
- hot leads
- offers drafted
- contracts won
- average margin / spread / yield
- time-to-first-touch
- time-to-underwrite
- time-to-decision
- source conversion rate
- dead lead reasons

## Build principle
The first version should be useful before it is fully autonomous.
Prioritize:
1. intake standardization
2. enrichment
3. routing
4. scoring
5. underwriting helpers
6. follow-up orchestration
7. reporting
