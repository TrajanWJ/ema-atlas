defmodule EmaClients do
  @moduledoc """
  Public API for the `client` bounded context.

  Mirrors the 10 event kinds in
  `packages/contracts/events/client.md`:

    * `client.added`           — `added/2,3`
    * `client.renamed`         — `renamed/3`
    * `client.recolored`       — `recolored/3`
    * `client.contact_updated` — `contact_updated/3`
    * `client.tagged`          — `tagged/3`
    * `client.untagged`        — `untagged/3`
    * `client.paused`          — `paused/2,3`
    * `client.resumed`         — `resumed/2,3`
    * `client.archived`        — `archived/2,3`
    * `client.restored`        — `restored/2`

  Each writer constructs a canonical envelope (see
  `EmaClients.Event`) and hands it to `EmaClients.Server`, which
  applies it to an ETS-backed projection. The projection is read via
  `list/0` and `get/1`.

  ## Status invariants

    * A client starts `:active`.
    * `archived/3` is rejected if the client is currently linked to
      one or more non-archived `kind="client"` projects. This is a
      cross-context check that Slice 2 stubs out — see the
      `# TODO: integrate with EmaProjects` comment in `archived/3`.
    * `restored/2` clears the archived state and returns the client
      to `:active`.

  Identifiers are minted opportunistically as `client:<random>` —
  Slice 2 keeps the daemon's ULID FFI on the Gleam side and uses a
  lightweight Elixir replacement here. When the bus is wired in, this
  module will delegate to the canonical bus and reuse the daemon's
  ULID source.
  """

  alias EmaClients.Event
  alias EmaClients.Server

  @typedoc "A client identifier — `client:<ulid>`."
  @type client_id :: String.t()

  @typedoc "An actor identifier — `actor:<ulid>`, `user:<ulid>`, or `system:<component>`."
  @type actor_id :: String.t()

  @typedoc "A tag string."
  @type tag :: String.t()

  @typedoc "Status of a client in the projection."
  @type status :: :active | :paused | :archived

  # ---------------------------------------------------------------------------
  # Writers (one per event kind)
  # ---------------------------------------------------------------------------

  @doc """
  Emit `client.added` and return the new `client_id`.

  ## Options

    * `:contact`  — string, e.g. an email line (default: `nil`)
    * `:color`    — sidebar accent hex, e.g. `"#5b8def"` (default: `nil`)
    * `:tags`     — list of strings (default: `[]`)
    * `:org_id`   — `org:<ulid>` (default: `"org:dev-local"`)
    * `:space_id` — `space:<ulid>` (default: `"space:dev-local"`)
    * `:added_by` — actor (default: `"actor:dev-console"`)
  """
  @spec added(String.t(), keyword()) :: {:ok, client_id} | {:error, term()}
  def added(name, opts \\ []) when is_binary(name) do
    case String.trim(name) do
      "" ->
        {:error, :empty_name}

      clean_name ->
        client_id = "client:" <> Event.ulid()
        event = Event.added(client_id, clean_name, opts)
        :ok = Server.apply_event(event)
        {:ok, client_id}
    end
  end

  @doc "Emit `client.renamed`. Returns `:ok` or `{:error, reason}`."
  @spec renamed(client_id, String.t(), actor_id) :: :ok | {:error, term()}
  def renamed(client_id, new_name, actor)
      when is_binary(client_id) and is_binary(new_name) and is_binary(actor) do
    case String.trim(new_name) do
      "" ->
        {:error, :empty_name}

      clean_name ->
        Server.apply_event(Event.renamed(client_id, clean_name, actor))
    end
  end

  @doc "Emit `client.recolored` with a new hex color."
  @spec recolored(client_id, String.t(), actor_id) :: :ok | {:error, term()}
  def recolored(client_id, new_color, actor)
      when is_binary(client_id) and is_binary(new_color) and is_binary(actor) do
    Server.apply_event(Event.recolored(client_id, new_color, actor))
  end

  @doc "Emit `client.contact_updated`. Pass `nil` to clear the contact."
  @spec contact_updated(client_id, String.t() | nil, actor_id) :: :ok | {:error, term()}
  def contact_updated(client_id, new_contact, actor)
      when is_binary(client_id) and is_binary(actor) and
             (is_binary(new_contact) or is_nil(new_contact)) do
    Server.apply_event(Event.contact_updated(client_id, new_contact, actor))
  end

  @doc "Emit `client.tagged`. Tags are set-merged with existing tags."
  @spec tagged(client_id, [tag], actor_id) :: :ok | {:error, term()}
  def tagged(client_id, tags, actor)
      when is_binary(client_id) and is_list(tags) and is_binary(actor) do
    Server.apply_event(Event.tagged(client_id, tags, actor))
  end

  @doc "Emit `client.untagged`. Tags listed are removed from the projection."
  @spec untagged(client_id, [tag], actor_id) :: :ok | {:error, term()}
  def untagged(client_id, tags, actor)
      when is_binary(client_id) and is_list(tags) and is_binary(actor) do
    Server.apply_event(Event.untagged(client_id, tags, actor))
  end

  @doc "Emit `client.paused`. Optional `:reason` keyword."
  @spec paused(client_id, actor_id, keyword()) :: :ok | {:error, term()}
  def paused(client_id, actor, opts \\ [])
      when is_binary(client_id) and is_binary(actor) do
    Server.apply_event(Event.paused(client_id, actor, opts))
  end

  @doc "Emit `client.resumed`. Optional `:reason` keyword."
  @spec resumed(client_id, actor_id, keyword()) :: :ok | {:error, term()}
  def resumed(client_id, actor, opts \\ [])
      when is_binary(client_id) and is_binary(actor) do
    Server.apply_event(Event.resumed(client_id, actor, opts))
  end

  @doc """
  Emit `client.archived`. Optional `:reason` keyword.

  Per `client.md` invariant 4, a client cannot be archived while it has
  at least one non-archived `kind="client"` project linked to it. Slice
  2 stubs that check (always passes); a follow-up will call into
  `EmaProjects` once that context lands.
  """
  @spec archived(client_id, actor_id, keyword()) :: :ok | {:error, term()}
  def archived(client_id, actor, opts \\ [])
      when is_binary(client_id) and is_binary(actor) do
    # TODO: integrate with EmaProjects — query for non-archived
    # client-kind projects with this client_id and reject if any exist.
    Server.apply_event(Event.archived(client_id, actor, opts))
  end

  @doc "Emit `client.restored`. Returns `:ok` or `{:error, reason}`."
  @spec restored(client_id, actor_id) :: :ok | {:error, term()}
  def restored(client_id, actor)
      when is_binary(client_id) and is_binary(actor) do
    Server.apply_event(Event.restored(client_id, actor))
  end

  # ---------------------------------------------------------------------------
  # Readers
  # ---------------------------------------------------------------------------

  @doc "Return every client currently in the projection."
  @spec list() :: [map()]
  def list do
    Server.list()
  end

  @doc "Return a single client projection or `:not_found`."
  @spec get(client_id) :: map() | :not_found
  def get(client_id) when is_binary(client_id) do
    Server.get(client_id)
  end

  @doc "Reset the projection. Test-only — provided to keep tests hermetic."
  @spec __reset__() :: :ok
  def __reset__ do
    Server.reset()
  end
end
