from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/mix/tasks/ema/mcp/stdio.ex"
text = p.read_text()
old = '''  def run(_args) do
    Application.put_env(:logger, :backends, [])
    System.put_env("EMA_MCP_STDIO", "1")

    Mix.Task.run("app.config")
    {:ok, _} = Application.ensure_all_started(:ema)

    Ema.MCP.Server.run_stdio()
  end
'''
new = '''  def run(_args) do
    Application.put_env(:logger, :backends, [])
    Application.put_env(:logger, :level, :error)
    System.put_env("EMA_MCP_STDIO", "1")

    Mix.Task.run("app.config")

    repo_cfg = Application.get_env(:ema, Ema.Repo, [])
    repo_cfg = Keyword.merge(repo_cfg, log: false, stacktrace: false)
    Application.put_env(:ema, Ema.Repo, repo_cfg)

    {:ok, _} = Application.ensure_all_started(:ema)

    Ema.MCP.Server.run_stdio()
  end
'''
if old not in text:
    raise SystemExit('expected run block not found in mcp stdio task')
p.write_text(text.replace(old, new, 1))
print('patched mcp stdio task to disable logger and repo SQL logging')
