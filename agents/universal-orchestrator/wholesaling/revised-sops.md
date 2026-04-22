# Revised SOP language for wholesaling system

## SOP: Off-Market List Builder

### Purpose
Build small, high-intent PropStream-driven seller lists that are more likely to produce assignable wholesale deals than broad undifferentiated pulls.

### Standard
We do not export large generic lists just because records are available. A list is only approved for outreach when it shows a credible combination of geography fit, equity, ownership friction, and seller motivation.

### Workflow
1. Define target market and submarket.
   - Start with Houston target zones by zip, school area, or buyer-friendly subdivision cluster.
   - Exclude zones with weak cash-buyer activity, heavy retail sensitivity, or low assignment liquidity.
2. Apply base property filters.
   - Single-family, small multifamily, or other approved asset classes only.
   - Remove property types outside current buyer appetite.
   - Exclude obviously non-actionable records where possible.
3. Apply equity and ownership filters.
   - Favor moderate-to-high equity.
   - Favor longer ownership duration.
   - Keep owner and mailing data suitable for contact and skip tracing.
4. Stack motivation signals.
   - Absentee owner
   - Vacancy proxy
   - Tax delinquency
   - Pre-foreclosure / notice signals
   - Inherited / estate / probate proxy
   - Tired landlord indicators
   - Lien or distress indicators where legally and operationally usable
5. Segment before export.
   - High-priority stacked distress
   - Medium-priority equity plus ownership friction
   - Nurture / watchlist
6. Export with metadata.
   - Save filter version
   - Save date pulled
   - Save market / zip / cohort name
   - Save matched reasons for inclusion

### Pass / fail rule
A list fails approval if it is large but weakly justified, cannot explain why a lead is included, or depends on only one shallow signal.

## SOP: Distress Monitoring

### Purpose
Continuously detect sellers whose situation is becoming more actionable so outreach timing improves.

### Standard
Distress monitoring is not just about severe legal distress. It includes emerging ownership friction, occupancy change, tax pressure, landlord fatigue, and property neglect signals.

### Workflow
1. Refresh approved distress sources on a fixed cadence.
   - Weekly for high-urgency signals
   - Monthly for slower-burn signals
2. Compare refreshed records against prior snapshots.
3. Flag events such as:
   - newly delinquent taxes
   - escalating delinquency
   - new pre-foreclosure indicators
   - vacant / likely vacant changes
   - ownership age crossing a threshold
   - code, lien, or maintenance deterioration where tracked
4. Re-score leads when new signals appear.
5. Route score increases into one of three actions:
   - immediate outreach
   - accelerated follow-up
   - hold for manual review
6. Suppress records that are no longer suitable.
   - recently listed retail
   - sold / pending
   - duplicated across active campaigns without new reason

### Operator note
The system should preserve a before/after signal history so the team can see whether distress was stable, improving, or worsening.

## SOP: Motivation Scoring

### Purpose
Estimate seller actionability using stacked evidence instead of gut feel.

### Standard
No single flag should dominate unless it is an extreme signal. The best leads usually combine distress, equity, solvable property issues, and a realistic wholesale exit path.

### Core score components
- **Distress score**: tax, foreclosure, liens, vacancy, code issues, inherited or estate friction
- **Equity score**: enough room for discounted purchase and assignment spread
- **Ownership friction score**: absentee, long hold, tired landlord pattern, out-of-area owner
- **Marketability score**: buyer demand, neighborhood liquidity, property type fit
- **Contactability score**: skip trace confidence, phone quality, mailing quality

### Suggested triage bands
- **A leads**: multiple strong signals plus clear disposition potential, contact immediately
- **B leads**: some motivation but missing either urgency or margin, contact in active rotation
- **C leads**: plausible but weak or early, nurture and monitor
- **D leads**: insufficient motivation, poor market fit, or weak monetization path, suppress

### Required output fields per scored lead
- total score
- sub-scores by category
- top 3 reason codes
- recommended outreach channel
- suggested opening angle
- underwriting caution tag

### QA rule
If a human cannot understand in 10 seconds why the model scored a lead highly, the score is not production-ready.