defmodule Ema.Babysitter.TickRenderer do
  @moduledoc """
  Compact rendering for routed tick decisions.

  This renderer is deliberately small and deterministic so daemon surfaces, live
  channels, and future CLI consumers can all present the same operator-facing
  summary without reimplementing formatting logic.
  """

  @spec render(map() | nil) :: map() | nil
  def render(nil), do: nil

  def render(stream_snapshot) when is_map(stream_snapshot) do
    route = stream_snapshot[:current_route] || :slow
    owner = stream_snapshot[:owner] || "shared"
    score = stream_snapshot[:route_score] || 0.0
    summary = stream_snapshot[:summary] || stream_snapshot[:stream] || "tick"
    reasons = stream_snapshot[:route_reasons] || []
    duplicate? = stream_snapshot[:duplicate_suppressed] || false
    coalesced_count = stream_snapshot[:coalesced_count] || 0

    header =
      [String.upcase(to_string(route)), "owner:" <> owner, "score:" <> format_score(score)]
      |> Enum.join(" · ")

    why =
      cond do
        duplicate? -> "duplicate-suppressed"
        reasons != [] -> Enum.take(reasons, 3) |> Enum.join(", ")
        true -> stream_snapshot[:route_reason] || "routed"
      end

    compact =
      case coalesced_count do
        count when count > 1 -> summary <> " (" <> "+" <> Integer.to_string(count - 1) <> " related)"
        _ -> summary
      end

    %{
      header: header,
      summary: summary,
      compact: compact,
      why: why,
      route: route,
      owner: owner,
      score: score,
      coalesced_count: coalesced_count,
      duplicate_suppressed: duplicate?
    }
  end

  defp format_score(score) when is_integer(score), do: score |> Kernel./(1) |> format_score()
  defp format_score(score) when is_float(score), do: :erlang.float_to_binary(score, decimals: 1)
  defp format_score(_), do: "0.0"
end
