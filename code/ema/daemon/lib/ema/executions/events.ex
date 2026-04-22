defmodule Ema.Executions.Events do
  @moduledoc """
  Canonical execution event envelope + PubSub emitter.

  This is the thin contract layer for execution lifecycle events so HQ,
  live streams, and downstream projections can consume one normalized shape.

  Every emitted event is also appended to a local JSONL ledger so EMA has a
  durable, append-only execution trail independent of transient subscribers.
  """

  require Logger

  @topic "executions:all"
  @ledger_file Path.expand("../../../priv/executions_events.jsonl", __DIR__)

  @type execution_status ::
          :queued
          | :planning
          | :ready
          | :running
          | :verifying
          | :blocked
          | :waiting_human
          | :retrying
          | :succeeded
          | :failed
          | :cancelled
          | :timed_out
          | :orphaned

  @type execution_phase ::
          :intake
          | :decomposition
          | :dispatch
          | :implementation
          | :verification
          | :merge
          | :reporting
          | :done

  @type execution_event_type ::
          :execution_created
          | :execution_queued
          | :execution_planning_started
          | :execution_ready
          | :execution_started
          | :execution_progress
          | :execution_blocked
          | :execution_waiting_human
          | :execution_retry_scheduled
          | :execution_verification_started
          | :execution_merge_started
          | :execution_artifact_attached
          | :execution_completed
          | :execution_failed
          | :execution_cancelled
          | :execution_timed_out
          | :execution_orphaned
          | :execution_resumed

  @spec topic() :: String.t()
  def topic, do: @topic

  @spec build(binary(), execution_event_type(), map()) :: map()
  def build(execution_id, type, attrs \\ %{}) when is_binary(execution_id) and is_map(attrs) do
    %{
      event_id: attrs[:event_id] || attrs["event_id"] || UUID.uuid4(),
      execution_id: execution_id,
      sequence: attrs[:sequence] || attrs["sequence"] || System.unique_integer([:positive]),
      occurred_at: attrs[:occurred_at] || attrs["occurred_at"] || DateTime.utc_now() |> DateTime.to_iso8601(),
      type: normalize_type(type),
      status: normalize_optional(attrs[:status] || attrs["status"]),
      phase: normalize_optional(attrs[:phase] || attrs["phase"]),
      actor: attrs[:actor] || attrs["actor"],
      summary_line: attrs[:summary_line] || attrs["summary_line"],
      payload: attrs[:payload] || attrs["payload"] || %{}
    }
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  @spec emit(binary(), execution_event_type(), map()) :: map()
  def emit(execution_id, type, attrs \\ %{}) do
    event = build(execution_id, type, attrs)
    append_to_ledger(event)
    Phoenix.PubSub.broadcast(Ema.PubSub, @topic, {:execution_event, event})
    event
  end

  defp normalize_type(type) when is_atom(type), do: Atom.to_string(type)
  defp normalize_type(type), do: type

  defp normalize_optional(nil), do: nil
  defp normalize_optional(value) when is_atom(value), do: Atom.to_string(value)
  defp normalize_optional(value), do: value

  defp append_to_ledger(event) do
    @ledger_file |> Path.dirname() |> File.mkdir_p!()

    line = [Jason.encode_to_iodata!(event), "\n"]

    case File.write(@ledger_file, line, [:append]) do
      :ok -> :ok
      {:error, reason} -> Logger.warning("[Executions.Events] failed to append ledger entry: #{inspect(reason)}")
    end
  end
end
