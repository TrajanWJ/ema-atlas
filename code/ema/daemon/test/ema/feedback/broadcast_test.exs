defmodule Ema.Feedback.BroadcastTest do
  use ExUnit.Case, async: false

  alias Ema.Feedback.Broadcast

  setup do
    original = Application.get_env(:ema, :discord_channel_ids)

    on_exit(fn ->
      if is_nil(original) do
        Application.delete_env(:ema, :discord_channel_ids)
      else
        Application.put_env(:ema, :discord_channel_ids, original)
      end
    end)

    :ok
  end

  test "channel_id prefers configured overrides for the current operator lane" do
    Application.put_env(:ema, :discord_channel_ids, %{babysitter_live: 1_495_993_628_735_307_926})

    assert Broadcast.channel_id(:babysitter_live) == 1_495_993_628_735_307_926
  end

  test "channel_ids merges overrides without dropping the defaults" do
    Application.put_env(:ema, :discord_channel_ids, %{babysitter_live: 999, execution_log: 555})

    ids = Broadcast.channel_ids()

    assert ids.babysitter_live == 999
    assert ids.execution_log == 555
    assert is_integer(ids.system_heartbeat)
  end
end
