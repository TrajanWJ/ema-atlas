defmodule EmaResponsibilities.Event do
  @moduledoc """
  Constructors for `responsibility.*` event envelopes.

  Mirrors `packages/contracts/events/responsibility.md`. Same shape
  as `EmaClients.Event`. See that module's docs for the long-form
  rationale on Slice 2's in-process envelopes.
  """

  @type t :: %{
          required(:event_id) => String.t(),
          required(:kind) => String.t(),
          required(:ts) => String.t(),
          required(:actor) => String.t(),
          required(:org_id) => String.t(),
          optional(:space_id) => String.t() | nil,
          required(:payload) => map()
        }

  # ---------------------------------------------------------------------------
  # Public constructors
  # ---------------------------------------------------------------------------

  @spec added(String.t(), String.t(), String.t(), atom(), keyword()) :: t
  def added(responsibility_id, title, why, cadence, opts) do
    org_id = Keyword.get(opts, :org_id, "org:dev-local")
    space_id = Keyword.get(opts, :space_id, "space:dev-local")
    actor = Keyword.get(opts, :added_by, "actor:dev-console")
    project_id = Keyword.get(opts, :project_id)
    tags = Keyword.get(opts, :tags, [])

    payload =
      %{
        responsibility_id: responsibility_id,
        org_id: org_id,
        space_id: space_id,
        title: title,
        why: why,
        cadence: cadence,
        status: :active,
        added_by: actor
      }
      |> maybe_put(:project_id, project_id)
      |> maybe_put_tags(tags)

    envelope("responsibility.added", actor, org_id, space_id, payload)
  end

  @spec retitled(String.t(), String.t(), String.t()) :: t
  def retitled(responsibility_id, new_title, actor) do
    payload = %{
      responsibility_id: responsibility_id,
      to: new_title,
      retitled_by: actor
    }

    envelope("responsibility.retitled", actor, nil, nil, payload)
  end

  @spec why_updated(String.t(), String.t(), String.t()) :: t
  def why_updated(responsibility_id, new_why, actor) do
    payload = %{
      responsibility_id: responsibility_id,
      to: new_why,
      updated_by: actor
    }

    envelope("responsibility.why_updated", actor, nil, nil, payload)
  end

  @spec cadence_changed(String.t(), atom(), atom(), String.t()) :: t
  def cadence_changed(responsibility_id, from_cadence, to_cadence, actor) do
    payload = %{
      responsibility_id: responsibility_id,
      from: from_cadence,
      to: to_cadence,
      changed_by: actor
    }

    envelope("responsibility.cadence_changed", actor, nil, nil, payload)
  end

  @spec scoped(String.t(), String.t() | nil, String.t()) :: t
  def scoped(responsibility_id, to_project_id, actor) do
    payload = %{
      responsibility_id: responsibility_id,
      to_project_id: to_project_id,
      scoped_by: actor
    }

    envelope("responsibility.scoped", actor, nil, nil, payload)
  end

  @spec tagged(String.t(), [String.t()], String.t()) :: t
  def tagged(responsibility_id, tags, actor) do
    payload = %{
      responsibility_id: responsibility_id,
      tags: tags,
      tagged_by: actor
    }

    envelope("responsibility.tagged", actor, nil, nil, payload)
  end

  @spec untagged(String.t(), [String.t()], String.t()) :: t
  def untagged(responsibility_id, tags, actor) do
    payload = %{
      responsibility_id: responsibility_id,
      tags: tags,
      untagged_by: actor
    }

    envelope("responsibility.untagged", actor, nil, nil, payload)
  end

  @spec paused(String.t(), String.t(), keyword()) :: t
  def paused(responsibility_id, actor, opts) do
    payload =
      %{responsibility_id: responsibility_id, paused_by: actor}
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    envelope("responsibility.paused", actor, nil, nil, payload)
  end

  @spec resumed(String.t(), String.t(), keyword()) :: t
  def resumed(responsibility_id, actor, opts) do
    payload =
      %{responsibility_id: responsibility_id, resumed_by: actor}
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    envelope("responsibility.resumed", actor, nil, nil, payload)
  end

  @spec retired(String.t(), String.t(), keyword()) :: t
  def retired(responsibility_id, actor, opts) do
    payload =
      %{responsibility_id: responsibility_id, retired_by: actor}
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    envelope("responsibility.retired", actor, nil, nil, payload)
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  @doc "Generate a ULID-shaped identifier. See `EmaClients.Event.ulid/0` for rationale."
  @spec ulid() :: String.t()
  def ulid do
    EmaClients.Event.ulid()
  end

  @doc "ISO-8601 UTC timestamp."
  @spec iso_now() :: String.t()
  def iso_now do
    EmaClients.Event.iso_now()
  end

  defp envelope(kind, actor, org_id, space_id, payload) do
    %{
      event_id: "event:" <> ulid(),
      kind: kind,
      ts: iso_now(),
      actor: actor,
      org_id: org_id || Map.get(payload, :org_id, "org:dev-local"),
      space_id: space_id || Map.get(payload, :space_id),
      payload: payload
    }
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp maybe_put_tags(map, []), do: map
  defp maybe_put_tags(map, tags), do: Map.put(map, :tags, tags)
end
