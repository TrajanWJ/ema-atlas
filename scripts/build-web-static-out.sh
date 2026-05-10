#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
WEB_DIR="$ROOT/apps/web"
OUT_DIR="$WEB_DIR/out"

pnpm --filter @ema/web build

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/_next"

cp "$WEB_DIR/.next/server/app/index.html" "$OUT_DIR/index.html"
cp "$WEB_DIR/.next/server/app/_not-found.html" "$OUT_DIR/404.html"
cp -R "$WEB_DIR/.next/static" "$OUT_DIR/_next/static"

find "$WEB_DIR/.next/server/app" -maxdepth 1 -type f -name '*.html' \
  ! -name 'index.html' \
  ! -name '_*.html' \
  -print0 | while IFS= read -r -d '' route_html; do
    route_name="$(basename "$route_html" .html)"
    mkdir -p "$OUT_DIR/$route_name"
    cp "$route_html" "$OUT_DIR/$route_name/index.html"
  done

find "$WEB_DIR/.next/server/app" -mindepth 2 -type f -name '*.html' \
  ! -path '*/_*.html' \
  -print0 | while IFS= read -r -d '' route_html; do
    route_rel="${route_html#"$WEB_DIR/.next/server/app/"}"
    route_rel="${route_rel%.html}"
    mkdir -p "$OUT_DIR/$route_rel"
    cp "$route_html" "$OUT_DIR/$route_rel/index.html"
  done

POPOUT_APPS=(
  launchpad
  cockpit
  agent-work
  hq
  atlas
  blueprint
  chronicle
  git-ema
  clients
  threads
  wiki
  settings
  place-tools
  terminal
  finder
)

for app_id in "${POPOUT_APPS[@]}"; do
  mkdir -p "$OUT_DIR/popout/$app_id"
  if [[ ! -f "$OUT_DIR/popout/$app_id/index.html" ]]; then
    cp "$OUT_DIR/index.html" "$OUT_DIR/popout/$app_id/index.html"
  fi
done

if [[ -d "$WEB_DIR/public" ]]; then
  cp -R "$WEB_DIR/public"/. "$OUT_DIR"/
fi

echo "Wrote static desktop web assets to $OUT_DIR"
