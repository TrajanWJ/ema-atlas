defmodule Ema.Claude.SlowShell do
  @behaviour Ema.Claude.Shell

  @impl true
  def cmd(_command, _args, _opts \\ []) do
    Process.sleep(50)
    {"slow", 0}
  end
end

defmodule Ema.Claude.ProviderRegistryTest do
  use ExUnit.Case, async: false

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

  test "preflight detects expired Claude auth even when auth status reports logged in" do
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

    result = ProviderRegistry.preflight()

    claude = Enum.find(result.providers, &(&1.id == "claude-cli"))
    codex = Enum.find(result.providers, &(&1.id == "codex-cli"))

    refute result.ok
    refute claude.healthy
    assert claude.error.code == :auth_expired
    assert codex.healthy
    assert result.summary.primary_blocker == :auth_expired
    assert result.summary.status == :degraded
    assert result.summary.message =~ "refresh CLI auth"
  end

  test "preflight classifies malformed Codex command construction" do
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
          "is_error" => false,
          "result" => "OK"
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
      {"error: unexpected argument 'is' found\nUsage: codex exec [OPTIONS] [PROMPT] [COMMAND]\nbash: line 3: Title:: command not found\n",
       2}
    )

    result = ProviderRegistry.preflight()
    codex = Enum.find(result.providers, &(&1.id == "codex-cli"))

    refute result.ok
    refute codex.healthy
    assert codex.error.code == :command_malformed
    assert result.summary.primary_blocker == :command_malformed
  end

  test "run falls back from Claude auth failure to Codex" do
    FakeShell.put_response(
      "claude",
      ["--permission-mode", "bypassPermissions", "--print", "--output-format", "json", "Say hi"],
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

    FakeShell.put_response(
      "codex",
      ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--json", "Say hi"],
      {~s({"type":"item.completed","item":{"type":"agent_message","text":"hi from codex"}}) <>
         "\n", 0}
    )

    assert {:ok, result} = ProviderRegistry.run("Say hi")
    assert result.provider == "codex-cli"
    assert result.provider_type == :codex
    assert result.content == "hi from codex"

    attempts = result.attempts
    assert Enum.at(attempts, 0).provider == "claude-cli"
    assert Enum.at(attempts, 0).code == :auth_expired
    assert Enum.at(attempts, 1).provider == "codex-cli"
    assert Enum.at(attempts, 1).status == :ok

    providers = ProviderRegistry.list_available()
    claude = Enum.find(providers, &(&1.id == "claude-cli"))
    codex = Enum.find(providers, &(&1.id == "codex-cli"))

    assert claude.health in [:degraded, :unhealthy]
    assert codex.health == :healthy
  end

  test "classifies provider queue timeout separately from generic timeout" do
    FakeShell.put_response(
      "claude",
      [
        "--permission-mode",
        "bypassPermissions",
        "--print",
        "--output-format",
        "json",
        "Wait your turn"
      ],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => true,
          "result" => "Request timed out while queued behind overloaded capacity"
        }),
        0
      }
    )

    assert {:error, error} = ProviderRegistry.run("Wait your turn", allow_fallback: false)
    assert error.code == :timeout
    assert error.timeout_kind == :queue
    assert error.classification == {:timeout, :queue}
    assert error.retryable == true
  end

  test "classifies provider read timeout separately from generic timeout" do
    FakeShell.put_response(
      "claude",
      [
        "--permission-mode",
        "bypassPermissions",
        "--print",
        "--output-format",
        "json",
        "Read slowly"
      ],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => true,
          "result" => "Read timeout while waiting for response headers from provider"
        }),
        0
      }
    )

    assert {:error, error} = ProviderRegistry.run("Read slowly", allow_fallback: false)
    assert error.code == :timeout
    assert error.timeout_kind == :read
    assert error.classification == {:timeout, :read}
    assert error.retryable == true
  end

  test "classifies provider client cancellation as non-retryable" do
    FakeShell.put_response(
      "codex",
      ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--json", "Stop now"],
      {~s({"type":"turn.failed","error":{"message":"Request canceled by user"}}) <> "\n", 0}
    )

    assert {:error, error} =
             ProviderRegistry.run("Stop now", provider: "codex-cli", allow_fallback: false)

    assert error.code == :client_cancelled
    assert error.classification == :client_cancel
    assert error.retryable == false
  end

  test "classifies hard shell timeout as total timeout" do
    assert {:error, error} =
             ProviderRegistry.run("Too slow",
               provider: "claude-cli",
               allow_fallback: false,
               shell: Ema.Claude.SlowShell,
               timeout: 5
             )

    assert error.code == :timeout
    assert error.timeout_kind == :total
    assert error.classification == {:timeout, :total}
    assert error.retryable == true
  end
end
