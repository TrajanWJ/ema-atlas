defmodule Ema.Campaigns.Flow do
  @moduledoc """
  State machine for campaign flows.

  Tracks a campaign through its lifecycle:
  forming -> ready -> running -> completed (also: failed, cancelled)

  Each flow holds proposals (planned actions) and discoveries
  (results gathered during execution). State transitions are validated
  against an explicit transition table.
  """

  @type status :: :forming | :ready | :running | :completed | :failed | :cancelled

  @type t :: %__MODULE__{
          id: String.t(),
          status: status(),
          proposals: [map()],
          discoveries: [map()],
          started_at: DateTime.t() | nil,
          updated_at: DateTime.t(),
          completed_at: DateTime.t() | nil,
          metadata: map()
        }

  @enforce_keys [:id, :status, :updated_at]
  defstruct [
    :id,
    :status,
    :started_at,
    :completed_at,
    proposals: [],
    discoveries: [],
    updated_at: nil,
    metadata: %{}
  ]

  @valid_transitions %{
    forming: [:ready, :cancelled],
    ready: [:running, :cancelled],
    running: [:completed, :failed, :cancelled]
  }

  @terminal_states [:completed, :failed, :cancelled]

  @doc """
  Create a new Flow in :forming state.

  Accepts an optional map of attributes. The `id` field defaults to a
  generated UUID if not provided. `status` is always forced to :forming.
  """
  @spec new(map()) :: t()
  def new(attrs \\ %{}) do
    now = DateTime.utc_now()

    %__MODULE__{
      id: Map.get(attrs, :id, UUID.uuid4()),
      status: :forming,
      proposals: Map.get(attrs, :proposals, []),
      discoveries: Map.get(attrs, :discoveries, []),
      started_at: Map.get(attrs, :started_at),
      updated_at: now,
      completed_at: nil,
      metadata: Map.get(attrs, :metadata, %{})
    }
  end

  @doc """
  Check whether a transition from `from` to `to` is allowed.
  """
  @spec valid_transition?(status(), status()) :: boolean()
  def valid_transition?(from, to) do
    to in Map.get(@valid_transitions, from, [])
  end

  @doc """
  Validate and apply a state transition.

  Returns `{:ok, updated_flow}` on success or `{:error, reason}` on failure.

  The transition from :forming to :ready requires at least one proposal.
  Terminal states (:completed, :failed, :cancelled) cannot transition further.
  """
  @spec transition(t(), status()) :: {:ok, t()} | {:error, String.t()}
  def transition(%__MODULE__{status: current} = _flow, new_status)
      when current in @terminal_states do
    {:error, "cannot transition from terminal state :#{current} to :#{new_status}"}
  end

  def transition(%__MODULE__{status: current} = flow, new_status) do
    cond do
      !valid_transition?(current, new_status) ->
        {:error, "invalid transition from :#{current} to :#{new_status}"}

      current == :forming and new_status == :ready and flow.proposals == [] ->
        {:error, "cannot transition to :ready without at least one proposal"}

      true ->
        now = DateTime.utc_now()

        updated =
          %{flow | status: new_status, updated_at: now}
          |> maybe_set_started_at(new_status, now)
          |> maybe_set_completed_at(new_status, now)

        {:ok, updated}
    end
  end

  @doc """
  Add a proposal map to the flow.

  The proposal must contain an `:id` key. Returns `{:ok, updated_flow}`
  or `{:error, reason}` if the flow is in a terminal state.
  """
  @spec add_proposal(t(), map()) :: {:ok, t()} | {:error, String.t()}
  def add_proposal(%__MODULE__{status: status}, _proposal) when status in @terminal_states do
    {:error, "cannot add proposal to flow in :#{status} state"}
  end

  def add_proposal(%__MODULE__{} = flow, %{id: _} = proposal) do
    {:ok, %{flow | proposals: flow.proposals ++ [proposal], updated_at: DateTime.utc_now()}}
  end

  def add_proposal(%__MODULE__{}, _proposal) do
    {:error, "proposal must contain an :id key"}
  end

  @doc """
  Remove a proposal by id.

  Returns `{:ok, updated_flow}` or `{:error, reason}`.
  """
  @spec remove_proposal(t(), String.t()) :: {:ok, t()} | {:error, String.t()}
  def remove_proposal(%__MODULE__{status: status}, _id) when status in @terminal_states do
    {:error, "cannot remove proposal from flow in :#{status} state"}
  end

  def remove_proposal(%__MODULE__{} = flow, proposal_id) do
    remaining = Enum.reject(flow.proposals, &(&1.id == proposal_id))

    if length(remaining) == length(flow.proposals) do
      {:error, "proposal #{proposal_id} not found"}
    else
      {:ok, %{flow | proposals: remaining, updated_at: DateTime.utc_now()}}
    end
  end

  @doc """
  Add a discovery result map to the flow.

  Returns `{:ok, updated_flow}` or `{:error, reason}`.
  """
  @spec add_discovery(t(), map()) :: {:ok, t()} | {:error, String.t()}
  def add_discovery(%__MODULE__{status: status}, _discovery) when status in @terminal_states do
    {:error, "cannot add discovery to flow in :#{status} state"}
  end

  def add_discovery(%__MODULE__{} = flow, discovery) when is_map(discovery) do
    {:ok,
     %{flow | discoveries: flow.discoveries ++ [discovery], updated_at: DateTime.utc_now()}}
  end

  @doc """
  Return a JSON-serializable summary map of the flow.
  """
  @spec summary(t()) :: map()
  def summary(%__MODULE__{} = flow) do
    %{
      id: flow.id,
      status: flow.status,
      proposal_count: length(flow.proposals),
      discovery_count: length(flow.discoveries),
      started_at: format_datetime(flow.started_at),
      updated_at: format_datetime(flow.updated_at),
      completed_at: format_datetime(flow.completed_at),
      metadata: flow.metadata
    }
  end

  # -- Private helpers --

  defp maybe_set_started_at(flow, :running, now), do: %{flow | started_at: flow.started_at || now}
  defp maybe_set_started_at(flow, _status, _now), do: flow

  defp maybe_set_completed_at(flow, status, now) when status in [:completed, :failed, :cancelled],
    do: %{flow | completed_at: now}

  defp maybe_set_completed_at(flow, _status, _now), do: flow

  defp format_datetime(nil), do: nil
  defp format_datetime(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
end
