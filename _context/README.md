# EMA central context branch

This branch carries the non-runtime workspace context from the parent
`EMA-CENTRAL-EVERYTHING` folder under:

`_context/EMA-CENTRAL-EVERYTHING/`

The runnable EMA runtime remains at the repository root, matching `main`.

Excluded from this context copy:

- `runtime/`
- nested `.git/` directories
- `node_modules/`
- `.next/`, `out/`, `target/`, and `build/`
- local databases, logs, pids, and TypeScript build-info files
- macOS `.DS_Store`

Those exclusions keep this branch focused on doctrine, plans, archives,
inventory, links, donors, and source snapshots without publishing local
build/dependency artifacts.
