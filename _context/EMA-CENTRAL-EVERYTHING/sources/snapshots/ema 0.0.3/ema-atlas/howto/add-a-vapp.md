# Playbook — add a vApp

A **vApp** is a virtual app inside the EMA shell, rendered by the Launchpad
or Virtual Desktop. Examples already named in
[`05-fresh-context-project-app-model.md`](../05-fresh-context-project-app-model.md):
Wiki, Chat, Threads/Server, Agent vEnv, Blueprint, Code, Files, Images.
Use this playbook when proposing a new vApp.

> **Open question dependencies:**
> - [Q1](../OPEN_QUESTIONS.md) — agent identity model. Affects who can act
>   inside the vApp.
> - [Q2](../OPEN_QUESTIONS.md) — collaboration state location. Affects
>   whether the vApp owns objects or borrows them from the collab plane.
> - [Q3](../OPEN_QUESTIONS.md) — Project ↔ Space cardinality. Affects scope.

## Pressure-check (from `VAPP-FINAL-VISION-CHECKLIST.md`)

A vApp must answer all of these before being added:

1. **What object(s) does it own or render?** (cite the GLOSSARY term)
2. **What truths does it expose?** (which control-plane records or
   collaboration objects)
3. **What actions can humans take?**
4. **What actions can agents take through CLI?** (parity matters)
5. **What chronicle / review / memory links exist?**
6. **What host / runtime / workstream context can it show?**
7. **How does it avoid being decorative?** (must own state or render it; not
   both; not neither)

If any answer is "I don't know", the vApp is not ready.

## Steps

1. **Write the spec under `docs/vapps/<name>.md`** in the canonical EMA
   repo with the seven answers above plus:
   - which Project/Space scope it lives in
   - which permissions roles it gates on
   - which surfaces it can be embedded in (Launchpad, HQ, native desktop, web)

2. **Decide its plane.** Each vApp draws from one of:
   - control-plane records only (read-only dashboard)
   - shared workspace artifacts (plans/handoffs/notes)
   - collaboration objects (live multi-user editing)
   Mixing planes is fine, but **state ownership** must be unambiguous —
   the vApp does not own state; it renders state owned by EMA, the workspace,
   or the collab subsystem.

3. **Add a node** under `graph/nodes/` for any new branch you create that
   holds the vApp's surface code. (See [`add-a-branch.md`](add-a-branch.md).)

4. **Update topic edges:**
   - `graph/edges/surfaces.md` — list the vApp under "vApps"
   - `graph/edges/<plane>.md` — workspace / collab / authority depending
     on what state it renders

5. **Add the vApp to `GLOSSARY.md`** so the name is canonical.

## Verification

- A fresh agent reading only `docs/vapps/<name>.md` plus `GLOSSARY.md`
  can answer all seven pressure-check questions.
- The vApp does not introduce a new state authority. Grep for `Repo.insert`
  / `Repo.update` in the surface code; there should be none.
- CLI parity: every action a human can take in the UI has a CLI path
  documented (CURRENT-PRIORITIES step 3).

## Commit message template

```
ema: add <name> vApp spec

- docs/vapps/<name>.md: pressure-check + scope + permissions + plane
- transfer-pack/graph/edges/surfaces.md: list under vApps
- transfer-pack/GLOSSARY.md: add <name> term

State ownership: <plane>. CLI parity: <yes/no, link>.
```

## Cross-references

- [`05-fresh-context-project-app-model.md`](../05-fresh-context-project-app-model.md) — named vApps
- [`docs-ema-next-steps`](../graph/nodes/docs-ema-next-steps.qmd) — `VAPP-FINAL-VISION-CHECKLIST.md`
- [`graph/edges/surfaces.md`](../graph/edges/surfaces.md)
- [`graph/edges/identity.md`](../graph/edges/identity.md)
- [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md) Q1, Q2, Q3
