defmodule Ema.Claude.AsyncDispatchTest do
  use ExUnit.Case, async: false

  alias Ema.Claude.FakeShell
  alias Ema.Claude.ProviderRegistry

  @pubsub Ema.PubSub
  @topic "bridge:results"

  setup do
    Application.put_env(:ema, :claude_shell, FakeShell)

    Application.put_env(:ema, :claude_providers, [
      %{id: "claude-cli", type: :claude, cmd: "claude", priority: 100, enabled: true}
    ])

    FakeShell.reset()
    ProviderRegistry.reload()

    # Subscribe so we can assert on broadcast messages
    Phoenix.PubSub.subscribe(@pubsub, @topic)

    on_exit(fn ->
      Application.put_env(:ema, :claude_shell, Ema.Claude.SystemShell)
      FakeShell.reset()
      ProviderRegistry.reload()
    end)

    :ok
  end

  test "async_run returns {:ok, ref} immediately" do
    FakeShell.put_response(
      "claude",
      ["--permission-mode", "bypassPermissions", "--print", "--output-format", "json", "Say hi"],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => false,
          "result" => "hello"
        }),
        0
      }
    )

    {result, ref} = timed_async_run("Say hi")

    assert result == :ok
    assert is_reference(ref)

    # Drain the async result so the task completes before on_exit cleanup
    assert_receive {:bridge_result, ^ref, _}, 5_000
  end

  test "results arrive via PubSub after async_run" do
    FakeShell.put_response(
      "claude",
      ["--permission-mode", "bypassPermissions", "--print", "--output-format", "json", "Say hi"],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => false,
          "result" => "hello"
        }),
        0
      }
    )

    {:ok, ref} = ProviderRegistry.async_run("Say hi")

    assert_receive {:bridge_result, ^ref, {:ok, payload}}, 5_000
    assert payload.content == "hello"
    assert payload.provider == "claude-cli"
  end

  test "provider errors are broadcast via PubSub" do
    FakeShell.put_response(
      "claude",
      ["--permission-mode", "bypassPermissions", "--print", "--output-format", "json", "fail"],
      {
        Jason.encode!(%{
          "type" => "result",
          "is_error" => true,
          "result" => "Failed to authenticate. OAuth token has expired."
        }),
        0
      }
    )

    {:ok, ref} = ProviderRegistry.async_run("fail")

    assert_receive {:bridge_result, ^ref, {:error, error}}, 5_000
    assert error.code in [:auth_expired, :no_provider_available]
  end

  # Returns the async_run result and measures that the call itself was fast
  # (i.e. non-blocking). We don't assert a hard upper bound because CI can
  # be slow, but the call should return well under 1 second.
  defp timed_async_run(prompt) do
    t0 = System.monotonic_time(:millisecond)
    {:ok, ref} = ProviderRegistry.async_run(prompt)
    elapsed = System.monotonic_time(:millisecond) - t0

    # Sanity check: the call itself should not block for the full timeout
    assert elapsed < 1_000, "async_run blocked for #{elapsed}ms — expected immediate return"

    {:ok, ref}
  end
end
