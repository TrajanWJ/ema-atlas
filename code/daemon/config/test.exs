import Config

config :ema, EmaWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test_secret_key_base_replace_in_prod_min_64_chars_long_xxxxxxxxxx",
  server: false

config :ema, Ema.Repo,
  database: Path.expand("../priv/ema_test.db", Path.dirname(__ENV__.file)),
  pool_size: 5

config :logger, level: :warning

config :swoosh, :api_client, false

config :phoenix, :plug_init_mode, :runtime
