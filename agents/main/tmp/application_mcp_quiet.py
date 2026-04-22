from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/application.ex"
text = p.read_text()
old = '      Logger.warning("DISCORD_BOT_TOKEN not set — Discord delivery will be unavailable")\n'
new = '      unless System.get_env("EMA_MCP_STDIO") in ["1", "true", "TRUE"] do\n        Logger.warning("DISCORD_BOT_TOKEN not set — Discord delivery will be unavailable")\n      end\n'
if old not in text:
    raise SystemExit('discord warning line not found')
p.write_text(text.replace(old, new, 1))
print('patched application discord warning for MCP stdio mode')
