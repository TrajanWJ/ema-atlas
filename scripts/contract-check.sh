#!/usr/bin/env bash
# Contract check — every event-kind string used in code must appear in
# packages/contracts/events/catalog.v0.md.
#
# Scope: apps/daemon/src + apps/web/src + packages/surface-core/src.
# Kinds are recognized as bare string literals matching:
#   <family>.<verb>[.<subverb>]
#
# This is a lightweight lint, not a full AST pass. False positives are
# rare because EMA event kinds use a distinctive dotted form.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/.."
CATALOG="$ROOT/packages/contracts/events/catalog.v0.md"

if [[ ! -f "$CATALOG" ]]; then
  echo "contract-check: catalog not found at $CATALOG"
  exit 2
fi

KNOWN=$(grep -oE '`[a-z_]+\.[a-z_]+(\.[a-z_]+)?`' "$CATALOG" | tr -d '`' | sort -u)

# Kinds that appear in source code as event kind assignments. The
# narrower pattern avoids false positives from command names such as
# "connector.connect" and projection names such as "blueprint.sections".
FOUND=$(grep -rhoE '(kind|event_kind)[[:space:]]*[:=][[:space:]]*"[a-z_]+\.[a-z_]+(\.[a-z_]+)?"' \
  "$ROOT/apps/daemon/src" \
  "$ROOT/apps/web/src" \
  "$ROOT/packages/surface-core/src" \
  2>/dev/null \
  | grep -oE '"[a-z_]+\.[a-z_]+(\.[a-z_]+)?"' \
  | tr -d '"' \
  | sort -u \
  | grep -E '^(actor|org|space|project|membership|invite|device|peer|lease|replication|lane|handoff|proposal|incident|dispatch|execution|tool|blueprint|attachment|connector)\.' \
  || true)

MISSING=""
while IFS= read -r kind; do
  [[ -z "$kind" ]] && continue
  if ! echo "$KNOWN" | grep -qx "$kind"; then
    MISSING="$MISSING $kind"
  fi
done <<< "$FOUND"

if [[ -n "$MISSING" ]]; then
  echo "contract-check: unknown event kinds referenced in code:"
  for k in $MISSING; do echo "  - $k"; done
  echo ""
  echo "Add them to $CATALOG (and the appropriate family file) before shipping."
  exit 1
fi

echo "contract-check: OK — every referenced event kind is in catalog v0."
