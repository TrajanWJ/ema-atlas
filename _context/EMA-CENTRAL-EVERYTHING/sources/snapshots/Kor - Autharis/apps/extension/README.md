# @autharis/extension — Autharis Clipper (MV3)

Browser extension (WXT + React 19, Manifest V3) that scrapes a highlighted
job post on LinkedIn, Upwork, Lever, or Greenhouse and deep-links the
normalized payload into the Autharis draft-job flow.

## Lane

G3 — Browser extension (MV3). File scope: `apps/extension/**`.

## Install (unpacked)

```bash
pnpm install
pnpm --filter @autharis/extension build
```

`wxt build` writes the unpacked extension to `.output/chrome-mv3/`.

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select `apps/extension/.output/chrome-mv3`.
4. Pin the **Autharis Clipper** icon to the toolbar.

## Usage

1. Visit a job post on LinkedIn, Upwork, Lever, or Greenhouse.
2. Highlight the job description (optional — improves accuracy).
3. Right-click and choose **Send to Autharis**.
4. Click the extension icon — the popup shows the normalized payload.
5. Press **Open in Autharis** to launch the deep link
   (`autharis://jobs/new?draft=<base64url-json>`), or **Copy JSON**.

## Site parsers

Four site-specific parsers live under `lib/parsers/`:

- `linkedin.ts`
- `upwork.ts`
- `lever.ts`
- `greenhouse.ts`

Each returns a `RawScrape` that `lib/normalize.ts` converts into a
`CreateJobRequestInput`-shaped payload (plus `sourceUrl`).

## Icons

`public/icon-{16,48,128}.png` are 1x1 placeholder PNGs. Replace with real
artwork before shipping to the Chrome Web Store.

## Scripts

- `pnpm dev` — WXT dev server with live reload.
- `pnpm build` — production MV3 build.
- `pnpm zip` — Web Store upload archive.
- `pnpm typecheck` — `tsc --noEmit`.
