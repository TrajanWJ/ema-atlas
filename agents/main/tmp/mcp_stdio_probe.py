import json
import subprocess

proc = subprocess.Popen(
    [
        "/home/trajan/.local/share/mise/installs/elixir/1.18.4-otp-27/bin/mix",
        "run",
        "-e",
        "Ema.MCP.Server.run_stdio()",
    ],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
    cwd="/home/trajan/Projects/ema/daemon",
)


def rpc(msg):
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()
    return proc.stdout.readline().strip()

msgs = [
    {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"clientInfo": {"name": "orchestrator-proof", "version": "1.0"}}},
    {"jsonrpc": "2.0", "id": 2, "method": "resources/list", "params": {}},
    {"jsonrpc": "2.0", "id": 3, "method": "resources/read", "params": {"uri": "ema://context/operator"}},
    {"jsonrpc": "2.0", "id": 4, "method": "resources/read", "params": {"uri": "ema://context/project?id=ema"}},
    {"jsonrpc": "2.0", "id": 5, "method": "tools/list", "params": {}},
    {"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {"name": "context_operator", "arguments": {}, "_meta": {"requestId": "proof-ctx-op"}}},
    {"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "context_project", "arguments": {"project": "ema"}, "_meta": {"requestId": "proof-ctx-proj"}}},
]

for m in msgs:
    print(f"=== response {m['id']} ===")
    print(rpc(m))
    print()

proc.kill()
err = proc.stderr.read().strip()
if err:
    print("=== stderr ===")
    print(err)
