defmodule Ema.Repo.Migrations.CreateIntentAndProjectStateTables do
  use Ecto.Migration

  def change do
    create table(:control_plane_intents, primary_key: false) do
      add(:id, :string, primary_key: true)
      add(:project, :string, null: false)
      add(:slug, :string, null: false)
      add(:title, :string, null: false)
      add(:kind, :string, null: false)
      add(:status, :string, null: false, default: "draft")
      add(:priority, :string, null: false, default: "normal")
      add(:current_focus, :text)
      add(:summary, :text)
      add(:objectives, :map, default: [])
      add(:blockers, :map, default: [])
      add(:next_actions, :map, default: [])
      add(:linked_refs, :map, default: %{})
      add(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    create(index(:control_plane_intents, [:project]))
    create(index(:control_plane_intents, [:status]))
    create(index(:control_plane_intents, [:kind]))
    create(unique_index(:control_plane_intents, [:project, :slug]))

    create table(:control_plane_project_states, primary_key: false) do
      add(:id, :string, primary_key: true)
      add(:project, :string, null: false)
      add(:title, :string, null: false)
      add(:status, :string, null: false, default: "active")
      add(:current_focus_intent_id, :string)
      add(:primary_goal, :text)
      add(:active_intent_ids, {:array, :string}, default: [])
      add(:blockers, :map, default: [])
      add(:recent_decisions, :map, default: [])
      add(:next_actions, :map, default: [])
      add(:linked_refs, :map, default: %{})
      add(:metadata, :map, default: %{})

      timestamps(type: :utc_datetime_usec)
    end

    create(unique_index(:control_plane_project_states, [:project]))
    create(index(:control_plane_project_states, [:status]))
  end
end
