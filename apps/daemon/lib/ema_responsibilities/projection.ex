defmodule EmaResponsibilities.Projection do
  @moduledoc """
  In-memory projection for `responsibility.*` events.

  Backed by an ETS table named `:ema_responsibilities_projection`.
  Schema:

      %{
        responsibility_id: "responsibility:...",
        org_id: "org:...",
        space_id: "space:...",
        project_id: nil | "project:...",
        title: "...",
        why: "...",
        cadence: :daily | :weekly | :monthly | :quarterly | :ongoing,
        status: :active | :paused | :retired,
        tags: ["..."],
        added_at: "ISO-8601",
        retired_at: nil | "ISO-8601"
      }

  Pure event-sourced — every transition flows through `apply/1`.
  """

  @table :ema_responsibilities_projection

  @doc "Create the ETS table if it doesn't exist. Idempotent."
  @spec ensure_table!() :: :ok
  def ensure_table! do
    case :ets.whereis(@table) do
      :undefined ->
        :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
        :ok

      _ref ->
        :ok
    end
  end

  @doc "Reset the projection."
  @spec reset() :: :ok
  def reset do
    ensure_table!()
    :ets.delete_all_objects(@table)
    :ok
  end

  @doc "Apply a single responsibility.* event to the projection."
  @spec apply(map()) :: :ok | {:error, term()}
  def apply(%{kind: "responsibility.added", payload: payload, ts: ts}) do
    record = %{
      responsibility_id: payload.responsibility_id,
      org_id: payload.org_id,
      space_id: payload.space_id,
      project_id: Map.get(payload, :project_id),
      title: payload.title,
      why: payload.why,
      cadence: payload.cadence,
      status: :active,
      tags: Map.get(payload, :tags, []),
      added_at: ts,
      retired_at: nil
    }

    insert(record)
  end

  def apply(%{kind: "responsibility.retitled", payload: %{responsibility_id: id, to: new_title}}) do
    update(id, fn rec -> %{rec | title: new_title} end)
  end

  def apply(%{kind: "responsibility.why_updated", payload: %{responsibility_id: id, to: new_why}}) do
    update(id, fn rec -> %{rec | why: new_why} end)
  end

  def apply(%{
        kind: "responsibility.cadence_changed",
        payload: %{responsibility_id: id, to: new_cadence}
      }) do
    update(id, fn rec -> %{rec | cadence: new_cadence} end)
  end

  def apply(%{
        kind: "responsibility.scoped",
        payload: %{responsibility_id: id, to_project_id: pid}
      }) do
    update(id, fn rec -> %{rec | project_id: pid} end)
  end

  def apply(%{kind: "responsibility.tagged", payload: %{responsibility_id: id, tags: tags}}) do
    update(id, fn rec ->
      merged = Enum.uniq(rec.tags ++ tags)
      %{rec | tags: merged}
    end)
  end

  def apply(%{kind: "responsibility.untagged", payload: %{responsibility_id: id, tags: tags}}) do
    update(id, fn rec ->
      remaining = Enum.reject(rec.tags, fn t -> t in tags end)
      %{rec | tags: remaining}
    end)
  end

  def apply(%{kind: "responsibility.paused", payload: %{responsibility_id: id}}) do
    update(id, fn rec -> %{rec | status: :paused} end)
  end

  def apply(%{kind: "responsibility.resumed", payload: %{responsibility_id: id}}) do
    update(id, fn rec -> %{rec | status: :active} end)
  end

  def apply(%{kind: "responsibility.retired", payload: %{responsibility_id: id}, ts: ts}) do
    update(id, fn rec -> %{rec | status: :retired, retired_at: ts} end)
  end

  def apply(%{kind: kind}) do
    {:error, {:unknown_kind, kind}}
  end

  @doc "Return every responsibility row."
  @spec list() :: [map()]
  def list do
    ensure_table!()

    @table
    |> :ets.tab2list()
    |> Enum.map(fn {_id, record} -> record end)
  end

  @doc "Return a single responsibility row or `:not_found`."
  @spec get(String.t()) :: map() | :not_found
  def get(responsibility_id) do
    ensure_table!()

    case :ets.lookup(@table, responsibility_id) do
      [{^responsibility_id, record}] -> record
      [] -> :not_found
    end
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp insert(record) do
    ensure_table!()
    :ets.insert(@table, {record.responsibility_id, record})
    :ok
  end

  defp update(id, fun) do
    ensure_table!()

    case :ets.lookup(@table, id) do
      [{^id, record}] ->
        :ets.insert(@table, {id, fun.(record)})
        :ok

      [] ->
        {:error, :not_found}
    end
  end
end
