#!/usr/bin/env bash
# Run the EMA daemon in dev.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../apps/daemon"

if ! command -v gleam >/dev/null 2>&1; then
  echo "gleam not found. Install: https://gleam.run/getting-started/installing/"
  exit 1
fi

exec gleam run
