import json
import subprocess
import time

proc = subprocess.Popen(
    [
        "/home/trajan/.local/share/mise/installs/elixir/1.18.4-otp-27/bin/mix",
        "ema.mcp.stdio",
    ],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
    cwd="/home/trajan/Projects/ema/daemon",
)


def rpc(msg, timeout=15):
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()
    deadline = time.time() + timeout
    lines = []
    while time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            time.sleep(0.05)
            continue
        line = line.strip()
        if not line:
            continue
        lines.append(line)
        try:
            json.loads(line)
            return {"json": line, "noise": lines[:-1]}
        except Exception:
            continue
    return {"json": None, "noise": lines}

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
    out = rpc(m)
    print(f"=== response {m['id']} ===")
    print(json.dumps(out, indent=2))
    print()

proc.kill()
err = proc.stderr.read().strip()
if err:
    print("=== stderr ===")
    print(err)
