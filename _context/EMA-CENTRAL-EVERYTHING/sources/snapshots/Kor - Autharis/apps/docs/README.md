# @autharis/docs

Public docs site for the Autharis ecosystem. Lane F4.

Built on **Astro Starlight** (chosen over Nextra 3 to avoid Next.js version
conflict with the `autharis/` workspace and to keep the static build trivial).

## Scripts

```sh
pnpm --filter @autharis/docs dev     # astro dev --port 4000
pnpm --filter @autharis/docs build   # astro build
pnpm --filter @autharis/docs preview # astro preview --port 4000
```

Serves on `:4000` in development. The CORS allowlist in `services/api`
(Lane F6) already includes `http://localhost:4000`.

## Structure

```
apps/docs/
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.svg
└── src/
    └── content/
        ├── config.ts
        └── docs/
            ├── index.mdx
            ├── overview/{platform,roles}.mdx
            ├── guides/{matching,payments}.mdx
            ├── api/{reference,sdk}.mdx
            ├── faq.mdx
            ├── glossary.mdx
            └── swarm.mdx
```

## Content coverage

- Platform overview + roles (client / talent / admin)
- Matching model (cites E4 + F7)
- Payments & payouts (cites E3)
- HTTP API reference (19 endpoints from F6)
- `@autharis/sdk` usage (G8)
- FAQ, glossary, swarm process
