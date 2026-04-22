import Config

config :ema, EmaWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: String.to_integer(System.get_env("PORT") || "4488")],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "dev_secret_key_base_replace_in_prod_min_64_chars_long_xxxxxxxxxx",
  watchers: []

config :ema, Ema.Repo,
  database: Path.expand("../priv/ema_dev.db", Path.dirname(__ENV__.file)),
  pool_size: 5,
  show_sensitive_data_on_connection_error: true

config :logger, level: :debug

config :phoenix, :stacktrace_depth, 20

config :phoenix, :plug_init_mode, :runtime
