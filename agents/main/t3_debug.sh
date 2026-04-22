#!/usr/bin/env bash
set -u
ssh -o BatchMode=yes host-machine 'cat > /tmp/t3_debug.sh <<"EOF"
#!/usr/bin/env bash
set -u
LOG=/tmp/t3-debug-run.log
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "== start $(date -Is) =="
echo "host=$(hostname) user=$(whoami) pwd=$(pwd)"
echo "sessions:"; loginctl list-sessions --no-legend || true

echo "== desktop file =="
sed -n "1,120p" "$HOME/.local/share/applications/t3-code.desktop" || true

echo "== kill stale =="
pkill -9 -f "/home/trajan/Applications/T3-Code-fork|/tmp/.mount_T3|t3code|dist-electron/main.js|vite preview|vite --host|@t3tools/desktop" || true
sleep 2
pgrep -af "T3-Code-fork|t3code|electron|dist-electron|vite" || true

export XDG_RUNTIME_DIR=/run/user/1000
export WAYLAND_DISPLAY=wayland-0
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
export XDG_SESSION_TYPE=wayland
export DISPLAY=:1
export XAUTHORITY=/run/user/1000/xauth_mWlluJ

echo "== env =="
env | grep -E "DISPLAY|WAYLAND|XDG_RUNTIME_DIR|DBUS_SESSION|XAUTHORITY|XDG_SESSION_TYPE" | sort

echo "== launch wayland =="
nohup "$HOME/Applications/T3-Code-fork-0.0.17-x86_64.AppImage" --no-sandbox --ozone-platform=wayland >/tmp/t3-wayland.log 2>&1 &
WPID=$!
echo "wayland pid=$WPID"
sleep 12

echo "== processes =="
pgrep -af "T3-Code-fork|t3code" || true

echo "== windows =="
kdotool search --title ".*" 2>/dev/null | while read id; do name=$(kdotool getwindowname "$id" 2>/dev/null | head -1); cls=$(kdotool getwindowclassname "$id" 2>/dev/null | head -1); echo "$id | $cls | $name"; done | sed -n "1,120p"

echo "== direct searches =="
(kdotool search --class "t3|electron|code" 2>/dev/null || true)
(kdotool search --title "T3|Code" 2>/dev/null || true)

echo "== wayland log =="
sed -n "1,220p" /tmp/t3-wayland.log || true

if ! kdotool search --class "t3|electron|code" >/tmp/t3.ids 2>/dev/null && ! kdotool search --title "T3|Code" >/tmp/t3.ids 2>/dev/null; then
  echo "== fallback x11 =="
  pkill -9 -f "/home/trajan/Applications/T3-Code-fork|/tmp/.mount_T3|t3code" || true
  sleep 2
  nohup "$HOME/Applications/T3-Code-fork-0.0.17-x86_64.AppImage" --no-sandbox --ozone-platform=x11 >/tmp/t3-x11.log 2>&1 &
  XPID=$!
  echo "x11 pid=$XPID"
  sleep 12
  echo "== x11 processes =="
  pgrep -af "T3-Code-fork|t3code" || true
  echo "== x11 windows =="
  kdotool search --title ".*" 2>/dev/null | while read id; do name=$(kdotool getwindowname "$id" 2>/dev/null | head -1); cls=$(kdotool getwindowclassname "$id" 2>/dev/null | head -1); echo "$id | $cls | $name"; done | sed -n "1,120p"
  echo "== x11 direct searches =="
  (kdotool search --class "t3|electron|code" 2>/dev/null || true)
  (kdotool search --title "T3|Code" 2>/dev/null || true)
  echo "== x11 log =="
  sed -n "1,220p" /tmp/t3-x11.log || true
fi

rm -f /tmp/t3-candidate-*.png || true
idx=0
for id in $(kdotool search --title ".*" 2>/dev/null | head -40); do
  name=$(kdotool getwindowname "$id" 2>/dev/null | head -1)
  cls=$(kdotool getwindowclassname "$id" 2>/dev/null | head -1)
  case "$cls" in
    plasmashell|org.kde.konsole|org.kde.dolphin|zen|virt-viewer|org.kde.ksecretd|org.kde.plasma-systemmonitor) continue ;;
  esac
  idx=$((idx+1))
  echo "candidate $idx $id | $cls | $name"
  kdotool windowactivate "$id" >/dev/null 2>&1 || true
  sleep 1
  spectacle -b -n -a -o "/tmp/t3-candidate-$idx.png" >/dev/null 2>&1 || true
  ls -lh "/tmp/t3-candidate-$idx.png" 2>/dev/null || true
done

echo "== end $(date -Is) =="
EOF
chmod +x /tmp/t3_debug.sh
/tmp/t3_debug.sh'