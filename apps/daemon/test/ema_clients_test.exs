defmodule EmaClientsTest do
  @moduledoc """
  Smoke tests for `EmaClients`. Covers the API surface for the 10
  event kinds in `packages/contracts/events/client.md`.

  These run via `mix test` from `apps/daemon/`. Each test resets the
  projection up front so they're hermetic regardless of order.
  """

  use ExUnit.Case, async: false

  setup do
    EmaClients.__reset__()
    :ok
  end

  describe "added/2" do
    test "adds a client and returns its id" do
      assert {:ok, "client:" <> _} = EmaClients.added("Acme")
      assert [%{name: "Acme", status: :active}] = EmaClients.list()
    end

    test "rejects empty names" do
      assert {:error, :empty_name} = EmaClients.added("")
      assert {:error, :empty_name} = EmaClients.added("   ")
    end

    test "honors optional contact, color, tags" do
      {:ok, id} =
        EmaClients.added("Beta",
          contact: "founder@beta.example",
          color: "#5b8def",
          tags: ["priority", "trial"]
        )

      assert %{
               name: "Beta",
               contact: "founder@beta.example",
               color: "#5b8def",
               tags: tags
             } = EmaClients.get(id)

      assert Enum.sort(tags) == ["priority", "trial"]
    end
  end

  describe "renamed/3" do
    test "updates the projected name" do
      {:ok, id} = EmaClients.added("Old Name")
      :ok = EmaClients.renamed(id, "New Name", "actor:test")
      assert %{name: "New Name"} = EmaClients.get(id)
    end

    test "rejects empty name" do
      {:ok, id} = EmaClients.added("Name")
      assert {:error, :empty_name} = EmaClients.renamed(id, "  ", "actor:test")
    end
  end

  describe "tagged/3 and untagged/3" do
    test "set-merge add and remove" do
      {:ok, id} = EmaClients.added("Tagged Co", tags: ["a"])
      :ok = EmaClients.tagged(id, ["b", "c"], "actor:test")
      :ok = EmaClients.tagged(id, ["a", "c", "d"], "actor:test")

      assert %{tags: tags} = EmaClients.get(id)
      assert Enum.sort(tags) == ["a", "b", "c", "d"]

      :ok = EmaClients.untagged(id, ["a", "c"], "actor:test")
      assert %{tags: tags} = EmaClients.get(id)
      assert Enum.sort(tags) == ["b", "d"]
    end
  end

  describe "recolored/3" do
    test "updates the projected color" do
      {:ok, id} = EmaClients.added("Color Co", color: "#aaaaaa")
      :ok = EmaClients.recolored(id, "#bbbbbb", "actor:test")
      assert %{color: "#bbbbbb"} = EmaClients.get(id)
    end
  end

  describe "contact_updated/3" do
    test "updates and clears contact" do
      {:ok, id} = EmaClients.added("Contact Co", contact: "old@x.com")
      :ok = EmaClients.contact_updated(id, "new@x.com", "actor:test")
      assert %{contact: "new@x.com"} = EmaClients.get(id)

      :ok = EmaClients.contact_updated(id, nil, "actor:test")
      assert %{contact: nil} = EmaClients.get(id)
    end
  end

  describe "paused/3 and resumed/3" do
    test "transitions through pause/resume" do
      {:ok, id} = EmaClients.added("Cycle Co")
      assert %{status: :active} = EmaClients.get(id)

      :ok = EmaClients.paused(id, "actor:test", reason: "vacation")
      assert %{status: :paused} = EmaClients.get(id)

      :ok = EmaClients.resumed(id, "actor:test")
      assert %{status: :active} = EmaClients.get(id)
    end
  end

  describe "archived/3 and restored/2" do
    test "archive sets status and timestamp; restore clears" do
      {:ok, id} = EmaClients.added("Archive Co")
      :ok = EmaClients.archived(id, "actor:test", reason: "churned")

      record = EmaClients.get(id)
      assert record.status == :archived
      assert is_binary(record.archived_at)

      :ok = EmaClients.restored(id, "actor:test")
      record = EmaClients.get(id)
      assert record.status == :active
      assert record.archived_at == nil
    end
  end

  describe "list/0 and get/1" do
    test "list returns every projected client" do
      {:ok, _} = EmaClients.added("One")
      {:ok, _} = EmaClients.added("Two")
      {:ok, _} = EmaClients.added("Three")

      names = EmaClients.list() |> Enum.map(& &1.name) |> Enum.sort()
      assert names == ["One", "Three", "Two"]
    end

    test "get returns :not_found for unknown ids" do
      assert :not_found = EmaClients.get("client:nonexistent")
    end
  end
end
