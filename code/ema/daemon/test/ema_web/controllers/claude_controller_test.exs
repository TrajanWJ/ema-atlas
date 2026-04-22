defmodule EmaWeb.ClaudeControllerTest do
  use EmaWeb.ConnCase, async: false

  alias Ema.Claude.FakeShell
  alias Ema.Claude.ProviderRegistry

  setup do
    Application.put_env(:ema, :claude_shell, FakeShell)

    Application.put_env(:ema, :claude_providers, [
      %{id: "claude-cli", type: :claude, cmd: "claude", priority: 100, enabled: true},
      %{id: "codex-cli", type: :codex, cmd: "codex", priority: 90, enabled: true}
    ])

    FakeShell.reset()
    ProviderRegistry.reload()

    on_exit(fn ->
      Application.put_env(:ema, :claude_shell, Ema.Claude.SystemShell)
      FakeShell.reset()
      ProviderRegistry.reload()
    end)

    :ok
  end

  test "POST /api/claude/preflight surfaces summary for auth failures", %{conn: conn} do
    FakeShell.put_response("claude", ["auth", "status"], {
      Jason.encode!(%{"loggedIn" => true, "authMethod" => "claude.ai"}),
      0
    })

    FakeShell.put_response(
      "claude",
      [
        "--permission-mode",
        "bypassPermissions",
        "--print",
        "--output-format",
        "json",
        "Reply with exactly OK"
      ],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => true,
          "result" =>
            "Failed to authenticate. API Error: 401 {\"error\":{\"message\":\"OAuth token has expired.\"}}"
        }),
        0
      }
    )

    FakeShell.put_response("codex", ["login", "status"], {"Logged in using ChatGPT\n", 0})

    FakeShell.put_response(
      "codex",
      [
        "exec",
        "--skip-git-repo-check",
        "--sandbox",
        "workspace-write",
        "--json",
        "Reply with exactly OK"
      ],
      {~s({"type":"item.completed","item":{"type":"agent_message","text":"OK"}}) <> "\n", 0}
    )

    conn = post(conn, "/api/claude/preflight", %{})
    body = json_response(conn, 200)

    refute body["ok"]
    assert get_in(body, ["summary", "primary_blocker"]) == "auth_expired"
    assert get_in(body, ["summary", "message"]) =~ "refresh CLI auth"
  end

  test "POST /api/claude/run returns a fallback-backed result", %{conn: conn} do
    FakeShell.put_response(
      "claude",
      [
        "--permission-mode",
        "bypassPermissions",
        "--print",
        "--output-format",
        "json",
        "Explain this"
      ],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => true,
          "result" => "Rate limit exceeded"
        }),
        0
      }
    )

    FakeShell.put_response(
      "codex",
      ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--json", "Explain this"],
      {~s({"type":"item.completed","item":{"type":"agent_message","text":"Codex handled it"}}) <>
         "\n", 0}
    )

    conn = post(conn, "/api/claude/run", %{prompt: "Explain this"})
    body = json_response(conn, 200)

    assert body["ok"]
    assert get_in(body, ["result", "provider"]) == "codex-cli"
    assert get_in(body, ["result", "content"]) == "Codex handled it"
    assert get_in(body, ["result", "attempts", Access.at(0), "code"]) == "rate_limited"
  end
end
