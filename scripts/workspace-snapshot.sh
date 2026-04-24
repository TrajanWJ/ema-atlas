#!/usr/bin/env sh
set -eu

repo_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

cd "$repo_root"

printf '== git status ==\n'
git status --short --branch

printf '\n== recent commits ==\n'
git log --oneline --decorate --max-count=8

printf '\n== worktrees ==\n'
git worktree list

printf '\n== tracked generated/local-state files ==\n'
git ls-files | grep -E '(^|/)(node_modules|build|target|\.ema-dev/logs|\.ema-dev/pids)(/|$)|\.sqlite(-.*)?$|\.DS_Store$' || true

printf '\n== largest tracked files ==\n'
git ls-files -z | xargs -0 du -k 2>/dev/null | sort -nr | head -20
