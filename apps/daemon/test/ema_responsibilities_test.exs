defmodule EmaResponsibilitiesTest do
  @moduledoc """
  Smoke tests for `EmaResponsibilities`. Covers the 10 event kinds
  in `packages/contracts/events/responsibility.md`.
  """

  use ExUnit.Case, async: false

  setup do
    EmaResponsibilities.__reset__()
    :ok
  end

  describe "added/4" do
    test "adds and returns id" do
      assert {:ok, "responsibility:" <> _} =
               EmaResponsibilities.added(
                 "Pay bills",
                 "Keeps the lights on",
                 :monthly
               )

      assert [%{title: "Pay bills", cadence: :monthly, status: :active}] =
               EmaResponsibilities.list()
    end

    test "rejects invalid cadence" do
      assert {:error, {:invalid_cadence, :hourly}} =
               EmaResponsibilities.added("X", "Y", :hourly)
    end

    test "rejects empty title and why" do
      assert {:error, :empty_title} = EmaResponsibilities.added("  ", "Y", :daily)
      assert {:error, :empty_why} = EmaResponsibilities.added("X", "  ", :daily)
    end

    test "stores optional project_id and tags" do
      {:ok, id} =
        EmaResponsibilities.added(
          "Daily standup",
          "Sync the team",
          :daily,
          project_id: "project:abc",
          tags: ["team", "comms"]
        )

      record = EmaResponsibilities.get(id)
      assert record.project_id == "project:abc"
      assert Enum.sort(record.tags) == ["comms", "team"]
    end
  end

  describe "retitled/3 and why_updated/3" do
    test "updates title and why" do
      {:ok, id} = EmaResponsibilities.added("Old", "Old why", :weekly)
      :ok = EmaResponsibilities.retitled(id, "New", "actor:test")
      :ok = EmaResponsibilities.why_updated(id, "Better why", "actor:test")
      assert %{title: "New", why: "Better why"} = EmaResponsibilities.get(id)
    end
  end

  describe "cadence_changed/3" do
    test "validates new cadence and stamps from/to" do
      {:ok, id} = EmaResponsibilities.added("R", "Y", :weekly)
      :ok = EmaResponsibilities.cadence_changed(id, :monthly, "actor:test")
      assert %{cadence: :monthly} = EmaResponsibilities.get(id)
    end

    test "rejects invalid new cadence" do
      {:ok, id} = EmaResponsibilities.added("R", "Y", :weekly)

      assert {:error, {:invalid_cadence, :hourly}} =
               EmaResponsibilities.cadence_changed(id, :hourly, "actor:test")
    end
  end

  describe "scoped/3" do
    test "scope to a project and unscope back to nil" do
      {:ok, id} = EmaResponsibilities.added("R", "Y", :daily)

      :ok = EmaResponsibilities.scoped(id, "project:abc", "actor:test")
      assert %{project_id: "project:abc"} = EmaResponsibilities.get(id)

      :ok = EmaResponsibilities.scoped(id, nil, "actor:test")
      assert %{project_id: nil} = EmaResponsibilities.get(id)
    end
  end

  describe "tagged/3 and untagged/3" do
    test "set-merge add and remove" do
      {:ok, id} = EmaResponsibilities.added("R", "Y", :daily, tags: ["a"])

      :ok = EmaResponsibilities.tagged(id, ["b", "c"], "actor:test")
      :ok = EmaResponsibilities.tagged(id, ["a", "c", "d"], "actor:test")

      assert Enum.sort(EmaResponsibilities.get(id).tags) == ["a", "b", "c", "d"]

      :ok = EmaResponsibilities.untagged(id, ["a"], "actor:test")
      assert Enum.sort(EmaResponsibilities.get(id).tags) == ["b", "c", "d"]
    end
  end

  describe "paused/3, resumed/3, retired/3" do
    test "active → paused → active" do
      {:ok, id} = EmaResponsibilities.added("R", "Y", :daily)
      :ok = EmaResponsibilities.paused(id, "actor:test", reason: "trip")
      assert %{status: :paused} = EmaResponsibilities.get(id)

      :ok = EmaResponsibilities.resumed(id, "actor:test")
      assert %{status: :active} = EmaResponsibilities.get(id)
    end

    test "retire is terminal" do
      {:ok, id} = EmaResponsibilities.added("R", "Y", :daily)
      :ok = EmaResponsibilities.retired(id, "actor:test", reason: "obsolete")

      record = EmaResponsibilities.get(id)
      assert record.status == :retired
      assert is_binary(record.retired_at)

      assert {:error, :retired} = EmaResponsibilities.paused(id, "actor:test")
      assert {:error, :retired} = EmaResponsibilities.resumed(id, "actor:test")
    end
  end

  describe "standing/0" do
    test "groups active responsibilities by cadence" do
      {:ok, daily_id} = EmaResponsibilities.added("Daily 1", "Y", :daily)
      {:ok, _} = EmaResponsibilities.added("Daily 2", "Y", :daily)
      {:ok, _} = EmaResponsibilities.added("Weekly 1", "Y", :weekly)
      {:ok, paused_id} = EmaResponsibilities.added("Paused 1", "Y", :daily)
      {:ok, retired_id} = EmaResponsibilities.added("Retired 1", "Y", :daily)

      :ok = EmaResponsibilities.paused(paused_id, "actor:test")
      :ok = EmaResponsibilities.retired(retired_id, "actor:test")

      groups = EmaResponsibilities.standing()
      assert length(groups[:daily]) == 2
      assert length(groups[:weekly]) == 1

      assert daily_id in Enum.map(groups[:daily], & &1.responsibility_id)
      refute paused_id in Enum.map(groups[:daily] || [], & &1.responsibility_id)
      refute retired_id in Enum.map(groups[:daily] || [], & &1.responsibility_id)
    end
  end

  describe "valid_cadences/0" do
    test "returns the closed-set of allowed cadences" do
      assert EmaResponsibilities.valid_cadences() == [
               :daily,
               :weekly,
               :monthly,
               :quarterly,
               :ongoing
             ]
    end
  end
end
