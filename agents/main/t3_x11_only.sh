#!/usr/bin/env bash
ssh -o BatchMode=yes host-machine 'cat > /tmp/t3_x11_only.sh <<"EOF"
#!/usr/bin/env bash
set -u
LOG=/tmp/t3-x11-only.log
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1
pkill -9 -f "/home/trajan/Applications/T3-Code-fork|/tmp/.mount_T3|t3code" || true
sleep 2
export XDG_RUNTIME_DIR=/run/user/1000
export WAYLAND_DISPLAY=wayland-0
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
export XDG_SESSION_TYPE=wayland
export DISPLAY=:1
export XAUTHORITY=/run/user/1000/xauth_mWlluJ
nohup "$HOME/Applications/T3-Code-fork-0.0.17-x86_64.AppImage" --no-sandbox --ozone-platform=x11 >/tmp/t3-x11-window.log 2>&1 &
sleep 12
echo PROCS
pgrep -af "T3-Code-fork|t3code" || true
echo WINDOWS
kdotool search --title ".*" 2>/dev/null | while read id; do name=$(kdotool getwindowname "$id" 2>/dev/null | head -1); cls=$(kdotool getwindowclassname "$id" 2>/dev/null | head -1); echo "$id | $cls | $name"; done | sed -n "1,120p"
echo SEARCH
(kdotool search --class "t3|electron|code" 2>/dev/null || true)
(kdotool search --title "T3|Code" 2>/dev/null || true)
echo LOG
sed -n "1,220p" /tmp/t3-x11-window.log || true
EOF
chmod +x /tmp/t3_x11_only.sh
/tmp/t3_x11_only.sh'