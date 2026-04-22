defmodule Ema.Stream.Babysitter do
  @moduledoc """
  Discord babysitter surface adapter.

  It polls the babysitter sprint channel for operator messages, turns recognized
  incident commands into authority requests, and renders lightweight views/acks
  back to Discord. It should not hold canonical incident truth itself.
  """

  use GenServer

  require Logger

  alias Ema.Babysitter.CommandRouter
  alias Ema.Discord.{IncidentCommands, IncidentsView}
  alias Ema.Feedback.Broadcast

  @babysitter_channel_id 1_489_786_483_970_936_933
  @human_user_id "1482230345909932168"
  @poll_interval_ms 60_000
  @escalation_threshold_ms 5 * 60 * 1_000
  @discord_api "https://discord.com/api/v10"
  @ets_table :stream_babysitter_directives

  # Public API

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Force an immediate poll cycle."
  def poll_now(server \\ __MODULE__) do
    GenServer.cast(server, :poll_now)
  end

  @doc "Return all tracked directives."
  def directives(server \\ __MODULE__) do
    GenServer.call(server, :directives)
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    table = :ets.new(@ets_table, [:set, :named_table, :public, read_concurrency: true])

    timer_ref = schedule_poll(@poll_interval_ms)

    state = %{
      poll_interval_ms: @poll_interval_ms,
      timer_ref: timer_ref,
      ets: table,
      poll_count: 0,
      last_poll_at: nil,
      # Track message IDs we've already seen, rolling window
      seen_message_ids: MapSet.new()
    }

    Logger.info("[Stream.Babysitter] Started, polling every #{@poll_interval_ms}ms")
    {:ok, state}
  end

  @impl true
  def handle_call(:directives, _from, state) do
    directives = :ets.tab2list(@ets_table) |> Enum.map(fn {_k, v} -> v end)
    {:reply, directives, state}
  end

  @impl true
  def handle_cast(:poll_now, state) do
    {:noreply, do_poll(state)}
  end

  @impl true
  def handle_info(:poll, state) do
    new_state = do_poll(state)
    timer_ref = schedule_poll(state.poll_interval_ms)
    {:noreply, %{new_state | timer_ref: timer_ref}}
  end

  # --- Poll logic ---

  defp do_poll(state) do
    now = DateTime.utc_now()
    Logger.debug("[Stream.Babysitter] Polling #babysitter-live")

    # Check for escalation-due directives first
    check_escalations(now)

    # Fetch recent messages
    case fetch_recent_messages(@babysitter_channel_id) do
      {:ok, messages} ->
        new_seen = process_messages(messages, state.seen_message_ids, now)

        # Keep seen set bounded to 500 entries
        seen =
          if MapSet.size(new_seen) > 500 do
            # Trim to last 200
            new_seen |> MapSet.to_list() |> Enum.take(-200) |> MapSet.new()
          else
            new_seen
          end

        %{state | poll_count: state.poll_count + 1, last_poll_at: now, seen_message_ids: seen}

      {:error, reason} ->
        Logger.warning("[Stream.Babysitter] Poll failed: #{inspect(reason)}")
        %{state | poll_count: state.poll_count + 1, last_poll_at: now}
    end
  end

  defp process_messages(messages, seen, now) do
    Enum.reduce(messages, seen, fn msg, acc_seen ->
      msg_id = msg["id"] || ""
      author_id = get_in(msg, ["author", "id"]) || ""
      content = msg["content"] || ""

      cond do
        MapSet.member?(acc_seen, msg_id) ->
          acc_seen

        author_id != @human_user_id ->
          MapSet.put(acc_seen, msg_id)

        content == "" ->
          MapSet.put(acc_seen, msg_id)

        # Skip bot acknowledgements
        String.starts_with?(content, "[ACK]") or String.starts_with?(content, "[INTENT]") ->
          MapSet.put(acc_seen, msg_id)

        true ->
          handle_directive(msg_id, content, author_id, now)
          MapSet.put(acc_seen, msg_id)
      end
    end)
  end

  defp handle_directive(msg_id, content, author_id, now) do
    case :ets.lookup(@ets_table, msg_id) do
      [{^msg_id, _directive}] ->
        :ok

      [] ->
        Logger.info("[Stream.Babysitter] New directive: #{String.slice(content, 0, 80)}")

        directive = %{
          id: msg_id,
          content: content,
          detected_at: now,
          acknowledged: false,
          acknowledged_at: nil,
          escalated: false,
          actor: author_id
        }

        :ets.insert(@ets_table, {msg_id, directive})

        ack_msg =
          case CommandRouter.handle(content) do
            {:ok, %{action: :start, chain: chain}} ->
              Broadcast.emit(:intent_stream, "[INTENT] START #{chain.id}")
              "[ACK] START #{chain.id} · bucket=#{chain.cadence_bucket} · executor=#{chain.executor}"

            {:ok, %{action: :stop, chain: chain}} ->
              Broadcast.emit(:intent_stream, "[INTENT] STOP #{chain.id}")
              "[ACK] STOP #{chain.id}"

            {:ok, %{action: :pause, chain: chain}} ->
              Broadcast.emit(:intent_stream, "[INTENT] PAUSE #{chain.id}")
              "[ACK] PAUSE #{chain.id}"

            {:ok, %{action: :resume, chain: chain}} ->
              Broadcast.emit(:intent_stream, "[INTENT] RESUME #{chain.id}")
              "[ACK] RESUME #{chain.id} · bucket=#{chain.cadence_bucket}"

            {:ok, %{action: :hint, chain: chain}} ->
              Broadcast.emit(:intent_stream, "[INTENT] HINT #{chain.id}")
              "[ACK] HINT #{chain.id} · next=#{DateTime.to_iso8601(chain.requested_next_tick_at)}"

            {:ok, %{action: :status, snapshot: snapshot}} ->
              "[ACK] STATUS · active=#{snapshot.active_count} · chains=#{length(snapshot.chains)} · Hermes=#{snapshot.hermes_status.status}"

            {:ok, %{action: :list_chains, chains: chains}} ->
              rendered =
                chains
                |> Enum.take(6)
                |> Enum.map(fn chain -> "#{chain.id}(#{chain.status})" end)
                |> Enum.join(", ")

              if rendered == "", do: "[ACK] LIST CHAINS · none", else: "[ACK] LIST CHAINS · #{rendered}"

            {:error, %{code: :unknown_command}} ->
              case IncidentCommands.maybe_handle(content, author_id) do
                {:ok, {:list, incidents}} ->
                  IncidentsView.render_list(incidents)

                {:ok, {:action, action, incident}} ->
                  Broadcast.emit(
                    :intent_stream,
                    "[INTENT] #{action} #{incident["incident_id"] || incident[:incident_id]}"
                  )

                  IncidentsView.render_action(action, incident)

                {:error, reason} ->
                  "[ACK] incident command failed: #{inspect(reason)}"

                :ignore ->
                  Broadcast.emit(:intent_stream, "[INTENT] Taking: #{content}")
                  "[ACK] Received directive: #{String.slice(content, 0, 120)}"
              end

            {:error, reason} ->
              "[ACK] command failed: #{Map.get(reason, :message) || inspect(reason)}"
          end

        post_to_channel(@babysitter_channel_id, ack_msg)

        acknowledged = %{directive | acknowledged: true, acknowledged_at: DateTime.utc_now()}
        :ets.insert(@ets_table, {msg_id, acknowledged})

        :ok
    end
  end

  defp check_escalations(now) do
    cutoff = DateTime.add(now, -@escalation_threshold_ms, :millisecond)

    :ets.tab2list(@ets_table)
    |> Enum.each(fn {_id, directive} ->
      if not directive.acknowledged and not directive.escalated do
        if DateTime.compare(directive.detected_at, cutoff) == :lt do
          Logger.warning("[Stream.Babysitter] Escalating stale directive: #{directive.id}")

          escalation = """
          ⚠️ **[ESCALATION]** Directive unacknowledged for 5+ minutes
          > #{String.slice(directive.content, 0, 200)}
          Detected at: #{DateTime.to_string(directive.detected_at)}
          """

          Broadcast.emit(:intent_stream, String.trim(escalation))

          updated = %{directive | escalated: true}
          :ets.insert(@ets_table, {directive.id, updated})
        end
      end
    end)
  end

  defp fetch_recent_messages(channel_id) do
    token = discord_token()

    if is_nil(token) or token == "" do
      {:error, :no_token}
    else
      url = "#{@discord_api}/channels/#{channel_id}/messages?limit=50"

      case Req.get(url,
             headers: [{"authorization", "Bot #{token}"}],
             receive_timeout: 10_000
           ) do
        {:ok, %{status: status, body: body}} when status in 200..204 ->
          {:ok, body}

        {:ok, %{status: 429, body: body}} ->
          retry_after = get_in(body, ["retry_after"]) || 1.0
          Process.sleep(round(retry_after * 1000))
          fetch_recent_messages(channel_id)

        {:ok, %{status: status, body: body}} ->
          {:error, {:http_error, status, body}}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp post_to_channel(channel_id, content) do
    token = discord_token()

    if is_nil(token) or token == "" do
      Logger.warning("[Stream.Babysitter] No token, skipping post to #{channel_id}")
      :ok
    else
      url = "#{@discord_api}/channels/#{channel_id}/messages"
      body = Jason.encode!(%{"content" => String.slice(content, 0, 2000)})

      case Req.post(url,
             body: body,
             headers: [
               {"authorization", "Bot #{token}"},
               {"content-type", "application/json"}
             ]
           ) do
        {:ok, %{status: status}} when status in 200..204 ->
          :ok

        {:ok, %{status: status}} ->
          Logger.warning("[Stream.Babysitter] Failed to post ack, status=#{status}")
          :ok

        {:error, reason} ->
          Logger.warning("[Stream.Babysitter] Failed to post ack: #{inspect(reason)}")
          :ok
      end
    end
  end

  defp discord_token do
    Application.get_env(:ema, :discord_bot_token) || System.get_env("DISCORD_BOT_TOKEN")
  end

  defp schedule_poll(interval_ms) do
    Process.send_after(self(), :poll, interval_ms)
  end
end
