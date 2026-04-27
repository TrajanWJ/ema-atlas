#!/usr/bin/env bash
# Contract check — v2.
#
# Classifies contract drift between source code and the catalog/id-prefix
# registries. Three error classes:
#
#   missing-from-catalog   an event kind is referenced in code but does not
#                          appear in packages/contracts/events/catalog.v0.md
#                          and is not close to any registered kind.
#   misspelled-kind        an event kind is referenced, is not in catalog,
#                          but is within Levenshtein distance 2 of a known
#                          kind — almost always a typo. Suggests the closest
#                          known kind.
#   unknown-id-prefix      a ULID-shaped literal of the form
#                          "<prefix>:<26-upper-alnum>" uses a prefix that is
#                          not registered in packages/contracts/types/ids.md.
#
# Output is human-readable by default. Pass --json for CI-parseable JSON.
#
# Exit codes:
#   0  clean
#   1  at least one error-class hit
#   2  setup failure (registries missing, bad arguments)

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/.."
CATALOG="$ROOT/packages/contracts/events/catalog.v0.md"
IDS_DOC="$ROOT/packages/contracts/types/ids.md"

JSON=0
SOURCE_DIR_OVERRIDE=""
RUN_FIXTURE=0

for arg in "$@"; do
  case "$arg" in
    --json)
      JSON=1
      ;;
    --source-dir=*)
      SOURCE_DIR_OVERRIDE="${arg#--source-dir=}"
      ;;
    --test-fixture)
      RUN_FIXTURE=1
      ;;
    -h|--help)
      cat <<EOF
contract-check.sh — verify event kinds and ID prefixes against contract registries.

Usage:
  $0                        scan the standard source dirs.
  $0 --json                 emit JSON output for CI.
  $0 --source-dir=PATH      scan only PATH instead of the default dirs.
  $0 --test-fixture         scan test/fixtures/bad-kinds/ and assert it fails.
  $0 -h | --help            this help.

Error classes:
  missing-from-catalog   kind referenced in code, not in catalog, no close match.
  misspelled-kind        kind referenced in code, not in catalog, within edit distance 2.
  unknown-id-prefix      ULID-shaped literal uses an unregistered prefix.

Exits 0 clean, 1 on any error-class hit, 2 on setup failure.
EOF
      exit 0
      ;;
    *)
      echo "contract-check: unknown option: $arg" >&2
      echo "see: $0 --help" >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$CATALOG" ]]; then
  echo "contract-check: catalog not found at $CATALOG" >&2
  exit 2
fi
if [[ ! -f "$IDS_DOC" ]]; then
  echo "contract-check: ids.md not found at $IDS_DOC" >&2
  exit 2
fi

# Test-fixture mode: re-invoke this script pointed at the fixture and
# assert it exits 1 with at least one error class raised.
if [[ "$RUN_FIXTURE" -eq 1 ]]; then
  FIXTURE_DIR="$ROOT/test/fixtures/bad-kinds"
  if [[ ! -d "$FIXTURE_DIR" ]]; then
    echo "contract-check: fixture dir not found at $FIXTURE_DIR" >&2
    exit 2
  fi
  echo "contract-check: running against fixture at $FIXTURE_DIR"
  set +e
  "$0" --source-dir="$FIXTURE_DIR" --json
  rc=$?
  set -e
  if [[ "$rc" -ne 1 ]]; then
    echo "contract-check fixture test FAILED: expected rc=1, got rc=$rc" >&2
    exit 1
  fi
  echo "contract-check fixture test OK: fixture exited 1 as expected."
  exit 0
fi

# --- Known-kind set -----------------------------------------------------

KNOWN_KINDS=$(grep -oE '`[a-z_]+\.[a-z_]+(\.[a-z_]+)?`' "$CATALOG" | tr -d '`' | sort -u)

# --- Known-prefix set ---------------------------------------------------

KNOWN_PREFIXES=$(grep -oE '^\| `[a-z_]+`' "$IDS_DOC" | grep -oE '`[a-z_]+`' | tr -d '`' | sort -u)

# --- Source scan --------------------------------------------------------

if [[ -n "$SOURCE_DIR_OVERRIDE" ]]; then
  SOURCE_DIRS=("$SOURCE_DIR_OVERRIDE")
else
  SOURCE_DIRS=(
    "$ROOT/apps/daemon/src"
    "$ROOT/apps/web/src"
    "$ROOT/packages/surface-core/src"
  )
fi

existing_source_dirs=()
for d in "${SOURCE_DIRS[@]}"; do
  if [[ -d "$d" ]]; then
    existing_source_dirs+=("$d")
  fi
done

if [[ ${#existing_source_dirs[@]} -eq 0 ]]; then
  echo "contract-check: no source directories exist to scan." >&2
  exit 2
fi

# Event kinds referenced in code.
FAMILY_REGEX='^(actor|agent|org|space|project|membership|invite|access_session|device|peer|lease|replication|lane|handoff|proposal|incident|dispatch|execution|tool|blueprint|collab|attachment|connector|swarm|mission|campaign|vcalendar|calendar_block|checkup|queue_item|artifact|source_ref|codebase|user|personal_ai|event|debug)\.'

FOUND_KINDS=$(grep -rhoE '(kind|event_kind)[[:space:]]*[:=][[:space:]]*"[a-z_]+\.[a-z_]+(\.[a-z_]+)?"' \
  "${existing_source_dirs[@]}" 2>/dev/null \
  | grep -oE '"[a-z_]+\.[a-z_]+(\.[a-z_]+)?"' \
  | tr -d '"' \
  | sort -u \
  | grep -E "$FAMILY_REGEX" \
  || true)

# ULID-shaped prefix usage.
FOUND_PREFIX_USES=$(grep -rhoE '"[a-z_]+:[0-9A-Z]{26}"' \
  "${existing_source_dirs[@]}" 2>/dev/null \
  | grep -oE '"[a-z_]+:' \
  | tr -d '":' \
  | sort -u \
  || true)

# --- Classify -----------------------------------------------------------

# Levenshtein in awk. Prints distance.
levenshtein() {
  awk -v a="$1" -v b="$2" '
    BEGIN {
      la = length(a); lb = length(b);
      if (la == 0) { print lb; exit }
      if (lb == 0) { print la; exit }
      for (i = 0; i <= la; i++) d[i,0] = i;
      for (j = 0; j <= lb; j++) d[0,j] = j;
      for (i = 1; i <= la; i++) {
        ca = substr(a, i, 1);
        for (j = 1; j <= lb; j++) {
          cb = substr(b, j, 1);
          cost = (ca == cb) ? 0 : 1;
          v1 = d[i-1,j] + 1;
          v2 = d[i,j-1] + 1;
          v3 = d[i-1,j-1] + cost;
          m = v1; if (v2 < m) m = v2; if (v3 < m) m = v3;
          d[i,j] = m;
        }
      }
      print d[la,lb];
    }
  '
}

missing_kinds=()
misspelled_kinds=()     # "kind=>suggestion"
unknown_prefixes=()

while IFS= read -r kind; do
  [[ -z "$kind" ]] && continue
  if echo "$KNOWN_KINDS" | grep -qx "$kind"; then
    continue
  fi
  # not in catalog: check edit distance
  best_known=""
  best_dist=9999
  while IFS= read -r known; do
    [[ -z "$known" ]] && continue
    dist=$(levenshtein "$kind" "$known")
    if [[ "$dist" -lt "$best_dist" ]]; then
      best_dist="$dist"
      best_known="$known"
    fi
  done <<< "$KNOWN_KINDS"
  if [[ "$best_dist" -le 2 && -n "$best_known" ]]; then
    misspelled_kinds+=("$kind=>$best_known")
  else
    missing_kinds+=("$kind")
  fi
done <<< "$FOUND_KINDS"

while IFS= read -r prefix; do
  [[ -z "$prefix" ]] && continue
  if ! echo "$KNOWN_PREFIXES" | grep -qx "$prefix"; then
    unknown_prefixes+=("$prefix")
  fi
done <<< "$FOUND_PREFIX_USES"

# --- Emit ---------------------------------------------------------------

errors=$(( ${#missing_kinds[@]} + ${#misspelled_kinds[@]} + ${#unknown_prefixes[@]} ))

if [[ "$JSON" -eq 1 ]]; then
  # Build JSON with awk for consistent formatting.
  printf '{\n'
  printf '  "ok": %s,\n' "$( [[ $errors -eq 0 ]] && echo true || echo false )"
  printf '  "error_count": %d,\n' "$errors"
  printf '  "missing_from_catalog": ['
  first=1
  for k in "${missing_kinds[@]:-}"; do
    [[ -z "$k" ]] && continue
    if [[ $first -eq 1 ]]; then first=0; printf '"%s"' "$k"; else printf ', "%s"' "$k"; fi
  done
  printf '],\n  "misspelled_kind": ['
  first=1
  for entry in "${misspelled_kinds[@]:-}"; do
    [[ -z "$entry" ]] && continue
    k="${entry%%=>*}"
    s="${entry##*=>}"
    if [[ $first -eq 1 ]]; then first=0; printf '{"kind":"%s","suggested":"%s"}' "$k" "$s";
    else printf ', {"kind":"%s","suggested":"%s"}' "$k" "$s"; fi
  done
  printf '],\n  "unknown_id_prefix": ['
  first=1
  for p in "${unknown_prefixes[@]:-}"; do
    [[ -z "$p" ]] && continue
    if [[ $first -eq 1 ]]; then first=0; printf '"%s"' "$p"; else printf ', "%s"' "$p"; fi
  done
  printf ']\n'
  printf '}\n'
else
  if [[ "$errors" -eq 0 ]]; then
    echo "contract-check: OK — every referenced event kind and id prefix is registered."
  else
    echo "contract-check: FAIL ($errors error(s))"
    if [[ ${#missing_kinds[@]} -gt 0 ]]; then
      echo ""
      echo "missing-from-catalog:"
      for k in "${missing_kinds[@]}"; do echo "  - $k"; done
      echo "  add these to $CATALOG and the appropriate family file."
    fi
    if [[ ${#misspelled_kinds[@]} -gt 0 ]]; then
      echo ""
      echo "misspelled-kind:"
      for entry in "${misspelled_kinds[@]}"; do
        k="${entry%%=>*}"
        s="${entry##*=>}"
        echo "  - $k  (did you mean: $s ?)"
      done
    fi
    if [[ ${#unknown_prefixes[@]} -gt 0 ]]; then
      echo ""
      echo "unknown-id-prefix:"
      for p in "${unknown_prefixes[@]}"; do echo "  - $p"; done
      echo "  register these in $IDS_DOC before shipping."
    fi
  fi
fi

if [[ "$errors" -gt 0 ]]; then
  exit 1
fi
exit 0
