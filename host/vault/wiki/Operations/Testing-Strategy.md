---
id: "722a425c-afe0-418e-9b92-2f6c8166b9e1"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Testing Strategy
tags: [testing, quality, ci, operations]
source: session-2026-04-07
---

# EMA Testing Strategy

## Priority 1: This Week
1. Claude.BridgeMock — fixture-based mock for LLM calls (CLAUDE_MOCK=true)
2. Proposal pipeline integration test (mocked, no real Claude)
3. GitHub Actions CI workflow
4. ExCoveralls setup (target: 70% core, 65% agents, 80% bridge)

## Priority 2: Next Week
5. GenServer test helper module (start_supervised patterns)
6. PubSub subscription tests for all pipeline GenServers
7. StreamData property tests for proposal/agent inputs

## Priority 3: Week 3
8. Golden/snapshot tests for generator/scorer outputs
9. Agent worker integration tests
10. Coverage reporting dashboard

## Key Libraries
- stream_data ~> 1.1 (property testing)
- excoveralls ~> 0.18 (coverage)
- mox ~> 1.0 (behaviour mocking)

## Mock Pattern
```elixir
defmodule Ema.Claude.BridgeMock do
  def run(prompt, opts \\ []) do
    cond do
      String.contains?(prompt, "generator") -> load_fixture("generator.json")
      String.contains?(prompt, "debate") -> load_fixture("debate.json")
      true -> {:ok, %{"result" => "mock response"}}
    end
  end
end
```
