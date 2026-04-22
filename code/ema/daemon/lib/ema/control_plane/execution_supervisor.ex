defmodule Ema.ControlPlane.ExecutionSupervisor do
  @moduledoc """
  Minimal supervisor loop for control-plane executions.

  This is intentionally small: it periodically asks the canonical store to sweep
  stale executions so orphaned or timed-out runs become explicit state
  transitions with durable events.
  """

  use GenServer
  require Logger

  @default_interval_ms 30_000

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(opts) do
    interval_ms =
      Keyword.get(
        opts,
        :interval_ms,
        Application.get_env(:ema, :control_plane_sweep_interval_ms, @default_interval_ms)
      )

    state = %{interval_ms: interval_ms, last_sweep_at: nil, last_sweep_result: nil}
    Logger.info("[ControlPlane.ExecutionSupervisor] started, sweep_interval_ms=#{interval_ms}")
    schedule_sweep(interval_ms)
    {:ok, state}
  end

  @impl true
  def handle_info(:sweep, state) do
    sweep = Ema.ControlPlane.Store.sweep_stale()
    _ = Ema.ControlPlane.Incidents.Authority.sweep()

    Logger.info(
      "[ControlPlane.ExecutionSupervisor] sweep complete updated_count=#{Map.get(sweep, :updated_count, 0)}"
    )

    schedule_sweep(state.interval_ms)
    {:noreply, %{state | last_sweep_at: DateTime.utc_now(), last_sweep_result: sweep}}
  end

  defp schedule_sweep(interval_ms) do
    Process.send_after(self(), :sweep, interval_ms)
  end
end
