defmodule Ema.Feedback.Broadcast do
  @moduledoc """
  Central Discord HTTP broadcast module for EMA stream-of-consciousness channels.

  All Discord posts from EMA flow through here so we have a single place for
  rate-limit handling, bot token lookup, and request formatting.

  Usage:
      Ema.Feedback.Broadcast.emit(:system_heartbeat, "🟢 Gateway: up | Sessions: 2", [])
      Ema.Feedback.Broadcast.emit(:agent_thoughts, "Reasoning: ...", [])
      Ema.Feedback.Broadcast.emit(1489820670333423827, "direct channel ID post", [])
  """

  require Logger

  @default_channel_ids %{
    system_heartbeat: 1_489_820_670_333_423_827,
    agent_thoughts: 1_489_820_679_472_677_044,
    intent_stream: 1_489_820_673_760_301_156,
    pipeline_flow: 1_489_820_676_859_756_606,
    memory_writes: 1_489_820_685_101_699_193,
    intelligence_layer: 1_489_820_682_198_974_525,
    babysitter_digest: 1_489_856_926_706_827_264,
    babysitter_live: 1_489_786_483_970_936_933
  }

  @discord_api "https://discord.com/api/v10"

  @type channel_key :: atom() | pos_integer()
  @type emit_opts :: [
          username: String.t(),
          suppress: boolean()
        ]

  @doc """
  Post a message to a named stream channel or a raw Discord channel ID.

  Returns `:ok` or `{:error, reason}`.
  """
  @spec emit(channel_key(), String.t(), emit_opts()) :: :ok | {:error, term()}
  def emit(channel, content, opts \\ []) do
    if Keyword.get(opts, :suppress, false) do
      :ok
    else
      channel_id = resolve_channel(channel)
      do_emit(channel_id, content)
    end
  end

  @doc "Return the resolved Discord channel ID for a named key."
  @spec channel_id(atom()) :: pos_integer() | nil
  def channel_id(key), do: Map.get(channel_ids(), key)

  @doc "Return all channel ID mappings."
  @spec channel_ids() :: %{atom() => pos_integer()}
  def channel_ids do
    configured = Application.get_env(:ema, :discord_channel_ids, %{})

    configured
    |> Enum.reduce(@default_channel_ids, fn {key, value}, acc ->
      case normalize_channel_id(value) do
        nil -> acc
        normalized -> Map.put(acc, key, normalized)
      end
    end)
  end

  # --- Private ---

  defp resolve_channel(channel) when is_atom(channel) do
    case Map.fetch(channel_ids(), channel) do
      {:ok, id} ->
        id

      :error ->
        Logger.warning("[Broadcast] Unknown channel key: #{inspect(channel)}")
        nil
    end
  end

  defp resolve_channel(channel) when is_integer(channel) and channel > 0, do: channel
  defp resolve_channel(channel) when is_binary(channel), do: normalize_channel_id(channel)

  defp resolve_channel(other) do
    Logger.warning("[Broadcast] Invalid channel: #{inspect(other)}")
    nil
  end

  defp do_emit(nil, _content), do: {:error, :unknown_channel}

  defp do_emit(channel_id, content) when is_binary(content) do
    token = discord_token()

    if is_nil(token) or token == "" do
      Logger.warning("[Broadcast] DISCORD_BOT_TOKEN not set — skipping emit to #{channel_id}")
      {:error, :no_token}
    else
      url = "#{@discord_api}/channels/#{channel_id}/messages"
      body = Jason.encode!(%{"content" => truncate(content, 2000)})

      case Req.post(url,
             body: body,
             headers: [
               {"authorization", "Bot #{token}"},
               {"content-type", "application/json"}
             ]
           ) do
        {:ok, %{status: status}} when status in 200..204 ->
          :ok

        {:ok, %{status: 429, body: body}} ->
          retry_after = get_in(body, ["retry_after"]) || 1.0
          Logger.warning("[Broadcast] Rate limited on #{channel_id}, retry_after=#{retry_after}s")
          Process.sleep(round(retry_after * 1000))
          do_emit(channel_id, content)

        {:ok, %{status: status, body: body}} ->
          Logger.error("[Broadcast] Discord error #{status} on #{channel_id}: #{inspect(body)}")
          {:error, {:http_error, status}}

        {:error, reason} ->
          Logger.error("[Broadcast] HTTP failure emitting to #{channel_id}: #{inspect(reason)}")
          {:error, reason}
      end
    end
  end

  defp discord_token do
    Application.get_env(:ema, :discord_bot_token) || System.get_env("DISCORD_BOT_TOKEN")
  end

  defp normalize_channel_id(value) when is_integer(value) and value > 0, do: value

  defp normalize_channel_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {id, ""} when id > 0 -> id
      _ -> nil
    end
  end

  defp normalize_channel_id(_), do: nil

  defp truncate(content, max_len) when byte_size(content) > max_len do
    String.slice(content, 0, max_len - 3) <> "..."
  end

  defp truncate(content, _), do: content
end
