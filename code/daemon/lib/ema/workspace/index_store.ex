defmodule Ema.Workspace.IndexStore do
  @moduledoc "GenServer-owned cached snapshot of workspace/shared overlay files."

  use GenServer

  alias Ema.Workspace.Indexer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def snapshot do
    GenServer.call(__MODULE__, :snapshot)
  end

  def refresh do
    GenServer.call(__MODULE__, :refresh)
  end

  @impl true
  def init(_opts) do
    {:ok, Indexer.scan()}
  end

  @impl true
  def handle_call(:snapshot, _from, state) do
    {:reply, state, state}
  end

  def handle_call(:refresh, _from, _state) do
    state = Indexer.scan()
    {:reply, state, state}
  end
end
