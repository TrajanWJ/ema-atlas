defmodule Ema.Surfaces.HostSessionSync do
  @moduledoc """
  Periodically imports recent Claude and Codex host sessions into EMA persistence.

  This keeps the host-session tables warm without requiring manual import calls.
  It is intentionally best-effort and logs warnings instead of crashing the app.
  """

  use GenServer
  require Logger

  alias Ema.Surfaces.{ClaudeImporter, CodexImporter}

  @default_interval_ms 5 * 60 * 1_000

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def sync_now do
    GenServer.call(__MODULE__, :sync_now, 60_000)
  end

  @impl true
  def init(opts) do
    interval_ms = Keyword.get(opts, :interval_ms, @default_interval_ms)
    state = %{interval_ms: interval_ms, last_result: nil}
    Process.send_after(self(), :sync, 5_000)
    {:ok, state}
  end

  @impl true
  def handle_call(:sync_now, _from, state) do
    result = do_sync()
    {:reply, result, %{state | last_result: result}}
  end

  @impl true
  def handle_info(:sync, state) do
    result = do_sync()
    Process.send_after(self(), :sync, state.interval_ms)
    {:noreply, %{state | last_result: result}}
  end

  defp do_sync do
    claude = safe_import(fn -> ClaudeImporter.import_recent(limit: 20) end, :claude)
    codex = safe_import(fn -> CodexImporter.import_recent(limit: 20) end, :codex)

    result = %{
      synced_at: DateTime.utc_now(),
      claude: claude,
      codex: codex
    }

    Logger.info("[HostSessionSync] claude=#{summary_count(claude)} codex=#{summary_count(codex)}")
    result
  end

  defp safe_import(fun, label) do
    fun.()
  rescue
    e ->
      Logger.warning("[HostSessionSync] #{label} import failed: #{Exception.message(e)}")
      %{error: Exception.message(e)}
  end

  defp summary_count(%{imported: n}) when is_integer(n), do: n
  defp summary_count(%{count: n}) when is_integer(n), do: n
  defp summary_count(_), do: 0
end
