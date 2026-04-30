# ADR-001: Design Token Migration

## Context
The codebase uses a flat set of CSS custom properties (`--bg-deep`, `--accent-blue`, `--text-secondary: #8088a0`) that evolved organically. The system prompt specifies a strict three-color accent system (teal/slate-blue/amber), white-at-opacity text, named surface tiers, and 4-tier glass morphism. All tokens must be CSS custom properties for runtime theming via the Palette app.

## Old → New Mapping

### Surfaces
| Old | New | Old Value | New Value |
|-----|-----|-----------|-----------|
| `--bg-deep` | `--place-void` | `#060610` | `#060610` |
| `--bg-surface` | `--place-surface-1` | `#0a0e1a` | `#0E1017` |
| `--bg-glass` | (removed — use glass tiers) | `rgba(80,130,220,0.06)` | — |
| — | `--place-base` | — | `#08090E` |
| — | `--place-surface-2` | — | `#141620` |
| — | `--place-surface-3` | — | `#1A1D2A` |

### Text
| Old | New | Old Value | New Value |
|-----|-----|-----------|-----------|
| `--text-primary` | `--place-text-primary` | `#e8eaf0` (gray hex) | `rgba(255,255,255,0.87)` |
| `--text-secondary` | `--place-text-secondary` | `#8088a0` (gray hex) | `rgba(255,255,255,0.60)` |
| — | `--place-text-tertiary` | — | `rgba(255,255,255,0.40)` |
| — | `--place-text-muted` | — | `rgba(255,255,255,0.25)` |
| — | `--place-text-ghost` | — | `rgba(255,255,255,0.12)` |

### Accents
| Old | New | Old Value | New Value |
|-----|-----|-----------|-----------|
| `--accent-blue` | `--place-secondary-500` | `#5b9cf5` | `#4B7BE5` |
| `--accent-success` | `--place-success` | `#38c97a` | `#22C55E` |
| `--accent-warm` | `--place-tertiary-400` | `#e8a84c` | `#F59E0B` |
| `--accent-urgent` | `--place-error` | `#ef6b6b` | `#E24B4A` |
| — | `--place-primary-*` (teal) | — | see system prompt |

### Borders
| Old | New | Old Value | New Value |
|-----|-----|-----------|-----------|
| `--border` | `--place-border-default` | `rgba(100,160,255,0.08)` | `rgba(255,255,255,0.08)` |
| `--border-hover` | `--place-border-strong` | `rgba(100,160,255,0.18)` | `rgba(255,255,255,0.15)` |
| — | `--place-border-subtle` | — | `rgba(255,255,255,0.04)` |

### Glass
| Old | New |
|-----|-----|
| `.glass` class (single tier) | 4 named tiers: ambient, surface, elevated, accent |

## Decision
Migrate in one pass. Define all `--place-*` vars on `:root`. Keep old var names as aliases pointing to new ones during transition (so nothing breaks). Remove aliases after all components are updated.

## Consequences
- Every component touching color must be audited
- Hardcoded hex values in inline styles must be replaced with var references
- The `.glass` class becomes `.glass-surface` (default tier), with `.glass-ambient`, `.glass-elevated`, `.glass-accent` variants
- Tailwind config needs updating to reference CSS vars
