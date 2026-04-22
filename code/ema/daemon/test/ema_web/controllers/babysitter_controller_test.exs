defmodule EmaWeb.BabysitterControllerTest do
  use EmaWeb.ConnCase, async: false

  setup do
    Ema.Babysitter.StreamTicker.update_stream("babysitter-live", %{manual_interval_ms: nil})
    :ok
  end

  test "GET /api/babysitter exposes stream state, defaults, lanes, and cadence buckets", %{
    conn: conn
  } do
    conn = get(conn, "/api/babysitter")
    body = json_response(conn, 200)

    assert %{
             "streams" => streams,
             "defaults" => defaults,
             "lanes" => lanes,
             "cadence_buckets" => cadence_buckets
           } = body

    assert Map.has_key?(streams, "babysitter-live")
    assert Map.has_key?(defaults, "babysitter-live")
    assert Map.has_key?(defaults, "babysitter-ops")
    assert Map.has_key?(lanes, "operator_rollup")
    assert Map.has_key?(cadence_buckets, "realtime")
    assert get_in(streams, ["babysitter-live", "lane"]) == "operator_rollup"
    assert get_in(streams, ["babysitter-live", "cadence_bucket"]) == "realtime"
  end

  test "GET /api/babysitter/:stream returns 404 payload for unknown stream", %{conn: conn} do
    conn = get(conn, "/api/babysitter/unknown-stream")
    body = json_response(conn, 404)

    assert body["error"] == "stream_not_found"
    assert body["stream"] == "unknown-stream"
    assert get_in(body, ["defaults", "stream"]) == "unknown-stream"
  end

  test "PUT /api/babysitter/:stream updates config incrementally", %{conn: conn} do
    stream = "controller-config-live"

    conn =
      put(conn, "/api/babysitter/#{stream}", %{
        interval_ms: 33_000,
        time_range_ms: 180_000,
        signal_floor: 2.5
      })

    body = json_response(conn, 200)

    assert get_in(body, ["stream", "config", "manual_interval_ms"]) == 33_000
    assert get_in(body, ["stream", "config", "activity_window_ms"]) == 180_000
    assert get_in(body, ["stream", "config", "signal_floor"]) == 2.5
    assert get_in(body, ["stream", "config", "base_interval_ms"]) == 20_000
    assert get_in(body, ["stream", "time_range_ms"]) == 180_000
    assert get_in(body, ["stream", "lane"]) == "operator_rollup"
    assert get_in(body, ["stream", "cadence_bucket"]) == "realtime"
  end

  test "POST /api/babysitter/:stream/activity records activity and returns the updated stream", %{
    conn: conn
  } do
    stream = "controller-live-activity"

    conn =
      post(conn, "/api/babysitter/#{stream}/activity", %{
        message_count: 2,
        token_pressure: 0.9,
        source: "discord"
      })

    body = json_response(conn, 200)

    assert get_in(body, ["stream", "stream"]) == stream
    assert get_in(body, ["stream", "recent_event_count"]) >= 1
    assert get_in(body, ["stream", "token_pressure"]) == 0.9
    assert get_in(body, ["stream", "suppression_reason"]) == "token_pressure"
    assert "discord" in get_in(body, ["stream", "sources"])
    assert is_binary(get_in(body, ["stream", "tick_render", "header"]))
    assert is_binary(get_in(body, ["stream", "tick_render", "compact"]))
  end

  test "chain control endpoints expose autonomous chain state", %{conn: conn} do
    conn = post(conn, "/api/babysitter/chains/operator-rollup/start", %{})
    start_body = json_response(conn, 200)

    assert start_body["ok"] == true
    assert get_in(start_body, ["chain", "id"]) == "operator-rollup"
    assert get_in(start_body, ["chain", "status"]) == "running"

    conn = get(recycle(conn), "/api/babysitter/chains")
    snapshot = json_response(conn, 200)
    assert is_list(snapshot["chains"])
    assert is_map(snapshot["hermes_status"])

    conn =
      post(recycle(conn), "/api/babysitter/chains/operator-rollup/hint", %{
        next_tick_hint_ms: 600_000
      })

    hinted = json_response(conn, 200)
    assert hinted["ok"] == true
    assert is_binary(get_in(hinted, ["chain", "requested_next_tick_at"]))

    conn = post(recycle(conn), "/api/babysitter/chains/operator-rollup/stop", %{})
    stopped = json_response(conn, 200)
    assert stopped["ok"] == true
    assert get_in(stopped, ["chain", "status"]) == "stopped"
  end

  test "POST /api/babysitter/rewrite-category supports dry run planning", %{conn: conn} do
    conn = post(conn, "/api/babysitter/rewrite-category", %{dry_run: true})
    body = json_response(conn, 200)

    assert body["dry_run"] == true
    assert get_in(body, ["category", "name"]) == "🧵 STREAM"
    assert is_list(body["actions"])

    assert Enum.any?(body["actions"], fn action -> action["spec"]["name"] == "babysitter-live" end)

    assert Enum.any?(body["actions"], fn action ->
             action["spec"]["name"] == "babysitter-sprint"
           end)

    refute Enum.any?(body["actions"], fn action -> action["spec"]["name"] == "alerts" end)
  end

  test "POST /api/babysitter/rewrite-category accepts explicit current category/channel overrides",
       %{conn: conn} do
    conn =
      post(conn, "/api/babysitter/rewrite-category", %{
        dry_run: true,
        category_name: "🧵 CURRENT STREAM",
        channel_specs: [
          %{name: "babysitter-live", topic: "Current operator lane.", position: 0},
          %{name: "execution-log", topic: "Evidence.", position: 1}
        ]
      })

    body = json_response(conn, 200)

    assert body["dry_run"] == true
    assert get_in(body, ["category", "name"]) == "🧵 CURRENT STREAM"

    assert Enum.map(body["actions"], fn action -> action["spec"]["name"] end) == [
             "babysitter-live",
             "execution-log"
           ]
  end

  test "POST /api/babysitter/command wraps operator-friendly chain commands", %{conn: conn} do
    conn = post(conn, "/api/babysitter/command", %{command: "START hermes-watch"})
    started = json_response(conn, 200)
    assert started["ok"] == true
    assert get_in(started, ["chain", "id"]) == "hermes-watch"

    conn = post(recycle(conn), "/api/babysitter/command", %{command: "LIST CHAINS"})
    listed = json_response(conn, 200)
    assert listed["ok"] == true
    assert is_list(listed["chains"])

    conn = post(recycle(conn), "/api/babysitter/command", %{command: "STOP hermes-watch"})
    stopped = json_response(conn, 200)
    assert stopped["ok"] == true
    assert get_in(stopped, ["chain", "status"]) == "stopped"
  end
end
