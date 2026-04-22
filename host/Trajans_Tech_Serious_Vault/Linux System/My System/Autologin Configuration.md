---
tags:
  - my-system
  - autologin
  - sddm
  - startup
created: 2026-03-13
---

# Autologin Configuration

[[System Overview|Trajan's system]] is configured to automatically log in to user `trajan` on boot — no password prompt at the display manager.

## Display Manager

KDE Neon uses **SDDM** (Simple Desktop Display Manager) as the default display manager.

## SDDM Autologin

> **TODO**: Run `capture-kde-config.sh` to capture the actual SDDM configuration. Document exact config here once captured.

### Expected Configuration

Autologin is configured in SDDM's config files (see [[Configuration Files]] for other KDE config paths):

**Location** (one of):
```
/etc/sddm.conf
/etc/sddm.conf.d/autologin.conf
```

**Expected Content**:
```ini
[Autologin]
User=trajan
Session=plasma
```

### How to Set Up SDDM Autologin

1. **GUI method**: System Settings → Startup and Shutdown → Login Screen (SDDM) → Behavior → Automatically log in
2. **CLI method**:
   ```bash
   sudo mkdir -p /etc/sddm.conf.d
   sudo tee /etc/sddm.conf.d/autologin.conf << 'EOF'
   [Autologin]
   User=trajan
   Session=plasma
   EOF
   ```

### Session Type

The `Session=plasma` line launches the default Plasma session, which on this system is [[Wayland vs X11|Wayland]].

To force X11 instead: `Session=plasmax11`

## Startup Sequence

1. **System boot** → systemd starts SDDM
2. **SDDM autologin** → logs in as `trajan`
3. **Plasma session starts** → loads [[Plasma Shell]], [[KWin]] (the [[Wayland vs X11|Wayland]] compositor)
4. **Startup scripts** → `~/.config/plasma-workspace/env/*.sh` execute
5. **Autostart apps** → `~/.config/autostart/*.desktop` launch
6. **[[Monitor Setup|Monitor color correction]]** → applied via startup script

## Security Note

Autologin means anyone with physical access can use the system. Acceptable for:
- ✅ Personal laptop at home
- ✅ Desktop in private space
- ❌ Shared computers
- ❌ Public/office environments

Screen lock (`Meta+L`) still works for temporary security.

## See Also

- [[System Overview]]
- [[Monitor Setup]]
- [[KDE Plasma Overview]]
- [[Configuration Files]]
- [[Wayland vs X11]]
