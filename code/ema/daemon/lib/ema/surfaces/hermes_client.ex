defmodule Ema.Surfaces.HermesClient do
  @moduledoc """
  Lightweight Hermes API client for the independent babysitter/orchestrator runtime.

  Hermes remains an execution substrate, not the Discord surface owner. This module
  gives EMA enough awareness to:

    * detect whether Hermes API is reachable
    * enumerate Hermes-exposed models
    * generate optional autonomous chain updates through Hermes when available

  All calls degrade cleanly to local fallbacks so the orchestrator can keep running
  even when Hermes is unavailable.
  """

  require Logger

  @default_timeout 8_000
  @default_generation_timeout 30_000

  @type hermes_status :: %{
          status: :ready | :unreachable | :error,
          base_url: String.t(),
          model: String.t() | nil,
          models: [String.t()],
          error: term() | nil
        }

  @spec status(keyword()) :: {:ok, hermes_status()} | {:error, hermes_status()}
  def status(opts \\ []) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    base_url = normalize_base_url(Keyword.get(opts, :base_url, base_url()))

    case Req.get(base_url <> "/models", headers: headers(), receive_timeout: timeout) do
      {:ok, %{status: status, body: %{"data" => models}}} when status in 200..299 ->
        model_ids =
          models
          |> Enum.map(fn
            %{"id" => id} -> id
            %{"model" => id} -> id
            _ -> nil
          end)
          |> Enum.reject(&is_nil/1)

        {:ok,
         %{
           status: :ready,
           base_url: base_url,
           model: configured_model(),
           models: model_ids,
           error: nil
         }}

      {:ok, %{status: status, body: body}} ->
        payload = %{
          status: :error,
          base_url: base_url,
          model: configured_model(),
          models: [],
          error: {:http_error, status, body}
        }

        {:error, payload}

      {:error, reason} ->
        payload = %{
          status: :unreachable,
          base_url: base_url,
          model: configured_model(),
          models: [],
          error: reason
        }

        {:error, payload}
    end
  end

  @doc """
  Ask Hermes for a concise autonomous chain update.

  Returns `{:ok, %{summary: ..., next_tick_hint_ms: ...}}` when Hermes succeeds.
  Returns `{:error, reason}` on connectivity or API failure.
  """
  @spec generate_chain_update(map(), map(), keyword()) ::
          {:ok, %{summary: String.t(), next_tick_hint_ms: pos_integer() | nil, raw: map()}}
          | {:error, term()}
  def generate_chain_update(chain, scheduler_snapshot, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, @default_generation_timeout)
    base_url = normalize_base_url(Keyword.get(opts, :base_url, base_url()))
    model = Keyword.get(opts, :model, configured_model())

    body = %{
      "model" => model,
      "messages" => [
        %{
          "role" => "system",
          "content" =>
            "You are an autonomous orchestration summarizer. Produce one concise operator-facing update about the chain plus optionally a recommended next wake delay in milliseconds. Reply as strict JSON with keys summary and next_tick_hint_ms. Keep summary under 280 chars."
        },
        %{
          "role" => "user",
          "content" => Jason.encode!(%{
            chain: serializable_chain(chain),
            scheduler: serializable_scheduler_snapshot(scheduler_snapshot)
          })
        }
      ],
      "temperature" => 0.2,
      "stream" => false
    }

    case Req.post(base_url <> "/chat/completions",
           json: body,
           headers: headers(),
           receive_timeout: timeout
         ) do
      {:ok, %{status: status, body: response}} when status in 200..299 ->
        case extract_message_content(response) do
          {:ok, content} ->
            with {:ok, parsed} <- Jason.decode(content) do
              {:ok,
               %{
                 summary: truncate(Map.get(parsed, "summary") || fallback_summary(chain, scheduler_snapshot), 280),
                 next_tick_hint_ms: normalize_hint(Map.get(parsed, "next_tick_hint_ms")),
                 raw: response
               }}
            else
              _ ->
                {:ok, %{summary: truncate(content, 280), next_tick_hint_ms: nil, raw: response}}
            end

          {:error, reason} ->
            {:error, reason}
        end

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  rescue
    error ->
      Logger.warning("[HermesClient] generate_chain_update failed: #{Exception.message(error)}")
      {:error, {:exception, Exception.message(error)}}
  end

  @spec fallback_summary(map(), map()) :: String.t()
  def fallback_summary(chain, scheduler_snapshot) do
    active_count = scheduler_snapshot[:active_count] || 0
    hermes_state = scheduler_snapshot[:hermes_status] || %{}
    hermes_text = hermes_state[:status] || hermes_state["status"] || :unknown

    "Chain #{chain.id} running in #{chain.cadence_bucket}; active chains=#{active_count}; Hermes=#{hermes_text}; next wake #{format_next_tick(chain.next_tick_at)}"
  end

  @spec configured_model() :: String.t()
  def configured_model do
    Application.get_env(:ema, :hermes_model) || System.get_env("HERMES_MODEL") || "gpt-5.4"
  end

  @spec base_url() :: String.t()
  def base_url do
    Application.get_env(:ema, :hermes_base_url) || System.get_env("HERMES_BASE_URL") || "http://127.0.0.1:8642/v1"
  end

  defp headers do
    case Application.get_env(:ema, :hermes_api_key) || System.get_env("HERMES_API_KEY") do
      nil -> [{"accept", "application/json"}]
      "" -> [{"accept", "application/json"}]
      token -> [{"accept", "application/json"}, {"authorization", "Bearer #{token}"}]
    end
  end

  defp normalize_base_url(url) do
    url = String.trim(url || "")

    cond do
      url == "" -> "http://127.0.0.1:8642/v1"
      String.ends_with?(url, "/v1") -> url
      true -> String.trim_trailing(url, "/") <> "/v1"
    end
  end

  defp extract_message_content(%{"choices" => [%{"message" => %{"content" => content}} | _]}) when is_binary(content), do: {:ok, content}
  defp extract_message_content(%{"choices" => [%{"message" => %{"content" => [%{"text" => text} | _]}} | _]}) when is_binary(text), do: {:ok, text}
  defp extract_message_content(_), do: {:error, :missing_message_content}

  defp serializable_chain(chain) when is_map(chain) do
    chain
    |> Map.drop([:timer_ref])
    |> Enum.into(%{}, fn {key, value} -> {to_string(key), normalize_value(value)} end)
  end

  defp serializable_scheduler_snapshot(snapshot) when is_map(snapshot) do
    Enum.into(snapshot, %{}, fn {key, value} -> {to_string(key), normalize_value(value)} end)
  end

  defp normalize_value(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp normalize_value(value) when is_map(value), do: Enum.into(value, %{}, fn {k, v} -> {to_string(k), normalize_value(v)} end)
  defp normalize_value(value) when is_list(value), do: Enum.map(value, &normalize_value/1)
  defp normalize_value(value), do: value

  defp normalize_hint(nil), do: nil
  defp normalize_hint(value) when is_integer(value) and value > 0, do: value
  defp normalize_hint(value) when is_float(value) and value > 0, do: round(value)
  defp normalize_hint(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> nil
    end
  end
  defp normalize_hint(_), do: nil

  defp truncate(content, max) when is_binary(content) and byte_size(content) > max,
    do: String.slice(content, 0, max - 3) <> "..."

  defp truncate(content, _max) when is_binary(content), do: content
  defp truncate(content, _max), do: inspect(content)

  defp format_next_tick(nil), do: "unscheduled"
  defp format_next_tick(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_next_tick(other), do: inspect(other)
end
