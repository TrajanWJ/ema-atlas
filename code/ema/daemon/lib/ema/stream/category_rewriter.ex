defmodule Ema.Stream.CategoryRewriter do
  @moduledoc """
  Rewrites or plans the current Discord `🧵 STREAM` category for the independent
  orchestrator system.

  The default mode is dry-run planning. Applying changes is explicit so category
  rewrites are never implicit side effects of ordinary runtime behavior.
  """

  alias Ema.Stream.ChannelManager

  @default_category_name "🧵 STREAM"

  @default_channel_specs [
    %{
      name: "babysitter-sprint",
      topic: "Directives, approvals, escalations, milestone summaries. Control plane only.",
      position: 0
    },
    %{name: "system-heartbeat", topic: "Raw health facts only.", position: 1},
    %{name: "intent-stream", topic: "Action declarations before execution.", position: 2},
    %{
      name: "pipeline-flow",
      topic: "Queued/running/completed/failed transitions and handoffs.",
      position: 3
    },
    %{
      name: "agent-thoughts",
      topic: "Provisional reasoning, hypotheses, and uncertainty.",
      position: 4
    },
    %{name: "memory-writes", topic: "Durable confirmed facts worth future recall.", position: 5},
    %{
      name: "intelligence-layer",
      topic: "Second-order synthesis after multiple events or incidents.",
      position: 6
    },
    %{name: "execution-log", topic: "Execution evidence / action-result trace.", position: 7},
    %{
      name: "babysitter-live",
      topic: "Operator rollup deltas only — not raw stream-of-consciousness.",
      position: 8
    }
  ]

  def plan(opts \\ []) do
    category_name = category_name(opts)
    channel_specs = channel_specs(opts)

    case ChannelManager.list_channels() do
      {:ok, channels} ->
        category = find_category(channels, category_name)
        planned_actions = build_actions(channels, category, channel_specs)

        {:ok,
         %{
           category: %{
             name: category_name,
             existing_id: category && category["id"],
             channel_count: length(channel_specs),
             discovery: :live
           },
           actions: planned_actions
         }}

      {:error, reason} ->
        {:ok,
         %{
           category: %{
             name: category_name,
             existing_id: nil,
             channel_count: length(channel_specs),
             discovery: :unavailable,
             error: inspect(reason)
           },
           actions:
             Enum.map(channel_specs, fn spec ->
               %{
                 action: :create_channel,
                 spec: spec,
                 reason: "category discovery unavailable; assuming create"
               }
             end)
         }}
    end
  rescue
    error ->
      category_name = category_name(opts)
      channel_specs = channel_specs(opts)

      {:ok,
       %{
         category: %{
           name: category_name,
           existing_id: nil,
           channel_count: length(channel_specs),
           discovery: :exception,
           error: Exception.message(error)
         },
         actions:
           Enum.map(channel_specs, fn spec ->
             %{
               action: :create_channel,
               spec: spec,
               reason: "category discovery raised exception; assuming create"
             }
           end)
       }}
  end

  def rewrite(opts \\ []) do
    dry_run = Keyword.get(opts, :dry_run, true)

    with {:ok, plan} <- plan(opts) do
      if dry_run do
        {:ok, Map.put(plan, :dry_run, true)}
      else
        apply_plan(plan)
      end
    end
  end

  def channel_specs(opts \\ []) do
    Keyword.get(opts, :channel_specs, @default_channel_specs)
  end

  def category_name(opts \\ []) do
    Keyword.get(opts, :category_name, @default_category_name)
  end

  defp apply_plan(%{actions: actions, category: category}) do
    case ensure_category(category.existing_id, category.name) do
      {:ok, category_id} ->
        results = Enum.map(actions, &apply_action(&1, category_id))
        {:ok, %{dry_run: false, category_id: category_id, actions: results}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp ensure_category(nil, category_name) do
    case ChannelManager.create_category(category_name) do
      {:ok, %{"id" => id}} -> {:ok, id}
      {:ok, %{id: id}} -> {:ok, id}
      {:error, reason} -> {:error, reason}
    end
  end

  defp ensure_category(existing_id, _category_name), do: {:ok, existing_id}

  defp apply_action(%{action: :create_channel, spec: spec}, category_id) do
    case ChannelManager.create_channel(spec.name,
           category_id: category_id,
           topic: spec.topic,
           position: spec.position
         ) do
      {:ok, channel} ->
        Map.put(%{action: :create_channel, channel: spec.name}, :result, %{
          ok: true,
          channel_id: channel["id"] || channel[:id]
        })

      {:error, reason} ->
        %{
          action: :create_channel,
          channel: spec.name,
          result: %{ok: false, error: inspect(reason)}
        }
    end
  end

  defp apply_action(%{action: :update_topic, channel_id: channel_id, spec: spec}, _category_id) do
    case ChannelManager.set_topic(channel_id, spec.topic) do
      {:ok, _channel} ->
        %{action: :update_topic, channel: spec.name, result: %{ok: true, channel_id: channel_id}}

      {:error, reason} ->
        %{action: :update_topic, channel: spec.name, result: %{ok: false, error: inspect(reason)}}
    end
  end

  defp apply_action(%{action: :move_channel, channel_id: channel_id, spec: spec}, category_id) do
    case ChannelManager.move_channel_to_category(channel_id, category_id) do
      {:ok, _channel} ->
        %{action: :move_channel, channel: spec.name, result: %{ok: true, channel_id: channel_id}}

      {:error, reason} ->
        %{action: :move_channel, channel: spec.name, result: %{ok: false, error: inspect(reason)}}
    end
  end

  defp apply_action(
         %{action: :move_and_update_topic, channel_id: channel_id, spec: spec},
         category_id
       ) do
    with {:ok, _channel} <- ChannelManager.move_channel_to_category(channel_id, category_id),
         {:ok, _channel} <- ChannelManager.set_topic(channel_id, spec.topic) do
      %{
        action: :move_and_update_topic,
        channel: spec.name,
        result: %{ok: true, channel_id: channel_id}
      }
    else
      {:error, reason} ->
        %{
          action: :move_and_update_topic,
          channel: spec.name,
          result: %{ok: false, error: inspect(reason)}
        }
    end
  end

  defp apply_action(%{action: :noop, spec: spec}, _category_id) do
    %{action: :noop, channel: spec.name, result: %{ok: true}}
  end

  defp build_actions(channels, category, channel_specs) do
    Enum.map(channel_specs, fn spec ->
      case find_channel(channels, spec.name) do
        nil ->
          %{action: :create_channel, spec: spec, reason: "missing channel"}

        channel ->
          cond do
            is_nil(category) ->
              %{
                action: :move_and_update_topic,
                channel_id: channel["id"],
                spec: spec,
                reason: "category missing; create and move channel"
              }

            category && channel["parent_id"] != category["id"] and
                normalize_topic(channel["topic"]) != spec.topic ->
              %{
                action: :move_and_update_topic,
                channel_id: channel["id"],
                spec: spec,
                reason: "channel in wrong category and topic drift"
              }

            category && channel["parent_id"] != category["id"] ->
              %{
                action: :move_channel,
                channel_id: channel["id"],
                spec: spec,
                reason: "channel in wrong category"
              }

            normalize_topic(channel["topic"]) != spec.topic ->
              %{
                action: :update_topic,
                channel_id: channel["id"],
                spec: spec,
                reason: "topic drift"
              }

            true ->
              %{action: :noop, channel_id: channel["id"], spec: spec, reason: "already aligned"}
          end
      end
    end)
  end

  defp find_category(channels, category_name) do
    Enum.find(channels, fn channel ->
      channel["type"] == 4 and channel["name"] in [category_name, sanitize(category_name)]
    end)
  end

  defp find_channel(channels, name) do
    target = sanitize(name)

    Enum.find(channels, fn channel ->
      channel["type"] == 0 and channel["name"] in [name, target]
    end)
  end

  defp sanitize(name) do
    name
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9\-_]/u, "-")
    |> String.replace(~r/-+/, "-")
    |> String.trim("-")
  end

  defp normalize_topic(nil), do: nil
  defp normalize_topic(topic), do: String.trim(topic)
end
