> See also: [[LetMeScale]]

# Brand Amplification Doctrine — Design Document

## Overview

Surgical strike across 8 highest-conversion-impact sections to unify LetMeScale under one brand identity: a high-status ROI infrastructure firm that operates with precision, inevitability, and control. Bloomberg Terminal × Luxury Brand × Dark Glass Morphism.

## Brand Doctrine

**Tone**: Cold authority. Every sentence sounds like it was written by someone who doesn't need your business.

**Sentence rhythm**: Short. Declarative. Then a longer sentence that earns its length with specificity. Never two long sentences back-to-back.

**Vocabulary restrictions**:
- Never: "leverage", "unlock", "empower", "elevate", "game-changing", "cutting-edge", "synergy", "optimize", "solutions"
- Never: exclamation marks, question marks in headlines (except CTA "Ready to be next?"), emoji
- Always imply: inevitability, precision, control, measurement, infrastructure
- Prefer: "install", "operate", "produce", "attribute", "compound", "enforce", "diagnose"

**Power dynamic**: LetMeScale is the gatekeeper. The reader is applying for access to infrastructure.

**Emotional temperature**: 2/10. Clinical precision. Red punctuation = the only emotional beat.

## Strike Targets

### 1. Hero (4 variants)
- Hero-A/B: Negations → "Not impressions." / "Not 'personal brand.'" / "Not vanity." Badge: "By application." CTA: "Submit Application"
- Hero-VSL: Headline → "One Client. Six Days. $83,212." Body → "Zero ad spend. Engineered organic distribution. Fully attributed." Play button → "View the proof."
- Hero-Editorial: "3 spots remaining this quarter" → "Intake closes quarterly."

### 2. CTA (3 variants)
- Original: "Stop Guessing. Start Operating." / "Quarterly intake is capped." / Footer: "Applications are reviewed manually. Response is not guaranteed."
- Sections: "Five minutes. One application. That is the entire ask."
- Mirror: "SELECT_PROTOCOL" — kill trailing underscore cursor, kill "END_OF_TRANSMISSION"

### 3. Proof / Testimonials (2 variants)
- Cascade intro: "Six operators. Exposed dashboards. Verified revenue." Kill "Scroll through each story."
- Results: "$3.4M Attributed. 2.1B Distributed."
- Trim bios by 30% — facts only, no emotional language.

### 4. Disqualifier (3 variants)
- Standard: "If you do not have a proven offer, this page is not for you." / "This infrastructure requires existing revenue signal to function."
- Mirror: "The system calibrates against existing revenue. Without signal, there is nothing to scale."
- Checkmark: "Qualification is binary."

### 5. System / What-We-Do (7 variants)
- System-A: "This Is Not a Service. It Is Infrastructure."
- System-B: "Five layers. One operating system."
- System-D: "Agencies describe. We install."
- Mirror variants: Remove dashboard cosplay (CALIBRATING/PENDING → all ACTIVE). Remove "LAST_SYNC" footer.

### 6. Two-Track (3 variants)
- "Two Protocols. One Application."
- Main: "Full-stack revenue infrastructure" / Overflow: "Distribution-only protocol"
- CTAs: "Apply — Main Protocol" / "Apply — Overflow"
- Mirror: Kill "END_OF_TRANSMISSION"

### 7. Philosophy (4 variants)
- Line 3: "You lose time. Revenue. Leverage. Focus."
- Line 4: "And worst of all, you stop noticing."
- Line 5 (red): "That is how operators stall."
- Mirror: Kill "Thesis_v4.2" version labeling.

### 8. Who-Is-For (2 variants)
- "Operators Who Have Revenue But Not Infrastructure."
- "You sell. You close. You deliver."
- "Revenue is real but unpredictable. The business runs on you."

## Novel Enhancements (6)

### A. Protocol Status Bar
Thin fixed bar at top of viewport: "PROTOCOL: ACTIVE // INTAKE: OPEN // QUEUE: 3". Disappears on scroll-down, reappears on scroll-up. Reinforces infrastructure feel.

### B. Confidence Meter
Fixed right-edge vertical bar that fills 0→100% as visitor scrolls through proof. Disappears at CTA. Visualizes commitment building.

### C. Redacted Proof
In disqualifier section: 2-3 blurred client results with "RESTRICTED — Visible after qualification." CSS blur + overlay. Curiosity gap.

### D. System Depth Indicator
Each system layer card has a left-edge bar that pulses on scroll entry. Sequential top-to-bottom activation. Machine coming online.

### E. Application Gravity
CTA button gains subtle magnetic pull as cursor approaches (2-3px translation within 100px radius). Subconscious pull toward action.

### F. DevNav Command Mode
Default: collapsed red dot. Click opens panel. "Command Mode" toggle scales panel 1.5x with glow flash. Feels like Bloomberg terminal advanced mode. Persisted in localStorage.

## Files Affected

All copy changes are string replacements in existing component files. No structural changes to components. Novel enhancements are new small components or additions to existing ones.

#letmescale #plans #archive
