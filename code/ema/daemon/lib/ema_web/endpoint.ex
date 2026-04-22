defmodule EmaWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ema

  socket "/socket", EmaWeb.UserSocket,
    websocket: true,
    longpoll: false

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]
  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason

  plug EmaWeb.Router
end
