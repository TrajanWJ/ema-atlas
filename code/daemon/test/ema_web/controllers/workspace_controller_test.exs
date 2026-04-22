defmodule EmaWeb.WorkspaceControllerTest do
  use EmaWeb.ConnCase, async: false

  setup do
    root = Path.join(System.tmp_dir!(), "ema_workspace_test_" <> Integer.to_string(System.unique_integer([:positive])))
    File.rm_rf!(root)
    File.mkdir_p!(Path.join(root, "actors"))
    File.mkdir_p!(Path.join(root, "handoffs"))
    File.mkdir_p!(Path.join(root, "schedules"))
    File.mkdir_p!(Path.join(root, "sessions"))

    File.write!(Path.join(root, "actors/hermes-a4.md"), """
# hermes-a4

- actor_id: hermes-a4
- harness: Hermes
- role: workspace UX
- status: active
- assignment: Define workspace packet
- created_at: 2026-04-21T05:00:00Z
- updated_at: 2026-04-21T05:10:00Z
""")

    File.write!(Path.join(root, "handoffs/h1.md"), """
# handoff

- from: claude-a1
- to: hermes-a4
- subject: Review packet shape
- status: open
- created_at: 2026-04-21T05:09:00Z
""")

    File.write!(Path.join(root, "schedules/block1.md"), """
# 2026-04-21 workspace

- id: block-1
- actor: hermes-a4
- title: Draft workspace packet
- status: queued
- scheduled_window:
    start: 2026-04-21T09:00:00Z
    end: 2026-04-21T10:00:00Z
- phase: queued
- created_at: 2026-04-21T05:00:00Z
- updated_at: 2026-04-21T05:10:00Z
""")

    File.write!(Path.join(root, "sessions/s1.md"), """
# session breadcrumb

- session_binding_id: sbind-1
- status: active
- actor_id: hermes-a4
- harness: Hermes
- cwd: /home/trajan/Projects/ema
- created_at: 2026-04-21T05:00:00Z
- updated_at: 2026-04-21T05:10:00Z
- last_activity_at: 2026-04-21T05:10:00Z
- execution_id: exe-1
- summary: active workspace session
- resume_hint: tmux attach -t ema
""")

    old = Application.get_env(:ema, :workspace_shared_root)
    Application.put_env(:ema, :workspace_shared_root, root)

    on_exit(fn ->
      if old == nil, do: Application.delete_env(:ema, :workspace_shared_root), else: Application.put_env(:ema, :workspace_shared_root, old)
      File.rm_rf!(root)
    end)

    :ok
  end

  test "GET /api/workspace/actors/:actor_id/packet returns actor-scoped workspace packet", %{conn: conn} do
    conn = get(conn, "/api/workspace/actors/hermes-a4/packet")
    body = json_response(conn, 200)

    assert get_in(body, ["actor", "actor_id"]) == "hermes-a4"
    assert get_in(body, ["actor", "harness"]) == "Hermes"
    assert get_in(body, ["current_focus", "assignment"]) == "Define workspace packet"
    assert length(get_in(body, ["handoffs", "inbox"])) == 1
    assert length(get_in(body, ["sessions", "breadcrumbs"])) == 1
    assert length(get_in(body, ["agenda", "items"])) == 1
    assert get_in(body, ["workspace_refs", "root"]) =~ "ema_workspace_test_"
  end
end
