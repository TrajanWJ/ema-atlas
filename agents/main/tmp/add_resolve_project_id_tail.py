from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/mcp/tools.ex"
text = p.read_text()
if 'defp resolve_project_id(project_ref)' in text:
    print('resolve_project_id already present')
    raise SystemExit(0)
old = '\nend\n'
new = '''
  defp resolve_project_id(project_ref) do
    with {:ok, %{status: 200, body: body}} <- get("/api/projects"),
         projects <- Map.get(body, "projects", []),
         project when not is_nil(project) <- Enum.find(projects, fn p -> project_ref in [p["id"], p["slug"], p["name"]] end) do
      {:ok, project["id"]}
    else
      nil -> {:error, "Project not found: #{project_ref}"}
      {:ok, %{status: status, body: body}} -> {:error, "EMA API error #{status}: #{inspect(body)}"}
      {:error, reason} -> {:error, reason}
    end
  end
end
'''
if not text.endswith(old):
    raise SystemExit('file does not end with expected end marker')
p.write_text(text[:-len(old)] + new)
print('inserted resolve_project_id helper before final end')
