defmodule Ema.ControlPlane.Schema do
  @moduledoc """
  Ecto schemas for control-plane entities.

  These mirror the in-memory structs in Store but provide a durable SQLite-backed
  persistence path. The Store continues to be the live authority; these schemas
  enable query, audit, and eventual migration off JSON files.
  """

  defmodule Proposal do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_proposals" do
      field(:project, :string)
      field(:intent, :string)
      field(:summary, :string)
      field(:context, :map, default: %{})
      field(:status, :string, default: "draft")
      field(:approved_by, :string)
      field(:execution_ids, {:array, :string}, default: [])
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    def changeset(proposal \\ %__MODULE__{}, attrs) do
      proposal
      |> cast(attrs, [
        :id,
        :project,
        :intent,
        :summary,
        :context,
        :status,
        :approved_by,
        :execution_ids,
        :metadata
      ])
      |> validate_required([:id, :project, :intent, :summary, :status])
    end
  end

  defmodule Execution do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_executions" do
      field(:proposal_id, :string)
      field(:project, :string)
      field(:intent, :string)
      field(:status, :string, default: "created")
      field(:adapter, :string)
      field(:operator, :string)
      field(:started_at, :utc_datetime_usec)
      field(:completed_at, :utc_datetime_usec)
      field(:context_bundle, :map, default: %{})
      field(:dispatch, :map)
      field(:result, :map)
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    def changeset(execution \\ %__MODULE__{}, attrs) do
      execution
      |> cast(attrs, [
        :id,
        :proposal_id,
        :project,
        :intent,
        :status,
        :adapter,
        :operator,
        :started_at,
        :completed_at,
        :context_bundle,
        :dispatch,
        :result,
        :metadata
      ])
      |> validate_required([:id, :project, :intent, :status])
    end
  end

  defmodule Outcome do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_outcomes" do
      field(:execution_id, :string)
      field(:proposal_id, :string)
      field(:project, :string)
      field(:intent, :string)
      field(:status, :string)
      field(:summary, :string)
      field(:details, :map, default: %{})
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    def changeset(outcome \\ %__MODULE__{}, attrs) do
      outcome
      |> cast(attrs, [
        :id,
        :execution_id,
        :proposal_id,
        :project,
        :intent,
        :status,
        :summary,
        :details,
        :metadata
      ])
      |> validate_required([:id, :project, :intent, :status])
    end
  end

  defmodule Event do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_events" do
      field(:execution_id, :string)
      field(:proposal_id, :string)
      field(:type, :string)
      field(:status, :string)
      field(:phase, :string)
      field(:actor, :string)
      field(:summary_line, :string)
      field(:sequence, :integer)
      field(:payload, :map, default: %{})
      field(:occurred_at, :utc_datetime_usec)
    end

    def changeset(event \\ %__MODULE__{}, attrs) do
      event
      |> cast(attrs, [
        :id,
        :execution_id,
        :proposal_id,
        :type,
        :status,
        :phase,
        :actor,
        :summary_line,
        :sequence,
        :payload,
        :occurred_at
      ])
      |> validate_required([:id, :type, :occurred_at])
    end
  end

  defmodule HostSession do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_host_sessions" do
      field(:provider, :string)
      field(:provider_session_id, :string)
      field(:provider_project_key, :string)
      field(:cwd, :string)
      field(:title, :string)
      field(:status, :string, default: "discovered")
      field(:source, :string, default: "imported")
      field(:started_at, :utc_datetime_usec)
      field(:last_activity_at, :utc_datetime_usec)
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    def changeset(session \\ %__MODULE__{}, attrs) do
      session
      |> cast(attrs, [
        :id,
        :provider,
        :provider_session_id,
        :provider_project_key,
        :cwd,
        :title,
        :status,
        :source,
        :started_at,
        :last_activity_at,
        :metadata
      ])
      |> validate_required([:id, :provider, :status, :source])
    end
  end

  defmodule HostSessionEvent do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_host_session_events" do
      field(:host_session_id, :string)
      field(:provider, :string)
      field(:provider_event_kind, :string)
      field(:event_kind, :string)
      field(:sequence, :integer)
      field(:occurred_at, :utc_datetime_usec)
      field(:payload, :map, default: %{})
      field(:raw_ref, :string)
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    def changeset(event \\ %__MODULE__{}, attrs) do
      event
      |> cast(attrs, [
        :id,
        :host_session_id,
        :provider,
        :provider_event_kind,
        :event_kind,
        :sequence,
        :occurred_at,
        :payload,
        :raw_ref,
        :metadata
      ])
      |> validate_required([:id, :host_session_id, :provider, :event_kind, :occurred_at])
    end
  end

  defmodule HostSessionMessage do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_host_session_messages" do
      field(:host_session_id, :string)
      field(:role, :string)
      field(:content, :string)
      field(:occurred_at, :utc_datetime_usec)
      field(:provider_event_id, :string)
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    def changeset(message \\ %__MODULE__{}, attrs) do
      message
      |> cast(attrs, [
        :id,
        :host_session_id,
        :role,
        :content,
        :occurred_at,
        :provider_event_id,
        :metadata
      ])
      |> validate_required([:id, :host_session_id, :role, :content, :occurred_at])
    end
  end

  defmodule SurfaceBinding do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_surface_bindings" do
      field(:host_session_id, :string)
      field(:surface_type, :string)
      field(:surface_id, :string)
      field(:binding_kind, :string)
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    def changeset(binding \\ %__MODULE__{}, attrs) do
      binding
      |> cast(attrs, [
        :id,
        :host_session_id,
        :surface_type,
        :surface_id,
        :binding_kind,
        :metadata
      ])
      |> validate_required([:id, :host_session_id, :surface_type, :surface_id, :binding_kind])
    end
  end

  defmodule Intent do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_intents" do
      field(:project, :string)
      field(:slug, :string)
      field(:title, :string)
      field(:kind, :string)
      field(:status, :string, default: "draft")
      field(:priority, :string, default: "normal")
      field(:current_focus, :string)
      field(:summary, :string)
      field(:objectives, :map, default: %{})
      field(:blockers, :map, default: %{})
      field(:next_actions, :map, default: %{})
      field(:linked_refs, :map, default: %{})
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    def changeset(intent \\ %__MODULE__{}, attrs) do
      intent
      |> cast(attrs, [
        :id,
        :project,
        :slug,
        :title,
        :kind,
        :status,
        :priority,
        :current_focus,
        :summary,
        :objectives,
        :blockers,
        :next_actions,
        :linked_refs,
        :metadata
      ])
      |> validate_required([:id, :project, :slug, :title, :kind, :status])
    end
  end

  defmodule ProjectState do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :string, autogenerate: false}
    schema "control_plane_project_states" do
      field(:project, :string)
      field(:title, :string)
      field(:status, :string, default: "active")
      field(:current_focus_intent_id, :string)
      field(:primary_goal, :string)
      field(:active_intent_ids, {:array, :string}, default: [])
      field(:blockers, :map, default: %{})
      field(:recent_decisions, :map, default: %{})
      field(:next_actions, :map, default: %{})
      field(:linked_refs, :map, default: %{})
      field(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    def changeset(project_state \\ %__MODULE__{}, attrs) do
      project_state
      |> cast(attrs, [
        :id,
        :project,
        :title,
        :status,
        :current_focus_intent_id,
        :primary_goal,
        :active_intent_ids,
        :blockers,
        :recent_decisions,
        :next_actions,
        :linked_refs,
        :metadata
      ])
      |> validate_required([:id, :project, :title, :status])
    end
  end
end
