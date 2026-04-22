#!/usr/bin/env bash
# review-local.sh — Review local git changes before commit
#
# Usage:
#   review-local.sh              # Review unstaged changes
#   review-local.sh --staged     # Review staged changes
#   review-local.sh --branch main  # Review changes vs a branch
#
# Same analysis as review-pr.sh but for local diffs.

set -euo pipefail

MODE="unstaged"
TARGET_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged) MODE="staged"; shift ;;
    --branch) MODE="branch"; TARGET_BRANCH="${2:?--branch requires a branch name}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# Verify we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "Error: Not in a git repository." >&2
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
REPO_NAME=$(basename "$REPO_ROOT")
REPORT_DIR="/tmp/pr-reviews"
mkdir -p "$REPORT_DIR"

log() { echo "[review-local] $*" >&2; }

# ── Get diff ─────────────────────────────────────────────────────────────────

case "$MODE" in
  unstaged)
    DIFF=$(git diff)
    FILES=$(git diff --name-only)
    DESCRIPTION="Unstaged changes"
    ;;
  staged)
    DIFF=$(git diff --cached)
    FILES=$(git diff --cached --name-only)
    DESCRIPTION="Staged changes"
    ;;
  branch)
    MERGE_BASE=$(git merge-base HEAD "$TARGET_BRANCH" 2>/dev/null || echo "$TARGET_BRANCH")
    DIFF=$(git diff "$MERGE_BASE"...HEAD)
    FILES=$(git diff "$MERGE_BASE"...HEAD --name-only)
    DESCRIPTION="Changes vs ${TARGET_BRANCH}"
    ;;
esac

if [[ -z "$DIFF" ]]; then
  log "No changes found (${DESCRIPTION})."
  echo "No changes to review."
  exit 0
fi

FILE_COUNT=$(echo "$FILES" | grep -c . || echo 0)
ADD_COUNT=$(echo "$DIFF" | grep -c '^+[^+]' || echo 0)
DEL_COUNT=$(echo "$DIFF" | grep -c '^-[^-]' || echo 0)

log "${DESCRIPTION}: ${FILE_COUNT} files, +${ADD_COUNT}/-${DEL_COUNT}"

# ── Categorize files ─────────────────────────────────────────────────────────

FILE_CATEGORIES=$(echo "$FILES" | python3 << 'PYEOF'
import sys, json
from collections import defaultdict

cats = defaultdict(list)
for line in sys.stdin:
    f = line.strip()
    if not f:
        continue
    name = f.split("/")[-1].lower()
    ext = name.rsplit(".", 1)[-1] if "." in name else ""

    if any(p in name for p in ["_test.", ".test.", ".spec.", "test_"]) or "/test/" in f:
        cats["test"].append(f)
    elif name in ("package.json", "package-lock.json", "yarn.lock", "go.mod", "go.sum",
                  "requirements.txt", "poetry.lock", "pyproject.toml", "Cargo.toml", "Cargo.lock"):
        cats["deps"].append(f)
    elif ext in ("yml", "yaml", "toml", "ini", "env", "cfg") or name in (
            ".env", "Dockerfile", "docker-compose.yml", "Makefile", "tsconfig.json"):
        cats["config"].append(f)
    elif ext in ("md", "txt", "rst") or name in ("LICENSE", "CHANGELOG"):
        cats["docs"].append(f)
    elif ext == "sql" or "/migration" in f:
        cats["schema"].append(f)
    else:
        cats["logic"].append(f)

print(json.dumps(dict(cats)))
PYEOF
)

# ── Analyze diff (same engine as review-pr.sh) ──────────────────────────────

FINDINGS_JSON=$(echo "$DIFF" | python3 << 'PYEOF'
import sys, json, re

diff_text = sys.stdin.read()
findings = []

def add(f, line, cat, sev, msg, ctx):
    findings.append({
        "file": f or "unknown", "line": line, "category": cat,
        "severity": sev, "message": msg, "context": ctx[:120]
    })

secret_patterns = [
    (r'(?i)(password|passwd|secret|api[_-]?key|token|auth[_-]?token)\s*[:=]\s*["\x27][^"\x27\s]{8,}["\x27]',
     "security", "critical", "Possible hardcoded secret"),
    (r'(?i)AKIA[0-9A-Z]{16}', "security", "critical", "AWS Access Key ID"),
    (r'-----BEGIN\s+(RSA\s+|EC\s+)?PRIVATE\s+KEY', "security", "critical", "Private key in source"),
    (r'(?i)(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}', "security", "critical", "GitHub token"),
    (r'sk-[A-Za-z0-9]{20,}', "security", "critical", "Possible API secret key"),
]

injection_patterns = [
    (r'(?i)(exec|system|popen|subprocess)\s*\(.*\+', "security", "critical", "Possible command injection"),
    (r'(?i)eval\s*\(', "security", "critical", "eval() — potential code injection"),
    (r'(?i)(execute|raw|query)\s*\(.*["\x27]\s*\+', "security", "critical", "Possible SQL injection"),
    (r'(?i)innerHTML\s*=', "security", "warning", "innerHTML — possible XSS"),
]

error_patterns = [
    (r',\s*_\s*:?=\s*\S+\(', "error-handling", "warning", "Discarded error return (Go)"),
    (r'\.Close\(\)\s*$', "error-handling", "warning", "Unchecked Close()"),
    (r'\bpanic\s*\(', "error-handling", "warning", "panic() — prefer returning error"),
    (r'except\s*:', "error-handling", "warning", "Bare except — catches everything"),
    (r'catch\s*\(\s*\w*\s*\)\s*\{\s*\}', "error-handling", "warning", "Empty catch block"),
    (r'\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)', "error-handling", "warning", "Empty .catch()"),
]

breaking_patterns = [
    (r'(?i)(DROP\s+TABLE|DROP\s+COLUMN|ALTER\s+TABLE.*DROP)', "breaking", "critical", "Destructive schema change"),
    (r'^-\s*export\s+(function|class|const|let|var|default)', "breaking", "warning", "Removed export"),
]

todo_patterns = [
    (r'(?i)\bFIXME\b', "todo", "warning", "FIXME — should fix before commit"),
    (r'(?i)\bHACK\b', "todo", "warning", "HACK marker"),
    (r'(?i)\bTODO\b', "todo", "info", "TODO marker"),
]

all_patterns = secret_patterns + injection_patterns + error_patterns + breaking_patterns + todo_patterns

lines = diff_text.split("\n")
current_file = None
line_num = 0

for line in lines:
    m = re.match(r'^\+\+\+ b/(.*)', line)
    if m:
        current_file = m.group(1)
        continue
    m = re.match(r'^@@ -\d+(?:,\d+)? \+(\d+)', line)
    if m:
        line_num = int(m.group(1)) - 1
        continue
    if line.startswith("+") and not line.startswith("+++"):
        line_num += 1
        content = line[1:]
        for pat, cat, sev, msg in all_patterns:
            try:
                if re.search(pat, line):
                    add(current_file, line_num, cat, sev, msg, content.strip())
            except re.error:
                continue
    elif not line.startswith("-"):
        line_num += 1

seen = {}
for f in findings:
    key = (f["file"], f["line"], f["category"])
    if key not in seen or {"critical": 3, "warning": 2, "info": 1}.get(f["severity"], 0) > \
       {"critical": 3, "warning": 2, "info": 1}.get(seen[key]["severity"], 0):
        seen[key] = f

print(json.dumps(list(seen.values())))
PYEOF
)

# ── Test coverage ────────────────────────────────────────────────────────────

TEST_COVERAGE=$(echo "$FILES" | python3 << 'PYEOF'
import sys

files = [f.strip() for f in sys.stdin if f.strip()]
test_indicators = ("_test.", ".test.", ".spec.", "test_")
skip_names = ("__init__", "main.", "index.", "config.", "types.", "models.", "schema.", "conftest.")

tests = [f for f in files if any(t in f.lower() for t in test_indicators)]
source = [f for f in files if f.endswith((".go", ".py", ".ts", ".tsx", ".js", ".jsx", ".rs", ".rb"))
          and f not in tests and not any(s in f.lower().split("/")[-1] for s in skip_names)]

missing = []
for s in source:
    s_name = s.split("/")[-1].rsplit(".", 1)[0]
    found = any(s_name in t.split("/")[-1] for t in tests)
    if not found:
        missing.append(s)

if not source:
    print("No source files changed.")
elif not missing:
    print(f"✅ All {len(source)} source files have corresponding test changes.")
else:
    print(f"⚠️  {len(missing)}/{len(source)} source files lack test changes:")
    for f in missing[:10]:
        print(f"  - {f}")
PYEOF
)

# ── Generate report ──────────────────────────────────────────────────────────

REPORT_FILE="${REPORT_DIR}/local-${REPO_NAME}-$(date +%Y%m%d-%H%M%S).md"

FINDINGS_SUMMARY=$(echo "$FINDINGS_JSON" | python3 -c "
import json, sys
from collections import Counter
findings = json.load(sys.stdin)
by_sev = Counter(f['severity'] for f in findings)
icons = {'critical': '🔴', 'warning': '🟡', 'info': '🔵'}
if not findings:
    print('✅ No issues found.')
else:
    parts = [f\"{icons[s]} {by_sev[s]} {s}\" for s in ('critical','warning','info') if by_sev[s]]
    print(f'**{len(findings)} findings:** ' + ', '.join(parts))
")

FINDINGS_TABLE=$(echo "$FINDINGS_JSON" | python3 -c "
import json, sys
findings = json.load(sys.stdin)
if not findings: sys.exit(0)
sev_order = {'critical': 0, 'warning': 1, 'info': 2}
findings.sort(key=lambda f: (sev_order.get(f['severity'], 9), f['file']))
icons = {'critical': '🔴', 'warning': '🟡', 'info': '🔵'}
print('| Sev | File | Line | Category | Finding |')
print('|-----|------|------|----------|---------|')
for f in findings[:40]:
    icon = icons.get(f['severity'], '⚪')
    fname = f['file'].split('/')[-1]
    print(f'| {icon} | \`{fname}\` | {f[\"line\"]} | {f[\"category\"]} | {f[\"message\"]} |')
")

VERDICT=$(echo "$FINDINGS_JSON" | python3 -c "
import json, sys
findings = json.load(sys.stdin)
sevs = [f['severity'] for f in findings]
cats = [f['category'] for f in findings]
if 'critical' in sevs and 'security' in cats:
    print('🔴 **SECURITY ISSUES** — Do not commit until security findings are addressed.')
elif 'critical' in sevs:
    print('🟠 **CRITICAL ISSUES** — Address critical findings before committing.')
elif sevs.count('warning') >= 3:
    print('🟡 **NEEDS ATTENTION** — Several warnings to consider.')
elif findings:
    print('🔵 **MINOR NOTES** — Informational findings only.')
else:
    print('✅ **LOOKS CLEAN** — No issues found. Good to commit.')
")

cat > "$REPORT_FILE" << REPORT
# Local Review: ${REPO_NAME}

**Mode:** ${DESCRIPTION}
**Files:** ${FILE_COUNT} changed (+${ADD_COUNT}/-${DEL_COUNT})
**Reviewed:** $(date -u '+%Y-%m-%d %H:%M UTC')

## Findings

${FINDINGS_SUMMARY}

${FINDINGS_TABLE}

## Test Coverage

${TEST_COVERAGE}

## Verdict

${VERDICT}

---
_Generated by review-local • $(date -u '+%Y-%m-%d %H:%M UTC')_
REPORT

log "Report saved: ${REPORT_FILE}"
echo "$REPORT_FILE"
