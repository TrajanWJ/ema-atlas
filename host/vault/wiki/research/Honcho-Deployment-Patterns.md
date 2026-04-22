---
title: Honcho Deployment Patterns — Research Report
created: '2026-04-03'
updated: '2026-04-03'
type: research
confidence: 0.65
tags:
  - honcho
  - memory
  - agent-memory
  - deployment
  - ema
  - integration
summary: >-
  Honcho v3 is API-key managed (app.honcho.dev), not Docker self-hosted. The
  'one docker command' assumption is stale. Sign up, get key, use managed
  service or find v2 for self-host.
sources: '2 primary, 0 institutional, 0 secondary'
wiki_id: research/Honcho-Deployment-Patterns
imported_from: vault/Research/Honcho-Deployment-Patterns.md
imported_at: '2026-04-04T00:23:57.043Z'
---

# Honcho Deployment Patterns

*Sources: 2 total (2 primary, 0 institutional, 0 secondary)*
*Confidence: Medium (0.65) — self-hosting docs not found, v2→v3 migration details unclear*
*Date: 2026-04-03*

## Summary

**The "docker run -d -p 8000:8000 plasticlabs/honcho:latest" one-liner in the planning doc is likely stale or wrong for v3.** Honcho v3 (current) is a managed service requiring an API key from app.honcho.dev. There is no `/self-hosting` documentation page — it returns 404. The quickstart explicitly requires an API key and references app.honcho.dev for account creation. Free tier: $100 credits on signup, ~$0.04 per quickstart run. This changes the deployment decision.

## Findings

### Honcho v3 Architecture — Managed Service, Not Self-Hosted

Honcho v3 uses four storage primitives:
- **Workspaces** — top-level containers per application/environment
- **Peers** — any entity that persists and changes over time (users, agents, objects)
- **Sessions** — interaction threads between peers with temporal boundaries
- **Messages** — units of data that trigger background reasoning

When messages are written, Honcho runs background reasoning (described as "formal logical reasoning") to generate *representations* — persistent conclusions about each peer. These representations are queryable for injecting context into agent prompts.

The managed service runs the reasoning backend. There is no documented way to self-host v3.

### Self-Hosting Status

`/self-hosting` returns 404. No self-hosting documentation exists in the v3 docs tree. The Docker image `plasticlabs/honcho:latest` may exist (referenced in the planning doc and in a GitHub repo snippet from a prior session) but corresponds to v2 or an older architecture — not the current v3 reasoning model.

**Implication:** The planning doc's "one docker command" is wrong for the current version. Options:
1. Use the managed service (app.honcho.dev) — API key, $100 free credits, easiest path
2. Find and use Honcho v2 (older, Docker-hostable) — loses the reasoning layer
3. Wait/check GitHub for v3 self-host option — may exist as a community contribution

### Session Boundary Decision

Honcho's data model supports flexible session boundaries. For EMA's use case:
- **Per-dispatch session** — each agent task is its own session. Clean separation, but low-signal for reasoning (short conversations).
- **Per-project session** — one session per EMA project, accumulating all agent interactions. Higher signal, more continuity.
- **Per-day session** — rolling daily sessions. Balances recency with continuity.

**Recommendation:** Per-project session boundary. EMA's agent tasks for a given project are semantically related — the reasoning layer benefits from seeing them together. A dispatch for StudioKamel builds on prior StudioKamel dispatches.

### Elixir Integration

No official Elixir SDK exists. Integration via `Req` (HTTP client) against Honcho's REST API is the correct approach. The API is a standard FastAPI/REST service.

```elixir
# Ema.Honcho module pattern
defmodule Ema.Honcho do
  @base_url "https://api.honcho.dev"  # or localhost:8000 for self-hosted v2
  
  def store_session(session_id, messages) do
    Req.post!("#{@base_url}/v3/workspaces/ema/sessions/#{session_id}/messages",
      json: %{messages: messages},
      headers: [{"Authorization", "Bearer #{api_key()}"}]
    )
  end
  
  def query_user(question) do
    Req.post!("#{@base_url}/v3/workspaces/ema/peers/trajan/query",
      json: %{query: question},
      headers: [{"Authorization", "Bearer #{api_key()}"}]
    )
  end
  
  def session_context(session_id, opts \\ []) do
    tokens = Keyword.get(opts, :tokens, 10_000)
    Req.get!("#{@base_url}/v3/workspaces/ema/sessions/#{session_id}/context?max_tokens=#{tokens}",
      headers: [{"Authorization", "Bearer #{api_key()}"}]
    )
  end
end
```

### Dreaming / Background Reasoning

Honcho's reasoning runs asynchronously after messages are written. At low session volume (single heavy user), this is fine — reasoning triggers on message ingestion, not on volume thresholds. No documented minimum session count required. The `$0.04` cost for a 14-message test confirms reasoning cost is per-message, not per-session.

### Known Production Gotchas

From docs and quickstart (T1 sources only — no community failure reports found):
- **API key required** — no key = no Honcho. Get from app.honcho.dev before starting.
- **Async reasoning** — querying immediately after writing may return stale representations. Design for eventual consistency.
- **Token budget** — representations are queryable with a `max_tokens` parameter. Set conservatively for pre-dispatch injection (1,000-2,000 tokens is sufficient for context injection).
- **Workspace isolation** — use separate workspace IDs per environment (ema-production, ema-dev).

## Key Takeaways

1. **Get the API key first** — the self-hosted path is not confirmed for v3. Use managed service.
2. **Session boundary: per-project** — accumulate all project agent interactions in one session.
3. **Three integration points in EMA:**
   - `store_session` → called in SessionHarvester completion hook
   - `query_user` → called in Dispatcher pre-spawn prompt injection
   - `session_context` → called in scope advisor flow
4. **Budget 1,000-2,000 tokens** for Honcho context injection into agent prompts.
5. **Async-safe** — don't query for context immediately after writing; query at spawn time using prior session's representations.

## Uncertain / Unknown

- Whether v3 supports self-hosting at all (no docs found, 404 on /self-hosting)
- Exact Docker image version for self-hostable Honcho (v2 likely)
- Latency of the reasoning pipeline in practice (not documented)
- Whether the free $100 credit is sufficient for EMA's sustained usage

## Open Questions

1. Does plasticlabs/honcho:latest on DockerHub correspond to v2 or v3? Check: `docker pull plasticlabs/honcho:latest && docker inspect`
2. Is there a v3 self-hosting option in the GitHub repo that isn't documented yet?

## Sources

1. [T1] [Honcho v3 Overview](https://docs.honcho.dev/v3/documentation/introduction/overview.md) — primary docs, architecture, primitives
2. [T1] [Honcho v3 Quickstart](https://docs.honcho.dev/v3/documentation/introduction/quickstart) — API key requirement, pricing, integration patterns
