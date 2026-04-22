import Config

defmodule Ema.RuntimeConfig do
  @moduledoc false

  def env(name, default \\ nil) do
    case System.get_env(name) do
      nil ->
        default

      value ->
        case String.trim(value) do
          "" -> default
          trimmed -> trimmed
        end
    end
  end

  def integer_env(name, default, opts \\ []) when is_integer(default) do
    min = Keyword.get(opts, :min, 1)

    case env(name) do
      nil ->
        default

      value ->
        case Integer.parse(value) do
          {parsed, ""} when parsed >= min ->
            parsed

          _ ->
            IO.warn("Ignoring invalid #{name}=#{inspect(value)}. Expected integer >= #{min}.")
            default
        end
    end
  end
end

# Anthropic API key for direct API adapter (Deliverable 1)
config :ema, anthropic_api_key: System.get_env("ANTHROPIC_API_KEY")

# Hermes API wiring for independent orchestrator chains
config :ema,
  hermes_base_url: Ema.RuntimeConfig.env("HERMES_BASE_URL", "http://127.0.0.1:8642/v1"),
  hermes_api_key: Ema.RuntimeConfig.env("HERMES_API_KEY"),
  hermes_model: Ema.RuntimeConfig.env("HERMES_MODEL", "gpt-5.4")

# OpenClaw gateway URL
config :ema, openclaw_gateway_url: Ema.RuntimeConfig.env("OPENCLAW_GATEWAY_URL", "http://localhost:18789")

# Session mode override from env
if mode = Ema.RuntimeConfig.env("EMA_SESSION_MODE") do
  parsed_mode =
    case String.downcase(mode) do
      "shadow" -> :shadow
      "canary" -> :canary
      "primary" -> :primary
      "ema_only" -> :ema_only
      _ -> nil
    end

  if parsed_mode do
    config :ema, session_mode: parsed_mode
  else
    IO.warn("Ignoring invalid EMA_SESSION_MODE=#{inspect(mode)}. Expected one of shadow, canary, primary, ema_only.")
  end
end

if config_env() == :prod do
  config :ema, EmaWeb.Endpoint,
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: Ema.RuntimeConfig.integer_env("PORT", 4488)
    ],
    secret_key_base: System.fetch_env!("SECRET_KEY_BASE")
end
