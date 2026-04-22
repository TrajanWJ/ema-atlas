defmodule Ema.ControlPlane.Incidents.Policy do
  @moduledoc "Centralized thresholds and defaults for incident classification."

  @default_no_progress_warn_ms 60_000
  @default_no_progress_error_ms 180_000
  @default_sweep_interval_ms 15_000
  @default_snooze_ms 30 * 60 * 1_000

  def no_progress_warn_ms do
    Application.get_env(:ema, :incident_no_progress_warn_ms, @default_no_progress_warn_ms)
  end

  def no_progress_error_ms do
    Application.get_env(:ema, :incident_no_progress_error_ms, @default_no_progress_error_ms)
  end

  def sweep_interval_ms do
    Application.get_env(:ema, :incident_sweep_interval_ms, @default_sweep_interval_ms)
  end

  def default_snooze_ms do
    Application.get_env(:ema, :incident_default_snooze_ms, @default_snooze_ms)
  end
end
