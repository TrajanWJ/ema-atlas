from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/mcp/server.ex"
text = p.read_text()
old = '''  def run_stdio do
    {:ok, _} = start_link([])
    # Block forever; the GenServer owns stdio
    Process.sleep(:infinity)
  end
'''
new = '''  def run_stdio do
    quiet_stdio_logging()
    {:ok, _} = start_link([])
    # Block forever; the GenServer owns stdio
    Process.sleep(:infinity)
  end
'''
if old in text:
    text = text.replace(old, new, 1)
marker = '  # ── GenServer Callbacks'
helper = '''  defp quiet_stdio_logging do
    Logger.configure(level: :error)

    with backends when is_list(backends) <- Application.get_env(:logger, :backends, []),
         true <- :console in backends do
      Logger.remove_backend(:console, flush: true)
    else
      _ -> :ok
    end

    :ok
  rescue
    _ -> :ok
  end

'''
if 'defp quiet_stdio_logging do' not in text:
    text = text.replace(marker, helper + marker, 1)
p.write_text(text)
print('patched MCP stdio logging quiet mode')
