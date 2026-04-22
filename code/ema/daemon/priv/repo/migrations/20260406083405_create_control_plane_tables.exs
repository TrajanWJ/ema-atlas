defmodule Ema.Repo.Migrations.CreateControlPlaneTables do
  use Ecto.Migration

  def change do
    create table(:control_plane_proposals, primary_key: false) do
      add :id, :string, primary_key: true
      add :project, :string, null: false
      add :intent, :string, null: false
      add :summary, :text, null: false
      add :context, :map, default: %{}
      add :status, :string, null: false, default: "draft"
      add :approved_by, :string
      add :execution_ids, {:array, :string}, default: []
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:control_plane_proposals, [:project])
    create index(:control_plane_proposals, [:status])
    create index(:control_plane_proposals, [:project, :status])

    create table(:control_plane_executions, primary_key: false) do
      add :id, :string, primary_key: true
      add :proposal_id, references(:control_plane_proposals, type: :string, on_delete: :nilify_all)
      add :project, :string, null: false
      add :intent, :string, null: false
      add :status, :string, null: false, default: "created"
      add :adapter, :string
      add :operator, :string
      add :started_at, :utc_datetime_usec
      add :completed_at, :utc_datetime_usec
      add :context_bundle, :map, default: %{}
      add :dispatch, :map
      add :result, :map
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:control_plane_executions, [:proposal_id])
    create index(:control_plane_executions, [:project])
    create index(:control_plane_executions, [:status])
    create index(:control_plane_executions, [:project, :status])

    create table(:control_plane_outcomes, primary_key: false) do
      add :id, :string, primary_key: true
      add :execution_id, references(:control_plane_executions, type: :string, on_delete: :nilify_all)
      add :proposal_id, references(:control_plane_proposals, type: :string, on_delete: :nilify_all)
      add :project, :string, null: false
      add :intent, :string, null: false
      add :status, :string, null: false
      add :summary, :text
      add :details, :map, default: %{}
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:control_plane_outcomes, [:execution_id])
    create index(:control_plane_outcomes, [:proposal_id])
    create index(:control_plane_outcomes, [:project])

    create table(:control_plane_events, primary_key: false) do
      add :id, :string, primary_key: true
      add :execution_id, :string
      add :proposal_id, :string
      add :type, :string, null: false
      add :status, :string
      add :phase, :string
      add :actor, :string
      add :summary_line, :text
      add :sequence, :integer
      add :payload, :map, default: %{}
      add :occurred_at, :utc_datetime_usec, null: false
    end

    create index(:control_plane_events, [:execution_id])
    create index(:control_plane_events, [:proposal_id])
    create index(:control_plane_events, [:type])
    create index(:control_plane_events, [:occurred_at])
  end
end
