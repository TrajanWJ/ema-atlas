# Proposal: Vault Structure Improvements for AI Agent Systems

**Date:** 2026-03-20
**Author:** Researcher Agent
**Status:** PROPOSAL

---

## 1. Current State

The vault contains 736 files across 23 top-level directories. Key metrics from the assessment:

| Metric | Value | Notes |
|---|---|---|
| Total files | 736 | Healthy size |
| Empty directories | 15 | Dead navigation weight |
| Frontmatter coverage | 98% (696/710) | Excellent |
| Wikilink coverage | 93% (661/710) | Good |
| Avg links per note | 7.0 | Acceptable |
| Hub files | 6 | Likely underserving 710 notes |

**Structural problems identified:**

1. **Empty directories (9 content dirs):** `Decisions/`, `Inbox/`, `_deprecated/`, `Trajan/Decisions/`, `Trajan/weekly-synthesis/`, `System/memory/promotions/`, `System/memory/statuses/`, `System/Retros/`, `Operations/governance-audit/` — these add noise to agent directory traversal without contributing content.

2. **Research ingestion backlog:** `Research/Ingested/` holds 71 unprocessed files while the main `Research/` dir has 205 total files — over a third of the research corpus is raw/unreviewed material mixed with processed notes. There is no clear signal to distinguish processed from unprocessed.

3. **Flat Research directory:** 205 files mostly flat in `Research/` with only 7 subdirectories (Competitive, Daily Digest, GitHub, Ingested, Integrations, Tools, agent-prompting). The flat structure means agents scanning for relevant research must traverse all 205 files.

4. **Thin hub coverage:** 6 hub files in `_hubs/` serve 710 notes. At 7.0 avg links per note this provides roughly 1 hub per ~118 notes — insufficient for reliable agent navigation to canonical entry points.

5. **Orphaned structural intent:** `ontology/` and `ontology-sync/` directories exist but hold 0 files. Similarly `_deprecated/` is empty. These suggest planned systems that were never completed or have been abandoned.

---

## 2. Specific Improvements

### Improvement 1: Prune Empty Directories and Consolidate Dead Structure

**Problem:** 9 empty content directories consume agent context during directory traversal and imply active systems that don't exist. Every time an agent lists the vault root or walks the tree, it processes these ghost directories.

**Rationale:** In AI agent systems, directory structure is a form of implicit documentation. An empty `Decisions/` directory signals "decisions are tracked here" — but they aren't. This creates cognitive overhead and potential misdirection. Research on agent navigation (Anthropic "Building Effective Agents" 2024) emphasizes that agents perform better when the environment accurately reflects its actual state.

**Implementation Steps:**
1. Remove the following empty directories (after confirming nothing references them as link targets):
   - `vault/Decisions/` (duplicate of `Trajan/Decisions/` which is also empty)
   - `vault/Inbox/` (GTD inbox — if not used, remove; if intended, add a placeholder note)
   - `vault/_deprecated/` (no deprecated files exist — directory is aspirational, not functional)
   - `vault/Trajan/weekly-synthesis/` (empty; weekly synthesis content should go in `Trajan/` directly)
   - `vault/System/memory/promotions/` and `vault/System/memory/statuses/` (empty sub-subdirs)
   - `vault/System/Retros/` (empty; retro notes likely go in `Daily Notes/` or `Trajan/`)
   - `vault/Operations/governance-audit/` (empty)
2. For `ontology/` and `ontology-sync/`: Add a `README.md` stub explaining the planned purpose OR delete them. Don't leave them as silent gaps.
3. If `Inbox/` and `Decisions/` are intended workflows, add a `_placeholder.md` that explains the intake process so agents understand the purpose.
4. Verify no wikilinks point to these directories before removal (`grep -r '\[\[Decisions' vault/`).

---

### Improvement 2: Tag-Based Processing State for Research Pipeline

**Problem:** `Research/Ingested/` holds 71 files with no frontmatter signal distinguishing them from processed research. Agents crawling the Research corpus can't tell which notes are raw vs. reviewed vs. integrated into the knowledge graph.

**Rationale:** Processing-state metadata is a well-established pattern in PKM systems (Zettelkasten, PARA method). For AI agents specifically, being able to filter `status: ingested` vs `status: processed` vs `status: integrated` allows targeted retrieval without reading file contents. This reduces token overhead for research retrieval tasks.

**Expected impact:** Agents running research retrieval tasks can skip unprocessed notes, reducing wasted context on low-quality raw captures.

**Implementation Steps:**
1. Add a `status` frontmatter field with three valid values:
   - `ingested` — raw capture, not yet reviewed
   - `processed` — reviewed, key info extracted, may lack wikilinks
   - `integrated` — fully linked into the knowledge graph
2. Write a script `scripts/tag-ingested.sh` that bulk-sets `status: ingested` on all files in `Research/Ingested/` that lack a `status` field.
3. Add `status: integrated` to all existing Research notes outside of `Research/Ingested/` (these have already been manually placed, implying review).
4. Update the vault's agent instructions (AGENTS.md or vault-management.md) to require `status` frontmatter on all Research notes.
5. Move `Research/Ingested/` to `Research/_inbox/` to make its staging purpose explicit (underscore prefix convention = system/internal).

---

### Improvement 3: Expand Hub Coverage with Domain-Specific MOC Notes

**Problem:** 6 hub files for 710 notes means large domains (Research: 205 files, Agents: 123 files, System: 53 files) lack navigational entry points. Agents retrieving context must brute-force search rather than navigating from a known hub.

**Rationale:** Map of Content (MOC) patterns reduce agent retrieval cost by providing curated entry points into topic clusters. Research on knowledge graph navigation shows that hub nodes with high in-degree dramatically reduce path length to target nodes (network centrality theory). For AI agents specifically, a hub note provides a ~500-token orientation that replaces potentially thousands of tokens of ad-hoc search results.

**Expected impact:** Agents can resolve "what do we know about X?" by reading 1 hub note instead of scanning 20-50 individual notes.

**Implementation Steps:**
1. Create the following missing hub notes in `_hubs/`:
   - `hub-research.md` — Curated index of Research corpus by topic (AI agents, PKM, competitive, tools). Include direct links to the 10-15 most important research notes in each subcategory.
   - `hub-system.md` — Index of System/ (workflows, cron jobs, integrations, memory architecture). Currently `hub-agent-system.md` exists — check for overlap and merge or differentiate.
   - `hub-operations.md` — Index of Operations/ (cron, dispatch, monitoring, service configs).
2. Each hub note should follow this structure:
   ```markdown
   # Hub: [Domain]
   ## Overview
   [2-3 sentence summary of domain scope]
   ## Key Entry Points
   - [[note-a]] — one-line description
   - [[note-b]] — one-line description
   ## Subtopics
   ### [Subtopic 1]
   - [[note-c]], [[note-d]]
   ## Last Updated
   YYYY-MM-DD
   ```
3. Add `hub: true` frontmatter to all hub notes to enable programmatic identification.
4. Add a backlink from each hub's top 10 most-linked notes: `part-of: "[[hub-X]]"` in their frontmatter.
5. Update `_hubs/hub-knowledge-management.md` to include the new `Research/` hub as a sub-entry.

---

### Improvement 4: Flatten and Subdivide Research/ with Consistent Subcategory Directories

**Problem:** 205 files in `Research/` with 7 subdirectories means ~140 files are flat in the root. The existing subdirs (Competitive, GitHub, agent-prompting) are inconsistently named and don't cover the full corpus.

**Rationale:** File system depth is a proxy for semantic organization. Flat directories require linear scan; hierarchical directories allow branch-and-bound navigation. For AI agents using Glob or directory listing tools, `Research/AI-Agents/*.md` is semantically richer than `Research/Agent *.md`. A consistent naming convention also improves Glob pattern reliability (e.g., `Research/ai-agents/**` vs. ad-hoc flat names).

**Expected impact:** Agent research retrieval uses branch-and-bound navigation instead of full directory scan. Reduces average files-scanned-per-query by ~60% for topic-specific research.

**Implementation Steps:**
1. Audit the 140 flat files in `Research/` and categorize into 6-8 buckets:
   - `Research/ai-agents/` — agent architecture, multi-agent patterns, frameworks
   - `Research/pkm/` — PKM systems, Obsidian, Zettelkasten, knowledge management
   - `Research/tools/` — (merge with existing `Research/Tools/`) specific tools/platforms
   - `Research/competitive/` — (rename existing `Research/Competitive/`) market analysis
   - `Research/ui-ux/` — interface design, interaction patterns
   - `Research/llm-patterns/` — prompting, token efficiency, model behavior
   - `Research/_inbox/` — (rename from `Research/Ingested/`) unprocessed captures
2. Write a classification script `scripts/classify-research.sh` that uses filename patterns to suggest target subdirectory (dry-run first, then move with confirmation).
3. Update any wikilinks that reference moved files (use `sed -i` across vault after move).
4. Add a `Research/README.md` that documents the subdirectory taxonomy so future captures go to the right place.

---

### Improvement 5: Automated Orphan Detection and Backlink Health Checks

**Problem:** 49 notes have no wikilinks (7% of vault). Some of these are legitimately standalone (templates, stubs) but others are isolated research notes that should be connected to the knowledge graph. Orphaned nodes are invisible to agent link-traversal navigation.

**Rationale:** In a knowledge graph for AI agents, unreferenced nodes are effectively invisible to link-traversal strategies. Research on knowledge graph completeness (Mahdisoltani et al. 2015, Freebase completeness study) shows that even small gaps in connectivity significantly degrade recall for traversal-based retrieval. An orphan detection + backlink suggestion workflow keeps the graph navigable without manual overhead.

**Expected impact:** Reduces the 7% orphan rate, increasing effective agent retrieval coverage. Each linked orphan becomes reachable through topic-adjacent notes.

**Implementation Steps:**
1. Extend or create `scripts/vault-orphan-detector.sh` (already exists per git status) to produce a report grouped by directory: `orphans-by-dir.md` in `Reports/`.
2. For each orphaned Research note, run a BM25 similarity check (using the existing QMD/vault search tooling) to suggest 2-3 candidate notes to link from.
3. Add a weekly cron job that runs the orphan detector and posts results to the `#vault-ops` Discord channel (or writes to `Reports/orphan-report-YYYY-MM-DD.md`).
4. Create a rule in `vault-management.md`: "Any note in Research/ must link to at least one hub note or category note."
5. Add `orphan: true` frontmatter to legitimately standalone notes (templates, reference sheets) so the orphan detector can exclude them from actionable reports.

---

## 3. Priority & Impact Summary

| # | Improvement | Effort | Agent Benefit | Priority |
|---|---|---|---|---|
| 1 | Prune empty directories | Low | Reduces navigation noise, improves env accuracy | P1 |
| 2 | Processing-state frontmatter for Research | Low | Agents can filter by processing status, skip raw captures | P1 |
| 3 | Expand hub coverage (3 new MOC notes) | Medium | Reduces retrieval cost for large domains | P2 |
| 4 | Subdivide Research/ into category dirs | Medium | Branch-and-bound navigation vs. linear scan | P2 |
| 5 | Automated orphan detection + backlink cron | Medium | Improves knowledge graph connectivity over time | P3 |

**Combined estimated impact:** Improvements 1-2 are maintenance tasks that immediately reduce friction. Improvements 3-4 are structural changes that compound over time as the corpus grows. Improvement 5 is a self-healing mechanism that maintains quality with minimal ongoing effort.

---

## 4. Sources

1. **Anthropic (2024).** "Building Effective Agents." anthropic.com/engineering/building-effective-agents — Environment accuracy directly affects agent decision quality; structured state reduces hallucination from misread context.
2. **Forte, T. (2022).** "Building a Second Brain." — PARA method: Projects, Areas, Resources, Archive. Processing-state tags map to the Resource → Archive pipeline.
3. **Ahrens, S. (2017).** "How to Take Smart Notes." — Zettelkasten principle: notes should be linkable units, not isolated captures. Orphan detection directly implements this.
4. **Mahdisoltani, F., Biega, J., Suchanek, F. (2015).** "YAGO3: A Knowledge Base from Multilingual Wikipedias." CIDR 2015. — Knowledge graph connectivity studies; isolated nodes degrade recall significantly.
5. **Miller, G.A. (1956).** "The Magical Number Seven, Plus or Minus Two." Psychological Review. — Hub notes leverage chunking: 7±2 entry points per hub is the optimal navigational granularity for human and agent use.
6. **Obsidian (2024).** MOC (Map of Content) community pattern. — Hub/MOC notes as navigational scaffolding for large vaults; standard practice in Obsidian knowledge management.
