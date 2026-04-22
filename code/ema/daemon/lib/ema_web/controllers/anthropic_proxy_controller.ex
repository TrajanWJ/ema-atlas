defmodule EmaWeb.AnthropicProxyController do
  @moduledoc """
  Anthropic API-compatible proxy that routes requests through EMA's Surfaces layer.

  OpenClaw and other tools that call the Anthropic API directly can point their
  baseUrl at this endpoint. Requests are translated into ClaudeSession invocations,
  which use the `claude` CLI with built-in OAuth (plan-included usage, not extra usage).

  Supports:
  - POST /v1/messages — standard Anthropic messages API
  - Streaming (SSE) and non-streaming responses
  - All Claude models (opus, sonnet, haiku)
  - System prompts, multi-turn conversations, tool use

  This gives OpenClaw's embedded agent the same auth path as the CLI —
  no "third-party extra usage" wall.
  """

  use EmaWeb, :controller
  require Logger

  alias Ema.ControlPlane.Store
  alias Ema.Surfaces.{Supervisor, ClaudeSession, SessionPool}

  @doc """
  POST /v1/messages — Anthropic Messages API compatible endpoint.

  Translates the Anthropic API request into a claude CLI invocation via Surfaces.
  """
  def create_message(conn, params) do
    model = Map.get(params, "model", "claude-sonnet-4-6")
    messages = Map.get(params, "messages", [])
    system = Map.get(params, "system")
    max_tokens = Map.get(params, "max_tokens", 4096)
    stream = Map.get(params, "stream", false)
    # tools and thinking params are accepted but handled by the CLI internally
    _tools = Map.get(params, "tools", [])
    _thinking = Map.get(params, "thinking")

    # Normalize model name (strip provider prefix if present)
    cli_model = normalize_model(model)

    # Build prompt from messages
    prompt = build_prompt(messages, system)

    control = begin_control_plane_flow(prompt, cli_model, params)

    # Get or create a session for this model
    session_id = get_or_create_session(cli_model)

    if stream do
      stream_response(conn, session_id, prompt, cli_model, max_tokens, control)
    else
      sync_response(conn, session_id, prompt, cli_model, max_tokens, model, control)
    end
  end

  defp sync_response(conn, session_id, prompt, cli_model, _max_tokens, original_model, control) do
    case ClaudeSession.send_prompt(session_id, prompt, model: cli_model, timeout: 120_000) do
      {:ok, result} ->
        text = Map.get(result, "result", Map.get(result, "text", ""))
        usage = Map.get(result, "usage", %{})
        SessionPool.checkin(session_id)
        complete_control_plane_flow(control, :succeeded, text, %{usage: usage, session_id: session_id})

        # Return Anthropic-compatible response format
        response = %{
          id: "msg_ema_#{System.unique_integer([:positive])}",
          type: "message",
          role: "assistant",
          model: original_model,
          content: [%{type: "text", text: text}],
          stop_reason: "end_turn",
          stop_sequence: nil,
          usage: %{
            input_tokens: Map.get(usage, "input_tokens", 0),
            output_tokens: Map.get(usage, "output_tokens", 0)
          }
        }

        conn
        |> put_status(200)
        |> json(response)

      {:error, :busy} ->
        Logger.warning("[AnthropicProxy] session busy, retrying with new session")
        # Create a fresh session for overflow
        overflow_id = "proxy-overflow-#{System.unique_integer([:positive])}"
        Supervisor.start_claude_session(overflow_id, model: cli_model)

        case ClaudeSession.send_prompt(overflow_id, prompt, model: cli_model, timeout: 120_000) do
          {:ok, result} ->
            text = Map.get(result, "result", Map.get(result, "text", ""))
            usage = Map.get(result, "usage", %{})
            complete_control_plane_flow(control, :succeeded, text, %{usage: usage, session_id: overflow_id, overflow: true})
            conn |> put_status(200) |> json(%{
              id: "msg_ema_#{System.unique_integer([:positive])}",
              type: "message", role: "assistant", model: original_model,
              content: [%{type: "text", text: text}],
              stop_reason: "end_turn", stop_sequence: nil,
              usage: %{input_tokens: Map.get(usage, "input_tokens", 0), output_tokens: Map.get(usage, "output_tokens", 0)}
            })

          {:error, reason} ->
            fail_control_plane_flow(control, reason)
            error_response(conn, reason)
        end

      {:error, reason} ->
        fail_control_plane_flow(control, reason)
        error_response(conn, reason)
    end
  end

  defp stream_response(conn, session_id, prompt, cli_model, _max_tokens, control) do
    # For streaming, we use async and send SSE events
    conn = conn
    |> put_resp_content_type("text/event-stream")
    |> put_resp_header("cache-control", "no-cache")
    |> put_resp_header("connection", "keep-alive")
    |> send_chunked(200)

    # Send message_start event
    msg_id = "msg_ema_#{System.unique_integer([:positive])}"
    send_sse(conn, %{
      type: "message_start",
      message: %{id: msg_id, type: "message", role: "assistant", model: cli_model,
                 content: [], stop_reason: nil, stop_sequence: nil,
                 usage: %{input_tokens: 0, output_tokens: 0}}
    })

    # Send content_block_start
    send_sse(conn, %{type: "content_block_start", index: 0, content_block: %{type: "text", text: ""}})

    # Run the prompt synchronously and stream the result as one block
    case ClaudeSession.send_prompt(session_id, prompt, model: cli_model, timeout: 120_000) do
      {:ok, result} ->
        text = Map.get(result, "result", Map.get(result, "text", ""))
        usage = Map.get(result, "usage", %{})
        complete_control_plane_flow(control, :succeeded, text, %{usage: usage, session_id: session_id, stream: true})

        # Send the text as a delta
        send_sse(conn, %{type: "content_block_delta", index: 0,
                         delta: %{type: "text_delta", text: text}})

        # Send content_block_stop
        send_sse(conn, %{type: "content_block_stop", index: 0})

        # Send message_delta with stop reason
        send_sse(conn, %{type: "message_delta",
                         delta: %{stop_reason: "end_turn", stop_sequence: nil},
                         usage: %{output_tokens: String.length(text)}})

        # Send message_stop
        send_sse(conn, %{type: "message_stop"})

      {:error, reason} ->
        fail_control_plane_flow(control, reason)
        send_sse(conn, timeout_or_error_payload(reason))
    end

    conn
  end

  defp error_response(conn, reason) do
    body = timeout_or_error_payload(reason)
    status = if timeout_reason?(reason), do: 504, else: 500

    conn
    |> put_status(status)
    |> json(body)
  end

  defp timeout_or_error_payload(reason) do
    if timeout_reason?(reason) do
      %{
        type: "error",
        error: %{
          type: "timeout_error",
          message: "EMA proxy request timed out waiting for Claude session completion",
          detail: inspect(reason)
        }
      }
    else
      %{
        type: "error",
        error: %{
          type: "api_error",
          message: "EMA Surfaces proxy error: #{inspect(reason)}"
        }
      }
    end
  end

  defp timeout_reason?(:timeout), do: true
  defp timeout_reason?(%{code: :timeout}), do: true
  defp timeout_reason?({:timeout, _}), do: true
  defp timeout_reason?(_), do: false

  defp send_sse(conn, data) do
    event_type = Map.get(data, :type, "message")
    case Jason.encode(data) do
      {:ok, json} ->
        chunk(conn, "event: #{event_type}\ndata: #{json}\n\n")
      _ -> :ok
    end
  end

  defp build_prompt(messages, system) do
    system_text = extract_text(system)

    parts = if system_text != "" do
      ["System: #{system_text}"]
    else
      []
    end

    message_parts = Enum.map(messages, fn
      %{"role" => role, "content" => content} ->
        label = case role do
          "user" -> "Human"
          "assistant" -> "Assistant"
          other -> other
        end
        "#{label}: #{extract_text(content)}"
    end)

    (parts ++ message_parts) |> Enum.join("\n\n")
  end

  # Extract text from various Anthropic content formats
  defp extract_text(nil), do: ""
  defp extract_text(text) when is_binary(text), do: text
  defp extract_text(blocks) when is_list(blocks) do
    blocks
    |> Enum.map(fn
      %{"type" => "text", "text" => text} -> text
      %{"text" => text} when is_binary(text) -> text
      _ -> ""
    end)
    |> Enum.reject(& &1 == "")
    |> Enum.join("\n")
  end
  defp extract_text(_), do: ""

  defp normalize_model(model) do
    model
    |> String.replace(~r/^anthropic[-\/]/, "")
    |> String.replace(~r/^anthropic-backup[-\/]/, "")
    |> String.replace(~r/^anthropic-cli[-\/]/, "")
    |> case do
      "claude-opus-4-6" -> "opus"
      "claude-sonnet-4-6" -> "sonnet"
      "claude-haiku-4-5-20251001" -> "haiku"
      m when m in ["opus", "sonnet", "haiku"] -> m
      _other -> "sonnet"  # default fallback
    end
  end

  defp get_or_create_session(model) do
    # Use session pool for fast checkout (pre-warmed sessions)
    case SessionPool.checkout(model) do
      {:ok, session_id} -> session_id
      {:error, _} ->
        # Pool exhausted — create ad-hoc session
        fallback_id = "proxy-adhoc-#{model}-#{System.unique_integer([:positive])}"
        Supervisor.start_claude_session(fallback_id, model: model)
        fallback_id
    end
  end

  defp begin_control_plane_flow(prompt, cli_model, params) do
    project = Map.get(params, "project", "openclaw")
    source = Map.get(params, "source", "openclaw-anthropic-proxy")
    summary = summarize_prompt(prompt)

    attrs = %{
      project: project,
      intent: "anthropic-proxy-request",
      summary: "#{source} via #{cli_model}: #{summary}",
      context: %{
        source: source,
        model: cli_model,
        streaming: Map.get(params, "stream", false)
      },
      metadata: %{
        path: "/v1/messages",
        source: source
      }
    }

    with {:ok, proposal} <- Store.propose(attrs),
         {:ok, result} <- Store.run(proposal.id, %{adapter: "anthropic_proxy", operator: source, metadata: %{model: cli_model}}) do
      %{proposal: proposal, execution: result.execution}
    else
      error ->
        Logger.warning("[AnthropicProxy] failed to begin control-plane flow: #{inspect(error)}")
        nil
    end
  end

  defp complete_control_plane_flow(nil, _status, _summary, _details), do: :ok

  defp complete_control_plane_flow(control, status, summary, details) do
    Store.complete(control.execution.id, %{
      status: Atom.to_string(status),
      summary: String.slice(summary || "EMA proxy request completed", 0, 500),
      details: details
    })
  end

  defp fail_control_plane_flow(nil, _reason), do: :ok

  defp fail_control_plane_flow(control, reason) do
    Store.complete(control.execution.id, %{
      status: "failed",
      summary: "EMA proxy request failed",
      details: %{reason: inspect(reason)}
    })
  end

  defp summarize_prompt(prompt) when is_binary(prompt) do
    prompt
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
    |> String.slice(0, 120)
  end
end
