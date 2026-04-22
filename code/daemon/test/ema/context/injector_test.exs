defmodule Ema.Context.InjectorTest do
  use ExUnit.Case, async: false

  alias Ema.Context.Injector
  alias Ema.ControlPlane.Persistence
  alias Ema.Repo

  setup do
    Repo.delete_all(Ema.ControlPlane.Schema.HostSessionMessage)
    Repo.delete_all(Ema.ControlPlane.Schema.HostSessionEvent)
    Repo.delete_all(Ema.ControlPlane.Schema.HostSession)
    Repo.delete_all(Ema.ControlPlane.Schema.Intent)
    Repo.delete_all(Ema.ControlPlane.Schema.ProjectState)
    :ok
  end

  test "project_package returns project state and intents" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_project_state(%{
      id: "proj_ema",
      project: "ema",
      title: "EMA",
      status: "active",
      linked_refs: %{wiki_pages: ["wiki:projects/EMA"]},
      inserted_at: now,
      updated_at: now
    })

    Persistence.upsert_intent(%{
      id: "int_ema_root",
      project: "ema",
      slug: "ema-root",
      title: "EMA Root",
      kind: "project-root",
      status: "active",
      inserted_at: now,
      updated_at: now
    })

    package = Injector.project_package("ema", budget: "small")
    assert package.project_state.project == "ema"
    assert length(package.intents) == 1
    assert package.wiki.linked_pages == ["wiki:projects/EMA"]
    assert is_list(package.sources)
  end

  test "operator_package rolls up visible intents" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_intent(%{
      id: "int_ema_root",
      project: "ema",
      slug: "ema-root",
      title: "EMA Root",
      kind: "project-root",
      status: "active",
      inserted_at: now,
      updated_at: now
    })

    package = Injector.operator_package(budget: "small", limit_projects: 5)
    assert "ema" in package.active_projects
    assert is_list(package.top_intents)
  end

  test "session_evidence filters host sessions by project match" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_host_session(%{
      id: "sess_ema",
      provider: "claude",
      provider_session_id: "prov_1",
      provider_project_key: "ema",
      cwd: "/home/trajan/Projects/ema",
      title: "EMA work",
      status: "active",
      started_at: now,
      last_activity_at: now,
      inserted_at: now,
      updated_at: now
    })

    result = Injector.session_evidence("ema", limit: 10)
    assert length(result.sessions) == 1
    assert hd(result.sessions).id == "sess_ema"
  end
end
