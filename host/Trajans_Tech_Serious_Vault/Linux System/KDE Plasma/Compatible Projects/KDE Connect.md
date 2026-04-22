---
tags:
  - kde
  - kde-connect
  - mobile
  - integration
created: 2026-03-13
---

# KDE Connect

Connects your Linux desktop to Android/iOS devices over local network with **end-to-end TLS encryption**. Works on any DE, not just [[KDE Plasma Overview|KDE]].

## Features

| Feature | Direction |
|---------|-----------|
| **Shared clipboard** | Bidirectional |
| **Phone notifications** | Phone → Desktop (with reply) |
| **File sharing** | Bidirectional (from any app) |
| **URL sharing** | Bidirectional |
| **Remote input** | Phone as trackpad/keyboard (see [[Keyboard Shortcuts]]) |
| **SMS from desktop** | Desktop → Phone |
| **Media control** | Bidirectional |
| **Preset remote commands** | Desktop ← Phone (scriptable via [[D-Bus Scripting]]) |
| **Presentation remote** | Volume buttons advance slides |
| **Digitizer plugin** | Drawing tablet input (v1.35+) |
| **In-app notification view** | Added March 2025 |

## Panel Integration

Use the **KDE Connect Indicator** [[Must-Have Widgets|widget]] in your panel — shows connected devices, battery level, and quick actions.

## Platform Availability

| Platform | Source |
|----------|--------|
| Android | Google Play Store + F-Droid |
| iOS | App Store + TestFlight |
| Linux | Pre-installed on KDE Plasma, available for all DEs |
| Windows | Available (Microsoft Store) |

## Setup

1. Install on both devices
2. Both must be on the **same local network**
3. Pair via the app/System Settings
4. Grant permissions as needed (notifications, SMS, files)
5. Config stored in [[Configuration Files|KDE config directories]]

## Security

- All communication encrypted with TLS
- Devices must be explicitly paired
- Pairing can be revoked at any time
- No cloud servers — direct local communication

## See Also

- [[Must-Have Widgets]]
- [[KDE Plasma Overview]]
- [[Keyboard Shortcuts]]
- [[D-Bus Scripting]]
