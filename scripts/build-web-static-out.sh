#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
WEB_DIR="$ROOT/apps/web"
OUT_DIR="$WEB_DIR/out"
POPOUT_PAGE="$WEB_DIR/app/popout/[appId]/page.tsx"
PARITY_SCRIPT="$ROOT/tooling/verify-static-popout-parity.mjs"

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

# Source the canonical STATIC_POPOUT_APPS list directly from the Next.js
# popout route (apps/web/app/popout/[appId]/page.tsx). This replaces the
# previous hand-maintained POPOUT_APPS bash array so the build cannot drift
# from the runtime list.
if [[ ! -f "$POPOUT_PAGE" ]]; then
  echo "canonical popout page missing: $POPOUT_PAGE" >&2
  exit 1
fi

POPOUT_APPS_LIST="$(
  awk '
    /STATIC_POPOUT_APPS\s*=\s*\[/ { capture=1; next }
    capture && /\]/ { capture=0; exit }
    capture { print }
  ' "$POPOUT_PAGE" | grep -oE '"[a-z0-9-]+"' | tr -d '"'
)"

if [[ -z "$POPOUT_APPS_LIST" ]]; then
  echo "failed to parse STATIC_POPOUT_APPS from $POPOUT_PAGE" >&2
  exit 1
fi

while IFS= read -r app_id; do
  [[ -z "$app_id" ]] && continue
  mkdir -p "$OUT_DIR/popout/$app_id"
  if [[ ! -f "$OUT_DIR/popout/$app_id/index.html" ]]; then
    cp "$OUT_DIR/index.html" "$OUT_DIR/popout/$app_id/index.html"
  fi
done <<< "$POPOUT_APPS_LIST"

if [[ -d "$WEB_DIR/public" ]]; then
  cp -R "$WEB_DIR/public"/. "$OUT_DIR"/
fi

echo "Wrote static desktop web assets to $OUT_DIR"

# Hard parity gate: fail (exit 1) if any expected popout page is missing
# from the static bundle. Runs the same authoritative list via Node so the
# verifier can be invoked independently from CI/runtime reports.
node "$PARITY_SCRIPT"
