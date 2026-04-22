defmodule Ema.Repo.Migrations.CreateHostSessionTables do
  use Ecto.Migration

  def change do
    create table(:control_plane_host_sessions, primary_key: false) do
      add :id, :string, primary_key: true
      add :provider, :string, null: false
      add :provider_session_id, :string
      add :provider_project_key, :string
      add :cwd, :text
      add :title, :text
      add :status, :string, null: false, default: "discovered"
      add :source, :string, null: false, default: "imported"
      add :started_at, :utc_datetime_usec
      add :last_activity_at, :utc_datetime_usec
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:control_plane_host_sessions, [:provider])
    create index(:control_plane_host_sessions, [:provider, :provider_session_id])
    create index(:control_plane_host_sessions, [:status])
    create index(:control_plane_host_sessions, [:last_activity_at])

    create table(:control_plane_host_session_events, primary_key: false) do
      add :id, :string, primary_key: true
      add :host_session_id, :string, null: false
      add :provider, :string, null: false
      add :provider_event_kind, :string
      add :event_kind, :string, null: false
      add :sequence, :integer
      add :occurred_at, :utc_datetime_usec, null: false
      add :payload, :map, default: %{}
      add :raw_ref, :text
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:control_plane_host_session_events, [:host_session_id])
    create index(:control_plane_host_session_events, [:provider])
    create index(:control_plane_host_session_events, [:event_kind])
    create index(:control_plane_host_session_events, [:occurred_at])

    create table(:control_plane_host_session_messages, primary_key: false) do
      add :id, :string, primary_key: true
      add :host_session_id, :string, null: false
      add :role, :string, null: false
      add :content, :text, null: false
      add :occurred_at, :utc_datetime_usec, null: false
      add :provider_event_id, :string
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:control_plane_host_session_messages, [:host_session_id])
    create index(:control_plane_host_session_messages, [:role])
    create index(:control_plane_host_session_messages, [:occurred_at])

    create table(:control_plane_surface_bindings, primary_key: false) do
      add :id, :string, primary_key: true
      add :host_session_id, :string, null: false
      add :surface_type, :string, null: false
      add :surface_id, :string, null: false
      add :binding_kind, :string, null: false
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:control_plane_surface_bindings, [:host_session_id])
    create index(:control_plane_surface_bindings, [:surface_type, :surface_id])
    create index(:control_plane_surface_bindings, [:binding_kind])
  end
end
