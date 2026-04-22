defmodule Ema.ControlPlane.ProposalEvents do
  @moduledoc """
  Canonical proposal event envelope + PubSub emitter.

  Keeps proposal lifecycle distinct from execution lifecycle while still using
  the same durable append-only pattern for operator-visible replay.
  """

  require Logger

  @topic "control_plane:proposals"
  @ledger_file Path.expand("../../../priv/proposal_events.jsonl", __DIR__)

  @type proposal_event_type ::
          :proposal_created
          | :proposal_approved
          | :proposal_running
          | :proposal_completed
          | :proposal_failed
          | :proposal_cancelled
          | :proposal_timed_out
          | :proposal_orphaned

  @spec topic() :: String.t()
  def topic, do: @topic

  @spec build(binary(), proposal_event_type(), map()) :: map()
  def build(proposal_id, type, attrs \\ %{}) when is_binary(proposal_id) and is_map(attrs) do
    %{
      event_id: attrs[:event_id] || attrs["event_id"] || UUID.uuid4(),
      proposal_id: proposal_id,
      sequence: attrs[:sequence] || attrs["sequence"] || System.unique_integer([:positive]),
      occurred_at: attrs[:occurred_at] || attrs["occurred_at"] || DateTime.utc_now() |> DateTime.to_iso8601(),
      type: normalize(type),
      status: normalize(attrs[:status] || attrs["status"]),
      actor: attrs[:actor] || attrs["actor"],
      summary_line: attrs[:summary_line] || attrs["summary_line"],
      payload: attrs[:payload] || attrs["payload"] || %{}
    }
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  @spec emit(binary(), proposal_event_type(), map()) :: map()
  def emit(proposal_id, type, attrs \\ %{}) do
    event = build(proposal_id, type, attrs)
    append_to_ledger(event)
    Phoenix.PubSub.broadcast(Ema.PubSub, @topic, {:proposal_event, event})
    event
  end

  defp normalize(nil), do: nil
  defp normalize(value) when is_atom(value), do: Atom.to_string(value)
  defp normalize(value), do: value

  defp append_to_ledger(event) do
    @ledger_file |> Path.dirname() |> File.mkdir_p!()

    case File.write(@ledger_file, [Jason.encode_to_iodata!(event), "\n"], [:append]) do
      :ok -> :ok
      {:error, reason} -> Logger.warning("[ProposalEvents] failed to append ledger entry: #{inspect(reason)}")
    end
  end
end
