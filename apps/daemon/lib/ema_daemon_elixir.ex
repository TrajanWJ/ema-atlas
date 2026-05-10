defmodule EmaDaemon.ElixirApplication do
  @moduledoc """
  OTP application module for the Elixir-side of the daemon.

  Hosts the Elixir bounded contexts (`EmaClients`, `EmaResponsibilities`)
  under their own supervisor so they can be exercised by `mix test` and
  by `:application.start(:ema_daemon_elixir)` independent of the Gleam
  supervisor.

  ## Mounting from Gleam

  When the Gleam supervisor (`apps/daemon/src/ema_daemon/supervisor.gleam`)
  is ready to absorb these GenServers, it can either:

    1. Add child specs that point at `EmaClients.Server` and
       `EmaResponsibilities.Server` directly (preferred — they are
       plain OTP GenServers and respond to standard child-spec calls);
       or
    2. Start `:application.start(:ema_daemon_elixir)` once at boot and
       let this supervisor own them.

  Slice 2 leaves the Gleam supervisor untouched. See the TODO marker
  in `supervisor.gleam` for the wiring point.
  """

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      EmaClients.Server,
      EmaResponsibilities.Server,
      EmaIntentionFarmer.Server
    ]

    opts = [strategy: :one_for_one, name: EmaDaemon.ElixirSupervisor]
    Supervisor.start_link(children, opts)
  end
end
