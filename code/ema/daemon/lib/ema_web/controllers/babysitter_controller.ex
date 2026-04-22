defmodule EmaWeb.BabysitterController do
  use EmaWeb, :controller

  alias Ema.Babysitter.ChainScheduler
  alias Ema.Babysitter.CommandRouter
  alias Ema.Babysitter.StreamChannels
  alias Ema.Babysitter.StreamTicker
  alias Ema.Babysitter.TakeoverManager
  alias Ema.Stream.CategoryRewriter

  def index(conn, _params) do
    json(conn, StreamTicker.snapshot())
  end

  def show(conn, %{"stream" => stream}) do
    case StreamTicker.stream_snapshot(stream) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{
          error: "stream_not_found",
          stream: stream,
          defaults: StreamChannels.default_config(stream)
        })

      snapshot ->
        json(conn, %{stream: snapshot})
    end
  end

  def update(conn, %{"stream" => stream} = params) do
    attrs = Map.drop(params, ["stream"])
    json(conn, %{stream: StreamTicker.update_stream(stream, attrs)})
  end

  def activity(conn, %{"stream" => stream} = params) do
    attrs = Map.drop(params, ["stream"])
    json(conn, %{stream: StreamTicker.ingest_activity(stream, attrs)})
  end

  def tick(conn, %{"stream" => stream}) do
    json(conn, %{stream: StreamTicker.force_tick(stream)})
  end

  def chains(conn, _params) do
    json(conn, ChainScheduler.snapshot())
  end

  def chain_show(conn, %{"id" => id}) do
    case ChainScheduler.chain_status(id) do
      {:ok, chain} ->
        json(conn, %{chain: chain})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "chain_not_found", id: id})
    end
  end

  def chain_start(conn, %{"id" => id} = params) do
    attrs =
      params
      |> Map.drop(["id"])
      |> maybe_put_default_profile(id)

    case ChainScheduler.start_chain(id, attrs) do
      {:ok, chain} ->
        json(conn, %{ok: true, chain: chain})

      {:error, reason} ->
        conn |> put_status(:bad_request) |> json(%{ok: false, error: inspect(reason)})
    end
  end

  def chain_stop(conn, %{"id" => id}) do
    case ChainScheduler.stop_chain(id) do
      {:ok, chain} ->
        json(conn, %{ok: true, chain: chain})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{ok: false, error: "chain_not_found", id: id})
    end
  end

  def chain_pause(conn, %{"id" => id}) do
    case ChainScheduler.pause_chain(id) do
      {:ok, chain} ->
        json(conn, %{ok: true, chain: chain})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{ok: false, error: "chain_not_found", id: id})
    end
  end

  def chain_resume(conn, %{"id" => id}) do
    case ChainScheduler.resume_chain(id) do
      {:ok, chain} ->
        json(conn, %{ok: true, chain: chain})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{ok: false, error: "chain_not_found", id: id})
    end
  end

  def chain_hint(conn, %{"id" => id} = params) do
    attrs = Map.drop(params, ["id"])

    case ChainScheduler.set_tick_hint(id, attrs) do
      {:ok, chain} ->
        json(conn, %{ok: true, chain: chain})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{ok: false, error: "chain_not_found", id: id})

      {:error, reason} ->
        conn |> put_status(:bad_request) |> json(%{ok: false, error: inspect(reason)})
    end
  end

  def rewrite_category(conn, params) do
    dry_run = Map.get(params, "dry_run", true) in [true, "true", "1", 1, nil]

    opts =
      [dry_run: dry_run]
      |> maybe_put_opt(:category_name, Map.get(params, "category_name"))
      |> maybe_put_opt(:channel_specs, parse_channel_specs(Map.get(params, "channel_specs")))

    case CategoryRewriter.rewrite(opts) do
      {:ok, result} ->
        json(conn, result)

      {:error, reason} ->
        conn |> put_status(:bad_request) |> json(%{ok: false, error: inspect(reason)})
    end
  end

  def command(conn, %{"command" => command}) do
    case CommandRouter.handle(command) do
      {:ok, result} -> json(conn, Map.put(result, :ok, true))
      {:error, error} -> conn |> put_status(:bad_request) |> json(%{ok: false, error: error})
    end
  end

  def command(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{ok: false, error: %{code: :missing_command, message: "command is required"}})
  end

  # --- Takeover endpoints ---

  def takeover_status(conn, %{"stream" => stream}) do
    json(conn, TakeoverManager.status(stream))
  end

  def takeover_activate(conn, %{"stream" => stream} = params) do
    owner = Map.get(params, "owner", "operator")
    reason = Map.get(params, "reason", "manual")
    TakeoverManager.activate(stream, owner, reason)
    json(conn, %{ok: true, stream: stream, owner: owner, reason: reason})
  end

  def takeover_release(conn, %{"stream" => stream}) do
    TakeoverManager.release(stream)
    json(conn, %{ok: true, stream: stream})
  end

  defp maybe_put_default_profile(attrs, id) do
    if Map.has_key?(attrs, "profile") do
      attrs
    else
      default_profile =
        cond do
          String.contains?(id, "hermes") -> "hermes-watch"
          String.contains?(id, "attention") -> "attention-sentry"
          true -> "operator-rollup"
        end

      Map.put(attrs, "profile", default_profile)
    end
  end

  defp maybe_put_opt(opts, _key, nil), do: opts
  defp maybe_put_opt(opts, _key, []), do: opts
  defp maybe_put_opt(opts, key, value), do: Keyword.put(opts, key, value)

  defp parse_channel_specs(nil), do: nil

  defp parse_channel_specs(specs) when is_list(specs) do
    Enum.map(specs, &normalize_channel_spec/1)
  end

  defp parse_channel_specs(_other), do: nil

  defp normalize_channel_spec(%{"name" => name} = spec) do
    %{
      name: name,
      topic: Map.get(spec, "topic", ""),
      position: Map.get(spec, "position", 0)
    }
  end

  defp normalize_channel_spec(%{name: name} = spec) do
    %{
      name: name,
      topic: Map.get(spec, :topic, ""),
      position: Map.get(spec, :position, 0)
    }
  end
end
