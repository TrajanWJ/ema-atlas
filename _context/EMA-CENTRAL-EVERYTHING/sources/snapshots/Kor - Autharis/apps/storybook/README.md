# @autharis/storybook

Storybook 8 + Vite catalog for `@autharis/ui` primitives (Lane F5).

## Run

```bash
pnpm --filter @autharis/storybook dev     # http://localhost:6006
pnpm --filter @autharis/storybook build   # static build to storybook-static/
pnpm --filter @autharis/storybook typecheck
```

## Catalog

Eight primitive categories each have a story file in `src/stories/`:

- `Wordmark.stories.tsx` — default + scales + kicker
- `Icon.stories.tsx` — single icon + full gallery of all names in `ICON_NAMES`
- `Button.stories.tsx` — primary/secondary/ghost x sm/md/lg matrix
- `Badge.stories.tsx` — all five variants, with/without dot
- `Pill.stories.tsx` — plain, removable, with leading icon
- `SegmentedControl.stories.tsx` — controlled with three options, full-width
- `Dialog.stories.tsx` — trigger opens a dialog with focus trap
- `Tabs.stories.tsx` — three-panel controlled tablist

## Theme + accent toolbars

`.storybook/preview.ts` registers two global toolbars:

- **Theme** — light / dark; toggles `data-theme` on `<html>`
- **Accent** — seven swatches (terra, lime, moss, sky, rose, ink, cream) drawn from `@autharis/tokens`; sets `--accent`, `--accent-ink`, `--accent-text` inline on `<html>`

The decorator imports `@autharis/tokens/tokens.css` and `@autharis/ui/styles.css` once so every story inherits the token scale and primitive CSS.

## Adding a story

1. Create `src/stories/<Name>.stories.tsx`
2. Import the primitive from `@autharis/ui` (never copy — the workspace symlink points at the built package)
3. Export a default `Meta` with `title: 'Primitives/<Name>'` and the component
4. Export one or more `StoryObj` named exports
5. Run `pnpm --filter @autharis/storybook typecheck` to smoke

## Addons

- `@storybook/addon-essentials` — controls, actions, backgrounds (disabled), viewport, measure, outline
- `@storybook/addon-a11y` — axe-core panel per story

## Notes

- Story glob: `../src/**/*.stories.@(ts|tsx|mdx)`
- Framework: `@storybook/react-vite`
- React 19 + TS strict + `moduleResolution: bundler`
