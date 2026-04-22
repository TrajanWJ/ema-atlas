import Config

config :ema,
  ecto_repos: [Ema.Repo]

config :ema, EmaWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: EmaWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Ema.PubSub,
  live_view: [signing_salt: "ema_lv_salt"]

config :ema, Ema.Repo,
  database: Path.expand("../priv/ema_dev.db", Path.dirname(__ENV__.file)),
  pool_size: 5

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

config :swoosh, :api_client, false

# Vault (Second Brain) path — markdown notes directory
config :ema, vault_path: Path.expand("~/vault")

# Session mode: :shadow | :canary | :primary | :ema_only
config :ema, session_mode: :shadow

# Shadow comparison threshold
config :ema, shadow_quality_threshold: 0.90

config :ema, :claude_shell, Ema.Claude.SystemShell

config :ema, :claude_providers,
  [
    %{id: "claude-cli", type: :claude, cmd: "claude", priority: 100, model: "sonnet", enabled: true},
    %{id: "codex-cli", type: :codex, cmd: "codex", priority: 90, enabled: true}
  ]

import_config "#{config_env()}.exs"
