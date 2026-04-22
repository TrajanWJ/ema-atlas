---
tags:
  - kde
  - baloo
  - search
  - performance
created: 2026-03-13
---

# Baloo File Indexer

KDE's file indexing and search service. Powers search in [[Dolphin Power Features|Dolphin]], [[KRunner]], and file dialogs. Part of the core [[System Overview|KDE system]] stack.

## Commands

```bash
balooctl status        # Check indexing state
balooctl disable       # Stop completely
balooctl enable        # Re-enable
balooctl purge         # Delete index and rebuild
balooctl monitor       # Watch indexing in real-time
```

## Configuration

File: `~/.config/baloofilerc`

```ini
[Basic Settings]
Indexing-Enabled=true

[General]
# Exclude heavy directories
exclude folders[$e]=$HOME/Downloads,$HOME/.local/share/Steam,$HOME/node_modules
# Content indexing off (filename only) — much lighter
only basic indexing=true
```

## Optimization Tips

1. **Exclude large directories** — Steam, node_modules, build outputs, VMs
2. **Basic indexing only** — index filenames, not file contents (much faster/lighter)
3. **Disable if not needed** — `balooctl disable` if you use other search tools. Back up config with [[Konsave Backup]]
4. KF6.23.0 (2025): faster indexing, better memory safety, split long runs into transactions

## Impact

- **Enabled + full indexing**: Can use significant CPU/RAM during initial index (impacts [[Power Management]])
- **Enabled + basic indexing**: Minimal impact, filename search only
- **Disabled**: No KDE search in Dolphin/KRunner (can use `find`/`fd` instead)

## See Also

- [[Dolphin Power Features]]
- [[KRunner]]
- [[Configuration Files]]
- [[Power Management]]
