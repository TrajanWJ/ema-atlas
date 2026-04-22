defmodule Ema.Config.Registry do
  @moduledoc "ETS-backed GenServer registry for config resources"
  use GenServer

  alias Ema.Config.Resource

  @table :ema_config_registry

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def register(%Resource{} = resource) do
    GenServer.call(__MODULE__, {:register, resource})
  end

  def unregister(id) do
    GenServer.call(__MODULE__, {:unregister, id})
  end

  def lookup(id) do
    case :ets.lookup(@table, id) do
      [{^id, resource}] -> {:ok, resource}
      [] -> {:error, :not_found}
    end
  end

  def list_all do
    :ets.tab2list(@table) |> Enum.map(fn {_id, r} -> r end)
  end

  def list_by_type(type) do
    list_all() |> Enum.filter(&(&1.type == type))
  end

  def list_by_scope(scope) do
    list_all() |> Enum.filter(&(&1.scope == scope))
  end

  def clear do
    GenServer.call(__MODULE__, :clear)
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    table = :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    {:ok, %{table: table}}
  end

  @impl true
  def handle_call({:register, %Resource{} = resource}, _from, state) do
    resource = %{resource | inserted_at: resource.inserted_at || DateTime.utc_now()}
    :ets.insert(@table, {resource.id, resource})
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:unregister, id}, _from, state) do
    :ets.delete(@table, id)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call(:clear, _from, state) do
    :ets.delete_all_objects(@table)
    {:reply, :ok, state}
  end
end
