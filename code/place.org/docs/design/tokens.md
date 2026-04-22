# Design Tokens

All tokens are CSS custom properties on `:root`. Components MUST reference these — never hardcode hex.

## Status: MIGRATION PENDING
Current codebase uses old vars (`--bg-deep`, `--accent-blue`, etc.). Migration to `--place-*` namespace is Step 2 of Phase 1. See `decisions/001-design-token-migration.md` for the full mapping.

## Target Token Set

### Surfaces
```css
--place-void:      #060610
--place-base:      #08090E
--place-surface-1: #0E1017
--place-surface-2: #141620
--place-surface-3: #1A1D2A
```

### Text (white at opacity — NEVER gray hex)
```css
--place-text-primary:   rgba(255,255,255, 0.87)
--place-text-secondary: rgba(255,255,255, 0.60)
--place-text-tertiary:  rgba(255,255,255, 0.40)
--place-text-muted:     rgba(255,255,255, 0.25)
--place-text-ghost:     rgba(255,255,255, 0.12)
```

### Primary (Teal)
```css
--place-primary-900 through --place-primary-50
--place-primary-glow, --place-primary-subtle, --place-primary-border
```

### Secondary (Slate Blue)
```css
--place-secondary-900 through --place-secondary-50
--place-secondary-glow, --place-secondary-subtle, --place-secondary-border
```

### Tertiary (Amber)
```css
--place-tertiary-900 through --place-tertiary-50
--place-tertiary-glow, --place-tertiary-subtle, --place-tertiary-border
```

### Semantic (never themed)
```css
--place-error:   #E24B4A
--place-success: #22C55E
--place-warning: #EAB308
```

### Borders
```css
--place-border-subtle:  rgba(255,255,255, 0.04)
--place-border-default: rgba(255,255,255, 0.08)
--place-border-strong:  rgba(255,255,255, 0.15)
```

### Glass Tiers
```css
.glass-ambient:  bg rgba(255,255,255,0.01), blur(0)
.glass-surface:  bg rgba(255,255,255,0.02), blur(12px)
.glass-elevated: bg rgba(255,255,255,0.04), blur(16px)
.glass-accent:   bg rgba(13,147,115,0.06),  blur(20px)
```

### Typography
```css
--place-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
--place-font-mono: "SF Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace
```
