defmodule Ema.Config.Snapshot do
  @moduledoc "Save/restore registry state snapshots"

  alias Ema.Config.{Registry, Resource}

  @snapshots_dir Path.expand("~/.openclaw/agents/ema/priv/config_snapshots")

  def start_link(_opts \\ []), do: {:ok, self()}

  @spec save(String.t()) :: {:ok, String.t()} | {:error, term()}
  def save(label) do
    snapshot_id = "#{label}-#{DateTime.utc_now() |> DateTime.to_unix()}"
    path = snapshot_path(snapshot_id)

    resources = Registry.list_all()
    data = %{
      id: snapshot_id,
      label: label,
      saved_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      resources: Enum.map(resources, &resource_to_map/1)
    }

    File.mkdir_p!(Path.dirname(path))

    case Jason.encode(data) do
      {:ok, json} ->
        File.write!(path, json)
        {:ok, snapshot_id}

      {:error, _} = err ->
        err
    end
  end

  @spec list() :: [map()]
  def list do
    snapshots_dir = @snapshots_dir

    case File.ls(snapshots_dir) do
      {:ok, files} ->
        files
        |> Enum.filter(&String.ends_with?(&1, ".json"))
        |> Enum.map(fn file ->
          path = Path.join(snapshots_dir, file)
          id = Path.basename(file, ".json")
          stat = File.stat!(path)
          %{id: id, path: path, size: stat.size}
        end)

      {:error, _} ->
        []
    end
  end

  @spec restore(String.t()) :: :ok | {:error, term()}
  def restore(snapshot_id) do
    path = snapshot_path(snapshot_id)

    case File.read(path) do
      {:ok, json} ->
        case Jason.decode(json) do
          {:ok, data} ->
            Registry.clear()

            Enum.each(data["resources"], fn r ->
              resource = map_to_resource(r)
              Registry.register(resource)
            end)

            :ok

          {:error, _} = err ->
            err
        end

      {:error, _} = err ->
        err
    end
  end

  defp snapshot_path(id), do: Path.join(@snapshots_dir, "#{id}.json")

  defp resource_to_map(%Resource{} = r) do
    %{
      "id" => r.id,
      "type" => Atom.to_string(r.type),
      "name" => r.name,
      "scope" => Atom.to_string(r.scope),
      "source_path" => r.source_path,
      "enabled" => r.enabled,
      "metadata" => r.metadata,
      "inserted_at" => r.inserted_at && DateTime.to_iso8601(r.inserted_at)
    }
  end

  defp map_to_resource(m) do
    %Resource{
      id: m["id"],
      type: String.to_existing_atom(m["type"]),
      name: m["name"],
      scope: String.to_existing_atom(m["scope"]),
      source_path: m["source_path"],
      enabled: m["enabled"],
      metadata: m["metadata"] || %{},
      inserted_at:
        case m["inserted_at"] do
          nil -> nil
          ts -> elem(DateTime.from_iso8601(ts), 1)
        end
    }
  end
end
