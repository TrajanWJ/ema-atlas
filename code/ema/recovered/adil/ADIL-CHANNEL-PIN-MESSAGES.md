# Adil Channel Pin Messages

Use these as the first pinned messages when the Discord surface is provisioned.

---

## Category: ADIL — PERSONAL

### #welcome
**Welcome**

@AdilHilaly welcome.

This is your recovered and modernized workspace for the real-estate AI system.

What this space is:
- a working surface for collaboration
- a clean split between personal coordination and pipeline execution
- a mirror surface, not the source of truth

What actually owns durable state:
- **EMA** owns project/workflow/execution truth
- **Hermes** owns agent execution, tools, sessions, and delivery
- **Discord** is the human-facing work surface

Start here:
1. Read the pinned message in `#ai-hq`
2. Use `#queue` for concrete tasks only
3. Put general non-pipeline discussion in `#personal-hub`
4. Put major updates and blockers in `#handoff-log`

Core rule:
- if a message is actionable, route it into the proper workflow lane
- if it is not actionable, don’t let it clog execution channels

---

### #personal-hub
**Personal Hub**

Use this for:
- personal coordination
- loose discussion
- onboarding context
- non-pipeline questions
- broad planning before it becomes real work

Do **not** use this for:
- active deal flow
- underwriting
- seller pipeline work
- queue management

If something becomes actionable, move it to:
- `#queue` for work items
- `#ai-hq` for system-level decisions
- the appropriate house/land execution lane for domain work

---

### #handoff-log
**Handoff Log**

This channel is for concise, high-signal updates only.

Good entries:
- blocker discovered
- decision made
- workflow changed
- lane is now active/inactive
- important next step
- what needs operator attention

Format:
- **STATUS:** active / blocked / done
- **OBJECT:** what changed
- **WHY IT MATTERS:** why this matters
- **NEXT ACTION:** what should happen next
- **OWNER:** who owns it

Keep it short. This should read like a clean operator log, not a chat stream.

---

## Category: ADIL — WHOLESALING AI

### #ai-hq
**AI HQ**

This is the command layer for the whole system.

Use this for:
- priorities
- routing decisions
- architecture changes
- workflow design
- cross-lane coordination
- system-level questions

This is **not** where detailed house/land execution should live.

System shape:
- Shared backbone:
  - opportunity intake
  - lead enrichment
  - strategy routing
  - follow-up orchestration
  - KPI intelligence
- Execution splits after routing:
  - house wholesaling flow
  - land wholesaling flow

Decision rule:
- if the issue is system-wide, keep it here
- if the asset type is known, push it to the proper execution lane

---

### #opportunity-intake
**Opportunity Intake**

Purpose:
- normalize inbound leads into a common schema

Inputs:
- PropStream exports
- spreadsheets
- public-record leads
- copied deal blurbs
- manual notes
- inbound seller/opportunity text

Expected output for every intake object:
- source
- property / parcel identifier
- asset type guess
- owner / contact info if known
- raw notes
- status
- next action

Rule:
- raw inbound information lands here first
- don’t underwrite here
- don’t debate routing here
- intake first, then hand off

---

### #lead-enrichment
**Lead Enrichment**

Purpose:
- add owner, mailing, parcel, occupancy, distress, equity, and base context to intake objects

Use this for:
- enrichment outputs
- missing-field collection
- confidence notes
- data-quality issues

Good output should answer:
- who owns it?
- what do we know about the parcel/property?
- what distress/context exists?
- what is still missing?

Rule:
- enrichment improves the object
- it does not decide the final strategy
- send enriched leads to `#strategy-router`

---

### #strategy-router
**Strategy Router**

Purpose:
- decide whether a lead belongs in:
  - house wholesaling
  - land wholesaling
  - another strategy
  - nurture
  - dead

Good routing output format:
- **ROUTE:** house / land / nurture / dead / other
- **WHY:** one-line reason
- **NEXT ACTION:** exact next handoff
- **CONFIDENCE:** high / medium / low

Core split rule:
- houses and land share the front-end command layer
- they should not share downstream workflow once asset type is known

---

### #follow-up-orchestrator
**Follow-Up Orchestrator**

Purpose:
- make sure no real opportunity dies from neglect

Use this for:
- next touches
- stale lead revival
- reminder cadence
- escalation timing
- “what happens next?” logic

A follow-up entry should always include:
- current status
- last touch
- next touch
- reason for next touch
- escalation condition

Rule:
- no orphaned active leads
- no vague “follow up later” notes
- every live lead needs a concrete next action

---

### #kpi-intelligence
**KPI Intelligence**

Purpose:
- track list quality, response rates, underwriting pass rate, bottlenecks, and source conversion

Use this for:
- daily summaries
- weekly KPI snapshots
- source-quality comparisons
- pipeline bottleneck detection
- throughput and conversion reporting

Questions this lane should answer:
- what sources are producing?
- where are leads dying?
- what part of the flow is slow?
- where is conversion improving or degrading?

---

### #queue
**Queue**

This is one of the highest-value surfaces in the whole system.

Every queue item must be:
- concrete
- assignable
- scoped
- outcome-oriented
- visible

Bad queue item:
- improve workflow

Good queue item:
- define house seller triage schema with hot / warm / nurture / dead outputs and next-step routing

If a task cannot be clearly assigned and completed, it does not belong here yet.

---

### #done-feed
**Done Feed**

Purpose:
- show completed work and closed loops

Use this for:
- finished artifacts
- completed definitions
- closed blockers
- completed workflow steps
- major system updates that are actually done

Rule:
- only post things that are truly complete enough to count
- this is a signal feed, not a work-in-progress channel

---

## Category: ADIL — WHOLESALING HOUSES

### #house-list-builder
**House List Builder**

Purpose:
- build house-focused off-market lead lists

Typical list types:
- vacant absentee
- high equity
- tired landlord
- tax delinquent
- pre-foreclosure

Expected output:
- market / segment
- list logic used
- count
- confidence notes
- handoff target

---

### #house-distress-monitoring
**House Distress Monitoring**

Purpose:
- surface house-related distress signals quickly

Watch for:
- foreclosure
- probate
- tax delinquency
- vacancy
- code violations
- landlord distress

Rule:
- urgency belongs here
- raw list-building does not

---

### #house-seller-motivation
**House Seller Motivation**

Purpose:
- score seller urgency and likely discount potential

Questions to answer:
- why would this seller move?
- how urgent is the pain?
- how realistic is a discounted outcome?
- is this worth near-term outreach?

Expected output:
- hot / warm / nurture / dead tendency
- reasoning
- next action

---

### #house-outreach
**House Outreach**

Purpose:
- manage outbound contact sequencing for house leads

Use this for:
- outreach variants
- sequence stage tracking
- response timing
- message testing

Rule:
- keep scripts short and motivation-oriented
- escalate real replies fast
- weak/no-response cohorts go back toward follow-up logic

---

### #seller-response-triage
**Seller Response Triage**

Purpose:
- interpret seller replies and route the lead to the next best action

Good output:
- **CLASS:** hot / warm / nurture / dead
- **WHY:** what the reply means
- **NEXT ACTION:** exact next move
- **OWNER:** who owns the handoff

Rule:
- don’t let ambiguous seller replies sit idle

---

### #house-fast-underwriting
**House Fast Underwriting**

Purpose:
- determine quickly whether a house opportunity is worth pursuing

Core questions:
- why is the seller selling?
- what is the property condition?
- what does rehab likely cost?
- is there enough spread after ARV and repairs?
- can the seller realistically get to MAO?

Expected output:
- ARV estimate
- rehab severity band
- MAO estimate
- spread / viability call
- pursue / pause / renegotiate / kill

---

### #house-buyer-match-dispo
**House Buyer Match / Dispo**

Purpose:
- match viable house deals to flippers, landlords, and cash buyers

Use this for:
- buyer-fit validation
- disposition risk notes
- exit confidence
- deal packet readiness

Rule:
- if no strong buyer fit exists, call that out clearly
- if the deal fits a hold thesis better than a wholesale exit, say so

---

## Category: ADIL — WHOLESALING LAND

### #land-buyer-criteria
**Land Buyer Criteria**

Purpose:
- identify what land buyers actually want before sourcing aggressively

Buyer types may include:
- builders / developers
- land bankers
- trailer / affordable-housing buyers
- mineral-rights buyers

Rule:
- land workflow is more buyer-criteria-first than house workflow

---

### #land-sourcing
**Land Sourcing**

Purpose:
- pull parcels that match buyer criteria, market constraints, zoning potential, and lot-size logic

Expected output:
- parcel candidate set
- target market
- why this parcel type is interesting
- next due-diligence handoff

---

### #zoning-entitlement
**Zoning / Entitlement**

Purpose:
- evaluate zoning, legal use, split potential, entitlement posture, and development viability

Questions to answer:
- what is legally allowed?
- what is realistically approvable?
- what creates or destroys value here?

---

### #gis-parcel-constraints
**GIS / Parcel Constraints**

Purpose:
- evaluate practical parcel blockers and physical constraints

Check for:
- access
- water
- sewer / septic
- power
- floodplain
- wetlands
- physical limits

Rule:
- buildability matters more than generic house-style logic here

---

### #land-seller-qualification
**Land Seller Qualification**

Purpose:
- ask the land-specific seller questions that determine real viability

Must-know questions:
- lot size
- zoning
- why selling
- water
- sewage / septic
- power
- buildability

No land lead should move forward without clarity on these.

---

### #highest-best-use
**Highest Best Use**

Purpose:
- compare the most realistic value paths for the parcel

Use this for:
- hold vs split vs rezone vs develop logic
- use-case comparison
- likely buyer-type selection

Rule:
- this lane decides what kind of value this land actually has

---

### #land-underwriting
**Land Underwriting**

Purpose:
- comp and price land opportunities conservatively

Use:
- land comps
- house-value percentage fallback where appropriate
- tax-assessed value as weak support only
- buyer demand reality

Expected output:
- pricing view
- viability view
- risk view
- recommended next action

---

### #land-buyer-match
**Land Buyer Match**

Purpose:
- validate real end-buyer demand for the parcel

Use this for:
- builder match
- land banker fit
- specialized buyer fit
- dispo confidence

Rule:
- if there is no real buyer path, say it early

---

### #municipality-planning-monitor
**Municipality Planning Monitor**

Purpose:
- track planning agendas, zoning cases, permits, and nearby infrastructure/development signals that may move land value

This is a later-stage lane.
Only keep it active if it produces real signal.

---

## Category: ADIL — LEGACY / IMPORTED

### #legacy-notes
**Legacy Notes**

This channel is reference only.

Use it for:
- imported notes
- old fragments worth preserving
- context that may still help decision-making

Do not treat it as command or source of truth.

---

### #legacy-architecture
**Legacy Architecture**

This channel holds old architecture references from the OpenClaw-era system.

Rule:
- preserve useful ideas
- migrate only the high-signal parts
- do not let legacy diagrams or lane layouts override the live structure

---

### #legacy-archive
**Legacy Archive**

This is cold storage.

If something is low-signal, stale, duplicated, or no longer part of the live operating model, it belongs here instead of cluttering live channels.

Legacy is reference, not command.
