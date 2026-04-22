from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/mcp/tools.ex"
text = p.read_text()
old = """      }\n      ,%{"""
new = """      },\n      %{"""
if old not in text:
    raise SystemExit('expected malformed comma block not found')
p.write_text(text.replace(old, new, 1))
print('fixed mcp tools list comma syntax')
