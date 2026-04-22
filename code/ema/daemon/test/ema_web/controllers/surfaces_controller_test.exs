defmodule EmaWeb.SurfacesControllerTest do
  use EmaWeb.ConnCase, async: false

  test "GET /api/surfaces/operator-status exposes operator-focused host projection", %{conn: conn} do
    conn = get(conn, "/api/surfaces/operator-status")
    body = json_response(conn, 200)

    assert %{
             "generated_at" => generated_at,
             "overall_state" => overall_state,
             "headline" => headline,
             "summary" => summary,
             "domains" => domains,
             "top_causes" => top_causes,
             "operator_actions" => operator_actions,
             "evidence" => evidence,
             "links" => links
           } = body

    assert is_binary(generated_at)
    assert overall_state in ["healthy", "degraded", "stalled"]
    assert is_binary(headline)
    assert is_binary(summary)
    assert is_map(domains)
    assert is_list(top_causes)
    assert is_list(operator_actions)
    assert is_map(evidence)
    assert get_in(links, ["detail"]) == "/api/surfaces/host-truth"

    assert Map.has_key?(domains, "observer_api")
    assert Map.has_key?(domains, "dispatch_loop")
    assert Map.has_key?(domains, "provider_path")
    assert Map.has_key?(domains, "gateway_protocol")

    assert %{
             "state" => observer_state,
             "severity" => observer_severity,
             "summary" => observer_summary,
             "evidence" => observer_evidence,
             "recommended_action" => observer_actions
           } = domains["observer_api"]

    assert observer_state in ["healthy", "degraded", "stalled"]
    assert observer_severity in ["info", "low", "medium", "high", "critical"]
    assert is_binary(observer_summary)
    assert is_map(observer_evidence)
    assert is_list(observer_actions)

    assert Map.has_key?(evidence, "counts")
    assert Map.has_key?(evidence, "dispatch_engine_running")
    assert Map.has_key?(evidence, "effective_queue_count")
  end
end
