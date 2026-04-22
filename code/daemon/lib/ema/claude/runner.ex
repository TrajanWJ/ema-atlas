defmodule Ema.Claude.Runner do
  @moduledoc """
  Single EMA-facing execution entrypoint.

  Routes through persistent ClaudeSession (Surfaces layer) by default,
  falling back to one-shot ProviderRegistry for backward compatibility.

  The Surfaces path gives:
  - Session continuity (conversation memory across calls)
  - OAuth handled by CLI (no manual token management)
  - PubSub streaming for real-time events
  - Proper timeout handling via Port
  """

  alias Ema.Claude.ProviderRegistry
  alias Ema.Surfaces.{Supervisor, ClaudeSession}

  require Logger

  def run(prompt, opts \\ []) when is_binary(prompt) do
    model = Keyword.get(opts, :model, "sonnet")
    use_surfaces = Keyword.get(opts, :surfaces, true)

    if use_surfaces do
      run_via_surfaces(prompt, model, opts)
    else
      ProviderRegistry.run(prompt, opts)
    end
  end

  def run_async(prompt, opts \\ []) when is_binary(prompt) do
    model = Keyword.get(opts, :model, "sonnet")
    session_id = get_or_create_session(model)
    ClaudeSession.send_prompt_async(session_id, prompt, opts)
    {:ok, session_id}
  end

  def preflight(opts \\ []) do
    ProviderRegistry.preflight(opts)
  end

  def providers do
    ProviderRegistry.list_available()
  end

  # --- Private ---

  defp run_via_surfaces(prompt, model, opts) do
    session_id = get_or_create_session(model)

    case ClaudeSession.send_prompt(session_id, prompt, Keyword.put(opts, :model, model)) do
      {:ok, result} ->
        # Extract text from the JSON result to match old Runner contract
        text = Map.get(result, "result", Map.get(result, "text", ""))
        {:ok, %{text: text, raw: result, session_id: session_id, via: :surfaces}}

      {:error, :busy} ->
        # Session busy, try another or fall back
        Logger.info("[Runner] session #{session_id} busy, falling back to ProviderRegistry")
        ProviderRegistry.run(prompt, opts)

      {:error, reason} ->
        Logger.warning("[Runner] surfaces failed (#{inspect(reason)}), falling back to ProviderRegistry")
        ProviderRegistry.run(prompt, opts)
    end
  end

  defp get_or_create_session(model) do
    pool_id = "runner-#{model}"

    # Try to start the session — if already exists, that's fine
    case Supervisor.start_claude_session(pool_id, model: model) do
      {:ok, _pid} -> pool_id
      {:error, {:already_started, _}} -> pool_id
      {:error, reason} ->
        Logger.warning("[Runner] failed to start session: #{inspect(reason)}")
        pool_id
    end
  end
end
