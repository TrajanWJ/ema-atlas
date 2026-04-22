defmodule EmaWeb.ClaudeController do
  use EmaWeb, :controller

  alias Ema.Claude.ProviderRegistry
  alias Ema.Claude.Runner

  def providers(conn, _params) do
    json(conn, %{providers: normalize_json(ProviderRegistry.list_available())})
  end

  def preflight(conn, params) do
    opts =
      []
      |> put_bool_opt(:probe, Map.get(params, "probe"))
      |> put_integer_opt(:timeout, Map.get(params, "timeout"))

    json(conn, normalize_json(Runner.preflight(opts)))
  end

  def run(conn, %{"prompt" => prompt} = params) when is_binary(prompt) do
    opts =
      []
      |> put_string_opt(:provider, Map.get(params, "provider"))
      |> put_string_opt(:model, Map.get(params, "model"))
      |> put_string_opt(:cwd, Map.get(params, "cwd"))
      |> put_bool_opt(:allow_fallback, Map.get(params, "allow_fallback"))
      |> put_integer_opt(:timeout, Map.get(params, "timeout"))

    case Runner.run(prompt, opts) do
      {:ok, result} ->
        json(conn, %{ok: true, result: result})

      {:error, error} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{ok: false, error: error})
    end
  end

  def run(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{ok: false, error: %{code: :missing_prompt, message: "prompt is required"}})
  end

  defp put_string_opt(opts, _key, nil), do: opts
  defp put_string_opt(opts, _key, ""), do: opts
  defp put_string_opt(opts, key, value), do: Keyword.put(opts, key, value)

  defp put_bool_opt(opts, _key, nil), do: opts
  defp put_bool_opt(opts, key, value) when is_boolean(value), do: Keyword.put(opts, key, value)
  defp put_bool_opt(opts, key, value) when value in ["true", "1", 1], do: Keyword.put(opts, key, true)
  defp put_bool_opt(opts, key, value) when value in ["false", "0", 0], do: Keyword.put(opts, key, false)
  defp put_bool_opt(opts, _key, _value), do: opts

  defp put_integer_opt(opts, _key, nil), do: opts
  defp put_integer_opt(opts, key, value) when is_integer(value), do: Keyword.put(opts, key, value)

  defp put_integer_opt(opts, key, value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> Keyword.put(opts, key, parsed)
      _ -> opts
    end
  end

  defp normalize_json(%_{} = struct) do
    struct
    |> Map.from_struct()
    |> Enum.into(%{}, fn {key, value} -> {key, normalize_json(value)} end)
  end

  defp normalize_json(map) when is_map(map) do
    Enum.into(map, %{}, fn {key, value} -> {key, normalize_json(value)} end)
  end

  defp normalize_json(list) when is_list(list), do: Enum.map(list, &normalize_json/1)
  defp normalize_json(tuple) when is_tuple(tuple), do: tuple |> Tuple.to_list() |> Enum.map(&normalize_json/1)
  defp normalize_json(value), do: value
end
