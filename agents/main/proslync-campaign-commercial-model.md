# Campaign Commercial Model

This document expands Proslync from a simple `public / private / hybrid` visibility toggle into a practical commercial system that supports how brands, athletes, agents, and fans actually behave.

It is meant to be durable product truth for campaign planning, demo storytelling, and backend/API evolution.

## Why this exists

The current repo already has:

- campaign builder UI scaffolding
- brief and workroom concepts
- matching + compliance flows
- public/private/hybrid visibility logic

What it lacks is a richer business model around campaign intent, routing, response states, and how different roles participate in the same campaign.

The key shift is:

**a campaign is not just a visibility mode. It is a commercial program with a sourcing strategy, review policy, response workflow, and conversion path into briefs, workrooms, deals, and fan-facing moments.**

## Core model

Every campaign should carry four layers:

1. **Commercial archetype** — what the campaign is trying to do in the market
2. **Visibility mode** — who can see it
3. **Participation model** — who can respond and on whose behalf
4. **Execution path** — how it turns into approved work and paid outcomes

### Proposed canonical campaign object additions

- `campaignType`
- `commercialGoal`
- `visibilityMode`
- `responseMode`
- `inviteRoute`
- `reviewPolicy`
- `briefingMode`
- `fanActivationMode`
- `applicationWindow`
- `inviteExpiryAt`
- `maxRosterSize`
- `requiresAgentAck`
- `supportsCounterOffer`
- `supportsWaitlist`
- `selectionPolicy`
- `closeReason`

## Recommended campaign types

### 1. Public marketplace campaign
Use when a brand wants broad discovery from eligible athletes and agents.

- visible in ranked marketplace feed
- athlete can express interest directly
- agent can submit on athlete's behalf
- brand reviews inbound interest alongside AI-ranked recommendations
- best for awareness, seasonal pushes, and broad sourcing

### 2. Private invite campaign
Use when the brand already knows whom it wants.

- not shown in public marketplace
- only visible to invited athlete, invited agent, or both
- supports expiration, revoke, resend, and counter-interest
- best for premium launches, exclusives, and stealth partnerships

### 3. Hybrid shortlist campaign
Use when the brand wants both open discovery and direct pursuit of preferred candidates.

- visible to a constrained eligible audience
- direct invites go to a priority shortlist
- inbound applicants, AI recommendations, and invited talent appear in one board
- best for launches with urgency and strong-but-not-perfect hypotheses

### 4. Agent-routed campaign
Use when the brand wants to source through representation instead of speaking directly to athletes first.

- may be private or hybrid
- primary visibility is to agents representing matching athletes
- agent can acknowledge, decline, nominate client, or request clarification
- best for larger budgets and premium partnerships

### 5. Fan activation extension
Use when the campaign includes a public fan-facing moment after creator/athlete selection.

- sourcing remains brand ↔ athlete/agent
- downstream fan moment can be merch, voting, premium content, or event access
- should be modeled as an execution extension rather than a sourcing mode

## V1 taxonomy recommendation

Proslync V1 should explicitly support:

1. `public_marketplace`
2. `private_invite`
3. `hybrid_shortlist`
4. `agent_routed`

And treat `fan_activation_extension` as a downstream execution mode.

## Role perspectives

### Brand perspective
Needs to:
- choose commercial goal quickly
- choose sourcing strategy without legal ambiguity
- compare inbound vs invited candidates
- convert approved candidates into briefs, workrooms, and deals
- measure outcomes, not just impressions

### Athlete perspective
Needs to:
- understand why they can see a campaign
- know whether outreach is direct or agent-routed
- express interest without overcommitting
- move cleanly from invite to brief to paid work

### Agent perspective
Needs to:
- know whether the campaign is visible to agent only, athlete only, or both
- submit athletes without losing attribution
- negotiate in a structured way
- monitor multiple client opportunities from one queue

### Fan perspective
Fans should rarely participate in sourcing directly. They matter downstream when campaigns become:
- content drops
- merch activations
- event access
- premium unlocks
- community moments

## Lifecycle model

### Campaign statuses
Recommended primary statuses:

- `draft`
- `precheck`
- `ready_to_launch`
- `live`
- `reviewing_candidates`
- `briefing`
- `negotiating`
- `contracting`
- `executing`
- `completed`
- `paused`
- `cancelled`
- `archived`

### Candidate / invite / application statuses
A campaign needs participant-level state, not just campaign-level state:

- `recommended`
- `visible`
- `invited`
- `applied`
- `agent_nominated`
- `viewed`
- `interested`
- `declined`
- `expired`
- `shortlisted`
- `brief_sent`
- `brief_viewed`
- `brief_accepted`
- `brief_declined`
- `workroom_open`
- `deal_created`
- `closed_lost`
- `converted`

## Product rules

1. **Eligibility is separate from visibility.**
2. **Representation routing is separate from visibility.**
3. **Hybrid must preserve source attribution.**
4. **Fan access is downstream.**
5. **Negotiation should happen in a workroom, not a generic inbox.**

## Demo-worthy scenarios

### Demo 1: Hybrid launch campaign
A recovery brand launches a spring sports push, publishes to eligible athletes in several sports, and directly invites 8 priority athletes.

### Demo 2: Premium private invite campaign
A luxury apparel brand runs a stealth ambassador launch with 3 handpicked athletes and agent-first routing.

### Demo 3: Agent-routed roster submission
A brand opens a regional campaign and preferred agencies nominate clients instead of athletes self-applying.

### Demo 4: Campaign to fan activation
A brand campaign results in a limited merch drop and fan content unlock for the selected athlete roster.

## Practical V1 recommendation

### Must-have
- explicit campaign type selection in builder
- public / private / hybrid visibility routing
- invite state tracking
- candidate source attribution
- shortlist and brief handoff
- agent routing toggle

### Nice next
- campaign-specific workroom templates
- structured counter-offers
- fan activation extension mode
- SLA timers and response nudges

## Recommended implementation order

1. Add campaign type taxonomy to frontend builder and docs
2. Add candidate/invite pipeline states to backend design
3. Add source attribution to candidate board
4. Add invite lifecycle actions: resend, revoke, expire, accept, decline
5. Add segmented boards: invited / inbound / nominated / converted
6. Extend workroom and brief logic from selected candidate state
7. Add fan activation extension after sourcing is stable

## Product conclusion

Proslync should not model campaigns as just a posting with a visibility toggle.

It should model them as:
- a **commercial program**
- with a **sourcing strategy**
- a **routing policy**
- a **participant pipeline**
- and a **conversion path** into deals and fan outcomes
