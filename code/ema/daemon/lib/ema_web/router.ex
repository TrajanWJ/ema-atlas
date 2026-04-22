defmodule EmaWeb.Router do
  use EmaWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/api", EmaWeb do
    pipe_through(:api)

    get("/babysitter", BabysitterController, :index)
    get("/babysitter/chains", BabysitterController, :chains)
    get("/babysitter/chains/:id", BabysitterController, :chain_show)
    post("/babysitter/chains/:id/start", BabysitterController, :chain_start)
    post("/babysitter/chains/:id/stop", BabysitterController, :chain_stop)
    post("/babysitter/chains/:id/pause", BabysitterController, :chain_pause)
    post("/babysitter/chains/:id/resume", BabysitterController, :chain_resume)
    post("/babysitter/chains/:id/hint", BabysitterController, :chain_hint)
    post("/babysitter/rewrite-category", BabysitterController, :rewrite_category)
    post("/babysitter/command", BabysitterController, :command)
    get("/babysitter/:stream", BabysitterController, :show)
    put("/babysitter/:stream", BabysitterController, :update)
    post("/babysitter/:stream/activity", BabysitterController, :activity)
    post("/babysitter/:stream/tick", BabysitterController, :tick)

    # Takeover state machine
    get("/babysitter/:stream/takeover", BabysitterController, :takeover_status)
    post("/babysitter/:stream/takeover/activate", BabysitterController, :takeover_activate)
    post("/babysitter/:stream/takeover/release", BabysitterController, :takeover_release)

    get("/sessions/monitor", SessionMonitorController, :index)
    post("/sessions/monitor/activity", SessionMonitorController, :activity)

    get("/control-plane", ControlPlaneController, :status)
    get("/control-plane/sweeper", ControlPlaneController, :sweeper)
    get("/control-plane/live", ControlPlaneController, :live)
    get("/control-plane/replay/dispatch-board", ControlPlaneController, :dispatch_board_replay)
    get("/control-plane/incidents", ControlPlaneController, :incidents)
    post("/control-plane/incidents/:id/actions/:action", ControlPlaneController, :incident_action)
    get("/control-plane/host-transitions", ControlPlaneController, :host_transitions)
    get("/control-plane/context_for", ControlPlaneController, :context_for)
    post("/control-plane/command", ControlPlaneController, :command)
    post("/control-plane/proposals", ControlPlaneController, :create_proposal)
    post("/control-plane/proposals/:id/approve", ControlPlaneController, :approve_proposal)
    post("/control-plane/proposals/:id/run", ControlPlaneController, :run_proposal)
    post("/control-plane/executions/:id/complete", ControlPlaneController, :complete_execution)

    post(
      "/control-plane/executions/:id/dispatch-update",
      ControlPlaneController,
      :dispatch_update
    )

    get("/control-plane/reconciler", ControlPlaneController, :reconciler)
    get("/control-plane/persistence", ControlPlaneController, :persistence_status)
    get("/control-plane/projects/:project/state", ControlPlaneController, :project_state)
    post("/control-plane/projects/:project/bootstrap", ControlPlaneController, :bootstrap_project)
    get("/control-plane/projects/:project/intents", ControlPlaneController, :list_project_intents)
    post("/control-plane/intents/:id/update", ControlPlaneController, :update_intent)

    get(
      "/control-plane/projects/:project/intent-snapshot",
      ControlPlaneController,
      :intent_snapshot
    )

    get("/context/project/:project/package", ControlPlaneController, :project_package)
    get("/context/operator/package", ControlPlaneController, :operator_package)
    get("/context/project/:project/session-evidence", ControlPlaneController, :session_evidence)

    get("/claude/providers", ClaudeController, :providers)
    post("/claude/preflight", ClaudeController, :preflight)
    post("/claude/run", ClaudeController, :run)

    # Workspace overlay read model
    get("/workspace/actors/:actor_id/packet", WorkspaceController, :actor_packet)

    # Execution surfaces — unified session/dispatch/peer management
    get("/surfaces", SurfacesController, :index)
    post("/surfaces/discover", SurfacesController, :discover)
    get("/surfaces/gateway", SurfacesController, :gateway)
    get("/surfaces/peers", SurfacesController, :peers)
    get("/surfaces/host-truth", SurfacesController, :host_truth)
    get("/surfaces/operator-status", SurfacesController, :operator_status)
    post("/surfaces/host-sessions/sync", SurfacesController, :sync_host_sessions)
    get("/surfaces/host-sessions", SurfacesController, :host_sessions)
    get("/surfaces/host-sessions/:id", SurfacesController, :host_session)
    get("/surfaces/host-sessions/:id/messages", SurfacesController, :host_session_messages)
    get("/surfaces/host-sessions/:id/events", SurfacesController, :host_session_events)
    post("/surfaces/host-sessions/:id/bind", SurfacesController, :bind_host_session)
    post("/surfaces/host-sessions/:id/resume", SurfacesController, :resume_host_session)
    post("/surfaces/peers/:peer_id/dispatch", SurfacesController, :dispatch_to_peer)

    get("/surfaces/sessions/import/claude", SurfacesController, :import_claude_sessions)

    get(
      "/surfaces/sessions/import/claude/:id/messages",
      SurfacesController,
      :claude_imported_messages
    )

    get("/surfaces/sessions/import/codex", SurfacesController, :import_codex_sessions)

    get(
      "/surfaces/sessions/import/codex/:id/messages",
      SurfacesController,
      :codex_imported_messages
    )

    post("/surfaces/sessions/claude", SurfacesController, :create_claude_session)
    post("/surfaces/sessions/codex", SurfacesController, :create_codex_session)
    get("/surfaces/sessions/:id", SurfacesController, :session_status)
    post("/surfaces/sessions/:id/prompt", SurfacesController, :send_prompt)

    post("/surfaces/dispatch", SurfacesController, :dispatch)
    post("/surfaces/message", SurfacesController, :send_gateway_message)

    # Second Brain vault search (FTS5)
    get("/vault/search", VaultController, :search)
    get("/vault/tree", VaultController, :tree)
    get("/vault/stats", VaultController, :stats)
    post("/vault/index", VaultController, :reindex)
  end

  # Anthropic API-compatible proxy — routes through EMA Surfaces (CLI-backed)
  # OpenClaw points its anthropic baseUrl here instead of api.anthropic.com
  scope "/v1", EmaWeb do
    pipe_through(:api)

    post("/messages", AnthropicProxyController, :create_message)
  end
end
