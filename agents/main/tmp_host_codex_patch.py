from pathlib import Path
p = Path.home() / '.codex/config.toml'
s = p.read_text()
old = '''[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/trajan/Projects", "/home/trajan/vault"]'''
new = '''[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/trajan/Projects", "/home/trajan/vault", "/home/trajan/Desktop/EMA-v1.1-Next-Steps"]'''
if old not in s:
    raise SystemExit('pattern not found')
p.write_text(s.replace(old, new, 1))
print(f'patched {p}')
