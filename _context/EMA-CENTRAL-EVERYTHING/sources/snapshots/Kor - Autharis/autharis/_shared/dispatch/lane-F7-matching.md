# Dispatch: Lane F7 — Python matching microservice

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F7 — Python matching microservice**.

## Read first

1. `services/matching/README.md`
2. `autharis/lib/data.ts` (READ-ONLY — talent/job shapes)
3. Lane E4 dispatch (`autharis/_shared/dispatch/lane-E4-matching.md`) — the Python service must align on scoring contract if E4 has landed

## Claim the lane

Flip Lane F7 to `held`.

## File scope

- `services/matching/**`

## Mission

A standalone Python 3.12 + FastAPI microservice:

- `pyproject.toml` managed by `uv` (or pip+venv — log choice)
- Deps: fastapi, uvicorn[standard], pydantic v2, scikit-learn, numpy
- `src/autharis_matching/app.py` — FastAPI app
- `POST /score` — body: `{job, talent}`, response: `{total, breakdown}` matching E4's contract
- `POST /rank` — body: `{job, candidates[]}`, response: ranked array
- Skill taxonomy in `src/autharis_matching/taxonomy.py` — mirror whatever E4 publishes OR publish first if E4 is unheld
- `tests/` pytest smoke suite
- `Dockerfile` (python:3.12-slim) + `compose.yaml` snippet in README

## Stack diversity purpose

This lane intentionally uses Python to prove the monorepo supports non-Node deliverables. The hub (F1) must surface it identically to the Node apps.

## Forbidden

- anything outside `services/matching/**`
- attempting to add this to `pnpm-workspace.yaml` — it is not a pnpm package

## Done when

- `uv run uvicorn autharis_matching.app:app --reload` serves the API
- smoke tests pass
- decision logged

--- DISPATCH PROMPT END ---
