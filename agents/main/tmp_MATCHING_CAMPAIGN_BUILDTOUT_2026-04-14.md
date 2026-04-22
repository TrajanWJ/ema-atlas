# Proslync Matching + Campaign Buildout — Product Model (2026-04-14)

## Why this exists
Proslync already has the right raw primitives for a strong NIL marketplace/workflow product:
- campaigns
- visibility rules
- campaign targets
- invites
- matching runs + candidates
- compliance decisions
- deals / messaging / escrow follow-through

What is still thin is the **product model** that turns those primitives into something demo-legible and implementation-ready. Right now the system can show campaigns and compute match scores, but it does not yet fully express:
- public campaigns vs private invite campaigns as first-class operating modes
- recommendation buckets and why a candidate landed there
- invite lifecycle and acceptance/response states
- sourcing pipeline stages between “matched” and “deal executed”
- explainability that sales/demo users can narrate on-screen
- a clean choreography for brand, athlete, and agent demo flows

This note defines that product model in a way that fits the current repo and recommends the implementation order.

---

## Product framing
Think of a campaign as two things at once:
1. a **commercial package** (objective, budget, timing, deliverables, compliance posture)
2. a **sourcing program** (who can see it, who is recommended, who is invited, and how it moves into a deal)

That suggests Proslync should model every campaign across four planes:
- **Campaign profile** — what the brand is offering
- **Access model** — who can discover or receive it
- **Matching model** — how candidates are scored, bucketed, and explained
- **Execution pipeline** — how interest becomes invite, negotiation, agreement, and fulfillment

---

## Recommended campaign access modes
The existing `visibility` enum is useful but too UI-thin by itself. Keep it for backend enforcement, but drive the product using a higher-level **campaign mode**.

### 1) Public Marketplace Campaign
**Visibility:** `public`

Use when the brand wants broad discovery from eligible athletes and agents.

**Behavior**
- campaign appears in public discovery feeds
- platform still ranks candidates internally for the brand
- athletes can express interest / apply
- brand can promote candidates from inbound interest into shortlist/invite/offer

**Best for**
- seasonal activations
- awareness campaigns
- “show me who the market has” demos

**Demo value**
- easy “discoverability” story
- shows market supply and recommendations side by side

### 2) Private Invite Campaign
**Visibility:** `private` or `invite_only`

Use when the brand wants stealth sourcing or already has a target roster in mind.

**Behavior**
- campaign hidden from public discovery
- only explicitly invited athletes/agents can access details
- matching engine still generates recommendations, but they are internal-only
- invite workspace becomes the main control surface

**Best for**
- premium launches
- renewals / exclusives
- confidential brand tests

**Demo value**
- strong “white-glove / stealth” narrative
- good for compliance + agent-routed storytelling

### 3) Hybrid Campaign
**Visibility:** `hybrid`

Use when the brand wants both inbound discovery and direct outreach.

**Behavior**
- constrained public visibility with optional rules
- top candidates get proactive invites
- inbound applicants can still enter the queue
- comparison view can show “recommended by system” vs “raised hand”

**Best for**
- time-sensitive launches
- campaigns with minimum fill counts
- marketplace + concierge story

**Demo value**
- strongest overall default for live demos
- lets Proslync show ranking, explainability, outreach, and conversion in one sequence

### 4) Agent-Routed Private Campaign
**Visibility:** `private`

Use when represented talent or agency relationships matter.

**Behavior**
- first invite can route to agent instead of directly to athlete
- status pipeline distinguishes athlete-pending from agent-pending
- negotiation/workroom stays representation-aware

**Best for**
- premium / represented athletes
- larger budget campaigns
- enterprise / rights-managed flows

**Demo value**
- makes Proslync feel operator-grade, not just marketplace-grade

---

## Recommended campaign lifecycle
The current lifecycle (`draft`, `scheduled`, `active`, `paused`, `completed`, `archived`) is serviceable for storage, but the **operator-facing lifecycle** should be richer.

### Operator lifecycle states
- `draft` — basic campaign profile exists but is incomplete
- `targeting_ready` — audience, target rules, and compliance posture are configured
- `matching_ready` — enough data exists to generate recommendations
- `sourcing_live` — campaign is discoverable and/or invites are being sent
- `shortlisting` — brand is curating candidate set
- `negotiating` — one or more candidates are in offer/workroom flow
- `contracting` — deal terms are agreed and signature/escrow are in progress
- `live` — campaign is actively executing with at least one accepted deal
- `completed` — execution finished
- `archived` — cold storage / historical reporting only

### Storage guidance
Do **not** replace the existing DB enum immediately.
Instead:
- keep the current persistence enum as the platform-wide canonical campaign status
- add an operator-facing derived state or `programStatus` later when needed
- map UI surfaces to the richer lifecycle using campaign + invite + deal aggregate data

That preserves migration safety while improving product semantics.

---

## Recommendation model
The current score is a good base, but demos need more than a number. A recommendation should answer:
- how strong is this candidate?
- what route should we take?
- what blocks exist?
- what exactly drove the score?

### Recommended recommendation buckets
For each match candidate, derive:
- `priority_invite` — brand should reach out now
- `strong_fit` — highly recommended, could invite or shortlist
- `discovery_fit` — relevant for public feed / application intake
- `watchlist` — plausible but weaker fit
- `manual_review` — blocked by compliance or ambiguity

### Routing guidance by bucket
- `priority_invite` → private invite or agent-routed
- `strong_fit` → shortlist, compare, optional invite
- `discovery_fit` → public campaign feed / inbound application
- `watchlist` → hold unless roster is thin
- `manual_review` → compliance review before exposure

### Explainability dimensions
At minimum, every recommendation should expose:
- audience fit
- engagement quality
- sport/category affinity
- geo / school / roster fit
- compliance posture
- budget/value fit
- confidence / freshness of underlying signals

This is important: **separate score factors from narrative reasons**.
A good system should provide both:
- machine-ish sub-scores for traceability
- human-friendly plain-English explanations for demos and operator confidence

Example:
- Sub-score: `engagement_quality = 0.82`
- Narrative: `Engagement rate is 1.8x above peers in this follower band.`

---

## Invite and sourcing pipeline model
Today invites exist, but the product needs a first-class state model.

### Invite lifecycle
Recommended invite states:
- `draft`
- `queued`
- `sent`
- `viewed`
- `interested`
- `declined`
- `expired`
- `withdrawn`
- `converted_to_deal`

### Candidate pipeline stages
Separately from invite state, every campaign candidate should be placeable in a sourcing stage:
- `recommended`
- `shortlisted`
- `invited`
- `responded`
- `negotiating`
- `deal_created`
- `contracted`
- `live`
- `completed`
- `lost`

This distinction matters:
- **invite state** = what happened to the invite
- **pipeline stage** = where the opportunity sits operationally

That separation will make the campaign detail screen and admin reporting much cleaner.

---

## Public vs private campaign behavior rules

### Public campaigns
- visible in athlete discovery feed
- recommendation engine still ranks internal candidates for brand
- athlete can self-identify interest
- brand can elevate inbound candidates into shortlist/invite/workroom
- low-confidence or restricted candidates should not appear publicly if compliance posture blocks them

### Private invite campaigns
- absent from public feeds
- only invited athlete/agent can see campaign details
- brand sees full ranked list internally
- system can recommend candidates without exposing campaign externally
- strongest path for “exclusive” demos

### Hybrid campaigns
- public feed exposes campaign at a partial detail level
- invitees get richer internal context and priority workflow
- candidate compare view can show:
  - inbound applicants
  - system recommendations
  - invited roster
- this is the best mode for showing Proslync as both marketplace and operator console

---

## Demo choreography opportunities
Proslync will demo best when campaigns are intentionally staged.

### Demo story A — public sourcing
1. Brand creates a public campaign
2. System generates recommended candidates immediately
3. Athletes discover the campaign in the marketplace
4. Brand sees inbound interest + ranked recommendations together
5. Brand shortlists one athlete and opens a workroom

**What this proves**
- discovery
- recommendations
- marketplace activity
- conversion into real workflow

### Demo story B — private concierge campaign
1. Brand creates a private invite campaign
2. Matching engine generates a “priority invite” roster
3. Brand opens candidate compare and rationale view
4. Brand sends direct invites to 2–3 athletes or agents
5. One invite converts into a deal / escrow path

**What this proves**
- premium workflow
- explainability
- private/stealth handling
- negotiation readiness

### Demo story C — hybrid campaign with explainability
1. Brand creates hybrid campaign
2. System shows three groups:
   - top-ranked direct invites
   - strong-fit open-market candidates
   - manual review candidates
3. Brand opens match explanation screen
4. Brand promotes one candidate to invite and another to watchlist
5. Athlete receives/accepts invite and enters workroom

**What this proves**
- operator intelligence
- human-in-the-loop control
- transparency instead of black-box AI

---

## Recommended UI surfaces

### 1) Campaign detail should become an operator board
Add sections for:
- campaign mode / visibility posture
- sourcing stage
- recommendation buckets
- invite pipeline counts
- explainability highlights
- “what should I do next?” prompts

### 2) Candidate compare should become decision-oriented
Each candidate card should show:
- recommendation bucket
- score
- top 2–4 explainability reasons
- compliance posture
- recommended next action

### 3) Match explanation should shift from static demo copy to structured reasons
Show:
- overall recommendation bucket
- sub-score bars
- narrative reasons
- compliance notes
- recommended action (`Invite now`, `Shortlist`, `Review manually`)

### 4) Invite workspace should show lifecycle state explicitly
It should answer:
- sent to whom
- via athlete or agent
- who has viewed/responded
- what is awaiting action

---

## Recommended backend shape evolution
The backend already has most tables needed. The most leverage will come from adding **small, additive fields**, not a giant rewrite.

### Existing strengths
- `campaigns`
- `campaign_visibility_rules`
- `campaign_targets`
- `campaign_invites`
- `match_runs`
- `match_candidates`
- `deals`
- compliance decisions

### Highest-value additive fields later
On `campaigns`:
- `mode` (`public_marketplace`, `private_invite`, `hybrid_shortlist`, `agent_routed`)
- `objective` / `objective_type`
- `sourcing_status` or `program_status`
- `discovery_opens_at` / `invite_opens_at`
- `application_window_ends_at`
- `requires_agent_routing`

On `campaign_invites`:
- normalize `state` into a stronger enum
- `recipient_type` (`athlete`, `agent`)
- `message_template_id` or invite copy snapshot
- `decline_reason`
- `viewed_at`

On `match_candidates`:
- `recommendation_bucket`
- `recommended_action`
- `explanation_summary`
- `pipeline_stage`
- `confidence`
- `compliance_status_snapshot`

### Important principle
Prefer **snapshotting** some explanation/compliance metadata onto `match_candidates` at run time.
That makes demos, audits, and “why did we recommend this at the time?” much easier.

---

## Recommended implementation order

### Phase 1 — make the product legible in existing screens
1. Add shared product-model types for campaign mode, recommendation buckets, invite states, and sourcing stages.
2. Update campaign detail / compare / explain screens to consume the new derived vocabulary.
3. Derive bucket + recommended action from existing score/compliance data.

**Why first:** high demo value, low migration risk.

### Phase 2 — strengthen backend contract additively
1. Add optional API fields for recommendation bucket, explanation summary, confidence, and pipeline stage.
2. Normalize invite state semantics.
3. Add campaign mode as a contract field without deleting existing visibility.

**Why second:** improves persistence and removes UI-only interpretation drift.

### Phase 3 — unify public/private/hybrid sourcing flows
1. Connect public discovery feed to real campaign visibility.
2. Connect private invites to invite workspace + thread creation.
3. Show inbound applicants vs direct invites vs system recommendations in one campaign board.

**Why third:** this is where the marketplace becomes coherent, but it depends on the vocabulary above.

### Phase 4 — execution closure and measurement
1. Trace accepted invite -> deal -> escrow -> completion back to campaign analytics.
2. Surface conversion metrics by recommendation bucket.
3. Add “why this converted” learning loops later.

**Why fourth:** best done after the operational pipeline is real.

---

## Opinionated defaults for demos right now
If Proslync needs a strong demo setup quickly:
- default to **hybrid** for most canned campaigns
- ensure top 3 candidates render as:
  - 1 `priority_invite`
  - 1 `strong_fit`
  - 1 `manual_review` or `watchlist`
- make the explanation screen narrate:
  - why recommended
  - what to do next
  - what, if anything, blocks execution
- let the campaign detail screen show a compact funnel:
  - recommended
  - shortlisted
  - invited
  - negotiating
  - funded/live

That gives the demo a beginning, middle, and end instead of “here is a list of athletes and a score.”

---

## Recommended next code slices
1. Replace mock-only campaign detail assumptions with derived campaign operator view data.
2. Add product-model types as shared frontend domain primitives.
3. Extend backend/API match candidate shapes with optional recommendation/explanation fields.
4. Normalize invite states into a finite vocabulary instead of free-form `state` strings.
5. Build one real hybrid demo campaign end-to-end and tune screens around that path.

---

## Bottom line
Proslync does **not** need a brand-new matching engine first.
It needs a better **product wrapper around the existing engine**:
- clear campaign modes
- recommendation buckets
- explicit invite/pipeline states
- explainability that supports decisions
- demo choreography that shows campaigns becoming deals

That is the shortest path from “interesting prototype” to “credible operator product.”
