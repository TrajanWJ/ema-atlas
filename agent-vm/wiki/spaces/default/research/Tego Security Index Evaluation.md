---
title: Tego Security Index Evaluation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - github
  - knowledge
  - prompts
  - research
  - security
  - skills
summary: >-
  The Tego Skills Security Index is a **centralized database of 2,485 AI agent
  skill definitions** scraped from GitHub repositories, each analyzed for s
wiki_id: research/Tego_Security_Index_Evaluation
imported_from: vault/Research/Tego Security Index Evaluation.md
imported_at: '2026-04-04T00:23:57.123Z'
---
# Tego Security Index — Evaluation

**Date:** 2026-03-16
**Evaluator:** 🔬 Researcher
**URL:** https://index.tego.security/skills/
**Parent company:** [Tego AI](https://tego.ai) — "Agentic AI Security | Know Every Agent. Control Every Action."
**Version:** v0.6.4

---

## What It Is

The Tego Skills Security Index is a **centralized database of 2,485 AI agent skill definitions** scraped from GitHub repositories, each analyzed for security risk. It's essentially a VirusTotal-like index for agent skills — scanning SKILL.md files and associated code for dangerous patterns.

### What They Analyze

For each skill, Tego evaluates:
- **10 capability dimensions:** Tools, Code Execution, Web Access, File System, Data Access, Authentication, Network, System, HITL (Human-in-the-Loop), Multi Agent
- **Findings:** Specific deviations — prompt injection, credential exposure, excessive permissions
- **Permissions:** Whether resource requests are justified by the skill's stated purpose
- **Risk score:** Composite of the above → Pass / Low / Medium / High / Critical

### Risk Distribution (2,485 skills)

| Risk Level | Count | Percentage |
|---|---|---|
| Medium | 1,104 | 44.4% |
| Low | 505 | 20.3% |
| Pass | 461 | 18.6% |
| High | 383 | 15.4% |
| Critical | 32 | 1.3% |

---

## Data Access & API

### Current State
- **No public API.** The APIs page says "Coming soon: APIs, skill submissions, and more."
- **No CLI tool.** No GitHub organization found at `github.com/tego-ai` (404).
- **No submission flow.** They have a "Request a Skill Scan" link but it's just a contact form.

### How Data Is Actually Served
The site is a **static SPA on S3/CloudFront**. Skill data lives in:
- `https://index.tego.security/data/skills_index.js` — 19MB JS file with `const DB = [...]` containing all 2,485 skill assessments as JSON
- `https://index.tego.security/data/skills/assessments/<sha>.risk.json` — individual skill detail files

**This means we can scrape the full dataset today** even without an API — the JS file is publicly accessible and parseable. However, this is fragile and not a supported integration path.

### Data Shape Per Skill
Each entry includes: `skill_name`, `skill_description`, `overall_risk`, `analysis_timestamp`, `capabilities` (10 dimensions), `findings`, `permissions_requested`, `analyzed_files`, `owner_login`, `avatar_url`, `stars`, `sha`, `_metadata` (with `github_html_url`).

---

## Our Skills in Their Index

Of ~60 installed skills, only **4 direct matches** found:

| Our Skill | Tego Match | Risk | Owner in Tego | Notes |
|---|---|---|---|---|
| [[agent-browser]] | `agent-browser` | **High** | shipshitdev (⭐7) | Different source repo than ours |
| [[memory-hygiene]] | `memory-hygiene` | **High** | aAAaqwq (⭐11) | Different source repo |
| deep-research | `deep-research` | Low | sanjay3290 (⭐135) | Different variant; 7 deep-research variants exist |
| [[elite-longterm-memory]] | `elite-longterm-memory` | **High** | NextFrontierBuilds (⭐4) | Different source repo |

**Key insight:** The skills in Tego's index are from *different GitHub repos/authors* than ours. Same skill names, different implementations. Our ClawHub-sourced skills ([[soulcraft]], [[prompt-compiler]], [[diverge]], [[parallax]], etc.) are **not indexed** — Tego appears to scan specific GitHub skill registries, not ClawHub.

---

## Integration Feasibility

### Can We Use This as a Scan-Before-Install Step?

**Short answer: Not yet. Promising for the future.**

#### Blockers
1. **No API** — "Coming soon" but not available. Scraping the 19MB JS blob works but is brittle.
2. **No skill submission** — We can't submit our skills for scanning; they index what they find on GitHub.
3. **Name-based matching is unreliable** — Same skill name ≠ same skill. Different repos have different SKILL.md content with the same name.
4. **Coverage gap** — Most of our skills aren't indexed. ClawHub skills are invisible to them.
5. **No SHA/content matching** — They key on GitHub repo SHA, not skill content hash.

#### What Would Make It Work
1. **Public API with content-hash lookup** — submit SKILL.md content, get risk assessment back
2. **Or:** A CLI tool that does local analysis using their assessment methodology
3. **Or:** A webhook/submission endpoint where ClawHub could register skills for scanning

### Proposed Integration (Future, When API Available)

```
clawhub install <skill>
  → Download skill package
  → Extract SKILL.md + referenced files
  → POST to Tego API: { skill_content, metadata }
  → Receive: { risk: "medium", findings: [...], capabilities: {...} }
  → If risk >= "high":
      ⚠️ "This skill is rated HIGH risk by Tego Security Index"
      Show findings summary
      Require --force or user confirmation
  → If risk == "critical":
      🛑 Block installation unless --force --accept-risk
  → Cache result by content hash
```

### Interim Workaround (Available Now)

We could build a **local pre-check script** that:
1. Downloads the Tego index (`skills_index.js`) — cache it daily
2. On `clawhub install <skill>`, fuzzy-matches against the index
3. Shows any Tego findings for matching skill names (with caveat about different sources)
4. This is informational only — not authoritative since different repos may have different content

---

## Assessment

### Strengths
- **Solid methodology** — 10-dimension capability analysis is thorough
- **Real data** — 2,485 skills analyzed, not vaporware
- **Clear risk framework** — Pass/Low/Medium/High/Critical is intuitive
- **Permission justification analysis** — checks if permissions match stated purpose
- **Active project** — v0.6.4, data from March 2026, regularly updated

### Weaknesses
- **No API** — the biggest blocker for programmatic integration
- **GitHub-only sourcing** — misses ClawHub and other registries
- **Name collision problem** — same skill name across repos ≠ same skill
- **No content-hash matching** — can't verify if the skill *you're installing* is the one *they scanned*
- **Static analysis only** — can't catch runtime behavior, only instructional risk
- **Early stage** — v0.6.4 suggests pre-1.0, features still landing

### Recommendation

**Watch and engage.** Contact security@tego.ai to:
1. Ask about API timeline and access
2. Suggest ClawHub as a registry they should index
3. Propose content-hash based lookups (not just repo-based)
4. Offer to be a design partner for their API

**In the meantime:** Build a lightweight local risk scorer that applies similar heuristics (capability detection from SKILL.md content) as part of our own `clawhub install` flow. We don't need to depend on Tego for basic checks like "this skill asks for sudo" or "this skill wants network access."

---

## Related
- [[ClawHub]] — our skill registry
- [[Security Audit Toolkit]] — existing security scanning skill
- [[ClaWDefender]] — our agent security skill
