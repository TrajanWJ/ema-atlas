defmodule Ema.Babysitter.CommandRouter do
  @moduledoc """
  Operator-friendly text command wrappers for the independent babysitter
  orchestrator.

  This aligns the new chain controls with prior prompt language by accepting
  concise commands like:

    START hermes-watch
    STOP operator-rollup
    PAUSE hermes-watch
    RESUME hermes-watch
    STATUS
    LIST CHAINS
    HINT hermes-watch 900000
  """

  alias Ema.Babysitter.ChainScheduler

  def handle(command) when is_binary(command) do
    tokens =
      command
      |> String.trim()
      |> String.split(~r/\s+/, trim: true)

    route(tokens)
  end

  defp route([action | rest]) do
    case String.upcase(action) do
      "START" -> start_command(rest)
      "STOP" -> stop_command(rest)
      "PAUSE" -> pause_command(rest)
      "RESUME" -> resume_command(rest)
      "STATUS" -> {:ok, %{action: :status, snapshot: ChainScheduler.snapshot()}}
      "LIST" -> list_command(rest)
      "HINT" -> hint_command(rest)
      other -> {:error, %{code: :unknown_command, message: "unknown command #{other}"}}
    end
  end

  defp route(_), do: {:error, %{code: :empty_command, message: "command is empty"}}

  defp start_command([id | rest]) do
    attrs = parse_kv_pairs(rest)

    case ChainScheduler.start_chain(id, attrs) do
      {:ok, chain} -> {:ok, %{action: :start, chain: chain}}
      {:error, reason} -> {:error, %{code: :start_failed, message: inspect(reason)}}
    end
  end

  defp start_command([]), do: {:error, %{code: :missing_chain, message: "START requires a chain id or profile"}}

  defp stop_command([id]) do
    case ChainScheduler.stop_chain(id) do
      {:ok, chain} -> {:ok, %{action: :stop, chain: chain}}
      {:error, :not_found} -> {:error, %{code: :chain_not_found, message: "chain #{id} not found"}}
    end
  end

  defp stop_command(_), do: {:error, %{code: :missing_chain, message: "STOP requires a chain id"}}

  defp pause_command([id]) do
    case ChainScheduler.pause_chain(id) do
      {:ok, chain} -> {:ok, %{action: :pause, chain: chain}}
      {:error, :not_found} -> {:error, %{code: :chain_not_found, message: "chain #{id} not found"}}
    end
  end

  defp pause_command(_), do: {:error, %{code: :missing_chain, message: "PAUSE requires a chain id"}}

  defp resume_command([id]) do
    case ChainScheduler.resume_chain(id) do
      {:ok, chain} -> {:ok, %{action: :resume, chain: chain}}
      {:error, :not_found} -> {:error, %{code: :chain_not_found, message: "chain #{id} not found"}}
    end
  end

  defp resume_command(_), do: {:error, %{code: :missing_chain, message: "RESUME requires a chain id"}}

  defp list_command([kind]) when kind in ["CHAINS", "chains"] do
    {:ok, %{action: :list_chains, chains: ChainScheduler.list_chains()}}
  end

  defp list_command(_), do: {:error, %{code: :invalid_list_command, message: "Did you mean LIST CHAINS?"}}

  defp hint_command([id, ms]) do
    case Integer.parse(ms) do
      {parsed, ""} when parsed > 0 ->
        case ChainScheduler.set_tick_hint(id, %{"next_tick_hint_ms" => parsed}) do
          {:ok, chain} -> {:ok, %{action: :hint, chain: chain}}
          {:error, :not_found} -> {:error, %{code: :chain_not_found, message: "chain #{id} not found"}}
          {:error, reason} -> {:error, %{code: :hint_failed, message: inspect(reason)}}
        end

      _ ->
        {:error, %{code: :invalid_hint, message: "HINT requires milliseconds as a positive integer"}}
    end
  end

  defp hint_command(_), do: {:error, %{code: :invalid_hint, message: "HINT requires: HINT <chain> <ms>"}}

  defp parse_kv_pairs(tokens) do
    Enum.reduce(tokens, %{}, fn token, acc ->
      case String.split(token, "=", parts: 2) do
        [key, value] when key != "" and value != "" -> Map.put(acc, key, value)
        _ -> acc
      end
    end)
  end
end
