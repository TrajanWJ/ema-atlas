defmodule Ema.Config.Scanner do
  @moduledoc "Scans filesystem for config resources"

  alias Ema.Config.Resource

  @openclaw_dir Path.expand("~/.openclaw")

  @spec scan() :: {:ok, [Resource.t()]} | {:error, term()}
  def scan do
    resources =
      []
      |> scan_skills()
      |> scan_agents()
      |> scan_openclaw_config()

    {:ok, resources}
  rescue
    e -> {:error, e}
  end

  # Skills are directories under ~/.openclaw/skills/ containing SKILL.md
  defp scan_skills(acc) do
    skills_dir = Path.join(@openclaw_dir, "skills")

    case File.ls(skills_dir) do
      {:ok, entries} ->
        skill_resources =
          entries
          |> Enum.flat_map(fn entry ->
            entry_path = Path.join(skills_dir, entry)

            cond do
              # Directory-based skill (has SKILL.md)
              File.dir?(entry_path) ->
                skill_md = Path.join(entry_path, "SKILL.md")
                if File.exists?(skill_md) do
                  [%Resource{
                    id: "skill:user:#{entry}",
                    type: :skill,
                    name: entry,
                    scope: :user,
                    source_path: skill_md,
                    enabled: true,
                    metadata: %{dir: entry_path},
                    inserted_at: DateTime.utc_now()
                  }]
                else
                  []
                end

              # File-based skill (.yaml, .yml, .json, .md)
              Path.extname(entry) in [".yaml", ".yml", ".json", ".md"] ->
                name = Path.basename(entry, Path.extname(entry))
                [%Resource{
                  id: "skill:user:#{name}",
                  type: :skill,
                  name: name,
                  scope: :user,
                  source_path: entry_path,
                  enabled: true,
                  metadata: %{file: entry},
                  inserted_at: DateTime.utc_now()
                }]

              true ->
                []
            end
          end)

        acc ++ skill_resources

      {:error, _} ->
        acc
    end
  end

  defp scan_agents(acc) do
    agents_dir = Path.join(@openclaw_dir, "agents")

    case File.ls(agents_dir) do
      {:ok, agent_dirs} ->
        agent_resources =
          agent_dirs
          |> Enum.flat_map(fn agent_name ->
            agent_path = Path.join(agents_dir, agent_name)

            if File.dir?(agent_path) do
              scan_agent_dir(agent_name, agent_path)
            else
              []
            end
          end)

        acc ++ agent_resources

      {:error, _} ->
        acc
    end
  end

  defp scan_agent_dir(agent_name, agent_path) do
    ["MEMORY.md", "SOUL.md"]
    |> Enum.filter(fn file -> File.exists?(Path.join(agent_path, file)) end)
    |> Enum.map(fn file ->
      path = Path.join(agent_path, file)
      doc_type = file |> Path.basename(".md") |> String.downcase()

      %Resource{
        id: "agent:user:#{agent_name}:#{doc_type}",
        type: :agent,
        name: "#{agent_name}/#{doc_type}",
        scope: :user,
        source_path: path,
        enabled: true,
        metadata: %{agent: agent_name, doc_type: doc_type},
        inserted_at: DateTime.utc_now()
      }
    end)
  end

  defp scan_openclaw_config(acc) do
    config_path = Path.join(@openclaw_dir, "openclaw.json")

    if File.exists?(config_path) do
      resource = %Resource{
        id: "config:user:openclaw",
        type: :command,
        name: "openclaw",
        scope: :user,
        source_path: config_path,
        enabled: true,
        metadata: %{config_type: "main"},
        inserted_at: DateTime.utc_now()
      }

      acc ++ [resource]
    else
      acc
    end
  end
end
