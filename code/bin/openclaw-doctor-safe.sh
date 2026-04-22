#!/usr/bin/env bash
# openclaw-doctor-safe.sh — Run doctor --fix with cron protection
# Usage: openclaw-doctor-safe.sh [extra-args...]
set -euo pipefail

echo "🔒 Backing up crons before doctor..."
~/bin/cron-backup.sh

echo ""
echo "🩺 Running openclaw doctor $*..."
openclaw doctor "$@"

echo ""
echo "🔄 Restoring crons..."
~/bin/cron-restore.sh

echo ""
echo "✅ Doctor complete — crons preserved"
