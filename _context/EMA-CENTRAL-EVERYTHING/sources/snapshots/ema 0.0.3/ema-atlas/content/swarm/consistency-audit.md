# Atlas consistency audit — polish lane

**Scope:** 46 new route files under `app/` produced by parallel subagents.
**Method:** static extraction of `SiteShell` eyebrow/title, `<section>` count, closing Navigate panel presence + chip count, and unusual markup (`<aside>`, `<figure>`, `<mark>`, `<sup>`, `style=`).
**Write scope:** this file only. No `.tsx` touched.

---

## 1. Per-route inventory

| Route | Eyebrow | Title | Sections | Closing chips | Notes |
|---|---|---|---:|---:|---|
| /canonical-rule | Canonical rule | EMA owns truth. Hermes owns execution. Surfaces do not own state. | 6 | 5 | title 82 chars |
| /state-planes | Cross-cutting | Four state planes | 6 | 5 | |
| /surfaces-map | Cross-cutting | Surface ↔ Plane map | 4 | 5 | |
| /anti-patterns | Catalog | Anti-patterns — things we will regret | 6 | 5 | |
| /evidence-tiers | Evidence | Confirmed · Inferred · Speculative | 6 | 5 | |
| /secrets-boundary | Cross-cutting | Secrets boundary | 6 | 5 | |
| /chronicle | Control plane | Chronicle — the raw event log | 5 | 5 | |
| /event-kinds | Control plane | Event kinds — the canonical catalog | 5 | 5 | |
| /incidents | Control plane | Incidents & the babysitter | 6 | 5 | |
| /proposal-flow | Control plane | Proposal flow | 6 | 5 | |
| /handoff | Coordination | Handoff — moving a lane, preserving the record | 6 | 5 | **unlabeled** `<nav className="chips">` — no "Navigate" heading |
| /inbox | Workspace plane | Inbox | 4 | 5 | **unlabeled** `<nav className="chips">` — no "Navigate" heading |
| /weekly-cadence | Coordination | Weekly cadence | 5 | 5 | |
| /workspace-contract | Workspace plane | Typed workspace contract | 6 | 5 | |
| /driver-matrix | Harness fabric | Driver matrix | 5 | 5 | |
| /hermes-contract | Harness seam | The Hermes contract | 6 | 5 | |
| /project-space | Identity | Org · Project · Space | 6 | 5 | |
| /personal-ai | Q4 | Personal AI — execution location | 5 | 5 | eyebrow is bare question-id |
| /mesh | Q9 — replication boundary | Mesh: strategic, not immediate | 6 | 5 | eyebrow long + question-id |
| /open-questions-map | Cross-cutting | Open questions × surfaces | 4 | 5 | |
| /collab-plane-options | Q2 + Q8 | Collaboration plane — transport options | 6 | 5 | eyebrow is question-id |
| /ship-order | Decision pressure | Ship order — which surface first | 5 | 5 | |
| /discord-migration | Migration plan | Discord → EMA Threads | 7 | 5 | |
| /agent-day | Narrative | A day in the life of claude-a1 | 2 | 5 | only 2 sections (uses data-driven rendering) |
| /human-day | Narrative | A day in the life of @tawj | 2 | 5 | only 2 sections (data-driven) |
| /scenarios/incident-response | Scenario | Incident: a stalled execution, end to end | 9 | 5 | high section count |
| /scenarios/onboarding | Scenario | First 30 minutes — joining ema-0.0.3 | 9 | 5 | high section count |
| /demo/surface-tour | Surface tour | A first pass through EMA | 3 | 5 | multiple inline Navigate chips throughout |
| /tour/for-skeptic | Tour | For the skeptic | 3 | 5 | |
| /tour/for-engineer | Tour | For the engineer | 8 | 5 | per-section Navigate chips |
| /tour/for-operator | Tour | For the operator | 3 | 5 | |
| /three-futures-gallery | Gallery | Three futures, every Part | 5 | 5 | |
| /glossary-app | Glossary | Load-bearing terms | 6 | 5 | |
| /surface-index | Atlas hub | Surface index — every route | 2 | 5* | *chips use `vapp-card` class, not `chip` |
| /launchpad | Top-level shell | Launchpad | 2 | 4 | only route with 4 chips |
| /launchpad/command | Launchpad variant | Command Launchpad | 5 | 5 | |
| /hq | Top-level shell | HQ | 6 | 5 | |
| /hq/personal | HQ variant | Personal HQ | 5 | 5 | |
| /hq/project | HQ variant | Project HQ — ema 0.0.3 | 5 | 5 | |
| /wiki | vApp | Wiki | 4 | 5 | contains `<aside>`, `<figure>`, `<mark>`, `<sup>` |
| /wiki/node/example | Wiki node | Node: 'Shared Workspace' (concept) | 6 | 5 | contains `<aside>`, `<figure>`, `<mark>`, `<sup>` |
| /chat | vApp | Chat | 5 | 5 | |
| /chat/tenanted | Chat variant | Tenanted Chat | 5 | 5 | |
| /threads | vApp | Threads / Server | 4 | 5 | |
| /threads/bridge | Q6 — bridge direction | Discord ↔ EMA: which way does the bridge write? | 5 | 5 | eyebrow is question-id; title 60 chars |
| /agent-environment | vApp | Agent Virtual Environment | 5 | 5 | |
| /blueprint | vApp | Blueprint | 4 | 5 | |

---

## 2. Eyebrow taxonomy

**Distinct values: 28** across 46 routes — eyebrow vocabulary has drifted.

| Eyebrow | Routes using it |
|---|---|
| Cross-cutting | state-planes, surfaces-map, secrets-boundary, open-questions-map |
| Control plane | chronicle, event-kinds, incidents, proposal-flow |
| vApp | wiki, chat, threads, agent-environment, blueprint |
| Tour | tour/for-skeptic, tour/for-engineer, tour/for-operator |
| Narrative | agent-day, human-day |
| Scenario | scenarios/incident-response, scenarios/onboarding |
| Coordination | handoff, weekly-cadence |
| Workspace plane | inbox, workspace-contract |
| Top-level shell | launchpad, hq |
| HQ variant | hq/personal, hq/project |
| Canonical rule | canonical-rule (singleton) |
| Catalog | anti-patterns (singleton) |
| Evidence | evidence-tiers (singleton) |
| Harness fabric | driver-matrix (singleton) |
| Harness seam | hermes-contract (singleton) |
| Identity | project-space (singleton) |
| Decision pressure | ship-order (singleton) |
| Migration plan | discord-migration (singleton) |
| Surface tour | demo/surface-tour (singleton) |
| Gallery | three-futures-gallery (singleton) |
| Glossary | glossary-app (singleton) |
| Atlas hub | surface-index (singleton) |
| Launchpad variant | launchpad/command (singleton) |
| Chat variant | chat/tenanted (singleton) |
| Wiki node | wiki/node/example (singleton) |
| Q4 | personal-ai (outlier — bare question-id) |
| Q2 + Q8 | collab-plane-options (outlier — question-id) |
| Q6 — bridge direction | threads/bridge (outlier — question-id with em-dash subtitle) |
| Q9 — replication boundary | mesh (outlier — question-id with em-dash subtitle) |

**Flagged outliers:**
- 18 of 28 eyebrows are singletons — the taxonomy has long tail drift.
- "Q4", "Q2 + Q8", "Q6 — bridge direction", "Q9 — replication boundary" break the noun-phrase pattern by leading with a question-id. Inconsistent among themselves: some are bare (`Q4`), some are compound (`Q2 + Q8`), some add subtitle (`Q6 — bridge direction`).
- Parallel groups named inconsistently: "Harness fabric" vs "Harness seam"; "Control plane" vs "Workspace plane" vs "Collaboration plane" (wait: collab route actually uses `Q2 + Q8`, not a plane eyebrow — further drift).
- "Top-level shell" + "HQ variant" + "Launchpad variant" + "Chat variant" — four overlapping schemes for shell-type taxonomy.

---

## 3. Title style

Most titles are noun phrases with optional em-dash subtitle (`Foo — bar qualifier`). A handful break the pattern:

**Long titles (>60 chars):**
- `/canonical-rule` — 82 chars — `EMA owns truth. Hermes owns execution. Surfaces do not own state.` (three sentences as title, unique in the set)
- `/threads/bridge` — 60 chars — `Discord ↔ EMA: which way does the bridge write?` (only route with interrogative title)

**Other anomalies:**
- `/mesh` — title starts `Mesh:` with a colon-then-sentence rather than em-dash subtitle (siblings use em-dash).
- `/wiki/node/example` — `Node: 'Shared Workspace' (concept)` — mixes colon, quoted term, and parenthetical qualifier; no other route uses this style.
- `/agent-day` and `/human-day` — `A day in the life of …` begins with article "A" (mildly verbose but internally consistent as a pair).
- `/scenarios/incident-response` — `Incident: a stalled execution, end to end` — colon subtitle style.
- `/scenarios/onboarding` — `First 30 minutes — joining ema-0.0.3` — starts with numeric phrase, siblings don't.
- All other titles: noun phrase or `Noun — qualifier` pattern.

No verb-started titles detected.

---

## 4. Navigate chip count distribution

| Chip count | Routes | Count |
|---:|---|---:|
| 3 | — | 0 |
| 4 | /launchpad | 1 |
| 5 | all other 45 routes | 45 |
| 6 | — | 0 |
| 7+ | — | 0 |

**Distribution is effectively flat at 5.** No routes ≥ 7 — no flags.
Sole outlier: `/launchpad` (4 chips).

Note on the count: `/surface-index` renders its closing Navigate using `vapp-card`-class `<Link>`s inside a `card-grid`, not `chip`-class links. Count of 5 still holds structurally but the visual treatment differs — worth noting for visual parity.

Note on labels: `/handoff` and `/inbox` render their closing chip row as a bare `<nav className="chips">` with no "Navigate"/"Related" heading, while every other route uses the `panel__tag` "Navigate" + `panel__title` "Related" scaffold (or an equivalent labeled variant). The chips themselves are present (5 each).

---

## 5. Style-attribute violations

Grep for `style={` or `<style` across all 46 routes.

**Violations found: 0.**

No inline `style=` attributes. No `<style>` tags. All routes defer to `app/globals.css` / shared class system. Clean.

---

## 6. Missing / unlabeled Navigate panel

**Strictly missing (no closing chip block at all): 0.**

**Unlabeled (chips present but no "Navigate" heading / panel scaffold): 2.**
- `/handoff` — uses `<nav className="chips">` directly, no `panel__tag` "Navigate" header.
- `/inbox` — same pattern.

**Structural variant (chips present, labeled "Navigate", but different class system): 1.**
- `/surface-index` — uses `vapp-card` grid for the Navigate panel rather than the `route-links` + `chip` pattern.

Every route terminates with some form of onward navigation. The cheap normalization is to make the labeling + class scaffold uniform.

---

## 7. Unusual markup

- **`<aside>` / `<figure>` / `<mark>` / `<sup>`:** present only in `/wiki` and `/wiki/node/example`. Both routes use all four tags. Since the Wiki routes are explicitly styled around a document/reference aesthetic, this is likely intentional — but it is the sole place these tags appear in the atlas, so a decision is owed: either promote them to a shared idiom or keep them scoped to the Wiki subtree and document that scoping.
- **Section counts are bimodal:** most routes sit at 4-6 sections, but `/agent-day` + `/human-day` have 2 (data-driven renderer), and `/scenarios/*` + `/tour/for-engineer` sit at 8-9. Not inherently wrong, but flag if visual rhythm becomes uneven.
- **`/launchpad` and `/surface-index`** have only 2 `<section>` blocks — lightest in the set.

---

## 8. Recommendations (cheap normalizations)

1. **Collapse eyebrow taxonomy to ~10 canonical values.** 18 singletons out of 28 is drift. Propose a closed vocabulary: `Cross-cutting`, `Control plane`, `Workspace plane`, `Collaboration plane`, `Harness`, `Coordination`, `Identity`, `Narrative`, `Scenario`, `Tour`, `vApp`, `Shell`, `Variant`, `Reference`, `Open question`. Re-tag singletons against this list.
2. **Normalize question-id eyebrows.** `Q4`, `Q2 + Q8`, `Q6 — bridge direction`, `Q9 — replication boundary` should pick one shape. Recommend: `Open question — Qn` with the subtitle moved into the title.
3. **Standardize the closing Navigate panel.** Adopt the `panel__tag "Navigate"` + `panel__title "Related"` + `route-links` + `chip` pattern as the single idiom. Rewrite `/handoff`, `/inbox`, `/surface-index` to match. (No chip-count change needed.)
4. **Cap chip count at 5.** Already enforced in practice (45/46). Raise `/launchpad` from 4 → 5 or codify 5 as the target.
5. **Title pattern: `Noun phrase` or `Noun phrase — qualifier`.** Rewrite `/canonical-rule` (three-sentence title is a hero, but breaks rhythm in lists/menus), `/mesh` (swap `:` for `—`), `/wiki/node/example` (drop either the quotes or the parenthetical), `/threads/bridge` (drop the interrogative or reshape as `Bridge direction — which way does the write go?`).
6. **Document Wiki's `<aside>`/`<figure>`/`<mark>`/`<sup>` scope.** Either keep strictly within `/wiki/**` or promote to a shared idiom with guidance. Today it reads as an accident rather than a decision.
7. **Audit nothing else.** No `style=` violations, no missing Navigate, no runaway chip counts. The surface area is mostly healthy; the drift is concentrated in eyebrow labels and a handful of title anomalies.

---

*End of audit.*
