---
date: 2026-04-12
tags:
  - meta
  - learnings
---

# Learnings & Gotchas

> Hard-won lessons that don't belong to any single project. The "don't touch the hot stove twice" section.

---

## Recent Learnings

- [[wa-sqlite Turbopack bundler breaks WASM import.meta.url]] — Never reference WASM-loading Emscripten `.mjs` files via bundled module imports. Always serve statically. (2026-03)
- [[2026-03-13 - Vault instructions dont self-enforce]] — CLAUDE.md instructions are soft constraints; under context pressure, instruction-following degrades. Keep instructions realistic and few. (2026-03-13)

<!-- Add new entries here as they come up during sessions -->

---

## How This Section Works

Add notes here when something bites you and the lesson is **transferable** — not specific to one project.

### Good fits for this section

- "Never use library X for Y because Z"
- "Always check Z before deploying to production"
- "This footgun in Node/Python/Postgres bit me twice"
- "This config pattern looks right but silently breaks under load"
- Platform-specific quirks (Linux, systemd, npm, etc.)

### Bad fits (put these elsewhere)

- Project-specific bugs → project note in [[Trajan's Projects]]
- One-time debugging steps → don't capture at all
- Tool installation issues → tool note in [[AI Knowledge Hub]]

### Note format

```markdown
## [Short description of the gotcha]

**Context:** What you were doing when this happened
**Problem:** What went wrong
**Fix:** What solved it
**Lesson:** The generalizable takeaway
```

---

See also: [[Session Log]], [[AI Knowledge Hub]]

#meta #learnings #gotchas
