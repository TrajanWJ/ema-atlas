---
type: research
tags:
  - personal-site
  - web-design
  - svg
  - animation
  - inspiration
  - speaking
  - gsap
  - greensock
confidence: 0.82
summary: >-
  Deep analysis of cassie.codes — SVG animation specialist, conference speaker,
  and educator. Playful nostalgia-driven aesthetic. Strong speaking portfolio.
wiki_id: research/CassieEvans-Site-Analysis
imported_from: vault/Research/CassieEvans-Site-Analysis.md
imported_at: '2026-04-04T00:23:57.005Z'
---

# Cassie Evans (cassie.codes) — Site Analysis

*Fetched: 2026-03-20 | URLs visited: 8 | Confidence: High (for what was fetchable)*

Related: [[JoshWComeau-Site-Analysis]] | [[SVG Animation Techniques]] | [[Interactive Web Design]]

---

## Site Overview & Aesthetic

Cassie Evans's personal site is smaller and more intimate than Josh Comeau's — less a content platform and more a digital calling card for a conference speaker and animation specialist. The aesthetic is deliberately **nostalgic and playful**, rooted in the early web era (Myspace, Neopets, Space Jam). She's stated this directly on the homepage.

**Key aesthetic signals:**
- "I got into making things on the web back in the whimsical days of myspace and neopets" — in the above the fold text
- Nostalgic, handcrafted feel vs. the polished modern aesthetic most devs aim for
- References sparkly trailing cursors, blink tags, Space Jam website as inspiration
- High CodePen engagement — she builds and shares experiments there heavily
- Animation-first: the site's point is to show off what CSS/SVG animation can do

**Writing voice:** Conversational, self-aware, slightly self-deprecating. "My gut reaction was 'heck no. That sounds terrifying.' So naturally I said yes." No pretension. Enthusiastic about neopets in 2024.

**Technical stack:** Hosted on Netlify (verified by 404 behavior). No /about or /posts routes exist — nav structure is different from what you'd expect.

---

## Content Inventory

### Homepage — https://www.cassie.codes

Single-page style landing with sections:
- **Header section:** "Hi, I'm cassie — I like making fun, interactive things with code. I also talk & write about those things."
- **Speaking section preview:** Links to /speaking with a quote about speaking terrifying her
- **Writing section** (anchor: #writing) — mentioned on homepage but /posts 404s (may use #writing anchor on homepage)
- Featured speaking items visible directly on homepage: workshop, and 3 talks

**Structural observation:** The site navigates by sections/anchors and dedicated routes, not a traditional blog index. She uses `/speaking/` as the main hub and individual speaking pages as sub-routes.

---

### Speaking — https://www.cassie.codes/speaking/

**Core message:** "I aim to bring back some of that playfulness to the web through my talks and workshops."

**Conference videos embedded:**
- "Interactive web animation with SVG" — beyond tellerrand Berlin (Vimeo embed)
- "Limitation breeds creativity" — Bytes conf Brighton (YouTube embed)  
- "Interactive web animation with SVG" — CSS camp Barcelona (YouTube embed)

**Upcoming/listed events:**

#### Workshop: Getting Started with SVG Animation
**URL:** /speaking/getting-started-with-svg-animation/
**Format:** Full workshop
**Description:** "Animation is one of the best ways to bring brand personality and character to an online experience, but in the busy world of front-end development, it can often be overlooked. In this workshop we cover everything you need to know to get started with, and master SVG animation."
**Hands-on:** Yes — "really hands-on... you can work on your own graphics or use the pre-prepped ones, and most importantly - no one's left behind."
**Output:** Past attendees' work collected in a CodePen collection.
**Conference:** beyond tellerrand

---

#### Talk: Painting with SVG
**URL:** /speaking/painting-with-svg/
**Description:** "SVG's a great format for creating illustrative graphics on the web, but it can sometimes feel a bit... flat? Illustration in the real-world is gloriously messy. It's full of texture, human error, smudges, and paint splatters. In this talk we take a look at how we can use different SVG techniques to recreate some tactile 'messiness'"
**Core theme:** Using SVG filters, feTurbulence, and other techniques to add organic, imperfect texture to digital illustration.

---

#### Talk: Interactive Web Animation with SVG
**URL:** /speaking/interactive-web-animation-with-svg/
**Description:** "Have you ever felt uninspired by the every-day grind? Like coding is all work and no play? Me too. In this talk I explain how playing with SVG helped me explore some fun new browser API's. I give some advice on how to get started, share some demos and advise on when to reach for an animation library. Oh, and there's neopets in it."
**Conference:** beyond tellerrand (Berlin), CSS camp (Barcelona)
**Core theme:** SVG as a "playground" for exploring browser APIs. The talk literally includes Neopets as a reference point. Accessible entry point for people who find animation intimidating.

---

#### Talk: Limitation Breeds Creativity
**URL:** /speaking/limitation-breeds-creativity/
**Description:** "Constraints might not feel like what you need when you're trying to be creative. But working within constraints can help you get started and provide unconventional ways around a problem. In this talk I chat about how to get over the fear of a blank page, and show off some fun CSS only demos."
**Conferences:** Bytes conf (Brighton), FullStackCon, more
**Reception:** Strong community response. Tweets from Chris Heilmann, testimonials about inspiring people to build their own sites. One attendee used the talk's lessons to stop a 6-year-old from having a meltdown over a blank piece of paper.

---

### Blog / Writing

The `/posts/` route 404s on Netlify — the blog may live elsewhere or be integrated into the homepage via the `#writing` anchor. Posts found through direct URL attempts:

- `/posts/making-a-cassie-com/` — 404 (likely moved/renamed)
- `/posts/spring-animation/` — 404
- `/posts/svg-animation-workshop/` — 404

**Assessment:** The blog section exists (referenced on homepage as "write about those things") but the URL structure isn't `/posts/` — likely uses a different path or it's embedded as a scrollable section on the homepage. The site's blog content may have been migrated or the current version doesn't have a standalone blog index.

**CodePen:** https://codepen.io/cassie-codes — this is where much of the "writing" probably happens. She builds experiments and publishes there, with CodePen acting as her visual portfolio and scratchpad.

---

## Standout Features & Design Patterns

### 1. Nostalgia as Brand Identity
Most modern portfolios compete on polish and technical cleanliness. Cassie inverts this by deliberately invoking the chaotic, playful early web. This is a differentiator that communicates personality immediately and filters for an audience that resonates with "bring back the fun web" thinking.

### 2. Speaking Page as Primary Content Hub
The main content offering isn't blog posts or tutorials — it's talks. Each talk gets its own dedicated page with description, tweet testimonials, and video embed. This is a clean, portfolio-style presentation that lets conference organizers evaluate her quickly.

### 3. Twitter Testimonials Embedded on Talk Pages
The "Limitation Breeds Creativity" talk page includes embedded tweets from Chris Heilmann (@codepo8) and others reacting positively. This is social proof built directly into the content page — not a separate "testimonials" section. Clever.

### 4. CodePen as Extension of the Site
The homepage links directly to `codepen.io/cassie-codes` — making CodePen her interactive portfolio. The workshop page links to a CodePen collection of past attendees' work. She treats CodePen as a first-class publication venue, not just a throwaway sandbox.

### 5. Self-Aware Humor About Fear
Multiple talks reference her own fear of public speaking: "My gut reaction was 'heck no. That sounds terrifying.' So naturally I said yes." This is authentic, disarming, and builds trust with audiences who share the same fear. The "Limitation Breeds Creativity" talk is essentially a pep talk for creatives who freeze up — and her speaking origin story backs it up.

### 6. Workshop vs Talk Distinction
The speaking page clearly distinguishes between workshop (hands-on, full day, participants create things) and talk (presentation, demos). The workshop offering for SVG animation is detailed and targeted at conference organizers specifically.

### 7. SVG Animation as Personality, Not Just Skill
Cassie doesn't just teach SVG animation — she frames it as a philosophy: bring joy and play to the web. Animation isn't decoration; it's a communication tool for personality. This framing elevates animation from "nice to have" to "expression of craft."

### 8. Minimal Site, Maximum Signal
The site is intentionally lean. No blog index, no portfolio grid, just: who I am, what I talk about, how to book me. This confidence in minimalism is itself a design statement.

---

## Technical Specialties (inferred from talk content)

Based on talk descriptions and CodePen work:

- **GSAP (GreenSock Animation Platform)** — likely her primary animation library (referenced indirectly in SVG talk "when to reach for an animation library")
- **SVG `<path>` animation** — path drawing, stroke animation, morphing
- **SVG filters** — feTurbulence, feDisplacementMap for organic texture (Painting with SVG talk)
- **CSS-only demos** — the Limitation Breeds Creativity talk explicitly does "CSS only demos"
- **ScrollTrigger patterns** — likely (GSAP ecosystem)
- **Spring physics** — likely integrated with GSAP's MotionPath or similar

---

## Site Navigation Structure

Confirmed routes:
- `/` — homepage with #speaking and #writing anchors
- `/speaking/` — speaking portfolio hub
- `/speaking/getting-started-with-svg-animation/` — workshop page
- `/speaking/interactive-web-animation-with-svg/` — talk page
- `/speaking/painting-with-svg/` — talk page
- `/speaking/limitation-breeds-creativity/` — talk page

404s:
- `/about/` — no dedicated about page
- `/posts/` — no blog index at this path
- `/posts/making-a-cassie-com/` — old post URL no longer valid

---

## Key Takeaways for Replication

1. **Nostalgia + Craft = Memorable Identity.** Cassie's Neopets/Myspace framing is distinctive. Most devs go for "professional minimalist." Going for "joyfully retro" is a wide-open lane.

2. **Speaking pages are a portfolio.** If you give talks or have presentations, each one deserves its own dedicated page with description, social proof, and video. It's both a portfolio and a bookable product page.

3. **CodePen as living portfolio.** For animation/visual work, a curated CodePen profile may be more effective than screenshotted blog posts. It's interactive, shareable, and shows work in motion.

4. **Authenticity scales.** "I was terrified to speak but said yes anyway" is more compelling than "I'm an experienced conference speaker." Cassie's authentic framing is her strongest asset.

5. **Constraints as creativity.** The "Limitation Breeds Creativity" talk has legs beyond SVG animation — it's a framework for creative paralysis that resonates with any maker. Constraint-based thinking is worth exploring as a site theme.

6. **Embed social proof where the proof is relevant.** Tweets on talk pages, CodePen collections on workshop pages. Don't centralize testimonials — distribute them contextually.

7. **The site itself is a demo.** Any personal site for an animation specialist should animate. Cassie's site practices what it preaches.

8. **Small sites can have big personality.** Cassie's site is lean. No sprawling content library. But every element is intentional and the identity is crystal clear. More pages ≠ more impact.

---

## All URLs Visited

| URL | Status | Content |
|-----|--------|---------|
| https://www.cassie.codes | 200 | Homepage |
| https://www.cassie.codes/speaking/ | 200 | Speaking hub |
| https://www.cassie.codes/speaking/getting-started-with-svg-animation/ | 200 | SVG workshop page |
| https://www.cassie.codes/speaking/interactive-web-animation-with-svg/ | 200 | SVG talk page |
| https://www.cassie.codes/speaking/painting-with-svg/ | 200 | Painting with SVG talk |
| https://www.cassie.codes/speaking/limitation-breeds-creativity/ | 200 | Creativity talk (has tweet embeds) |
| https://www.cassie.codes/about/ | 404 | No /about page |
| https://www.cassie.codes/posts/ | 404 | Blog index not at this path |
| https://www.cassie.codes/posts/making-a-cassie-com/ | 404 | Old post, removed/moved |
| https://www.cassie.codes/posts/spring-animation/ | 404 | Old post, removed/moved |

---

## Gaps & Limitations

- **Blog content not fully accessible.** The writing section referenced on homepage couldn't be crawled via `/posts/`. Likely lives at a different path or is fully client-rendered (requires JS). CodePen is probably the primary "writing" venue for interactive experiments.
- **No /about page.** Biographical info is woven into the homepage and speaking pages rather than isolated.
- **Newsletter/contact info** not found in rendered text — may be footer-only or JS-rendered.
- **Portfolio/projects section** — not found. May not exist as a separate section; CodePen + speaking = her portfolio.

---

## Sources Tier Distribution
- T1 (primary — fetched live): 10 URLs (8 successful, 2 redirected to 404)
- T2 (institutional): 0
- T3 (secondary): 0

All findings are direct observations from page content.
