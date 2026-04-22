from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/mcp/tools.ex"
text = p.read_text()
if 'defp resolve_project_id(project_ref)' in text:
    print('resolve_project_id already present')
    raise SystemExit(0)
marker = '\n  defp utc_now do\n'
helper = '''\n  defp resolve_project_id(project_ref) do\n    with {:ok, %{status: 200, body: body}} <- get("/api/projects"),\n         projects <- Map.get(body, "projects", []),\n         project when not is_nil(project) <- Enum.find(projects, fn p -> project_ref in [p["id"], p["slug"], p["name"]] end) do\n      {:ok, project["id"]}\n    else\n      nil -> {:error, "Project not found: #{project_ref}"}\n      {:ok, %{status: status, body: body}} -> {:error, "EMA API error #{status}: #{inspect(body)}"}\n      {:error, reason} -> {:error, reason}\n    end\n  end\n\n'''
if marker not in text:
    raise SystemExit('utc_now marker not found')
p.write_text(text.replace(marker, helper + marker, 1))
print('inserted resolve_project_id helper')
