defmodule EmaWeb.WorkspaceController do
  use EmaWeb, :controller

  alias Ema.Workspace.Synthesizer

  def actor_packet(conn, %{"actor_id" => actor_id} = params) do
    packet = Synthesizer.actor_packet(actor_id, project: Map.get(params, "project"))
    json(conn, packet)
  end
end
