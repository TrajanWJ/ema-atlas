from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/mix/tasks/ema/mcp/stdio.ex"
text = p.read_text()
old = '    Application.put_env(:logger, :backends, [])\n    Application.put_env(:logger, :level, :error)\n'
new = '    Application.put_env(:logger, :backends, [])\n    Application.put_env(:logger, :level, :error)\n    Application.put_env(:logger, :default_handler, false)\n'
if old not in text:
    raise SystemExit('logger config block not found')
text = text.replace(old, new, 1)
old2 = '    Mix.Task.run("app.config")\n\n    repo_cfg = Application.get_env(:ema, Ema.Repo, [])\n'
new2 = '    Mix.Task.run("app.config")\n\n    try do\n      :logger.remove_handler(:default)\n    rescue\n      _ -> :ok\n    catch\n      _, _ -> :ok\n    end\n\n    repo_cfg = Application.get_env(:ema, Ema.Repo, [])\n'
if old2 not in text:
    raise SystemExit('app.config block not found')
text = text.replace(old2, new2, 1)
p.write_text(text)
print('patched mcp stdio task to disable default logger handler')
