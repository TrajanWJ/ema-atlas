defmodule EmaClients.Event do
  @moduledoc """
  Constructors for `client.*` event envelopes.

  The shape mirrors `packages/contracts/events/README.md` (envelope) and
  `packages/contracts/events/client.md` (per-kind payloads). Slice 2
  produces in-process maps, not BEAM-encoded canonical events on the
  bus — that wiring lands once the daemon owns this code path.
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
  # Public constructors (one per kind)
  # ---------------------------------------------------------------------------

  @spec added(String.t(), String.t(), keyword()) :: t
  def added(client_id, name, opts) do
    org_id = Keyword.get(opts, :org_id, "org:dev-local")
    space_id = Keyword.get(opts, :space_id, "space:dev-local")
    actor = Keyword.get(opts, :added_by, "actor:dev-console")
    contact = Keyword.get(opts, :contact)
    color = Keyword.get(opts, :color)
    tags = Keyword.get(opts, :tags, [])

    payload =
      %{
        client_id: client_id,
        org_id: org_id,
        space_id: space_id,
        name: name,
        status: "active",
        added_by: actor
      }
      |> maybe_put(:contact, contact)
      |> maybe_put(:color, color)
      |> maybe_put_tags(tags)

    envelope("client.added", actor, org_id, space_id, payload)
  end

  @spec renamed(String.t(), String.t(), String.t()) :: t
  def renamed(client_id, new_name, actor) do
    payload = %{
      client_id: client_id,
      to: new_name,
      renamed_by: actor
    }

    envelope("client.renamed", actor, nil, nil, payload)
  end

  @spec recolored(String.t(), String.t(), String.t()) :: t
  def recolored(client_id, new_color, actor) do
    payload = %{
      client_id: client_id,
      to: new_color,
      recolored_by: actor
    }

    envelope("client.recolored", actor, nil, nil, payload)
  end

  @spec contact_updated(String.t(), String.t() | nil, String.t()) :: t
  def contact_updated(client_id, new_contact, actor) do
    payload = %{
      client_id: client_id,
      to: new_contact,
      updated_by: actor
    }

    envelope("client.contact_updated", actor, nil, nil, payload)
  end

  @spec tagged(String.t(), [String.t()], String.t()) :: t
  def tagged(client_id, tags, actor) do
    payload = %{
      client_id: client_id,
      tags: tags,
      tagged_by: actor
    }

    envelope("client.tagged", actor, nil, nil, payload)
  end

  @spec untagged(String.t(), [String.t()], String.t()) :: t
  def untagged(client_id, tags, actor) do
    payload = %{
      client_id: client_id,
      tags: tags,
      untagged_by: actor
    }

    envelope("client.untagged", actor, nil, nil, payload)
  end

  @spec paused(String.t(), String.t(), keyword()) :: t
  def paused(client_id, actor, opts) do
    payload =
      %{
        client_id: client_id,
        paused_by: actor
      }
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    envelope("client.paused", actor, nil, nil, payload)
  end

  @spec resumed(String.t(), String.t(), keyword()) :: t
  def resumed(client_id, actor, opts) do
    payload =
      %{
        client_id: client_id,
        resumed_by: actor
      }
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    envelope("client.resumed", actor, nil, nil, payload)
  end

  @spec archived(String.t(), String.t(), keyword()) :: t
  def archived(client_id, actor, opts) do
    payload =
      %{
        client_id: client_id,
        archived_by: actor
      }
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    envelope("client.archived", actor, nil, nil, payload)
  end

  @spec restored(String.t(), String.t()) :: t
  def restored(client_id, actor) do
    payload = %{
      client_id: client_id,
      restored_by: actor
    }

    envelope("client.restored", actor, nil, nil, payload)
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  @doc """
  Generate a ULID-shaped identifier.

  Slice 2 uses a lightweight 26-char Crockford-base32 string — enough
  for in-process dedupe and tests. The Gleam side has its own ULID
  FFI in `apps/daemon/src/ema_time_ffi.erl`; once the bus is wired in,
  Elixir will reuse that FFI by calling `:ema_time_ffi.ulid/0` so
  every event in the system shares one ULID source.
  """
  @spec ulid() :: String.t()
  def ulid do
    # Crockford base32 alphabet — 32 symbols, indexed 0..31.
    alphabet = ~c"0123456789ABCDEFGHJKMNPQRSTVWXYZ"

    # 26 characters of randomness (one symbol per byte, 5 bits used,
    # rest discarded). This isn't a *real* ULID — no time prefix — but
    # it's the right shape and uniqueness for in-process dedupe and
    # test stability. Real ULIDs come from the Gleam time FFI once the
    # bus is wired in.
    chars =
      for _ <- 1..26 do
        <<byte::8>> = :crypto.strong_rand_bytes(1)
        Enum.at(alphabet, rem(byte, 32))
      end

    List.to_string(chars)
  end

  @doc "ISO-8601 UTC timestamp."
  @spec iso_now() :: String.t()
  def iso_now do
    DateTime.utc_now()
    |> DateTime.truncate(:second)
    |> DateTime.to_iso8601()
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
