#!/usr/bin/env bash
# dev-restart.sh — kill any running atlas dev server, clear .next, restart on $PORT (default 4000).
#
# Use when Next.js throws "Cannot find module './XXXX.js'" or any other
# webpack-runtime cache corruption error during `npm run dev`. This is a
# known Next.js 15 dev cache issue; the recipe is always the same.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4000}"

echo "[1/3] killing any running 'next dev' processes"
pkill -f "next dev" 2>/dev/null || true
sleep 2

echo "[2/3] clearing .next cache"
rm -rf "$ROOT/.next"

echo "[3/3] starting fresh on PORT=$PORT"
cd "$ROOT"
PORT="$PORT" npm run dev
