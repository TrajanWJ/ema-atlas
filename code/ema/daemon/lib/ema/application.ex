defmodule Ema.Application do
  @moduledoc "EMA OTP application entry point."

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Config control plane — registry must start before other services
      Ema.Config.Supervisor,

      Ema.Repo,

      # Phoenix PubSub
      {Phoenix.PubSub, name: Ema.PubSub},

      # Async bridge dispatch supervisor
      {Task.Supervisor, name: Ema.Claude.TaskSupervisor},

      # AI Provider Registry
      Ema.Claude.ProviderRegistry,

      # Workspace overlay supervision
      Ema.Workspace.Supervisor,

      # Session supervision tree (Deliverable 2)
      Ema.Sessions.Supervisor,

      # Minimal control-plane runtime
      Ema.ControlPlane.Supervisor,
      Ema.ControlPlane.HostTransitionLog,

      # Shadow monitor (Deliverable 4)
      Ema.Sessions.Monitor,

      # Adaptive babysitter cadence manager
      Ema.Babysitter.StreamTicker,

      # Independent autonomous chain scheduler for visible work/orchestrator loops
      Ema.Babysitter.ChainScheduler,

      # Babysitter takeover state machine
      Ema.Babysitter.TakeoverManager,

      # Stream-of-consciousness layer
      Ema.Stream.Manager,
      Ema.Stream.Babysitter,

      # Execution surfaces (Claude/Codex sessions, Gateway, Peers)
      Ema.Surfaces.Supervisor,
      Ema.Surfaces.HostTruthWatcher,
      Ema.Surfaces.HostSessionSync,

      # Second Brain FTS5 indexer
      Ema.SecondBrain.Indexer,

      # Phoenix Endpoint — last so infra is up first
      EmaWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Ema.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    EmaWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
