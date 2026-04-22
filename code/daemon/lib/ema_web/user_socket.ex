defmodule EmaWeb.UserSocket do
  @moduledoc """
  Minimal user socket for EMA realtime endpoints.

  The babysitter API is HTTP-first today, but the endpoint advertises a websocket
  mount. Keeping a concrete socket module avoids runtime failures when `/socket`
  is negotiated and gives the daemon a safe foundation for future live stream
  transports.
  """

  use Phoenix.Socket

  channel "babysitter:*", EmaWeb.BabysitterChannel
  channel "execution-stream:*", EmaWeb.ExecutionStreamChannel
  channel "host-truth:*", EmaWeb.HostTruthChannel
  channel "control-plane:*", EmaWeb.ControlPlaneChannel

  @impl true
  def connect(_params, socket, _connect_info), do: {:ok, socket}

  @impl true
  def id(_socket), do: nil
end
