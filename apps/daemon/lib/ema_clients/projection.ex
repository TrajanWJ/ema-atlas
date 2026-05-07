defmodule EmaClients.Projection do
  @moduledoc """
  In-memory projection for `client.*` events.

  Backed by an ETS table named `:ema_clients_projection`. Each client
  is stored as `{client_id, %{...}}` where the value is a flat map of
  the projected fields:

      %{
        client_id: "client:...",
        org_id: "org:...",
        space_id: "space:...",
        name: "Acme",
        contact: nil | "...",
        color: nil | "#...",
        status: :active | :paused | :archived,
        tags: ["..."],
        added_at: "ISO-8601",
        archived_at: nil | "ISO-8601"
      }

  Replay is straightforward: feed every event through `apply/2` in
  order. The same function is used for live writes, since this module
  has no live-vs-replay distinction — that's the whole point of an
  event-sourced projection.
  """

  @table :ema_clients_projection

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

  @doc "Reset the projection — wipes all rows."
  @spec reset() :: :ok
  def reset do
    ensure_table!()
    :ets.delete_all_objects(@table)
    :ok
  end

  @doc "Apply a single client.* event to the projection."
  @spec apply(map()) :: :ok | {:error, term()}
  def apply(%{kind: "client.added", payload: payload, ts: ts}) do
    record = %{
      client_id: payload.client_id,
      org_id: payload.org_id,
      space_id: payload.space_id,
      name: payload.name,
      contact: Map.get(payload, :contact),
      color: Map.get(payload, :color),
      status: :active,
      tags: Map.get(payload, :tags, []),
      added_at: ts,
      archived_at: nil
    }

    insert(record)
    :ok
  end

  def apply(%{kind: "client.renamed", payload: %{client_id: id, to: new_name}}) do
    update(id, fn rec -> %{rec | name: new_name} end)
  end

  def apply(%{kind: "client.recolored", payload: %{client_id: id, to: new_color}}) do
    update(id, fn rec -> %{rec | color: new_color} end)
  end

  def apply(%{kind: "client.contact_updated", payload: %{client_id: id, to: contact}}) do
    update(id, fn rec -> %{rec | contact: contact} end)
  end

  def apply(%{kind: "client.tagged", payload: %{client_id: id, tags: tags}}) do
    update(id, fn rec ->
      merged = Enum.uniq(rec.tags ++ tags)
      %{rec | tags: merged}
    end)
  end

  def apply(%{kind: "client.untagged", payload: %{client_id: id, tags: tags}}) do
    update(id, fn rec ->
      remaining = Enum.reject(rec.tags, fn t -> t in tags end)
      %{rec | tags: remaining}
    end)
  end

  def apply(%{kind: "client.paused", payload: %{client_id: id}}) do
    update(id, fn rec -> %{rec | status: :paused} end)
  end

  def apply(%{kind: "client.resumed", payload: %{client_id: id}}) do
    update(id, fn rec -> %{rec | status: :active} end)
  end

  def apply(%{kind: "client.archived", payload: %{client_id: id}, ts: ts}) do
    update(id, fn rec -> %{rec | status: :archived, archived_at: ts} end)
  end

  def apply(%{kind: "client.restored", payload: %{client_id: id}}) do
    update(id, fn rec -> %{rec | status: :active, archived_at: nil} end)
  end

  def apply(%{kind: kind}) do
    {:error, {:unknown_kind, kind}}
  end

  @doc "Return every client row."
  @spec list() :: [map()]
  def list do
    ensure_table!()

    @table
    |> :ets.tab2list()
    |> Enum.map(fn {_id, record} -> record end)
  end

  @doc "Return a single client row or `:not_found`."
  @spec get(String.t()) :: map() | :not_found
  def get(client_id) do
    ensure_table!()

    case :ets.lookup(@table, client_id) do
      [{^client_id, record}] -> record
      [] -> :not_found
    end
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp insert(record) do
    ensure_table!()
    :ets.insert(@table, {record.client_id, record})
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
