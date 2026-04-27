# autharis-matching

Python 3.12 + FastAPI matching microservice. **Lane F7.**

Not a pnpm workspace member — managed via `pyproject.toml` (hatchling build
backend) and either `uv`, `pip`, or a plain `venv`. Stack diversity is the
point: different language, different dependency manager, same deliverable
registry that the Wave-5 hub (F1) surfaces alongside the Node services.

The scoring contract is aligned with Lane E4 (Node matching engine) so a
downstream consumer can swap between them without reshaping payloads.

## Layout

```
services/matching/
├── pyproject.toml
├── Dockerfile
├── src/autharis_matching/
│   ├── __init__.py
│   ├── app.py          # FastAPI app
│   ├── models.py       # Pydantic v2 wire models
│   ├── scoring.py      # score(job, talent)
│   ├── ranking.py      # rank(job, candidates, top_n)
│   └── taxonomy.py     # canonical SKILLS + SYNONYMS map
└── tests/
    ├── conftest.py
    ├── test_app.py
    └── test_scoring.py
```

## Install & run (local)

```bash
cd services/matching
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn autharis_matching.app:app --host 0.0.0.0 --port 4030 --reload
```

With `uv` (optional):

```bash
uv venv --python 3.12
uv pip install -e '.[dev]'
uv run uvicorn autharis_matching.app:app --port 4030 --reload
```

## Test

```bash
pytest -q
```

## Endpoints

| Method | Path         | Body                                | Returns                    |
|--------|--------------|-------------------------------------|----------------------------|
| GET    | `/healthz`   | —                                   | `{ status, service, version }` |
| GET    | `/taxonomy`  | —                                   | `{ skills, categories, synonyms }` |
| POST   | `/score`     | `{ job, talent }`                   | `ScoreResponse`            |
| POST   | `/rank`      | `{ job, candidates, top_n? }`       | `RankResponse`             |

### Scoring weights (sum to 100)

| Dimension       | Weight | Notes                                            |
|-----------------|-------:|--------------------------------------------------|
| skill_overlap   |     40 | TF-IDF cosine over normalized skills             |
| availability    |     20 | job.hoursPerWeek vs parsed talent.availability   |
| rate_fit        |     15 | talent.rate vs job.budget band                   |
| timezone        |     15 | string-match with loose tolerance                |
| rating          |     10 | yearsExp proxy (capped at 10)                    |

Deterministic: identical inputs always produce identical outputs.

## curl examples

```bash
# Health
curl -s http://localhost:4030/healthz | jq

# Taxonomy (skills + synonyms)
curl -s http://localhost:4030/taxonomy | jq '.skills | length'

# Score a single (job, talent) pair
curl -s -X POST http://localhost:4030/score \
  -H 'content-type: application/json' \
  -d '{
    "job": {
      "id": "jr-001",
      "title": "Patient intake coordinator",
      "category": "care",
      "hoursPerWeek": 20,
      "timezone": "GMT",
      "budget": [40, 55],
      "skills": ["Care Coordination", "Intake", "Project Coordination"]
    },
    "talent": {
      "id": "t-001",
      "name": "Amara Okafor",
      "timezone": "GMT",
      "rate": 42,
      "availability": "20 hrs / week",
      "skills": ["Project Coordination", "Care Coordination", "Notion", "Intake"],
      "yearsExp": 8
    }
  }' | jq

# Rank a candidate pool
curl -s -X POST http://localhost:4030/rank \
  -H 'content-type: application/json' \
  -d '{
    "job": { "id": "jr-001", "title": "x", "category": "care",
             "hoursPerWeek": 20, "timezone": "GMT", "budget": [40, 55],
             "skills": ["Care Coordination", "Intake"] },
    "candidates": [
      { "id": "t-001", "name": "Amara", "timezone": "GMT", "rate": 42,
        "availability": "20 hrs / week",
        "skills": ["Care Coordination", "Intake"], "yearsExp": 8 },
      { "id": "t-006", "name": "Miguel", "timezone": "ART", "rate": 36,
        "availability": "20 hrs / week",
        "skills": ["Outreach", "SDR Support"], "yearsExp": 4 }
    ],
    "top_n": 2
  }' | jq
```

## Docker

```bash
docker build -t autharis-matching ./services/matching
docker run --rm -p 4030:4030 autharis-matching
```

### compose.yaml snippet

```yaml
services:
  matching:
    build: ./services/matching
    ports: ["4030:4030"]
    environment: []
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request,sys;sys.exit(0 if urllib.request.urlopen('http://localhost:4030/healthz').status==200 else 1)"]
      interval: 10s
      timeout: 3s
      retries: 3
```

## Contract alignment

- Wire models mirror `Talent` and `JobRequest` in `autharis/lib/data.ts`
  (READ-ONLY source of truth for the prototype).
- `ScoreResponse.breakdown` dimensions align with Lane E4's TypeScript
  scoring surface; E4 may refine weights once it lands.
- `GET /taxonomy` publishes the canonical skill list + synonyms so Lane E6
  (search) can reuse them without re-deriving.

## Ports

Dev default: `:4030` (distinct from F6 Fastify API, F8 Bun WS gateway).
