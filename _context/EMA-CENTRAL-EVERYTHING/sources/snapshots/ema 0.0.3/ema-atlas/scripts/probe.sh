#!/usr/bin/env bash
# probe.sh — figure out which AGENT_BOOTSTRAP path this machine is on.
# Pure read-only. Safe to run anywhere.
set -u
have() { command -v "$1" >/dev/null 2>&1; }
sec()  { printf "\n== %s ==\n" "$1"; }

sec "tools"
for t in git gh elixir erl psql node pnpm npm vercel mix iex; do
  if have "$t"; then printf "  ok   %-8s %s\n" "$t" "$($t --version 2>&1 | head -1)"
  else                printf "  MISS %-8s\n" "$t"
  fi
done

sec "candidate ema repos"
for d in "$HOME/Projects/ema" "$HOME/ema-workspace/ema" "$HOME/code/ema" "/home/trajan/Projects/ema"; do
  if [ -d "$d/.git" ]; then printf "  found %s\n" "$d"; fi
done

sec "transfer pack"
if [ -f SYSTEM_GRAPH.md ] && [ -d graph/nodes ]; then
  printf "  cwd is a transfer-pack checkout\n"
else
  printf "  cwd is NOT the transfer pack (cd into it first)\n"
fi

sec "hermes (best-effort)"
for port in 4000 4001 4002 8787 8080; do
  if curl -fsS -m 1 "http://localhost:$port/health" >/dev/null 2>&1; then
    printf "  hermes-ish responding on :%s\n" "$port"
  fi
done

sec "verdict"
if [ -d "$HOME/Projects/ema/.git" ] || [ -d "$HOME/ema-workspace/ema/.git" ]; then
  echo "  PATH A — EMA already installed. Read AGENT_TRAVERSAL.md."
else
  echo "  PATH B — bootstrap the ecosystem. Follow AGENT_BOOTSTRAP.md §B."
fi
