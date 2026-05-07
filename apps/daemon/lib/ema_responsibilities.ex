defmodule EmaResponsibilities do
  @moduledoc """
  Public API for the `responsibility` bounded context.

  Mirrors the 10 event kinds in
  `packages/contracts/events/responsibility.md`:

    * `responsibility.added`           — `added/3,4`
    * `responsibility.retitled`        — `retitled/3`
    * `responsibility.why_updated`     — `why_updated/3`
    * `responsibility.cadence_changed` — `cadence_changed/3`
    * `responsibility.scoped`          — `scoped/3`
    * `responsibility.tagged`          — `tagged/3`
    * `responsibility.untagged`        — `untagged/3`
    * `responsibility.paused`          — `paused/2,3`
    * `responsibility.resumed`         — `resumed/2,3`
    * `responsibility.retired`         — `retired/2,3`

  ## Enum invariants (enforced at the API boundary)

    * `cadence` ∈ `:daily | :weekly | :monthly | :quarterly | :ongoing`.
      Anything else returns `{:error, {:invalid_cadence, value}}`.
    * `status` ∈ `:active | :paused | :retired`. The status field is
      never set directly — it transitions via `paused/2`, `resumed/2`,
      `retired/2`. Once retired, the responsibility is terminal:
      `paused/2` and `resumed/2` return `{:error, :retired}`.
  """

  alias EmaResponsibilities.Event
  alias EmaResponsibilities.Server

  @typedoc "A responsibility identifier — `responsibility:<ulid>`."
  @type responsibility_id :: String.t()

  @typedoc "An actor identifier."
  @type actor_id :: String.t()

  @typedoc "A tag string."
  @type tag :: String.t()

  @typedoc "Status of a responsibility."
  @type status :: :active | :paused | :retired

  @typedoc "Cadence enum. Closed-set per `responsibility.md` invariant 1."
  @type cadence :: :daily | :weekly | :monthly | :quarterly | :ongoing

  @valid_cadences [:daily, :weekly, :monthly, :quarterly, :ongoing]

  # ---------------------------------------------------------------------------
  # Writers
  # ---------------------------------------------------------------------------

  @doc """
  Emit `responsibility.added` and return the new `responsibility_id`.

  ## Required positional args

    * `title` — short string description
    * `why`   — multi-line "why this matters" explanation
    * `cadence` — one of `#{inspect(@valid_cadences)}`

  ## Options

    * `:project_id` — `project:<ulid>` if scoped (default: `nil`)
    * `:tags`       — list of strings (default: `[]`)
    * `:org_id`     — `org:<ulid>` (default: `"org:dev-local"`)
    * `:space_id`   — `space:<ulid>` (default: `"space:dev-local"`)
    * `:added_by`   — actor (default: `"actor:dev-console"`)
  """
  @spec added(String.t(), String.t(), cadence, keyword()) ::
          {:ok, responsibility_id} | {:error, term()}
  def added(title, why, cadence, opts \\ [])
      when is_binary(title) and is_binary(why) do
    with {:ok, ^cadence} <- validate_cadence(cadence),
         {:ok, clean_title} <- non_empty(title, :empty_title),
         {:ok, clean_why} <- non_empty(why, :empty_why) do
      responsibility_id = "responsibility:" <> Event.ulid()

      event =
        Event.added(
          responsibility_id,
          clean_title,
          clean_why,
          cadence,
          opts
        )

      :ok = Server.apply_event(event)
      {:ok, responsibility_id}
    end
  end

  @doc "Emit `responsibility.retitled`."
  @spec retitled(responsibility_id, String.t(), actor_id) :: :ok | {:error, term()}
  def retitled(responsibility_id, new_title, actor)
      when is_binary(responsibility_id) and is_binary(new_title) and is_binary(actor) do
    with {:ok, clean_title} <- non_empty(new_title, :empty_title) do
      Server.apply_event(Event.retitled(responsibility_id, clean_title, actor))
    end
  end

  @doc "Emit `responsibility.why_updated`."
  @spec why_updated(responsibility_id, String.t(), actor_id) :: :ok | {:error, term()}
  def why_updated(responsibility_id, new_why, actor)
      when is_binary(responsibility_id) and is_binary(new_why) and is_binary(actor) do
    with {:ok, clean_why} <- non_empty(new_why, :empty_why) do
      Server.apply_event(Event.why_updated(responsibility_id, clean_why, actor))
    end
  end

  @doc """
  Emit `responsibility.cadence_changed`.

  Both `from` and `to` must be valid cadence atoms. The current
  cadence is read from the projection — pass the new value here and
  the writer will look up `from` itself.
  """
  @spec cadence_changed(responsibility_id, cadence, actor_id) :: :ok | {:error, term()}
  def cadence_changed(responsibility_id, new_cadence, actor)
      when is_binary(responsibility_id) and is_binary(actor) do
    with {:ok, ^new_cadence} <- validate_cadence(new_cadence),
         %{cadence: from} <- Server.get(responsibility_id) do
      Server.apply_event(
        Event.cadence_changed(responsibility_id, from, new_cadence, actor)
      )
    else
      :not_found -> {:error, :not_found}
      other -> other
    end
  end

  @doc "Emit `responsibility.scoped`. Pass `nil` to unscope to workspace-wide."
  @spec scoped(responsibility_id, String.t() | nil, actor_id) :: :ok | {:error, term()}
  def scoped(responsibility_id, project_id, actor)
      when is_binary(responsibility_id) and is_binary(actor) and
             (is_binary(project_id) or is_nil(project_id)) do
    Server.apply_event(Event.scoped(responsibility_id, project_id, actor))
  end

  @doc "Emit `responsibility.tagged`. Tags are set-merged."
  @spec tagged(responsibility_id, [tag], actor_id) :: :ok | {:error, term()}
  def tagged(responsibility_id, tags, actor)
      when is_binary(responsibility_id) and is_list(tags) and is_binary(actor) do
    Server.apply_event(Event.tagged(responsibility_id, tags, actor))
  end

  @doc "Emit `responsibility.untagged`."
  @spec untagged(responsibility_id, [tag], actor_id) :: :ok | {:error, term()}
  def untagged(responsibility_id, tags, actor)
      when is_binary(responsibility_id) and is_list(tags) and is_binary(actor) do
    Server.apply_event(Event.untagged(responsibility_id, tags, actor))
  end

  @doc """
  Emit `responsibility.paused`. Returns `{:error, :retired}` if the
  responsibility has already been retired (terminal state).
  """
  @spec paused(responsibility_id, actor_id, keyword()) :: :ok | {:error, term()}
  def paused(responsibility_id, actor, opts \\ [])
      when is_binary(responsibility_id) and is_binary(actor) do
    with :ok <- assert_not_retired(responsibility_id) do
      Server.apply_event(Event.paused(responsibility_id, actor, opts))
    end
  end

  @doc "Emit `responsibility.resumed`. Rejected if already retired."
  @spec resumed(responsibility_id, actor_id, keyword()) :: :ok | {:error, term()}
  def resumed(responsibility_id, actor, opts \\ [])
      when is_binary(responsibility_id) and is_binary(actor) do
    with :ok <- assert_not_retired(responsibility_id) do
      Server.apply_event(Event.resumed(responsibility_id, actor, opts))
    end
  end

  @doc """
  Emit `responsibility.retired`. Terminal — `paused/2` and `resumed/2`
  will reject after this fires.
  """
  @spec retired(responsibility_id, actor_id, keyword()) :: :ok | {:error, term()}
  def retired(responsibility_id, actor, opts \\ [])
      when is_binary(responsibility_id) and is_binary(actor) do
    Server.apply_event(Event.retired(responsibility_id, actor, opts))
  end

  # ---------------------------------------------------------------------------
  # Readers
  # ---------------------------------------------------------------------------

  @doc "Return every responsibility in the projection."
  @spec list() :: [map()]
  def list, do: Server.list()

  @doc "Return one responsibility by id, or `:not_found`."
  @spec get(responsibility_id) :: map() | :not_found
  def get(responsibility_id) when is_binary(responsibility_id) do
    Server.get(responsibility_id)
  end

  @doc """
  Return active responsibilities grouped by cadence.

  Mirrors the cockpit's `/standing` projection per `responsibility.md`
  invariant 4 — paused responsibilities are excluded from the default
  view, retired never appear.
  """
  @spec standing() :: %{optional(cadence) => [map()]}
  def standing do
    list()
    |> Enum.filter(fn r -> r.status == :active end)
    |> Enum.group_by(fn r -> r.cadence end)
  end

  @doc "List of valid cadences."
  @spec valid_cadences() :: [cadence]
  def valid_cadences, do: @valid_cadences

  @doc "Reset the projection. Test-only."
  @spec __reset__() :: :ok
  def __reset__, do: Server.reset()

  # ---------------------------------------------------------------------------
  # Validators
  # ---------------------------------------------------------------------------

  defp validate_cadence(cadence) when cadence in @valid_cadences, do: {:ok, cadence}
  defp validate_cadence(other), do: {:error, {:invalid_cadence, other}}

  defp non_empty(value, error_atom) do
    case String.trim(value) do
      "" -> {:error, error_atom}
      clean -> {:ok, clean}
    end
  end

  defp assert_not_retired(responsibility_id) do
    case Server.get(responsibility_id) do
      :not_found -> {:error, :not_found}
      %{status: :retired} -> {:error, :retired}
      _ -> :ok
    end
  end
end
