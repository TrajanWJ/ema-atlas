# EMA Atlas — HTTP API Spec

A short, OpenAPI-flavored description of every read-only HTTP endpoint the
atlas exposes. The atlas is a static-leaning Next.js 15 App Router site, so
"endpoint" here means "URL the public can fetch over HTTP". There are no
write endpoints.

- **Base URL:** the atlas root (e.g. `http://localhost:3000` in dev, or the
  deployed origin).
- **Auth:** none. Everything is public.
- **Default response:** `text/html; charset=utf-8` for pages, `application/json`
  for `/api/*`.

The `Stability` column uses three values:

| Value     | Meaning                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `stable`  | Implemented, expected to keep this URL + response shape.                |
| `sketch`  | Implemented but the page/data shape is still being shaped — may change. |
| `planned` | URL is reserved / referenced from elsewhere but may not yet render.     |

## Endpoints

| Path                    | Method | Params                                              | Response                                              | Stability |
| ----------------------- | ------ | --------------------------------------------------- | ----------------------------------------------------- | --------- |
| `/`                     | GET    | —                                                   | HTML (atlas landing page)                             | stable    |
| `/api/graph`            | GET    | —                                                   | `application/json` — full `graph.json` document       | stable    |
| `/api/graph/{topic}`    | GET    | path: `topic` (slug, matches `graph/edges/*.md`)    | `application/json` — single topic slice (see below)   | stable    |
| `/parts`                | GET    | —                                                   | HTML — index of system parts                          | stable    |
| `/parts/{slug}`         | GET    | path: `slug`                                        | HTML — single part detail                             | stable    |
| `/briefs/{slug}`        | GET    | path: `slug`                                        | HTML — long-form brief                                | stable    |
| `/slides/{slug}`        | GET    | path: `slug`                                        | HTML — slide deck rendering                           | sketch    |
| `/canvas/{slug}`        | GET    | path: `slug`                                        | HTML — canvas / diagram view                          | sketch    |
| `/futures-board`        | GET    | —                                                   | HTML — futures board                                  | sketch    |
| `/decisions`            | GET    | —                                                   | HTML — decisions index                                | stable    |
| `/questions`            | GET    | —                                                   | HTML — open questions list                            | stable    |
| `/timeline`             | GET    | —                                                   | HTML — project timeline                               | stable    |
| `/research`             | GET    | —                                                   | HTML — research index                                 | sketch    |
| `/research/{slug}`      | GET    | path: `slug`                                        | HTML — research note                                  | sketch    |
| `/vapps`                | GET    | —                                                   | HTML — virtual-apps index                             | sketch    |
| `/vapps/{slug}`         | GET    | path: `slug`                                        | HTML — single vapp                                    | sketch    |
| `/docs`                 | GET    | —                                                   | HTML — docs index                                     | stable    |
| `/docs/{slug}`          | GET    | path: `slug`                                        | HTML — single doc                                     | stable    |
| `/artifacts`            | GET    | —                                                   | HTML — artifacts index                                | sketch    |
| `/demo`                 | GET    | —                                                   | HTML — demo surface                                   | sketch    |
| `/desktop`              | GET    | —                                                   | HTML — desktop / shell preview                        | sketch    |
| `/graph`                | GET    | —                                                   | HTML — system graph visualization                     | stable    |
| `/launchpad`            | GET    | —                                                   | HTML — launchpad / entry surface                      | sketch    |
| `/showroom`             | GET    | —                                                   | HTML — showroom of finished pieces                    | sketch    |
| `/program`              | GET    | —                                                   | HTML — program plan                                   | planned   |

## Response shapes (JSON endpoints)

### `GET /api/graph`

Returns the full `graph.json` document verbatim (parsed and re-serialized).
Top-level keys today include:

- `schema_version` — integer, currently `1`.
- `generated_at` — ISO-8601 timestamp of when the graph was built.
- `repo` — string, source repository identifier.
- `canonical_rule` — short string: the headline rule of the system.
- additional manifest keys describing nodes, edges, and topics.

Headers:

- `Content-Type: application/json`
- `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`

### `GET /api/graph/{topic}`

Returns a single topic slice parsed from `graph/edges/<topic>.md`.

Path parameter:

- `topic` — slug, must match `^[a-z0-9][a-z0-9-]*$` and correspond to an
  existing file in `graph/edges/`. Examples: `authority`, `collab`,
  `execution`, `identity`, `memory`, `orchestration`, `recovery`,
  `surfaces`, `transport`, `ux-metaphor`, `workspace`.

Response body:

```json
{
  "topic": "authority",
  "rule": "EMA owns truth. Authority lives in the Elixir daemon's control_plane/. No other node may store canonical state.",
  "primary_nodes": ["codebase-ema — code/ema/daemon/lib/ema/control_plane/ (...)"],
  "secondary_nodes": [],
  "cross_references": ["02-project-transfer-brief.md §2, §4"]
}
```

Field semantics:

- `topic` — echoed slug.
- `rule` — the `**Rule:**` paragraph from the markdown, or `null` if absent.
- `primary_nodes` — bullet list under `## Primary`.
- `secondary_nodes` — bullet list under `## Secondary`.
- `cross_references` — bullet list under `## Cross-references`.

Error responses:

- `400 { "error": "invalid_topic", "topic": "..." }` — slug failed validation.
- `404 { "error": "topic_not_found", "topic": "..." }` — no matching edge file.

Headers (success):

- `Content-Type: application/json`
- `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`
