---
title: "Bridge Async Contract"
created: 2026-04-03
updated: 2026-04-03
type: architecture
status: active
confidence: 0.88
tags: [bridge, async, dispatch, ema, openClaw, architecture, week-7]
summary: "Current Bridge is sync/blocking. Design for async dispatch with callbacks. Recommendation: event stream (Phoenix PubSub) as primary pattern. Long-polling for HQ. Code sketches for both."
author: Security Agent (intelligence-integrations task)
---

# Bridge Async Contract

> **Problem:** Current `Ema.Claude.Runner` is synchronous and blocking — the UI waits for the entire agent execution to complete.  
> **Goal:** Async dispatch where EMA fires off an agent task, the UI continues, and results stream back as events.

---

## 1. Current State (Sync Dispatch)

```
EMA UI                  EMA Daemon              Claude CLI
  │                         │                       │
  │  POST /api/dispatch      │                       │
  ├────────────────────────►│                       │
  │                         │  System.cmd("claude") │
  │   waiting...            ├──────────────────────►│
  │   waiting...            │   blocking...         │  (2-5 minutes)
  │   waiting...            │   waiting...          │
  │   waiting...            │◄──────────────────────┤
  │◄────────────────────────┤  {:ok, %{result: ...}}│
  │  {result}               │                       │
```

**Problems:**
1. HTTP request hangs for 2-5 minutes. Tauri/frontend times out.
2. No streaming updates — Trajan can't see progress.
3. One stuck execution blocks subsequent dispatches (if single GenServer).
4. No way to cancel mid-execution.
5. WebSocket `executions:all` channel exists but the Runner doesn't feed it.

---

## 2. Target Architecture (Async Dispatch)

```
EMA UI                  EMA Daemon              Claude CLI
  │                         │                       │
  │  POST /api/dispatch      │                       │
  ├────────────────────────►│                       │
  │◄────────────────────────┤                       │
  │  202 Accepted           │  spawn Bridge         │
  │  {execution_id: "ex_7"} │  (async)              │
  │                         ├──────────────────────►│
  │                         │                       │  (running)
  │  [subscribe to WS]      │  stream-json events ◄─┤
  │◄─ event: {type:text, ...}│◄─ JSONL line          │
  │◄─ event: {type:tool,...} │◄─ JSONL line          │
  │◄─ event: {completed,...} │◄─ JSONL line          │
  │                         │  write back result    │
```

**Properties:**
1. HTTP dispatch returns immediately with `execution_id`
2. UI subscribes to WebSocket channel for that execution
3. Events stream as Claude produces them
4. Cancellation sends SIGTERM to the Port subprocess
5. Daemon is never blocked — each execution runs in its own GenServer

---

## 3. Pattern Comparison

### Option A: Event Stream (Phoenix PubSub → WebSocket)

**How it works:**
- Bridge GenServer receives Claude stream-json events from Port
- Each event is broadcast via `Phoenix.PubSub.broadcast/3` to `executions:{id}`
- Frontend subscribes to WebSocket channel `ExecutionChannel`
- ExecutionChannel forwards PubSub events to the WebSocket socket

**Latency:** ~1-5ms from Claude output to frontend receipt.
**Complexity:** Low — Phoenix already has WebSocket infrastructure.
**Reconnect:** Phoenix channels handle reconnect/replay with `join` + missed events from DB.
**Superman integration:** Superman receives events via PubSub subscription directly.
**Cancellation:** Bridge handles `stop` message → sends SIGTERM to Port.

**✅ Recommended for primary streaming path.**

---

### Option B: Long-Polling (HTTP)

**How it works:**
- POST /api/dispatch → 202, execution_id
- GET /api/executions/:id/events?since=0 → blocks until new events or timeout (30s)
- Client re-polls immediately on response
- Bridge writes events to DB, long-poll serves from DB

**Latency:** 0-30s (depends on poll interval). Sub-optimal for live streaming.
**Complexity:** Medium — need event table, indexed by execution_id + sequence.
**Reconnect:** Trivial — just re-poll with `?since=last_seq`.
**Use case:** HQ dashboard when WebSocket not available, or external integrations.

**✅ Recommended as fallback/secondary for non-WS clients.**

---

### Option C: Webhooks

**How it works:**
- Caller registers a callback URL at dispatch time
- Bridge POSTs events to callback URL as they occur

**Latency:** Depends on callback server RTT.
**Complexity:** High — caller needs to run an HTTP server.
**Use case:** External systems that call EMA as a service.

**❌ Not applicable for current EMA architecture.** EMA UI and daemon are the same process pair. Webhooks are for external callers.

---

## 4. Chosen Architecture: Event Stream + Long-Poll Fallback

```
┌─────────────────────────────────────────────────────────────────┐
│  Async Dispatch Architecture                                     │
│                                                                  │
│  ┌──────────┐   POST /dispatch   ┌─────────────────────────┐   │
│  │ EMA UI   ├───────────────────►│ DispatchController      │   │
│  │ (Tauri)  │   202 {exec_id}    │ - Creates Execution row │   │
│  └────┬─────┘◄───────────────────│ - Spawns Bridge worker  │   │
│       │                          │ - Returns immediately   │   │
│       │ WS subscribe             └─────────────────────────┘   │
│       │ "executions:{id}"                  │                    │
│       │                          ┌─────────▼─────────────────┐ │
│       │                          │ Ema.Claude.Bridge         │ │
│       │                          │ (GenServer, per execution) │ │
│       │  WS event                │ - Opens Port subprocess   │ │
│       │◄─────────────────────────│ - Parses stream-json JSONL│ │
│       │                          │ - Broadcasts via PubSub   │ │
│       │                          │ - Writes result to DB     │ │
│       │                          └───────────────────────────┘ │
│                                            │                    │
│  ┌──────────────────────────────────────────┘                   │
│  │ PubSub → ExecutionChannel → WebSocket                        │
│  │ PubSub → Superman.ContextUpdater (if execution creates data) │
│  └──────────────────────────────────────────────────────────────┘
│                                                                  │
│  Long-poll fallback:                                             │
│  GET /api/executions/:id/events?since=0 (HQ or external)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Sketch A: Event Stream (Primary)

### 5.1 Dispatch Controller

```elixir
defmodule EmaWeb.DispatchController do
  use EmaWeb, :controller
  
  def create(conn, %{"proposal_id" => proposal_id} = params) do
    proposal = Ema.Proposals.get_proposal!(proposal_id)
    project = Ema.Projects.get_project!(proposal.project_id)
    
    # Build context (Superman enrichment)
    context = Superman.Context.for_project(project.id, max_tokens: 2000)
    
    # Create execution record
    {:ok, execution} = Ema.Executions.create(%{
      proposal_id: proposal.id,
      project_id: project.id,
      status: :queued,
      agent_role: params["agent_role"] || "coder"
    })
    
    # Spawn Bridge worker async — do not wait
    {:ok, _pid} = Ema.Claude.BridgeSupervisor.start_worker(%{
      execution_id: execution.id,
      proposal: proposal,
      project: project,
      superman_context: context,
      model: params["model"] || "sonnet"
    })
    
    conn
    |> put_status(202)
    |> json(%{
      execution_id: execution.id,
      status: "queued",
      stream_channel: "executions:#{execution.id}",
      poll_url: "/api/executions/#{execution.id}/events"
    })
  end
  
  def cancel(conn, %{"id" => execution_id}) do
    case Ema.Claude.BridgeSupervisor.stop_worker(execution_id) do
      :ok -> json(conn, %{status: "cancelled"})
      {:error, :not_found} -> send_resp(conn, 404, "Not found")
    end
  end
end
```

### 5.2 Bridge GenServer

```elixir
defmodule Ema.Claude.Bridge do
  use GenServer
  require Logger
  
  @claude_cmd "claude"
  @default_args [
    "--print",
    "--output-format", "stream-json",
    "--input-format", "json",
    "--permission-mode", "bypassPermissions"
  ]
  
  defstruct [
    :execution_id, :port, :model, :buffer,
    :status, :cost_usd, :session_id,
    :started_at
  ]
  
  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end
  
  @impl true
  def init(%{execution_id: exec_id, proposal: proposal, 
             project: project, superman_context: ctx, model: model}) do
    # Build enriched prompt
    prompt = build_prompt(proposal, ctx)
    
    # Open Claude CLI as Port subprocess
    args = @default_args ++ ["--model", model]
    port = Port.open({:spawn_executable, System.find_executable(@claude_cmd)},
      [:binary, :exit_status, {:args, args}])
    
    # Send the prompt to stdin
    input_json = Jason.encode!(%{prompt: prompt, project: project.path})
    Port.command(port, input_json <> "\n")
    
    # Update execution status
    Ema.Executions.update(exec_id, %{status: :running, started_at: DateTime.utc_now()})
    
    # Broadcast start event
    broadcast(exec_id, %{type: "started", execution_id: exec_id, timestamp: DateTime.utc_now()})
    
    {:ok, %__MODULE__{
      execution_id: exec_id,
      port: port,
      model: model,
      buffer: "",
      status: :running,
      started_at: DateTime.utc_now()
    }}
  end
  
  @impl true
  def handle_info({port, {:data, data}}, %{port: port} = state) do
    # Append to buffer and process complete JSONL lines
    full_buffer = state.buffer <> data
    {lines, remainder} = split_lines(full_buffer)
    
    new_state = Enum.reduce(lines, %{state | buffer: remainder}, fn line, acc ->
      process_jsonl_line(line, acc)
    end)
    
    {:noreply, new_state}
  end
  
  @impl true
  def handle_info({port, {:exit_status, status}}, %{port: port} = state) do
    Logger.info("[Bridge] Claude exited with status #{status} for execution #{state.execution_id}")
    
    # Update execution to completed/failed based on whether we got a result
    final_status = if state.status == :completed, do: :completed, else: :failed
    Ema.Executions.update(state.execution_id, %{
      status: final_status,
      completed_at: DateTime.utc_now(),
      cost_usd: state.cost_usd
    })
    
    broadcast(state.execution_id, %{
      type: "execution_done",
      execution_id: state.execution_id,
      status: final_status,
      cost_usd: state.cost_usd
    })
    
    {:stop, :normal, state}
  end
  
  @impl true
  def handle_cast(:stop, state) do
    Port.close(state.port)
    {:stop, :normal, state}
  end
  
  # --- Private ---
  
  defp process_jsonl_line(line, state) do
    case Jason.decode(line) do
      {:ok, event} -> handle_event(event, state)
      {:error, _} -> 
        Logger.warning("[Bridge] Malformed JSONL: #{inspect(line)}")
        state
    end
  end
  
  defp handle_event(%{"type" => "assistant", "message" => msg}, state) do
    # Broadcast text content to frontend
    text = extract_text(msg)
    if text && text != "" do
      broadcast(state.execution_id, %{
        type: "text_delta",
        execution_id: state.execution_id,
        text: text
      })
    end
    state
  end
  
  defp handle_event(%{"type" => "content_block_start", 
                      "content_block" => %{"type" => "tool_use", "name" => tool_name}}, state) do
    broadcast(state.execution_id, %{
      type: "tool_start",
      execution_id: state.execution_id,
      tool: tool_name
    })
    state
  end
  
  defp handle_event(%{"type" => "result", "subtype" => "success"} = event, state) do
    result_text = event["result"] || ""
    cost = get_in(event, ["usage", "cost_usd"]) || 0.0
    session_id = event["session_id"]
    
    # Write result back to DB
    Ema.Executions.update(state.execution_id, %{
      result: result_text,
      session_id: session_id,
      status: :completed
    })
    
    broadcast(state.execution_id, %{
      type: "result",
      execution_id: state.execution_id,
      result: result_text,
      cost_usd: cost,
      session_id: session_id
    })
    
    %{state | status: :completed, cost_usd: cost, session_id: session_id}
  end
  
  defp handle_event(_event, state), do: state
  
  defp broadcast(execution_id, payload) do
    Phoenix.PubSub.broadcast(
      Ema.PubSub, 
      "executions:#{execution_id}",
      {:execution_event, payload}
    )
    
    # Also broadcast to the global feed
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "executions:all",
      {:execution_event, payload}
    )
  end
  
  defp build_prompt(proposal, superman_context) do
    context_block = Superman.Context.as_prompt_block_from_struct(superman_context)
    "#{context_block}\n\n---\n\n#{proposal.content}"
  end
  
  defp split_lines(buffer) do
    lines = String.split(buffer, "\n")
    {Enum.slice(lines, 0..-2//1), List.last(lines) || ""}
  end
  
  defp extract_text(%{"content" => content}) when is_list(content) do
    content
    |> Enum.filter(&(&1["type"] == "text"))
    |> Enum.map(& &1["text"])
    |> Enum.join("")
  end
  defp extract_text(_), do: ""
end
```

### 5.3 WebSocket Channel

```elixir
defmodule EmaWeb.ExecutionChannel do
  use EmaWeb, :channel
  
  def join("executions:" <> execution_id, _params, socket) do
    # Subscribe to PubSub for this execution
    Phoenix.PubSub.subscribe(Ema.PubSub, "executions:#{execution_id}")
    
    # Send buffered events from DB (for reconnect case)
    events = Ema.Executions.get_events(execution_id, since: 0)
    Enum.each(events, fn event ->
      push(socket, "event", event)
    end)
    
    {:ok, assign(socket, :execution_id, execution_id)}
  end
  
  def join("executions:all", _params, socket) do
    Phoenix.PubSub.subscribe(Ema.PubSub, "executions:all")
    {:ok, socket}
  end
  
  def handle_in("cancel", _payload, socket) do
    execution_id = socket.assigns.execution_id
    Ema.Claude.BridgeSupervisor.stop_worker(execution_id)
    {:reply, :ok, socket}
  end
  
  def handle_info({:execution_event, payload}, socket) do
    push(socket, "event", payload)
    {:noreply, socket}
  end
end
```

### 5.4 Bridge Supervisor

```elixir
defmodule Ema.Claude.BridgeSupervisor do
  use DynamicSupervisor
  
  def start_link(opts) do
    DynamicSupervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    DynamicSupervisor.init(strategy: :one_for_one, max_children: 10)
  end
  
  def start_worker(opts) do
    spec = {Ema.Claude.Bridge, opts}
    DynamicSupervisor.start_child(__MODULE__, spec)
  end
  
  def stop_worker(execution_id) do
    case find_worker(execution_id) do
      nil -> {:error, :not_found}
      pid ->
        GenServer.cast(pid, :stop)
        :ok
    end
  end
  
  defp find_worker(execution_id) do
    DynamicSupervisor.which_children(__MODULE__)
    |> Enum.find_value(fn {_, pid, _, _} ->
      case GenServer.call(pid, :get_execution_id, 1_000) do
        ^execution_id -> pid
        _ -> nil
      end
    end)
  end
end
```

---

## 6. Implementation Sketch B: Long-Polling Fallback

For HQ dashboard (which may not use Phoenix WebSocket directly) or external API consumers:

### 6.1 Event Store

```elixir
defmodule Ema.ExecutionEvents do
  use Ecto.Schema
  
  schema "execution_events" do
    field :execution_id, :string
    field :seq, :integer          # monotonic sequence per execution
    field :type, :string          # "text_delta", "tool_start", "result", etc.
    field :payload, :map          # full event payload
    timestamps()
  end
  
  # Called from Bridge.broadcast/2 — write to DB alongside PubSub broadcast
  def append(execution_id, event) do
    seq = next_seq(execution_id)
    %__MODULE__{}
    |> changeset(%{execution_id: execution_id, seq: seq, type: event.type, payload: event})
    |> Ema.Repo.insert!()
  end
  
  def since(execution_id, seq) do
    from(e in __MODULE__,
      where: e.execution_id == ^execution_id and e.seq > ^seq,
      order_by: [asc: e.seq],
      limit: 100
    ) |> Ema.Repo.all()
  end
end
```

### 6.2 Long-Poll Controller

```elixir
defmodule EmaWeb.ExecutionEventsController do
  use EmaWeb, :controller
  
  @poll_timeout_ms 30_000
  @poll_check_interval_ms 500
  
  def index(conn, %{"id" => execution_id, "since" => since_seq}) do
    since = String.to_integer(since_seq)
    
    # Check for existing events first (non-blocking)
    events = Ema.ExecutionEvents.since(execution_id, since)
    
    if Enum.any?(events) do
      # Events available immediately — return now
      json(conn, %{
        execution_id: execution_id,
        events: Enum.map(events, &format_event/1),
        next_since: List.last(events).seq
      })
    else
      # Block until events arrive or timeout
      deadline = System.monotonic_time(:millisecond) + @poll_timeout_ms
      poll_loop(conn, execution_id, since, deadline)
    end
  end
  
  defp poll_loop(conn, execution_id, since, deadline) do
    now = System.monotonic_time(:millisecond)
    
    if now >= deadline do
      # Timeout — return empty (client re-polls)
      json(conn, %{
        execution_id: execution_id,
        events: [],
        next_since: since
      })
    else
      events = Ema.ExecutionEvents.since(execution_id, since)
      
      if Enum.any?(events) do
        json(conn, %{
          execution_id: execution_id,
          events: Enum.map(events, &format_event/1),
          next_since: List.last(events).seq
        })
      else
        Process.sleep(@poll_check_interval_ms)
        poll_loop(conn, execution_id, since, deadline)
      end
    end
  end
end
```

### 6.3 HQ Frontend (Long-Poll Client)

```typescript
// lib/executions/poller.ts
export class ExecutionPoller {
  private executionId: string
  private since: number = 0
  private running = false
  private onEvent: (event: ExecutionEvent) => void

  constructor(executionId: string, onEvent: (event: ExecutionEvent) => void) {
    this.executionId = executionId
    this.onEvent = onEvent
  }

  start() {
    this.running = true
    this.poll()
  }

  stop() {
    this.running = false
  }

  private async poll() {
    while (this.running) {
      try {
        const res = await fetch(
          `/api/executions/${this.executionId}/events?since=${this.since}`,
          { signal: AbortSignal.timeout(35_000) }
        )
        const data = await res.json()
        
        for (const event of data.events) {
          this.onEvent(event)
          if (event.type === 'execution_done') {
            this.stop()
            return
          }
        }
        
        this.since = data.next_since ?? this.since
      } catch (err) {
        // Network error or timeout — retry after 1s
        await sleep(1000)
      }
    }
  }
}

// Usage in HQ dispatch flow:
async function dispatchProposal(proposalId: string) {
  const res = await fetch('/api/dispatch', {
    method: 'POST',
    body: JSON.stringify({ proposal_id: proposalId }),
  })
  const { execution_id } = await res.json()

  const poller = new ExecutionPoller(execution_id, (event) => {
    executionStore.addEvent(execution_id, event)
  })
  poller.start()

  return execution_id
}
```

---

## 7. Superman Integration with Async Dispatch

Superman receives callbacks via PubSub — no separate integration needed:

```elixir
defmodule Superman.ExecutionObserver do
  @moduledoc """
  Observes execution events to update Superman index after completions.
  When an execution completes, the result may contain new vault-worthy data.
  """
  
  use GenServer
  
  def start_link(_) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end
  
  @impl true
  def init(_) do
    Phoenix.PubSub.subscribe(Ema.PubSub, "executions:all")
    {:ok, %{}}
  end
  
  @impl true
  def handle_info({:execution_event, %{type: "result", execution_id: exec_id}}, state) do
    # Re-index this execution's result
    execution = Ema.Executions.get_execution!(exec_id)
    Superman.Indexer.queue(:execution, exec_id, execution)
    {:noreply, state}
  end
  
  def handle_info(_, state), do: {:noreply, state}
end
```

---

## 8. Migration Path from Current Runner

```
Phase 1 (Week 7 — DO THIS):
  - Add BridgeSupervisor to supervision tree
  - Implement Bridge GenServer (streaming)
  - Add execution_events table migration
  - Wire DispatchController (async path)
  - Add ExecutionChannel (WebSocket)
  
  Keep Runner.run() for backward compat:
    def run(prompt, opts), do: Bridge.run_sync(prompt, opts)
    Bridge.run_sync wraps async dispatch with a 120s receive wait
    This preserves any existing sync callsites

Phase 2 (Week 8):
  - Remove all Runner.run() callsites (identified: 6 in proposal pipeline)
  - Replace with Bridge.dispatch_async()
  - Update frontend to subscribe to WebSocket channel instead of waiting
  - Add long-poll endpoint for HQ fallback

Phase 3 (Week 9+):
  - Add cancellation UI
  - Add execution replay (join channel, receive DB-buffered events)
  - Add cost tracking from stream events
  - Multi-turn session support (resume_session_id)
```

---

## 9. Event Type Reference

| Event Type | When | Payload |
|---|---|---|
| `started` | Bridge init | `{execution_id, timestamp}` |
| `text_delta` | Claude text output | `{execution_id, text}` |
| `tool_start` | Claude tool call begins | `{execution_id, tool}` |
| `tool_complete` | Claude tool call done | `{execution_id, tool, output_preview}` |
| `result` | Claude finishes successfully | `{execution_id, result, cost_usd, session_id}` |
| `execution_done` | Bridge shuts down | `{execution_id, status, cost_usd}` |
| `error` | Bridge or Claude errors | `{execution_id, error, message}` |
| `cancelled` | User or system cancels | `{execution_id, cancelled_by}` |

---

*Cross-references: `EMA-Claude-Bridge-Design.md`, `EMA-Phase-2-Corrected-Roadmap-2026-04-03.md`, `SUPERMAN-CONTEXT-FORMAT-SPEC.md`*
