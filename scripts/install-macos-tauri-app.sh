#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24"
SOURCE_APP="$ROOT/apps/desktop/src-tauri/target/release/bundle/macos/EMA.app"
TARGET_APP="${EMA_TAURI_DESKTOP_APP_PATH:-$HOME/Desktop/EMA 0.0.5.app}"

if [[ ! -d "$SOURCE_APP" ]]; then
  echo "Built Tauri app not found: $SOURCE_APP"
  echo "Build it with: pnpm --filter @ema/desktop tauri build"
  exit 1
fi

SOURCE_REAL="$(cd "$(dirname "$SOURCE_APP")" && pwd -P)/$(basename "$SOURCE_APP")"
TARGET_PARENT="$(dirname "$TARGET_APP")"
mkdir -p "$TARGET_PARENT"
TARGET_REAL="$(cd "$TARGET_PARENT" && pwd -P)/$(basename "$TARGET_APP")"

if [[ "$SOURCE_REAL" == "$TARGET_REAL" ]]; then
  echo "Source and target are the same app: $TARGET_APP"
  exit 0
fi

if [[ -d "$TARGET_APP" ]]; then
  BACKUP_APP="${TARGET_APP%.app}.backup-$(date +%Y%m%d%H%M%S).app"
  mv "$TARGET_APP" "$BACKUP_APP"
  echo "Moved existing target app to $BACKUP_APP"
fi

ditto "$SOURCE_APP" "$TARGET_APP"

echo "Installed real Tauri desktop app: $TARGET_APP"
echo "Source: $SOURCE_APP"
echo "No EMA user data under ~/Library/Application Support was deleted."
