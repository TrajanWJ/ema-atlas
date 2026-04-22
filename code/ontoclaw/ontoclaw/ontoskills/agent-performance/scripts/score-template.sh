#!/usr/bin/env bash
# score-template.sh - Output agent scoring template
set -euo pipefail

AGENT="${2:-<agent-name>}"
[[ "$1" == "--agent" ]] 2>/dev/null && AGENT="$2"

cat <<EOF
# Agent Evaluation: ${AGENT}
Date: $(date -u +"%Y-%m-%d")

## Scoring (1-5 scale)

| Category | Score | Notes |
|----------|-------|-------|
| Accuracy | /5 | Correctness of outputs |
| Autonomy | /5 | Works independently without excessive prompting |
| Tool Usage | /5 | Selects appropriate tools, uses them effectively |
| Communication | /5 | Clear, concise, actionable responses |
| Learning | /5 | Adapts based on corrections, avoids repeat mistakes |

**Total: /25**

## Qualitative Notes
-
-
-

## Recommended Actions
-
EOF
