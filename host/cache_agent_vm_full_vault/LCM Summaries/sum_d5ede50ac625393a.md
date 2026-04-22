# LCM Summary sum_d5ede50ac625393a

Created: 2026-03-25 18:52:36
Kind: leaf
Depth: 0
Conversation: 1472
Tokens: 1215
Descendants: 0
Earliest: 2026-03-25T18:50:37.000Z
Latest: 2026-03-25T18:50:37.000Z

## Content

[2026-03-25 18:50 UTC]
#!/usr/bin/env bash
# vault-research-loop.sh — Scan vault for gaps/thin files, produce proposal tasks
#
# Usage: vault-research-loop.sh [--focus area] [--dry-run]
# Runs as: cron every 4h, or triggered by dispatch engine
#
# The loop:
# 1. SCAN — Find thin files, missing content, stale notes
# 2. PRIORITIZE — Pick top candidates for improvement
# 3. PROPOSE — Write concrete proposal tasks to ~/dispatch/queue/

set -euo pipefail

VAULT="$HOME/vault"
QUEUE="$HOME/dispatch/queue"
RESULTS="$HOME/dispatch/results"
LOOP_STATE="$HOME/dispatch/research-loop-state.json"
LOOP_LOG="$HOME/.openclaw/logs/research-loop.log"
DRY_RUN=false
FOCUS=""
MAX_PROPOSALS=3

mkdir -p "$(dirname "$LOOP_LOG")" "$QUEUE" "$RESULTS"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --focus) FOCUS="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --max) MAX_PROPOSALS="$2"; shift 2 ;;
        *) shift ;;
    esac
done

log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOOP_LOG"
}

# Initialize state if needed
if [[ ! -f "$LOOP_STATE" ]]; then
    cat > "$LOOP_STATE" << 'EOF'
{
    "cycle_count": 0,
    "last_run": null,
    "proposals_created": 0,
    "last_proposals": []
}
EOF
fi

log "=== Vault Research Loop Start ==="

##############################################################################
# STEP 1: SCAN — Find thin files, gaps, quality issues
##############################################################################

declare -a CANDIDATES=()
declare -a CANDIDATE_REASONS=()

# 1a. Thin files: <500 bytes, not stubs/archives/templates/sessions
log "Scanning for thin files (<500 bytes)..."
while IFS= read -r line; do
    size=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | cut -d' ' -f2-)
    # Skip known stub patterns
    if grep -q "Installed skill\|No dispatches yet\|Section guide" "$file" 2>/dev/null; then
        continue
    fi
    CANDIDATES+=("$file")
    CANDIDATE_REASONS+=("thin-file (${size}B)")
done < <(find "$VAULT" -name "*.md" -size -500c \
    ! -path "*/.archive/*" ! -path "*/_deprecated/*" ! -path "*/Templates/*" \
    ! -path "*/Sessions/*" ! -path "*/message-harvests/*" ! -path "*/Claude-Code-Bot/*" \
    ! -name "_index.md" ! -name "*.stub.md" \
    -exec sh -c 'echo "$(wc -c < "$1") $1"' _ {} \; 2>/dev/null | sort -n)

# 1b. Files with TODO/TBD/placeholder markers
log "Scanning for TODO/TBD markers..."
while IFS= read -r file; do
    # Don't double-count
    already=false
    for c in "${CANDIDATES[@]:-}"; do
        [[ "$c" == "$file" ]] && already=true && break
    done
    $already && continue
    CANDIDATES+=("$file")
    CANDIDATE_REASONS+=("has-TODO/TBD markers")
done < <(grep -rl "TODO\|TBD\|FIXME\|placeholder" "$VAULT" --include="*.md" \
    -l 2>/dev/null | grep -v "/.archive/\|/_deprecated/\|/Templates/" | head -20)

# 1c. Files missing frontmatter
log "Scanning for missing frontmatter..."
count=0
while IFS= read -r file; do
    [[ $count -ge 10 ]] && break
    first=$(head -1 "$file" 2>/dev/null)
    if [[ "$first" != "---" ]]; then
        already=false
        for c in "${CANDIDATES[@]:-}"; do
            [[ "$c" == "$file" ]] && already=true && break
        done
        $already && continue
        CANDIDATES+=("$file")
        CANDIDATE_REASONS+=("missing-frontmatter")
        ((count++))
    fi
done < <(find "$VAULT" -name "*.md" \
    ! -path "*/.archive/*" ! -path "*/_deprecated/*" ! -path "*/Templates/*" \
    ! -name "_index.md" -type f 2>/dev/null | shuf | head -50)

# 1d. Focus-specific scan
if [[ -n "$FOCUS" ]]; then
    log "Focus scan: $FOCUS"
    case "$FOCUS" in
        content_gaps)
            # Find directories with <3 files
            while IFS= read -r dir; do
                count=$(find "$dir" -maxdepth 1 -name "*.md" | wc -l)
                if [[ $count -lt 3 && $count -gt 0 ]]; then
                    sample=$(find "$dir" -maxdepth 1 -name "*.md" | head -1)
                    CANDIDATES+=("$sample")
                    CANDIDATE_REASONS+=("sparse-directory (${count} files in $(basename "$dir"))")
                fi
            done < <(find "$VAULT" -type d ! -path "*/.archive/*" ! -path "*/_deprecated/*" 2>/dev/null)
            ;;
        knowledge_quality)
            # Low confidence files
            while IFS= read -r file; do
                CANDIDATES+=("$file")
                CANDIDATE_REASONS+=("low-confidence")
            done < <(grep -rl "confidence: 0\.[0-3]" "$VAULT" --include="*.md" 2>/dev/null | head -10)
            ;;
    esac
fi

log "Found ${#CANDIDATES[@]} candidates total"

if [[ ${#CANDIDATES[@]} -eq 0 ]]; then
    log "No candidates found. Vault looks healthy."
    echo "STATUS=no_candidates"
    exit 0
fi

#######################################################################
[LCM fallback summary; truncated for context management]
