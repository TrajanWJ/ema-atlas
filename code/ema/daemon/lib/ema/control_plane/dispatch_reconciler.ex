defmodule Ema.ControlPlane.DispatchReconciler do
  @moduledoc """
  Listens for gateway dispatch events and reconciles them against the Store.

  When the gateway reports a dispatch as completed, failed, or timed out,
  this module auto-closes the corresponding control-plane execution so
  operators don't have to manually reconcile gateway-dispatched work.
  """

  use GenServer
  require Logger

  alias Ema.ControlPlane.Store

  @terminal_statuses ["completed", "succeeded", "failed", "cancelled", "timed_out", "error"]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    Phoenix.PubSub.subscribe(Ema.PubSub, "surfaces:dispatch")
    Phoenix.PubSub.subscribe(Ema.PubSub, "surfaces:gateway")
    {:ok, %{reconciled_count: 0, last_reconciled_at: nil}}
  end

  def stats, do: GenServer.call(__MODULE__, :stats)

  @impl true
  def handle_call(:stats, _from, state) do
    {:reply, state, state}
  end

  @impl true
  def handle_info({:dispatch_event, event}, state) do
    state = maybe_reconcile(event, state)
    {:noreply, state}
  end

  def handle_info({:gateway_disconnected}, state) do
    Logger.info("[DispatchReconciler] gateway disconnected — will reconcile on reconnect")
    {:noreply, state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  defp maybe_reconcile(event, state) do
    dispatch_status = extract_status(event)
    execution_id = extract_execution_id(event)

    cond do
      is_nil(execution_id) ->
        state

      dispatch_status in @terminal_statuses ->
        outcome_status = normalize_to_outcome_status(dispatch_status)
        summary = extract_summary(event)

        case Store.complete(execution_id, %{
               status: outcome_status,
               summary: summary || "auto-reconciled from gateway dispatch",
               details: %{
                 source: "dispatch_reconciler",
                 dispatch_event: sanitize_event(event)
               }
             }) do
          {:ok, _result} ->
            Logger.info(
              "[DispatchReconciler] auto-closed execution=#{execution_id} status=#{outcome_status}"
            )

            %{
              state
              | reconciled_count: state.reconciled_count + 1,
                last_reconciled_at: DateTime.utc_now()
            }

          {:error, {:not_found, _, _}} ->
            # Not a control-plane execution — ignore
            state

          {:error, reason} ->
            Logger.warning(
              "[DispatchReconciler] failed to reconcile execution=#{execution_id}: #{inspect(reason)}"
            )

            state
        end

      true ->
        state
    end
  end

  defp extract_status(event) do
    Map.get(event, "status") || Map.get(event, :status) ||
      get_in(event, ["payload", "status"]) || get_in(event, [:payload, :status])
  end

  defp extract_execution_id(event) do
    Map.get(event, "execution_id") || Map.get(event, :execution_id) ||
      get_in(event, ["payload", "execution_id"]) || get_in(event, [:payload, :execution_id])
  end

  defp extract_summary(event) do
    Map.get(event, "summary") || Map.get(event, :summary) ||
      get_in(event, ["payload", "summary"]) || get_in(event, [:payload, :summary])
  end

  defp normalize_to_outcome_status(status) when status in ["completed", "succeeded"], do: "succeeded"
  defp normalize_to_outcome_status(status) when status in ["cancelled"], do: "cancelled"
  defp normalize_to_outcome_status(_status), do: "failed"

  defp sanitize_event(event) when is_map(event) do
    event
    |> Map.take(["type", "status", "execution_id", "payload", "dispatch_id", :type, :status, :execution_id, :payload, :dispatch_id])
    |> Map.new(fn {k, v} -> {to_string(k), v} end)
  end
end
