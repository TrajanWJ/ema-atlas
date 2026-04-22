---
title: "Monty — Secure Python Interpreter Cross-Pollination for EMA"
created: 2026-04-04
updated: 2026-04-04
type: research
status: active
tags: [EMA, sandbox, Python, Rust, code-execution, agent-architecture]
---

# Monty — Secure Python Interpreter for Agent Code Execution

> **Source:** https://github.com/pydantic/monty (pydantic org)  
> **Researched:** 2026-04-04 by Right Hand  
> **Verdict: Watch. Not ready to integrate today — but the pattern is worth tracking as EMA's code execution story matures.**

---

## What Monty Is

A Rust-native Python interpreter (pip: `pydantic-monty`) designed specifically for running LLM-generated code safely. Built by the pydantic team, will power "code-mode" in PydanticAI.

**Core properties:**
- **<1μs startup** — no container spin-up, no subprocess fork
- **Blocks everything by default** — filesystem, env vars, network: all require explicit grants
- **Capability-based function grants** — you define what host functions the agent's Python code can call; it can't reach anything else
- **Snapshot/resume** — serialize interpreter state to bytes at any external function call boundary; resume in a different process, different machine, from a DB row
- **Type-checking included** — ships with `ty` (Astral's type checker) in a single binary
- **Resource limits** — configurable memory, stack depth, execution time; cancels on breach
- **Callable from Rust, Python, or JS/TS** — no CPython dependency

**Status:** Experimental. README says explicitly "not ready for prime time." GitHub CI is active, CodeCov tracked, pydantic org credibility is high, but it's pre-stable.

**What it cannot do:**
- Full stdlib (only: sys, os, typing, asyncio, re, datetime, json, dataclasses-soon)
- Third-party libraries (no Pydantic inside Monty — ironic)
- Class definitions (coming soon)
- Match statements (coming soon)

---

## API Surface

### Python API

```python
m = pydantic_monty.Monty(
    code,                    # Python string to run
    inputs=['prompt'],       # Variable names the caller must supply
    script_name='agent.py',
    type_check=True,         # Run ty typechecker before execution
    type_check_stubs=stubs,  # .pyi stubs describing host functions
)

# Run all-at-once (auto-resolves external function calls)
output = await m.run_async(
    inputs={'prompt': 'value'},
    external_functions={'call_llm': call_llm_fn},  # capability grant
)

# Or: iterative start/resume (control each function call)
progress = m.start(inputs={'url': 'https://example.com'})
# progress is FunctionSnapshot: .function_name, .args, .kwargs
result = progress.resume(return_value='fetched data')
```

### Serialization

```python
# Serialize mid-flight state
state = progress.dump()  # bytes
progress2 = pydantic_monty.load_snapshot(state)
result = progress2.resume(return_value='response data')
```

This is the killer feature: pause execution at any async boundary, persist to DB, resume from cold.

### Capability Model

You pass `external_functions={}` — a dict of Python callables. Agent code can only call functions in that dict. Everything else (`import os`, `open()`, network calls) raises or is blocked at the interpreter level. Virtual filesystem via `OSAccess([MemoryFile(...)])` — mount read-only data blobs as fake paths.

---

## EMA's Current Execution Architecture

EMA does **not currently execute Python code written by agents**. Its architecture:

```
EMA (Elixir/Phoenix daemon)
  └── Ema.Claude.Bridge (GenServer + Port)
        ├── Spawns Claude Code process via OS Port
        ├── Streams JSONL back
        └── AgentWorker handles tool call routing
```

**What happens during agent execution:**
1. EMA dispatches a task to the Bridge GenServer
2. Bridge spawns Claude Code CLI as an OS Port (supervised process)
3. Claude Code runs on the host with full system access — it IS the executor
4. Tool calls are made by Claude Code directly (bash, file reads, etc.)
5. Results stream back via JSONL

**There is no Python sandbox.** EMA doesn't ask agents to write Python to call tools — it asks Claude Code to call tools natively. The agent IS the tool executor.

**No existing sandbox approach:** EMA relies on Claude Code's own permission model (bypassPermissions in agent context) and Governance module circuit-breakers. No container, no restricted interpreter.

---

## Integration Analysis

### Where monty *would* fit in EMA

Monty is for **programmatic tool calling** — the pattern where instead of sequential JSON tool calls, the agent writes Python code that calls your functions as a script, and you run that script in a sandbox.

Example: Instead of Claude doing `[tool: read_file(path)][result: ...][tool: query_db(sql)][result: ...]`, it writes:
```python
data = read_file('/path/to/file')
rows = query_db(f"SELECT * FROM x WHERE id = {data['id']}")
return rows
```
...and you run that in monty with `read_file` and `query_db` as granted capabilities.

**This is a fundamentally different execution model from what EMA does today.** EMA would need to shift from "dispatch Claude Code and let it do tool calls" to "get Claude to write Python, run it in monty."

### Integration paths

**Path A: Elixir NIF (no)**  
Monty is a Rust library. Elixir can call Rust via NIFs. But a NIF crash takes down the BEAM VM — bad choice for untrusted agent code. Not recommended.

**Path B: Elixir Port process (possible, ugly)**  
Compile monty-cli as a standalone binary, call it via Port from Elixir. Doable but awkward: binary serialization/deserialization across a Port boundary for arbitrary Python execution. Medium complexity, reasonable isolation.

**Path C: HTTP sidecar (cleanest)**  
Run a small Python/FastAPI sidecar that exposes monty as an HTTP endpoint. EMA Bridge calls `POST /run` with {code, inputs, capabilities}. Sidecar runs monty, returns result. Elixir stays clean, monty stays in its native Python ecosystem. This is the integration path that makes sense if EMA ever goes there.

**Path D: Not applicable yet (current reality)**  
EMA's execution model doesn't generate Python code for tool-calling today. This would require a product direction change: "ask agents to write Python scripts instead of natural-language tool calls."

### What it would unlock

If EMA adopted programmatic tool calling via monty:
- **Parallel tool execution natively** — agent writes `asyncio.gather(fetch_x(), fetch_y())` instead of sequential calls. 3-5x speed on multi-tool tasks.
- **Auditable agent actions** — the Python script IS the audit trail. You know exactly what the agent decided to do before running it.
- **Safe execution scope** — no accidental `rm -rf` from a confused agent; only granted capabilities can be called
- **Snapshot/resume** — mid-task interruption becomes trivial: dump state to DB, resume after network blip or restart
- **Cost reduction** — fewer LLM tokens spent on tool-call JSON scaffolding; one generation = one Python script = N tool calls

---

## Verdict

**Watch. Not now.**

**Why not now:**
1. Experimental — "not ready for prime time" by author's own README
2. EMA has no programmatic tool calling pattern yet — adopting monty requires building that pattern first
3. Integration path (Port or sidecar) adds operational complexity with unclear payoff for EMA's current scale
4. EMA's current bottleneck is not sandbox safety — it's campaign orchestration and planning quality

**Why watch:**
1. Pydantic org credibility — this will ship stable and become the standard way to run agent code in Python stacks
2. PydanticAI integration is planned — when code-mode lands in PydanticAI, monty will be battle-tested
3. Snapshot/resume is genuinely novel — if EMA ever needs long-running resumable agent tasks, this solves it cleanly
4. The capability-based API is the right abstraction — `external_functions={}` is cleaner than any sandbox-with-allowlists approach

**If/when to revisit:**
- When EMA's Campaign Manager (Feature 9) ships and campaigns need parallel tool execution
- When monty hits v1.0 or PydanticAI code-mode ships
- When EMA has a concrete need for "agent writes a script, EMA runs it safely" — e.g., data analysis tasks, report generation, formula evaluation

**Integration recommendation when the time comes:**  
HTTP sidecar pattern. Small FastAPI service wrapping monty, capability set defined per task type, snapshot blobs stored in EMA's DB alongside session state. Elixir calls it via Req with 30s timeout.

---

## Links

- Repo: https://github.com/pydantic/monty
- PyPI: https://pypi.org/project/pydantic-monty/
- SQL example: `examples/sql_playground/`
- Web scraper example: `examples/web_scraper/`
- Anthropic's programmatic tool calling: https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling
- EMA Bridge architecture: `~/Projects/ema/docs/ARCHITECTURE.md`
