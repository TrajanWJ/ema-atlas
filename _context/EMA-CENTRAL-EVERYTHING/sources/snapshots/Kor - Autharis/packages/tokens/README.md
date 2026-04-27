# @autharis/tokens

Single source of truth for design tokens across every deliverable. Lane F2. Unheld.

Exports:
- `./tokens.css` — the CSS custom-property cascade, sourced from `autharis/styles/tokens.css` (read-only) and re-exported as a package entry
- `./` — a typed object mirror (`colors`, `space`, `radius`, `type`) for non-CSS consumers (Storybook args, Python reports, Bun logging)

F2 must not edit `autharis/styles/tokens.css` directly — it reads and re-exports.
