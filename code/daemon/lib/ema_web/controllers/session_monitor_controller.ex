defmodule EmaWeb.SessionMonitorController do
  use EmaWeb, :controller

  alias Ema.Sessions.Monitor

  def index(conn, _params) do
    json(conn, Monitor.snapshot())
  end

  def activity(conn, %{"stream" => stream} = params) do
    attrs = Map.drop(params, ["stream"])
    Monitor.record_activity(stream, attrs)

    json(conn, %{
      ok: true,
      stream: stream,
      recent: Monitor.snapshot().recent
    })
  end
end
