# Proslync sports reference harvest

_Date:_ 2026-04-14 UTC  
_Method:_ official/public product pages + public athlete/recruit/player profiles fetched directly from the web. Browser search was limited in this runtime (Brave key missing, browser control disabled), so this note leans on high-signal known products and public profile surfaces rather than exhaustive SERP scraping.

## What this is
A durable reference bank of sports product patterns worth borrowing for Proslync, grouped by screen/page type.

## Fast take
If Proslync is building for athlete + brand + agent workflows, the strongest pattern stack is:
1. **ESPN / FotMob / Sofascore** for dense but scannable athlete overview architecture
2. **247Sports / On3** for recruiting-style narrative + projection + timeline packaging
3. **Opendorse** for commercial readiness, audience/value framing, and athlete-marketplace behavior
4. **TransferRoom** for agent / market / deal workflow framing
5. **Hudl** for video-first proof, clips, and fan-follow surfaces

The biggest opportunity is to combine these into a product that feels like:
- **sports credibility layer** (stats, timeline, verified context)
- **commercial layer** (brand fit, deliverables, pricing/value ranges, audience proof)
- **relationship / workflow layer** (agent actions, deal pipeline, follow-ups, approvals, media kits)

---

# 1) Athlete public profile / overview screen

## Reference: ESPN player profile
URL: https://www.espn.com/nfl/player/_/id/3915511/patrick-mahomes  
Observed via fetched page for a current ESPN player profile.

### What stands out
- Hero immediately grounds the player in **team + position + league context**.
- Fast-switch tabs/sections around **season stats, career stats, recent games, news, videos, standings**.
- Dense data still works because the page establishes a clear reading order:
  1. who this is
  2. current season snapshot
  3. game-by-game recency
  4. surrounding ecosystem content

### Ideas to borrow for Proslync
- Put a **top-line season/career snapshot strip** right under the hero.
- Use **recency blocks** (latest performances / latest content / latest partnerships) to make athlete pages feel alive.
- Keep **adjacent ecosystem modules** nearby: team, league, news, and media.
- For Proslync specifically: add equivalent modules for **active campaigns, media requests, endorsements, and agent notes**.

### Proslync adaptation
- Hero = athlete identity + sport + team/school + verified status + representation.
- Snapshot cards = followers, engagement, season form, NIL/commercial readiness, recent wins.
- Tabs = Overview / Performance / Content / Brand Fit / Opportunities / Timeline.

---

## Reference: FotMob player profile
URL: https://www.fotmob.com/players/30893/lionel-messi

### What stands out
- Excellent **single-screen performance digest**: goals, assists, starts, minutes, rating.
- Strong **visual trait framing** via radar/trait graph language.
- Includes **recent match list** with minutes + rating + event outcomes.
- Advanced views like **shot map, xG, xA, possession, defending, discipline** create layered depth without hiding the basics.

### Ideas to borrow
- Give each athlete a **performance fingerprint** rather than only raw stats.
- Show a **recent activity rail** with enough detail to show momentum.
- Use **benchmark framing**: “scores highly on X vs peers.”

### Proslync adaptation
- Replace some pure football metrics with **commercial + audience traits**:
  - audience affinity
  - content consistency
  - response speed
  - campaign reliability
  - brand-safe / community-heavy / performance-heavy tags
- Add a **Strengths vs peers** card for both sports and business readiness.

---

## Reference: Sofascore player profile
URL: https://www.sofascore.com/football/player/lionel-messi/12994

### What stands out
- Compact athlete summary with **age, height, club, footedness, jersey number**.
- Strong operational pattern: **next match + lineup confirmation expectations + live rating/heatmap promise**.
- Important stats for each competition are displayed without making users dig.

### Ideas to borrow
- Explicitly tell users **what updates next and when**.
- Use “if X happens, you’ll see Y” logic to make the page feel actionable and time-aware.

### Proslync adaptation
- On athlete pages, surface event-driven expectations like:
  - next competition / next appearance
  - next expected deliverable
  - pending approvals
  - when performance/commercial data will refresh

---

# 2) Athlete recruiting / projection / scouting screen

## Reference: 247Sports recruit player page
URL: https://247sports.com/player/bryce-underwood-46113169/

### What stands out
- Combines **scouting narrative**, **projection**, **evaluations**, **background**, **timeline**, and **stats**.
- “Projection: First Round” is powerful because it compresses complexity into a **single future-facing label**.
- The evaluation writeup is long-form, specific, and credible—not generic profile fluff.
- Athletic background reads like a structured narrative timeline.

### Ideas to borrow
- Proslync athlete profiles should include a **forward-looking projection block**, not just historical records.
- Keep a clear distinction between:
  - facts/data
  - expert evaluation
  - developmental trajectory
- Timeline matters; credibility compounds when the athlete story is chronological.

### Proslync adaptation
- Add a **Prospect / Market Projection** module:
  - rising
  - breakout candidate
  - strong local brand fit
  - national crossover potential
  - premium commercial upside
- Add **Evaluator Notes** from agent/manager/team with source attribution.
- Build a **structured journey timeline**: milestones, achievements, offers, partnerships, injuries/returns, content spikes.

---

## Reference: 247Sports recruit rankings page
URL: https://247sports.com/Season/2025-Football/RecruitRankings/

### What stands out
- Rankings page gives users fast comparison through **rank, position, dimensions, rating, and school/commit context**.
- Easy to scan because repeated rows use the same data grammar.
- Users can move from list view to deeper player pages.

### Ideas to borrow
- Proslync needs list views that let agents/brands compare athletes quickly.
- Fixed row grammar is more useful than over-designed cards when users are evaluating many prospects.

### Proslync adaptation
- Build **athlete discovery / shortlist tables** with stable columns like:
  - athlete
  - sport
  - school/team
  - region
  - audience size
  - engagement quality
  - performance trend
  - commercial fit score
  - asking range / estimated value

---

# 3) NIL / athlete marketplace / brand collaboration screens

## Reference: Opendorse marketplace home
URL: https://opendorse.com/

### What stands out
- They make the athlete economy legible through **team browse, athlete browse, sport browse**, not just search.
- Athlete cards expose **sport + school + follower counts/social signals** immediately.
- Marketplace language is concrete: athletes, fans, brands, teams, deals.
- The experience bridges both sides of the market rather than pretending there’s only one user.

### Ideas to borrow
- Make browse paths multidimensional:
  - by sport
  - by school/team
  - by athlete type
  - by audience niche
  - by brand campaign type
- Public athlete cards should reveal just enough commercial signal to support contact intent.

### Proslync adaptation
- Athlete cards should show:
  - sport + level + team/school
  - one-line positioning statement
  - audience footprint
  - content archetype
  - campaign readiness / response speed
  - verified rep/agent badge where applicable

---

## Reference: Opendorse athlete NIL profile
URL: https://opendorse.com/profile/jamal-jacobs

### What stands out
- Most important observed pattern: **data-backed athlete ranges** used as a pricing anchor.
- Copy explains pricing ranges as a trusted starting point while clarifying athlete/agent approval affects final price.

### Ideas to borrow
- Do not present rates as absolute truth; present **range + why it varies**.
- Pricing explanation itself builds trust.

### Proslync adaptation
- Add **Deal Range** modules with explicit variability drivers:
  - deliverables
  - platform
  - turnaround
  - exclusivity
  - seasonality
  - agent approval needed
- This is especially good for brand and agent workflows because it reduces dead-end inquiries.

---

## Reference: On3 NIL hub
URL: https://www.on3.com/nil/

### What stands out
- Strong editorial + data ecosystem around NIL:
  - NIL news
  - NIL deals
  - sports business context
- The product framing makes NIL feel like a living market, not a static directory.

### Ideas to borrow
- Proslync should not stop at profile pages; it needs a **market layer** around them.
- Users engage more when the athlete/business world feels in motion.

### Proslync adaptation
- Add a **Market Feed** or **Opportunity Feed** with:
  - recent signings
  - category demand spikes
  - regional trends
  - athlete momentum stories
  - relevant brand/agent activity

---

# 4) Agent / transfer / market intelligence screens

## Reference: TransferRoom
URL: https://www.transferroom.com/

### What stands out
- Excellent role-based framing for **clubs / agents / players**.
- Product language is workflow-centric: **market access, talent identification, financial planning**.
- Repeated watchlist/notification concepts indicate that **persistent monitoring** is core to dealmaking.
- Strong value props around unavailable opportunities, direct access, market intelligence, benchmarks, and what-if planning.

### Ideas to borrow
- Proslync should separate experiences by user role:
  - athlete
  - agent/manager
  - brand/marketer
  - team/collective
- Market products become more useful when they combine:
  - watchlists
  - alerts
  - benchmarks
  - scenario planning
  - direct access to counterparties

### Proslync adaptation
- Give agents a dedicated control surface:
  - athlete watchlists
  - inbound opportunities
  - deal stage pipeline
  - valuation benchmarks
  - contract/date reminders
  - recommended counterparties
- Add **scenario modeling** such as “if we package 3 posts + appearance + exclusivity, expected range becomes X.”

---

# 5) Video / proof / highlight-first screens

## Reference: Hudl platform
URL: https://www.hudl.com/

### What stands out
- “Capture every moment” is a great product anchor; it sells the system around proof, not just storage.
- Clear bridge between **athletes, teams, coaches, communities, fans, advertisers**.
- Video is treated as the connective tissue for performance, distribution, and fan experience.

### Ideas to borrow
- Proslync should treat video/highlights as proof objects that power multiple workflows:
  - athlete credibility
  - fan discovery
  - brand fit
  - scouting context
- One clip can serve recruiting, brand, and social proof at the same time.

### Proslync adaptation
- Add a **Featured Proof** module near the top of athlete pages:
  - pinned highlight reel
  - top recent clip
  - best-performing social post
  - press mention or broadcast clip
- Allow brands/agents to reference clips directly when creating outreach or proposals.

---

# 6) Discovery / browse / compare screens

## Reference: Opendorse browse surfaces
URL: https://opendorse.com/

### What stands out
- Browse by **team, athlete, sport** creates strong entry points.
- Cards expose enough identity and social proof to feel decision-supportive.

## Reference: 247Sports rankings
URL: https://247sports.com/Season/2025-Football/RecruitRankings/

### What stands out
- Rank tables remain one of the best formats for comparison-heavy workflows.

### Combined lesson
Use **cards for browse**, **tables for compare**, and **detail pages for conviction**.

### Proslync adaptation
- Discovery landing page:
  - browse cards by sport/team/region/content category
- Compare view:
  - sortable table with filters
- Detail view:
  - full profile with proof, evaluation, fit, and actions

---

# 7) Community / fan engagement / social proof screens

## Reference: Hudl fan framing
URL: https://www.hudl.com/

### What stands out
- Explicit promise to fans: **scores, schedules, stats, livestreams, anything in between**.
- Community isn’t a side effect; it’s a first-class audience.

## Reference: Strava for pro athletes
URL: https://www.strava.com/probadge

### What stands out
- Even though the fetched page content was sparse, the product concept matters: pros use a mainstream community platform where identity, activity, and audience overlap.

### Ideas to borrow
- Athlete pages should balance professional polish with **ongoing community presence**.
- Fans and brands both respond to signs of authentic activity, not only polished media kits.

### Proslync adaptation
- Add a **Community Pulse** block:
  - posting consistency
  - audience response trend
  - recent shoutouts/mentions
  - community-heavy moments
- Let athletes show both **official media kit posture** and **real audience energy**.

---

# 8) Strong UI patterns to borrow directly

## A. Hero composition
Borrow from ESPN / Sofascore / FotMob:
- player headshot / media
- name + role + team/school
- status badges (verified, represented, available, injured, transferring, booked)
- top-line stat strip
- immediate CTA cluster

For Proslync, CTA cluster should likely be role-sensitive:
- **Brand:** Request partnership / save athlete / compare
- **Agent:** Add to watchlist / open pipeline / send outreach / update valuation
- **Athlete:** Edit profile / approve pricing / upload proof / review requests

## B. Snapshot strip
Borrow from ESPN / FotMob:
- 4–8 metrics max above the fold
- each metric should answer a different decision question

Suggested Proslync snapshot metrics:
- audience size
- engagement quality
- sport form / recent performance
- campaign readiness
- estimated range
- response time

## C. Recency modules
Borrow from ESPN / FotMob:
- recent games
- recent content
- recent deals
- recent mentions

Why it matters: recency makes profiles feel trustworthy and current.

## D. Forward-looking labels
Borrow from 247Sports projection:
- future-facing summary labels are insanely useful

Suggested Proslync labels:
- breakout candidate
- premium local fit
- national crossover potential
- creator-first athlete
- event-friendly personality
- high-conversion community builder

## E. Market-facing explanation layers
Borrow from Opendorse + TransferRoom:
- show estimated value/range
- explain the range
- identify variables that move the number

## F. Watchlists and alerts
Borrow from TransferRoom:
- watchlists, notifications, availability, benchmark changes

This is likely mandatory if Proslync wants repeat usage from agents and brands.

---

# 9) Recommended Proslync information architecture

## Athlete profile
1. Hero
2. Snapshot strip
3. Featured proof (video/content)
4. Performance + audience overview
5. Brand fit / commercial readiness
6. Recent activity
7. Timeline
8. Evaluator / agent notes
9. Pricing / package ranges
10. Actions / inquiry workflow

## Brand-side athlete discovery
1. Search + filters
2. Browse by sport/team/region/category
3. Compare table
4. Saved shortlist
5. Outreach / brief submission

## Agent workspace
1. Roster overview
2. Watchlists
3. Opportunity inbox
4. Pipeline by deal stage
5. Valuation / benchmark shifts
6. Reminders / approvals / deliverables

---

# 10) Best ideas to steal first (highest ROI)

## Tier 1: do these first
1. **ESPN-style athlete hero + snapshot strip**
2. **FotMob-style recent activity + strengths summary**
3. **247Sports-style projection / evaluator note / timeline**
4. **Opendorse-style range pricing with explanation**
5. **TransferRoom-style watchlist + alerts + role-based dashboards**

## Tier 2: next
6. **compare-table discovery view** for brands and agents
7. **featured proof module** combining highlight and social proof
8. **market feed** for NIL/opportunity momentum

## Tier 3: differentiators
9. **commercial trait graph** blending athlete performance and creator/business traits
10. **scenario modeling** for deal packaging and expected range movement

---

# 11) Specific product references collected

## Athlete / stats / public profiles
- ESPN player profile — https://www.espn.com/nfl/player/_/id/3915511/patrick-mahomes
- FotMob player profile — https://www.fotmob.com/players/30893/lionel-messi
- Sofascore player profile — https://www.sofascore.com/football/player/lionel-messi/12994

## Recruiting / scouting / rankings
- 247Sports player profile — https://247sports.com/player/bryce-underwood-46113169/
- 247Sports 2025 football recruit rankings — https://247sports.com/Season/2025-Football/RecruitRankings/
- On3 NIL hub — https://www.on3.com/nil/

## NIL / athlete marketplace / commercial
- Opendorse home / marketplace — https://opendorse.com/
- Opendorse athlete NIL profile — https://opendorse.com/profile/jamal-jacobs

## Agent / transfer / market intelligence
- TransferRoom — https://www.transferroom.com/

## Video / proof / fan
- Hudl — https://www.hudl.com/
- Hudl fan surface — https://fan.hudl.com/
- Strava for pro athletes — https://www.strava.com/probadge

---

# 12) Caveats / gaps
- This pass is strong on public/product surfaces, but weaker on private authenticated dashboards because browser automation/search was unavailable in this runtime.
- Teamworks Influencer / INFLCR was not fetchable from the tested hostname during this run.
- Some highly interactive pages do not fully reveal UI structure through readability extraction, so several conclusions are drawn from product copy + exposed page text rather than complete DOM inspection.

---

# 13) Bottom line
If Proslync wants to feel category-defining, it should not choose between **sports profile**, **creator marketplace**, and **agent workflow tool**. The best references suggest the winning product is the merge:
- **ESPN/FotMob credibility**
- **247Sports future narrative**
- **Opendorse commercial actionability**
- **TransferRoom workflow rigor**
- **Hudl proof/media energy**

That blend would make Proslync feel less like a directory and more like a living operating system for athlete reputation, marketability, and deal flow.
