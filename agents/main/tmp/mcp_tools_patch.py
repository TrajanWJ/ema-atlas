from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/mcp/tools.ex"
text = p.read_text()
text = text.replace('@base_url "http://localhost:4488"', '@base_url "http://localhost:4488"')
insert_after = '      %{\n        "name" => "log_outcome",\n'
if '"name" => "context_operator"' not in text:
    marker = '    ]\n  end\n\n  # ── Tool Dispatch'
    addition = '''      ,%{
        "name" => "context_operator",
        "description" => "Fetch the canonical EMA operator context package from host EMA.",
        "inputSchema" => %{
          "type" => "object",
          "properties" => %{}
        }
      },
      %{
        "name" => "context_project",
        "description" => "Fetch the canonical EMA project context package by project id or slug.",
        "inputSchema" => %{
          "type" => "object",
          "properties" => %{
            "project" => %{"type" => "string", "description" => "Project id, slug, or name"}
          },
          "required" => ["project"]
        }
      }
'''
    text = text.replace(marker, addition + '    ]\n  end\n\n  # ── Tool Dispatch', 1)

text = text.replace('''  def call("log_outcome", args, request_id) do
    call_log_outcome(args, request_id)
  end
''','''  def call("log_outcome", args, request_id) do
    call_log_outcome(args, request_id)
  end

  def call("context_operator", args, request_id) do
    call_context_operator(args, request_id)
  end

  def call("context_project", args, request_id) do
    call_context_project(args, request_id)
  end
''',1)

if 'defp call_context_operator' not in text:
    marker = '  # ── Tool: create_proposal'
    addition = '''  # ── Tool: context_operator / context_project ─────────────────────────────

  defp call_context_operator(_args, _request_id) do
    case get("/api/context/operator/package") do
      {:ok, %{status: status, body: body}} when status in 200..299 -> {:ok, body}
      {:ok, %{status: status, body: body}} -> {:error, "EMA API error #{status}: #{inspect(body)}"}
      {:error, reason} -> {:error, reason}
    end
  end

  defp call_context_project(args, _request_id) do
    with {:ok, project_ref} <- require_string(args, "project"),
         {:ok, project_id} <- resolve_project_id(project_ref),
         {:ok, %{status: status, body: body}} when status in 200..299 <- get("/api/context/project/#{project_id}/package") do
      {:ok, body}
    else
      {:ok, %{status: status, body: body}} -> {:error, "EMA API error #{status}: #{inspect(body)}"}
      {:error, reason} -> {:error, reason}
    end
  end

'''
    text = text.replace(marker, addition + marker, 1)

if 'defp resolve_project_id' not in text:
    marker = '\n  # ── Private Helpers'
    addition = '''
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
'''
    text = text.replace(marker, addition + marker, 1)

p.write_text(text)
print('patched mcp tools for context_operator/context_project')
