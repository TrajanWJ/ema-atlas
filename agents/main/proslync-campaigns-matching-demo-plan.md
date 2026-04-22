# Plan: Proslync Campaigns, Matching, and Demo Backend

**Generated**: 2026-04-14
**Estimated Complexity**: High

## Overview
Build a mature, intuitive campaign system for Proslync that works for brands, athletes, and agents, while also being strong enough for a choreographed demo. The approach is to define a product-grade campaign model first, then layer in matching, explainability, invite flows, recommendations, and backend mock/demo orchestration.

The plan prioritizes:
- a clear campaign taxonomy
- intuitive lifecycle/state management
- role-aware UX concepts for brands, athletes, and agents
- explainable matching and fit scoring
- demo-safe backend behaviors that feel real even before full production logic exists

This plan is designed so each sprint produces something demoable, not just documentation.

## Prerequisites
- Agreement on primary personas: brand marketer, athlete, agent/manager, internal ops/admin
- Agreement on MVP platform surface for demo: web app, mobile mock, or mixed prototype
- A place to store product artifacts and demo data models
- Decision on whether backend demo will be:
  - fully mocked JSON/API
  - thin real backend with seeded data
  - hybrid (recommended)

## Product Principles
- Campaign creation must feel simple at the top level and powerful under the hood.
- Matching must be explainable, not black-box magic.
- Invite/private flows must feel premium and deliberate.
- Agents must be able to operate across rosters without confusion.
- Demo flows must highlight commercial value in under 3 minutes.

## Core Domain Model

### Primary Entities
- Campaign
- CampaignBrief
- CampaignAudienceRequirements
- CampaignDeliverable
- CampaignBudget
- CampaignInvite
- CampaignApplication
- MatchScore
- RecommendationReason
- AthleteProfile
- AthleteMetricsSnapshot
- AgentRoster
- BrandAccount
- BrandTeamMember
- ConversationThread
- Offer / Deal Memo
- Shortlist
- Activation / Fulfillment Record

### Roles
- Brand Admin
- Brand Marketer / Campaign Manager
- Athlete
- Agent / Manager
- Internal Ops / Concierge

## Campaign Taxonomy

### Campaign Visibility Modes
1. **Public Marketplace Campaign**
   - Visible to all eligible athletes/agents
   - Supports discovery and inbound applications
   - Best for scale and marketplace liquidity

2. **Private Invite-Only Campaign**
   - Only visible to invited athletes/agents
   - Best for premium launches and selective casting
   - Supports prestige positioning and confidentiality

3. **Hybrid Campaign**
   - Starts private, expands to public if underfilled
   - Best for balancing exclusivity and fill rate

4. **Roster-Scoped Campaign**
   - Visible only to one or more selected agencies/rosters
   - Best for agent-driven workflows

### Campaign Objective Types
1. Brand Awareness
2. Product Launch
3. Content Creation
4. Affiliate / Conversion
5. Event Appearance
6. Social Growth
7. Community Activation
8. NIL / College Athlete Activation
9. Local Market Promotion
10. Long-Term Ambassador Program
11. UGC Licensing / Rights Acquisition
12. Performance / Revenue Share Campaign

### Deliverable Types
- Instagram post
- Instagram story set
- TikTok post
- YouTube short
- YouTube integration
- X/Twitter post
- Live appearance
- Meet-and-greet
- Photo shoot
- White-labeled content package
- Referral / affiliate link push
- Email/newsletter mention
- Multi-platform bundle

### Compensation Models
- Flat fee
- Flat fee + bonuses
- Performance-based only
- Product/gifting only
- Appearance fee
- Revenue share
- Tiered compensation by reach/performance
- Negotiable / offer-based

## Lifecycle / Status Model

### Campaign Lifecycle
1. Draft
2. Internal Review
3. Ready to Launch
4. Live - Public
5. Live - Private Invite
6. Live - Hybrid
7. Paused
8. Under Review / Compliance Hold
9. Filled / Shortlist Locked
10. Contracting / Offer Stage
11. Active / In Fulfillment
12. Completed
13. Archived
14. Cancelled

### Invite Lifecycle
1. Queued
2. Sent
3. Delivered
4. Viewed
5. Saved
6. Accepted Interest
7. Declined
8. Expired
9. Withdrawn

### Application Lifecycle
1. Started
2. Submitted
3. Under Review
4. Shortlisted
5. Rejected
6. Offer Sent
7. Offer Accepted
8. Offer Declined
9. Contracted
10. Fulfillment Started
11. Fulfillment Complete

## Matching Model

### Match Dimensions
The score should be multi-factor and decomposable.

1. **Audience Fit**
   - demographic overlap
   - geography
   - age range
   - gender skew when relevant
   - audience interests

2. **Sport / Identity Fit**
   - sport category
   - athlete tier
   - lifestyle alignment
   - creator style
   - brand safety / tone alignment

3. **Performance Fit**
   - engagement rate
   - average views/impressions
   - conversion history
   - content consistency
   - platform strength by deliverable type

4. **Campaign Constraint Fit**
   - budget band
   - availability / timing
   - required deliverables
   - exclusivity conflicts
   - location requirements

5. **Commercial Fit**
   - expected ROI proxy
   - previous brand/category success
   - responsiveness / close rate
   - reliability / completion rate

6. **Relationship Fit**
   - prior collaboration with brand
   - agent relationship history
   - warm intro path
   - prior shortlist/interactions

### Explainability Output
Every recommendation should include:
- overall fit score
- top 3 reasons they match
- risk flags
- confidence level
- suggested outreach path
- estimated compensation band
- why they are ranked above/below similar candidates

Example:
- **92 Fit Score**
- Strong Gen Z fitness audience overlap
- High TikTok performance on product-led short-form content
- Based in target launch region
- Risk: limited Instagram strength for cross-post bundle
- Recommendation: invite privately with TikTok-first offer

### Recommendation Types
- Best overall matches
- Best value matches
- Best premium / prestige matches
- Best conversion-oriented matches
- Best local/event matches
- Best roster-based matches
- Near misses worth manual review

## Demo-Ready Matching Behaviors
For demo purposes, build behavior that appears intelligent and commercially useful:

1. **Auto-ranked candidate list**
   - sorted by fit score with visible reason chips

2. **Why this match? drawer**
   - expandable explanation with sub-scores

3. **Invite smarter suggestions**
   - "send private invite" suggestions for premium candidates
   - "open publicly" suggestion when fill rate risk is high

4. **Coverage gap insight**
   - system says campaign is weak in geography, audience age, or platform mix

5. **Budget pressure insight**
   - system warns if shortlist exceeds likely budget band

6. **Agent roll-up view**
   - show which agents can fulfill multiple candidate slots fastest

7. **Alternative recommendations**
   - if a top athlete declines, suggest 3 closest replacements instantly

8. **Confidence and risk flags**
   - low responsiveness
   - audience mismatch
   - exclusivity conflict
   - underpriced / overpriced relative to market estimate

## Role-Specific Product Design

### Brand Perspective
Needs:
- create campaign quickly
- understand who to target
- see shortlist quality
- trust matching
- manage invites and offers

Key surfaces:
- campaign builder
- recommended matches dashboard
- shortlist board
- invite tracker
- fulfillment tracker

### Athlete Perspective
Needs:
- understand opportunity fast
- know why they were invited/matched
- see pay, deliverables, deadlines, and fit
- respond easily

Key surfaces:
- campaign inbox
- opportunity detail page
- quick accept / interested / decline flows
- profile fit improvement prompts

### Agent Perspective
Needs:
- manage roster at scale
- route invites to the right athlete
- compare opportunities across roster
- negotiate efficiently

Key surfaces:
- roster campaign inbox
- candidate recommendations by roster member
- one-to-many shortlist tools
- status dashboard by athlete

## Core User Flows

### Flow 1: Brand Creates Public Campaign
1. Brand selects campaign objective
2. System recommends campaign template
3. Brand fills budget, timing, deliverables, audience target
4. System suggests target athlete ranges and estimated fill strategy
5. Campaign launches publicly
6. Matching engine recommends top candidates proactively
7. Athletes/agents apply; brand shortlists and offers

### Flow 2: Brand Creates Private Invite Campaign
1. Brand selects private invite mode
2. System recommends candidate list
3. Brand reviews fit explanations
4. Brand sends invites to athletes or agents
5. Invitees respond
6. Brand converts interested invitees into offers

### Flow 3: Agent Manages Roster Responses
1. Agent receives campaign invites at roster level
2. System maps best-fit roster members
3. Agent forwards or selects athlete(s)
4. Agent negotiates and confirms availability
5. Status syncs back to campaign pipeline

### Flow 4: Hybrid Recovery Flow
1. Private campaign underfills
2. System recommends widening criteria or going public
3. Brand approves hybrid release
4. Additional candidates are surfaced automatically

## Sprint 1: Product System Definition
**Goal**: Lock down the conceptual model so campaigns and matching feel coherent.
**Demo/Validation**:
- Review campaign matrix and lifecycle with stakeholders
- Validate that all major personas can describe their workflow simply

### Task 1.1: Create campaign taxonomy matrix
- **Location**: `docs/proslync/campaign-taxonomy.md`
- **Description**: Define campaign visibility, objectives, deliverables, compensation, and selection modes in a single matrix.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Public, private, hybrid, and roster-scoped campaigns are defined
  - Objective and deliverable types are mapped clearly
  - Compensation models are documented
- **Validation**:
  - Stakeholder review passes without unresolved ambiguity

### Task 1.2: Define lifecycle/status states
- **Location**: `docs/proslync/campaign-lifecycle.md`
- **Description**: Specify campaign, invite, application, offer, and fulfillment states with allowed transitions.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Every state has entry/exit rules
  - No major workflow gap exists for brand, athlete, or agent
- **Validation**:
  - Convert into transition table and sanity-check edge cases

### Task 1.3: Define role-specific workflow maps
- **Location**: `docs/proslync/persona-workflows.md`
- **Description**: Write brand, athlete, and agent journey maps.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Each persona has at least 3 high-value workflows
  - Handoffs between personas are explicit
- **Validation**:
  - Walk through end-to-end scenarios aloud

## Sprint 2: Matching and Explainability System
**Goal**: Make recommendations feel intelligent, useful, and defensible.
**Demo/Validation**:
- Produce ranked matches with visible reasons and flags
- Review whether non-technical stakeholders can explain why candidate A outranks candidate B

### Task 2.1: Define scoring framework
- **Location**: `docs/proslync/matching-model.md`
- **Description**: Create weighted scoring dimensions and sub-score breakdowns.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Score dimensions are defined
  - Weighting can vary by campaign objective
  - Risk flags and confidence are included
- **Validation**:
  - Run sample candidates through scorecard manually

### Task 2.2: Define recommendation reason schema
- **Location**: `docs/proslync/recommendation-explainability.md`
- **Description**: Create a reason-code system for why candidates are recommended or deprioritized.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Top reasons, risks, and outreach guidance can be rendered from structured data
- **Validation**:
  - Generate example explanation cards for 5 sample athletes

### Task 2.3: Define shortlist and replacement logic
- **Location**: `docs/proslync/shortlist-logic.md`
- **Description**: Specify how shortlist slots, fallback candidates, and replacement suggestions work.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Replacement logic exists when candidates decline
  - Shortlist diversity and budget checks are supported
- **Validation**:
  - Test with mock decline/accept scenarios

## Sprint 3: Backend Mock / Demo System
**Goal**: Build the illusion of a real, coherent backend with enough truth to support demos.
**Demo/Validation**:
- Trigger a full campaign creation -> recommendation -> invite -> shortlist flow in a demo environment

### Task 3.1: Define demo API contract
- **Location**: `docs/proslync/demo-api-contract.md`
- **Description**: Define entities, endpoints, payloads, and mock responses needed for the demo.
- **Dependencies**: Sprints 1-2
- **Acceptance Criteria**:
  - Campaigns, profiles, matches, invites, and offers all have payload definitions
  - Frontend team can build against the contract
- **Validation**:
  - Review endpoint list with mock consumer needs

### Task 3.2: Create seeded demo datasets
- **Location**: `data/proslync/demo/`
- **Description**: Seed realistic brands, athletes, agents, campaign templates, and scores.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - At least 3 brands, 20 athletes, 5 agents, and 6 campaigns exist
  - Data supports public, private, and hybrid stories
- **Validation**:
  - Run demo flows without missing data fields

### Task 3.3: Implement orchestration rules for fake-real behavior
- **Location**: `docs/proslync/demo-orchestration.md`
- **Description**: Script system behaviors like rank changes, responses, and invite outcomes so the demo feels alive.
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - At least 3 choreographed demo narratives exist
  - State changes can be triggered reliably
- **Validation**:
  - Rehearse demo twice end-to-end

## Sprint 4: UX/Surface Design for Intuition
**Goal**: Make the campaign system intuitive for agents and athletes, not just complete for brands.
**Demo/Validation**:
- Show the same campaign from all 3 perspectives and confirm each view feels native to the role

### Task 4.1: Design campaign builder information architecture
- **Location**: `docs/proslync/ui-campaign-builder.md`
- **Description**: Define sections, defaults, templates, and progressive disclosure for campaign creation.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Builder avoids overwhelming the user
  - Advanced controls are hidden until needed
- **Validation**:
  - UX walkthrough with role-play

### Task 4.2: Design opportunity detail page for athletes
- **Location**: `docs/proslync/ui-athlete-opportunity.md`
- **Description**: Specify what athletes see first and how they respond quickly.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Pay, deliverables, fit, and deadlines are immediately visible
  - Accept/interested/decline are friction-light
- **Validation**:
  - Simulate athlete decision in under 30 seconds

### Task 4.3: Design roster command center for agents
- **Location**: `docs/proslync/ui-agent-roster.md`
- **Description**: Define how agents triage, route, and negotiate opportunities across multiple athletes.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Agent can compare opportunities across roster members
  - Status rollups are visible at a glance
- **Validation**:
  - Run 3 simultaneous invite scenarios

## Sprint 5: Demo Storytelling and Commercial Readiness
**Goal**: Package the system into a compelling sales/demo narrative.
**Demo/Validation**:
- Deliver a 3-5 minute demo showing clear business value and product intelligence

### Task 5.1: Define top demo scenarios
- **Location**: `docs/proslync/demo-scenarios.md`
- **Description**: Write the strongest scenarios for showing value.
- **Dependencies**: Sprints 1-4
- **Acceptance Criteria**:
  - Includes one public campaign, one private premium campaign, one agent-roster scenario
- **Validation**:
  - Stakeholder can retell each scenario simply

### Task 5.2: Write demo script and screen choreography
- **Location**: `docs/proslync/demo-script.md`
- **Description**: Create exact click path, state changes, and narrative beats.
- **Dependencies**: Task 5.1, Sprint 3
- **Acceptance Criteria**:
  - Demo has no dead screens or unclear transitions
  - Each action proves business value
- **Validation**:
  - Dry-run with timing target under 5 minutes

### Task 5.3: Define success metrics for pilot/demo
- **Location**: `docs/proslync/pilot-metrics.md`
- **Description**: Specify the business and product signals to track.
- **Dependencies**: Sprints 1-4
- **Acceptance Criteria**:
  - Includes fill rate, response rate, time-to-shortlist, and recommendation acceptance
- **Validation**:
  - Metrics map to campaign and invite states cleanly

## Strongest Demo Scenarios

### Scenario A: Public Marketplace Fill
- Brand launches a hydration product campaign
- System recommends 15 athletes ranked by fit
- Public applications begin arriving
- Brand sees top value and premium candidates separately
- A shortlist is assembled in minutes

### Scenario B: Premium Private Invite Launch
- Sneaker brand launches invite-only campaign
- System surfaces a premium shortlist with explanation and risk flags
- Brand sends 8 private invites
- 3 athletes engage immediately
- One declines; replacement suggestions appear instantly

### Scenario C: Agent Roster Power Play
- Agency receives campaign brief
- System identifies best-fit athletes across the roster
- Agent compares fit, availability, and fee estimates
- Agent submits 2 optimized candidates quickly

### Scenario D: Hybrid Recovery
- Initial private outreach underperforms
- System warns fill risk and recommends public expansion
- Brand widens targeting with one click
- Additional qualified candidates appear

## Recommended Implementation Order
1. Campaign taxonomy and lifecycle
2. Scoring framework and explainability schema
3. Demo data model and seeded records
4. Demo API contract
5. Choreographed backend behaviors
6. Role-based UI definitions
7. Demo scripts and commercial packaging

## Testing Strategy
- Manual scenario walkthroughs for each persona
- State-transition testing for campaign/invite/application flows
- Scorecard sanity checks on sample candidates
- Demo rehearsal with seeded deterministic outcomes
- Acceptance review with a non-builder stakeholder to test intuitiveness

## Potential Risks & Gotchas
- Matching becomes too abstract and not believable in a demo
  - Mitigation: always show reason codes and visible sub-scores
- Campaign model becomes too flexible and confusing
  - Mitigation: use templates and progressive disclosure
- Agent workflows get treated as an afterthought
  - Mitigation: give roster-scoped flows first-class treatment
- Demo backend feels fake or brittle
  - Mitigation: use hybrid seeded data with deterministic orchestration
- Invite-only campaigns lack enough visible action for a demo
  - Mitigation: script viewed/responded/declined events with replacement suggestions
- Budget logic becomes hand-wavy
  - Mitigation: show compensation bands and shortlist cost estimates

## Rollback Plan
- If full matching is not ready, use deterministic weighted mock scores backed by seeded profiles
- If live backend orchestration is unstable, fall back to scripted state snapshots
- If role-specific UX is incomplete, present brand-first view with modal athlete/agent overlays
