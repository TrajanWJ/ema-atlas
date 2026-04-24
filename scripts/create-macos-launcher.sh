#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24"
APP_PATH="${EMA_WEB_DEV_LAUNCHER_PATH:-$HOME/Desktop/EMA 0.0.5 Web Dev Launcher.app}"
SCRIPT_PATH="$ROOT/scripts/start-ema-dev.sh"
ASSET_SVG="$ROOT/assets/ema-logo.svg"
BUILD_DIR="$ROOT/.ema-dev/launcher-build"
ICONSET="$BUILD_DIR/ema.iconset"
ICON_PNG="$BUILD_DIR/ema-logo.png"
ICON_ICNS="$BUILD_DIR/ema.icns"
APPLESCRIPT="$BUILD_DIR/EMA 0.0.5 Web Dev Launcher.applescript"

mkdir -p "$BUILD_DIR" "$ICONSET"
chmod +x "$SCRIPT_PATH"

if [[ -d "$APP_PATH" ]]; then
  BACKUP_PATH="${APP_PATH%.app}.backup-$(date +%Y%m%d%H%M%S).app"
  mv "$APP_PATH" "$BACKUP_PATH"
  echo "Moved existing launcher to $BACKUP_PATH"
fi

if command -v qlmanage >/dev/null 2>&1; then
  qlmanage -t -s 1024 -o "$BUILD_DIR" "$ASSET_SVG" >/dev/null 2>&1 || true
  if [[ -f "$BUILD_DIR/ema-logo.svg.png" ]]; then
    mv "$BUILD_DIR/ema-logo.svg.png" "$ICON_PNG"
  fi
fi

if [[ ! -f "$ICON_PNG" ]]; then
  echo "Could not render $ASSET_SVG into PNG for the app icon."
  echo "Continuing with the default macOS app icon."
else
  for size in 16 32 128 256 512; do
    sips -z "$size" "$size" "$ICON_PNG" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
    sips -z "$((size * 2))" "$((size * 2))" "$ICON_PNG" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o "$ICON_ICNS"
fi

cat > "$APPLESCRIPT" <<APPLESCRIPT
tell application "Terminal"
  activate
  do script quoted form of "$SCRIPT_PATH"
end tell
APPLESCRIPT

osacompile -o "$APP_PATH" "$APPLESCRIPT"

if [[ -f "$ICON_ICNS" ]]; then
  cp "$ICON_ICNS" "$APP_PATH/Contents/Resources/applet.icns"
fi

echo "Created EMA web/dev launcher: $APP_PATH"
echo "This helper starts the daemon/web dev servers and opens http://localhost:5173."
echo "Use scripts/install-macos-tauri-app.sh for the real Tauri desktop app."
