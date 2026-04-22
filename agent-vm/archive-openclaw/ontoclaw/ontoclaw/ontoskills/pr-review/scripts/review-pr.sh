#!/usr/bin/env bash
# review-pr.sh — Review a GitHub PR via gh CLI
#
# Usage:
#   review-pr.sh <PR#> [owner/repo] [--post approve|comment|request-changes]
#   review-pr.sh <PR-URL> [--post approve|comment|request-changes]
#
# Outputs: path to the generated markdown report

set -euo pipefail

# ── Parse args ───────────────────────────────────────────────────────────────

PR_INPUT=""
REPO=""
POST_ACTION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --post)
      POST_ACTION="${2:?--post requires: approve|comment|request-changes}"
      shift 2
      ;;
    https://github.com/*)
      # Parse URL: https://github.com/owner/repo/pull/123
      PR_INPUT=$(echo "$1" | grep -oP '/pull/\K\d+')
      REPO=$(echo "$1" | grep -oP 'github\.com/\K[^/]+/[^/]+')
      shift
      ;;
    [0-9]*)
      PR_INPUT="$1"
      shift
      ;;
    */*)
      REPO="$1"
      shift
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$PR_INPUT" ]]; then
  echo "Usage: review-pr.sh <PR#> [owner/repo] [--post approve|comment|request-changes]" >&2
  echo "       review-pr.sh <PR-URL> [--post ...]" >&2
  exit 1
fi

# Auto-detect repo
if [[ -z "$REPO" ]]; then
  REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)
  if [[ -z "$REPO" ]]; then
    echo "Error: Could not detect repo. Pass owner/repo or run from a git checkout." >&2
    exit 1
  fi
fi

PR_NUM="$PR_INPUT"
REPORT_DIR="/tmp/pr-reviews"
mkdir -p "$REPORT_DIR"

log() { echo "[review] $*" >&2; }

# ── Fetch PR data ────────────────────────────────────────────────────────────

log "Fetching PR #${PR_NUM} from ${REPO}..."

PR_JSON=$(gh pr view "$PR_NUM" --repo "$REPO" \
  --json title,author,headRefName,headRefOid,baseRefName,additions,deletions,body,createdAt,labels,changedFiles)

TITLE=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['title'])")
AUTHOR=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['author']['login'])")
BRANCH=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['headRefName'])")
HEAD_SHA=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['headRefOid'])")
BASE=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['baseRefName'])")
ADDITIONS=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['additions'])")
DELETIONS=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['deletions'])")
CHANGED_FILES=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['changedFiles'])")
BODY=$(echo "$PR_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('body','') or '')")
LABELS=$(echo "$PR_JSON" | python3 -c "import json,sys; print(', '.join(l['name'] for l in json.load(sys.stdin).get('labels',[])) or 'none')")

log "  Title: ${TITLE}"
log "  Author: ${AUTHOR}, Branch: ${BRANCH} → ${BASE}"
log "  Changes: +${ADDITIONS}/-${DELETIONS} across ${CHANGED_FILES} files"

# Get file list
FILES=$(gh pr view "$PR_NUM" --repo "$REPO" --json files --jq '.files[].path' 2>/dev/null || echo "")

# Get commits
COMMITS=$(gh pr view "$PR_NUM" --repo "$REPO" --json commits \
  --jq '.commits[] | "\(.oid[:8]) \(.messageHeadline)"' 2>/dev/null || echo "")

# Get diff
log "Fetching diff..."
DIFF=$(gh pr diff "$PR_NUM" --repo "$REPO" 2>/dev/null || echo "")

if [[ -z "$DIFF" ]]; then
  log "Warning: Empty diff. PR may be merged or have no changes."
fi

# ── Categorize files ─────────────────────────────────────────────────────────

log "Categorizing files..."

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

    # Test files
    if any(p in name for p in ["_test.", ".test.", ".spec.", "test_"]) or "/test/" in f or "/__tests__/" in f:
        cats["test"].append(f)
    # Dependency files
    elif name in ("package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
                  "go.mod", "go.sum", "requirements.txt", "poetry.lock", "pyproject.toml",
                  "Gemfile", "Gemfile.lock", "Cargo.toml", "Cargo.lock", "composer.json",
                  "composer.lock"):
        cats["deps"].append(f)
    # Config
    elif ext in ("yml", "yaml", "toml", "ini", "env", "cfg") or name in (
            ".env", ".env.example", "docker-compose.yml", "Dockerfile",
            ".dockerignore", ".gitignore", ".editorconfig", "Makefile",
            "tsconfig.json", "eslint.config.js", ".eslintrc.json", "jest.config.js",
            "webpack.config.js", "vite.config.ts", "rollup.config.js"):
        cats["config"].append(f)
    elif f.startswith(".github/") or name in ("Jenkinsfile", ".travis.yml", ".circleci"):
        cats["ci"].append(f)
    # Docs
    elif ext in ("md", "txt", "rst", "adoc") or name in ("LICENSE", "CHANGELOG", "AUTHORS"):
        cats["docs"].append(f)
    # Schema / migrations
    elif ext == "sql" or "/migration" in f or "/migrate" in f:
        cats["schema"].append(f)
    # Source code = logic
    else:
        cats["logic"].append(f)

print(json.dumps(dict(cats)))
PYEOF
)

# ── Analyze diff ─────────────────────────────────────────────────────────────

log "Analyzing diff..."

FINDINGS_JSON=$(echo "$DIFF" | python3 << 'PYEOF'
import sys, json, re

diff_text = sys.stdin.read()
findings = []

def add(f, line, cat, sev, msg, ctx):
    findings.append({
        "file": f or "unknown",
        "line": line,
        "category": cat,
        "severity": sev,
        "message": msg,
        "context": ctx[:120]
    })

# Patterns: (regex, category, severity, message)
# Severity: critical, warning, info

secret_patterns = [
    (r'(?i)(password|passwd|secret|api[_-]?key|token|auth[_-]?token|private[_-]?key)\s*[:=]\s*["\x27][^"\x27\s]{8,}["\x27]',
     "security", "critical", "Possible hardcoded secret/credential"),
    (r'(?i)AKIA[0-9A-Z]{16}', "security", "critical", "AWS Access Key ID detected"),
    (r'-----BEGIN\s+(RSA\s+|EC\s+|DSA\s+)?PRIVATE\s+KEY', "security", "critical", "Private key in source"),
    (r'(?i)(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}', "security", "critical", "GitHub token detected"),
    (r'sk-[A-Za-z0-9]{20,}', "security", "critical", "Possible API secret key (sk-...)"),
    (r'(?i)bearer\s+[a-zA-Z0-9\-_.~+/]{20,}', "security", "critical", "Hardcoded bearer token"),
]

injection_patterns = [
    (r'(?i)(exec|system|popen|subprocess\.call|subprocess\.run|child_process)\s*\(.*\+',
     "security", "critical", "Possible command injection — string concat in exec/system call"),
    (r'(?i)eval\s*\(', "security", "critical", "eval() usage — potential code injection"),
    (r'(?i)(execute|raw|query)\s*\(.*["\x27]\s*\+\s*',
     "security", "critical", "Possible SQL injection — string concat in query"),
    (r'(?i)innerHTML\s*=', "security", "warning", "innerHTML assignment — possible XSS"),
    (r'dangerouslySetInnerHTML', "security", "warning", "dangerouslySetInnerHTML — ensure sanitized"),
]

error_patterns = [
    # Go
    (r',\s*_\s*:?=\s*\S+\(', "error-handling", "warning", "Discarded error return (Go)"),
    (r'\.Close\(\)\s*$', "error-handling", "warning", "Unchecked Close() — use defer with error check"),
    (r'\bpanic\s*\(', "error-handling", "warning", "panic() — prefer returning error"),
    # Python
    (r'except\s*:', "error-handling", "warning", "Bare except — catches SystemExit/KeyboardInterrupt"),
    (r'except\s+Exception\s*:', "error-handling", "info", "Broad except Exception — consider specific types"),
    (r'pass\s*$', "error-handling", "info", "Empty except/pass block — error silently swallowed?"),
    # JS/TS
    (r'catch\s*\(\s*\w*\s*\)\s*\{\s*\}', "error-handling", "warning", "Empty catch block — error swallowed"),
    (r'\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)', "error-handling", "warning", "Empty .catch() — promise error swallowed"),
    # General
    (r'(?i)#\s*nosec', "error-handling", "info", "Security check suppressed with #nosec"),
    (r'@SuppressWarnings', "error-handling", "info", "Warning suppressed — documented why?"),
]

breaking_patterns = [
    (r'(?i)(DROP\s+TABLE|DROP\s+COLUMN|ALTER\s+TABLE.*DROP)', "breaking", "critical", "Destructive schema change"),
    (r'(?i)(DROP\s+INDEX|RENAME\s+TABLE|RENAME\s+COLUMN)', "breaking", "warning", "Schema migration — check backward compat"),
    (r'^-\s*export\s+(function|class|const|let|var|default|type|interface)\s',
     "breaking", "warning", "Removed export — possible breaking change"),
    (r'^-\s*def\s+\w+\(', "breaking", "info", "Removed function — check if public API"),
    (r'^-\s*func\s+\w+\(', "breaking", "info", "Removed function — check if public API"),
]

dep_patterns = [
    (r'^\+\s*"[^"]+"\s*:\s*"[\^~]?\d+\.\d+', "deps", "info", "New/changed dependency version"),
    (r'^\+\s*require\s+\(', "deps", "info", "New Go dependency"),
    (r'^\+.*install\s+--no-verify', "deps", "warning", "Install with --no-verify — skipping integrity check"),
]

todo_patterns = [
    (r'(?i)\bTODO\b', "todo", "info", "TODO marker"),
    (r'(?i)\bFIXME\b', "todo", "warning", "FIXME — should fix before merge"),
    (r'(?i)\bHACK\b', "todo", "warning", "HACK marker — needs cleanup"),
    (r'(?i)\bXXX\b', "todo", "warning", "XXX — needs attention"),
]

all_patterns = (secret_patterns + injection_patterns + error_patterns +
                breaking_patterns + dep_patterns + todo_patterns)

lines = diff_text.split("\n")
current_file = None
line_num = 0
in_added = False

for line in lines:
    # Track file
    m = re.match(r'^\+\+\+ b/(.*)', line)
    if m:
        current_file = m.group(1)
        continue

    # Track line numbers
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

# Deduplicate: same file+line+category = keep highest severity
seen = {}
for f in findings:
    key = (f["file"], f["line"], f["category"])
    if key not in seen or {"critical": 3, "warning": 2, "info": 1}.get(f["severity"], 0) > \
       {"critical": 3, "warning": 2, "info": 1}.get(seen[key]["severity"], 0):
        seen[key] = f

print(json.dumps(list(seen.values())))
PYEOF
)

# ── Test coverage check ─────────────────────────────────────────────────────

log "Checking test coverage..."

TEST_COVERAGE=$(echo "$FILES" | python3 << 'PYEOF'
import sys

files = [f.strip() for f in sys.stdin if f.strip()]
test_indicators = ("_test.", ".test.", ".spec.", "test_", "__test__")
test_dirs = ("/test/", "/__tests__/", "/tests/", "/spec/")
skip_names = ("__init__", "main.", "index.", "config.", "types.", "models.",
              "schema.", "setup.", "conftest.", "fixtures.", "mock", "stub")

tests = [f for f in files if any(t in f.lower() for t in test_indicators) or
         any(d in f for d in test_dirs)]
source = [f for f in files if f.endswith((".go", ".py", ".ts", ".tsx", ".js", ".jsx", ".rs", ".rb"))
          and f not in tests and not any(s in f.lower().split("/")[-1] for s in skip_names)]

missing = []
for s in source:
    s_name = s.split("/")[-1].rsplit(".", 1)[0]
    s_dir = "/".join(s.split("/")[:-1])
    found = False
    for t in tests:
        t_name = t.split("/")[-1]
        if s_name in t_name:
            found = True
            break
    if not found:
        missing.append(s)

if not source:
    print("No source files changed (config/docs/deps only).")
elif not missing:
    print(f"✅ All {len(source)} source files have corresponding test changes.")
elif tests:
    print(f"⚠️  {len(missing)}/{len(source)} source files lack test changes:")
    for f in missing:
        print(f"  - {f}")
    print(f"\n({len(tests)} test file(s) changed)")
else:
    print(f"⚠️  {len(source)} source files changed but NO test files modified:")
    for f in missing[:10]:
        print(f"  - {f}")
    if len(missing) > 10:
        print(f"  ... and {len(missing)-10} more")
PYEOF
)

# ── Generate report ──────────────────────────────────────────────────────────

log "Generating report..."

REPORT_FILE="${REPORT_DIR}/pr-${PR_NUM}-${REPO//\//-}.md"

FINDINGS_SUMMARY=$(echo "$FINDINGS_JSON" | python3 << 'PYEOF'
import json, sys
from collections import Counter

findings = json.load(sys.stdin)
by_cat = Counter(f["category"] for f in findings)
by_sev = Counter(f["severity"] for f in findings)

icons = {
    "security": "🔴", "error-handling": "🟡", "breaking": "🟠",
    "deps": "📦", "todo": "📝",
}
sev_icons = {"critical": "🔴", "warning": "🟡", "info": "🔵"}

if not findings:
    print("✅ No automated issues found.")
else:
    print(f"**{len(findings)} findings** — ", end="")
    parts = []
    for sev in ("critical", "warning", "info"):
        if by_sev[sev]:
            parts.append(f"{sev_icons[sev]} {by_sev[sev]} {sev}")
    print(", ".join(parts))
    print()
    for cat, count in sorted(by_cat.items()):
        icon = icons.get(cat, "⚪")
        print(f"  {icon} {cat}: {count}")
PYEOF
)

FINDINGS_TABLE=$(echo "$FINDINGS_JSON" | python3 << 'PYEOF'
import json, sys

findings = json.load(sys.stdin)
if not findings:
    sys.exit(0)

# Sort: critical first, then warning, then info
sev_order = {"critical": 0, "warning": 1, "info": 2}
findings.sort(key=lambda f: (sev_order.get(f["severity"], 9), f["file"], f["line"]))

sev_icons = {"critical": "🔴", "warning": "🟡", "info": "🔵"}

print("| Sev | File | Line | Category | Finding | Context |")
print("|-----|------|------|----------|---------|---------|")
for f in findings[:60]:
    icon = sev_icons.get(f["severity"], "⚪")
    fname = f["file"].split("/")[-1] if f["file"] != "unknown" else "?"
    ctx = f["context"].replace("|", "\\|").replace("`", "'")[:80]
    print(f"| {icon} | `{fname}` | {f['line']} | {f['category']} | {f['message']} | `{ctx}` |")

if len(findings) > 60:
    print(f"\n_... and {len(findings)-60} more findings (truncated)_")
PYEOF
)

FILE_CATEGORY_REPORT=$(echo "$FILE_CATEGORIES" | python3 << 'PYEOF'
import json, sys

cats = json.load(sys.stdin)
icons = {"logic": "⚡", "test": "🧪", "config": "⚙️", "ci": "🔄", "docs": "📝",
         "deps": "📦", "schema": "💾"}

for cat in ("logic", "test", "config", "ci", "docs", "deps", "schema"):
    files = cats.get(cat, [])
    if not files:
        continue
    icon = icons.get(cat, "📄")
    print(f"**{icon} {cat.title()}** ({len(files)})")
    for f in files:
        print(f"- `{f}`")
    print()
PYEOF
)

VERDICT=$(echo "$FINDINGS_JSON" | python3 << 'PYEOF'
import json, sys

findings = json.load(sys.stdin)
sev = [f["severity"] for f in findings]
cats = [f["category"] for f in findings]

if "critical" in sev and "security" in cats:
    print("🔴 **SECURITY ISSUES** — Critical security findings must be addressed before merge.")
elif "critical" in sev:
    print("🟠 **CRITICAL ISSUES** — Critical findings require attention before merge.")
elif sev.count("warning") >= 3:
    print("🟡 **NEEDS ATTENTION** — Multiple warnings to review before merge.")
elif "warning" in sev:
    print("🔵 **MINOR CONCERNS** — A few warnings, mostly looks good.")
elif findings:
    print("🔵 **MINOR NOTES** — Only informational findings. Looks good overall.")
else:
    print("✅ **LOOKS CLEAN** — No automated issues found. Ready for human review.")
PYEOF
)

cat > "$REPORT_FILE" << REPORT
# PR Review: #${PR_NUM} — ${TITLE}

| Field | Value |
|-------|-------|
| **Repo** | \`${REPO}\` |
| **Author** | ${AUTHOR} |
| **Branch** | \`${BRANCH}\` → \`${BASE}\` |
| **HEAD** | \`${HEAD_SHA:0:10}\` |
| **Size** | +${ADDITIONS}/-${DELETIONS} across ${CHANGED_FILES} files |
| **Labels** | ${LABELS} |
| **Reviewed** | $(date -u '+%Y-%m-%d %H:%M UTC') |

## Description

${BODY:-_No description provided._}

## Commits

\`\`\`
${COMMITS}
\`\`\`

## Changed Files

${FILE_CATEGORY_REPORT}

## Findings

${FINDINGS_SUMMARY}

${FINDINGS_TABLE}

## Test Coverage

${TEST_COVERAGE}

## Verdict

${VERDICT}

---
_Generated by pr-review • $(date -u '+%Y-%m-%d %H:%M UTC')_
REPORT

log "Report saved: ${REPORT_FILE}"

# ── Post to GitHub if requested ──────────────────────────────────────────────

if [[ -n "$POST_ACTION" ]]; then
  log "Posting review as '${POST_ACTION}' to PR #${PR_NUM}..."
  case "$POST_ACTION" in
    approve)
      gh pr review "$PR_NUM" --repo "$REPO" --approve --body-file "$REPORT_FILE"
      ;;
    comment)
      gh pr review "$PR_NUM" --repo "$REPO" --comment --body-file "$REPORT_FILE"
      ;;
    request-changes)
      gh pr review "$PR_NUM" --repo "$REPO" --request-changes --body-file "$REPORT_FILE"
      ;;
    *)
      log "Unknown post action: ${POST_ACTION}. Use approve|comment|request-changes"
      exit 1
      ;;
  esac
  log "Review posted."
fi

# Output the report path
echo "$REPORT_FILE"
