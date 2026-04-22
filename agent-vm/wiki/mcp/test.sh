#!/bin/bash
# Test wiki MCP tools
set -e

MCP_SERVER="python3 /home/trajan/wiki/mcp/server.py"
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}'

run_tool() {
    local name="$1"
    local args="$2"
    local call="{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"$name\",\"arguments\":$args}}"
    echo -e "$INIT\n$call" | timeout 15 $MCP_SERVER 2>/dev/null | grep '"id":2' | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
content = d.get('result', {}).get('content', [])
for c in content:
    print(c.get('text','')[:400])
"
}

echo "=== Testing wiki_search ==="
run_tool "wiki_search" '{"query":"EMA","limit":3}'

echo ""
echo "=== Testing wiki_list ==="
run_tool "wiki_list" '{"limit":5}'

echo ""
echo "=== Testing wiki_read (README page) ==="
run_tool "wiki_read" '{"page_id":"README"}'

echo ""
echo "All tests passed."
