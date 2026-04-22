defmodule Ema.Surfaces.HostTruthWatcher do
  @moduledoc """
  Periodically evaluates operator-facing host truth and emits transition events
  when overall or per-domain status changes.
  """

  use GenServer

  alias Ema.Surfaces.HostTruth

  @topic "surfaces:host_truth"
  @default_interval_ms 5_000

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def topic, do: @topic

  @impl true
  def init(opts) do
    interval_ms = Keyword.get(opts, :interval_ms, @default_interval_ms)
    send(self(), :tick)

    {:ok,
     %{
       interval_ms: interval_ms,
       last_overall_state: nil,
       last_domain_states: %{},
       last_transition_at: nil,
       sequence: 0
     }}
  end

  @impl true
  def handle_info(:tick, state) do
    operator = HostTruth.operator_detail()
    {events, next_state} = transition_events(operator, state)

    Enum.each(events, fn event ->
      Phoenix.PubSub.broadcast(Ema.PubSub, @topic, {:host_truth_transition, event})
    end)

    Process.send_after(self(), :tick, state.interval_ms)
    {:noreply, next_state}
  end

  def transition_events(operator, state) do
    overall_state = Map.get(operator, :overall_state) || Map.get(operator, "overall_state")
    domains = Map.get(operator, :domains) || Map.get(operator, "domains") || %{}

    domain_states =
      Map.new(domains, fn {domain, info} ->
        state = Map.get(info, :state) || Map.get(info, "state")
        {to_string(domain), state}
      end)

    {events, sequence, last_transition_at} =
      []
      |> maybe_add_overall_transition(operator, overall_state, state)
      |> maybe_add_domain_transitions(operator, domain_states, state)

    next_state = %{
      state
      | last_overall_state: overall_state,
        last_domain_states: domain_states,
        last_transition_at: last_transition_at || state.last_transition_at,
        sequence: sequence
    }

    {Enum.reverse(events), next_state}
  end

  defp maybe_add_overall_transition(events, _operator, nil, state) do
    {events, state.sequence, state.last_transition_at}
  end

  defp maybe_add_overall_transition(events, operator, overall_state, state) do
    previous = state.last_overall_state

    cond do
      is_nil(previous) or previous == overall_state ->
        {events, state.sequence, state.last_transition_at}

      true ->
        sequence = state.sequence + 1
        event = base_event(operator, sequence)

        {[
           Map.merge(event, %{
             event_type: "host.health.transition",
             domain: "overall",
             from: to_string(previous),
             to: to_string(overall_state)
           })
           | events
         ], sequence, event.at}
    end
  end

  defp maybe_add_domain_transitions(
         {events, sequence, last_transition_at},
         operator,
         domain_states,
         state
       ) do
    Enum.reduce(domain_states, {events, sequence, last_transition_at}, fn {domain, current_state},
                                                                          acc ->
      previous = Map.get(state.last_domain_states, domain)

      cond do
        is_nil(current_state) or is_nil(previous) or previous == current_state ->
          acc

        true ->
          {events_acc, sequence_acc, _last_at} = acc
          next_sequence = sequence_acc + 1
          event = base_event(operator, next_sequence)

          domain_info =
            (Map.get(operator, :domains) || Map.get(operator, "domains") || %{})
            |> Map.get(String.to_existing_atom(domain), %{})
            |> Kernel.||(
              (Map.get(operator, :domains) || Map.get(operator, "domains") || %{})
              |> Map.get(domain, %{})
            )

          domain_summary = Map.get(domain_info, :summary) || Map.get(domain_info, "summary")

          domain_actions =
            Map.get(domain_info, :recommended_action) ||
              Map.get(domain_info, "recommended_action") || []

          {[
             Map.merge(event, %{
               event_type: "host.domain.transition",
               domain: domain,
               from: to_string(previous),
               to: to_string(current_state),
               domain_summary: domain_summary,
               operator_actions: domain_actions
             })
             | events_acc
           ], next_sequence, event.at}
      end
    end)
  end

  defp base_event(operator, sequence) do
    %{
      host_id: "ema-host",
      at: Map.get(operator, :generated_at) || Map.get(operator, "generated_at"),
      headline: Map.get(operator, :headline) || Map.get(operator, "headline"),
      top_causes: Map.get(operator, :top_causes) || Map.get(operator, "top_causes") || [],
      operator_actions:
        Map.get(operator, :operator_actions) || Map.get(operator, "operator_actions") || [],
      sequence: sequence
    }
  end
end
