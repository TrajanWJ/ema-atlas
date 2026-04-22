# Proslync repo state + consolidation note

Date: 2026-04-14
Host checked: host-machine
Canonical active repo path: ~/proslync-app

## Boundary statement
This note is about the host-side canonical repo at ~/proslync-app.
Older Desktop-era Proslync work now lives under reference_deprecated/ inside this repo for salvage/reference, but those folders are not the active codebase.

## Current repo shape
The repo currently contains three active implementation surfaces plus planning/reference material:

1. Root Expo / React Native app
- Active app code under src/, App.tsx, app.json, assets/
- This is the only tracked/canonical implementation currently represented in git history on main
- Recent tracked edits are concentrated here

2. Untracked backend service
- backend/
- Hono + Drizzle + Postgres shape
- Appears to be a substantial new implementation branch, but is currently entirely untracked

3. Untracked web app
- web/
- Next.js 16 + React 19 app
- Also substantial, but currently entirely untracked

4. Documentation + planning layers
- docs/
- openapi/
- next phase/

5. Archived legacy/reference material
- reference_deprecated/
- Contains moved older repos and docs from Desktop-era locations
- Deliberately ignored by git via root .gitignore

## What git says right now
Branch: main

### Tracked modifications
Tracked changes are overwhelmingly in the root Expo app:
- 49 modified files under src/
- 2 modified files under assets/
- root config changes: .gitignore, App.tsx, app.json, package.json, package-lock.json, tsconfig.json

git diff --stat reports:
- 57 files changed
- 1811 insertions
- 2315 deletions

### Untracked additions
Large untracked additions now exist at the repo root:
- backend/
- web/
- docs/
- openapi/
- next phase/
- scripts/
- logs/
- eas.json, eas.md, metro.config.js, expo-watchdog.sh
- multiple new src/ subtrees and screens
- extra assets including adaptive Android icon set and logo mark

### Disk footprint snapshot
Approximate size:
- repo root total: 5.3G
- reference_deprecated/: 4.0G
- web/: 676M
- backend/: 161M
- docs/: 4.0M
- src/: 1.1M

Largest hidden contributor to active-tree bulk:
- web/node_modules: 663M

## Active/current vs stale/noise assessment
### Active / current / likely canonical
A. Root Expo app (src/, App.tsx, app.json, assets)
- clearly active: tracked on main and recently edited

B. backend/
- current in intent, not historical
- but not yet integrated into a coherent tracked commit boundary

C. web/
- current in intent, not stale
- also not yet coherently introduced into git history

D. docs/, openapi/, next phase/
- current in intent and should be treated as active documentation/planning, not trash

### Stale / frozen / archival / noisy
E. reference_deprecated/
- intentionally archived legacy material
- contains nested .git dirs, .next, node_modules, and old build artifacts
- biggest source of repo bloat and cognitive drift

F. logs/
- mixed-value folder
- expo-watchdog.log is runtime noise
- improvement-findings.md may contain useful history signal

G. .claude/, .expo/, local build/install state
- operational noise unless intentionally preserved

## Highest-risk drift / confusion points
1. Three product surfaces exist at once without an explicit canonical contract
- tracked Expo mobile/demo app
- untracked backend service
- untracked Next web app

2. Large, meaningful work is still untracked
- backend/, web/, docs/, openapi/, and next phase/ are substantial
- this is the single biggest repo-management risk

3. Archived repos live inside the active repo
- reference_deprecated/ contains nested git repos, old installs/build artifacts, and alternate implementations

4. Docs are ahead of the repository contract
- docs imply a richer system package, backend logic, flows, and planning system than tracked repo history currently anchors

5. Logs and generated/runtime artifacts are not fully separated from durable docs

## Files changed / current change shape
### Tracked modified files
Root/config:
- .gitignore
- App.tsx
- app.json
- package.json
- package-lock.json
- tsconfig.json
- assets/favicon.png
- assets/icon.png

Components/navigation/state:
- src/components/*
- src/navigation/*
- src/store/useStore.ts
- src/theme/colors.ts

Data layer:
- src/data/mock.ts heavily reshaped

Role screens:
- broad edits across admin, agent, athlete, brand, fan, onboarding, and shared screens

### Untracked additions
Major root additions:
- backend/
- web/
- docs/
- openapi/
- next phase/
- scripts/
- logs/
- .claude/
- eas.json
- eas.md
- metro.config.js
- expo-watchdog.sh

New app-layer additions:
- src/api/
- src/domain/
- src/services/
- src/data/mockData.ts
- src/data/repository.ts
- new brand screens including AI command center, campaign builder/detail, compare/workroom/escrow/invite/message/rules flows
- src/screens/athlete/PublicProfilePreview.tsx
- presentation helpers like BrandMark.tsx, PortalHero.tsx, QueryStateView.tsx

## Recommended consolidation sequence
This plan is deliberately non-destructive.

### Phase 1 — freeze the boundary in writing
1. Keep this note in-repo.
2. Add a short root README.md stating canonical repo path, active surfaces, production-intent vs experimental surfaces, and that reference_deprecated/ is frozen salvage only.
3. Add an explicit repo map section describing root Expo app vs backend/ vs web/.

### Phase 2 — classify before committing
4. Decide status labels for each major subtree.
5. Write those labels into README/docs so the repo stops depending on oral history.

### Phase 3 — separate durable from ephemeral
6. Tighten .gitignore for runtime/generated noise.
7. Move curated findings out of logs/ into docs/ if they are meant to persist.
8. Keep logs/ only for ephemeral operational output.

### Phase 4 — land coherent commits by concern, not as one giant blob
9. Commit/introduce changes in bounded groups:
- commit A: repo docs / repo map / ignore rules
- commit B: Expo app tracked changes
- commit C: backend introduction
- commit D: web introduction
- commit E: docs/openapi/next-phase planning corpus
10. If some subtree is still experimental, stage it into an incubation/ or clearly labeled path rather than leaving it untracked indefinitely.

### Phase 5 — quarantine archival mass more aggressively
11. Keep reference_deprecated/ frozen, but reduce active-repo interference.
12. Optionally move it outside the active repo later, once salvage confidence is high.

### Phase 6 — define the product architecture truth
13. Decide whether Proslync is Expo-first with backend/web supporting, or a multi-surface platform with Expo + web + backend as peers.
14. Align docs, git boundaries, and launch scripts to that answer.

## Opinionated conclusion
The repo is not random. It looks like a plausible migration from a single tracked Expo demo into a fuller platform repo with backend, web, system docs, OpenAPI, and a large planning corpus.

The chaos comes from one specific failure mode: the architecture has expanded faster than version-control and repo-boundary discipline have kept up.

So the right next move is not deletion. It is:
- declare canonical surfaces,
- separate durable vs ephemeral,
- commit coherent slices,
- and keep legacy reference material quarantined until it can safely leave the active repo.
