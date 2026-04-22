#!/bin/bash
# Wiki MCP Server — stdio transport
# Kills any stub server on :8090 then starts the wiki MCP server

# Kill existing on :8090
fuser -k 8090/tcp 2>/dev/null || true

cd /home/trajan/wiki/mcp
exec python3.12 server.py
