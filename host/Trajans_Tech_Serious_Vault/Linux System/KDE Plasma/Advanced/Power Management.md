---
tags:
  - kde
  - power
  - battery
  - performance
created: 2026-03-13
---

# Power Management on KDE

[[KDE Plasma Overview|KDE Plasma]] has robust power management through PowerDevil and compatible tools. Display protocol ([[Wayland vs X11]]) and background services like [[Baloo File Indexer]] can impact power consumption.

## PowerDevil (Built-in)

KDE's native power management daemon:
- Brightness control
- Suspend/hibernate on lid close
- Battery charge thresholds (if supported by hardware)
- Profile switching: `Meta+B` for OSD
- Profiles: Performance, Balanced, Power Saving

Configure: System Settings → Power Management (see [[Configuration Files]] for config paths)

## Additional Tools

| Tool | Purpose | Conflict Warning |
|------|---------|-----------------|
| **TLP** | Fine-grained laptop battery optimization | Config: `/etc/tlp.conf` |
| **auto-cpufreq** | Automatic CPU frequency scaling | ⚠️ Do NOT use with TLP CPU management |
| **power-profiles-daemon** | Simple power profiles | Integrates with PowerDevil OSD |
| **thermald** | Intel thermal management | Intel CPUs only |

## Best Combination

For [[System Overview|Trajan's AMD system]]:
- **PowerDevil** (always — it's built in)
- **power-profiles-daemon** OR **TLP** (not both for CPU management)
- **auto-cpufreq** if you want automatic switching without manual profiles

## See Also

- [[System Overview]]
- [[Gaming on KDE]]
- [[KDE Plasma Overview]]
- [[Hardware Specs]]
- [[Configuration Files]]
- [[Baloo File Indexer]]
