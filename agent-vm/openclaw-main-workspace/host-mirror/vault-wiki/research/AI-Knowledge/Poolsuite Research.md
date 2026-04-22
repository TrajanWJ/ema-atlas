---
date: 2026-03-20T00:00:00.000Z
tags:
  - research
  - ui
  - retro-os
  - place-org
  - inspiration
  - web-audio
  - window-management
status: active
type: research
wiki_id: research/AI-Knowledge/Poolsuite_Research
imported_from: vault/Research/AI-Knowledge/Poolsuite Research.md
imported_at: '2026-04-04T00:23:56.978Z'
summary: ''
---

# Poolsuite Research

> Deep dive into poolsuite.net for [[place.org]] adaptation. Researched 2026-03-20.
> Primary goal: extract implementable interaction patterns (boot ritual, window management, desktop metaphor).

---

## What Poolsuite Is

Poolsuite (formerly Poolside.fm) is an internet radio station with a retro Classic Mac OS desktop UI. Founded by Marty Bell. Designer Niek Dekker, lead developer Lewis King ("fastest web developer on earth" per the founder). Runs as a Cloudflare Worker backend wrapping the SoundCloud API.

---

## 1. Boot Sequence

**What is confirmed:**
- The HTML shell references `/boot/background.png` as a preload image asset — this is the boot splash graphic
- The site is a full SPA; JavaScript must execute before anything renders
- Multiple sources describe it as "booting up a Macintosh at the beach" and "an immediate flashback to System 7"
- The experience is compared to "powering on a vintage Mac from 1997"

**What is not confirmed (no public timing data):**
- Exact duration of the boot animation is undocumented in any public source
- Whether it shows a progress bar, disk spinning, or happy Mac icon is inferred from the aesthetic, not confirmed from source

**Implementable pattern:**
A full-screen `/boot/background.png` image displayed as a splash, replaced by the desktop once the JS app initializes. Likely 2–4 seconds. The retro convention is: black screen → Mac boot chime sound → happy Mac icon → "Welcome to Poolsuite" title card → desktop fade-in.

---

## 2. Window Management

**Confirmed behavior:**
- Floating, draggable windows — multiple sources confirm "drag around" behavior
- Classic Mac OS-style: title bar with close button, drag handle at top
- No confirmed use of a specific public library — the app is a closed SPA
- The V3 web app shows multiple simultaneous open windows

**Comparison research — what open-source libraries exist:**

| Library | Stars | Size | Notes |
|---------|-------|------|-------|
| WinBox.js | ~5k | <10KB gzip | Lightweight, no deps, React wrapper available (react-winbox) |
| react-rnd | ~3.5k | small | Used by daedalOS (the best-documented browser desktop) |
| os-gui | ~1k | small | jQuery dep, powers 98.js.org, Win98 aesthetic |
| classicy | low | medium | React + TypeScript, Mac OS 8 components, full desktop provider |
| system.css | ~3k | CSS only | Style layer only, no JS window behavior |

**Recommended for place.org:** `react-rnd` for drag/resize behavior + custom CSS for the space aesthetic. WinBox.js is the lightest option if React integration is secondary.

**daedalOS pattern** (Dustin Brett's browser desktop, well-documented):
- Three-layer architecture: `AppsLoader` → `RenderComponent` → `Window`
- `react-rnd` provides drag/resize via `dragHandleClassName` targeting the title bar
- Process context stores active windows; closing removes from context
- CSS `contain: strict` for performance

---

## 3. Desktop Icons

**Confirmed icon set (from multiple review sources):**

Below the main player window, desktop icons link to:
1. **Player** — the music player window
2. **Newsroom** — blog/editorial content
3. **Mixtapes** — curated playlist collections
4. **Members** — subscriber area
5. **Events** — live events calendar
6. **Instagram** — social link
7. **Vacation** — their sunscreen brand (lifestyle extension)
8. **Guestbook** — community sign-in
9. **Settings**

**Layout:** Icons are arranged below the player window, not in a grid across the full desktop. No confirmation that they are user-draggable to arbitrary positions — they appear fixed below the player.

**Visual style:** Described as "pixelated icons" consistent with System 7 icon aesthetics (monochrome or limited palette, 32x32 or 48x48).

---

## 4. Music Player

**Player window contents:**
- Play/pause control
- Channel selector (dropdown): Classic Poolsuite, Hangover Club, Monday Night Heat, Tokyo Disco, Indie Summer, Balearic Sundown, Friday Nite Heat
- Waveform visualizer that "dances along" with audio
- Track title display
- Timestamp showing how long the track has been playing
- Heart/favorite icon
- Share icon
- Mixtapes panel on the right side during playback (labeled "Mixtapes")
- Looping video background — grainy, CRT-style footage of beach scenes, 80s TV, home video

**Waveform implementation:**
The SoundCloud API returns a `waveform_url` pointing to a PNG. Replacing `.png` with `.json` in that URL returns structured data:
```json
{
  "width": 1800,
  "height": 140,
  "samples": [...]
}
```
Each sample is a bar height normalized 0–140. This is pre-computed static waveform data, not a live `AnalyserNode` visualization. The bars render from this JSON, not from real-time Web Audio API analysis.

**Audio backend:**
- Cloudflare Worker at `api.poolsidefm.workers.dev`
- `/v1/get_tracks_by_playlist` — returns playlists and track metadata
- `/v2/get_sc_mp3_stream?track_id={trackId}` — proxies SoundCloud HLS/DASH at 160kbps AAC
- All audio ultimately served from SoundCloud CDN

**SoundCloud playlists (public):**
- `soundcloud.com/poolsuite/sets/poolsuite-fm-official-playlist`
- `soundcloud.com/poolsuite/sets/poolsuite-fm-official-playlist-two`
- `soundcloud.com/poolsuite/sets/poolsuite-mixtapes`

---

## 5. Menu Bar

**Confirmed:** The top menu bar is present on the web app — multiple sources confirm "a menu bar" as a key UI element.

**What is in it:** Not confirmed in any public source at item level. Based on Mac OS convention and the app's purpose, it likely contains:
- Apple logo (branding) → About Poolsuite
- Channel or Station menu
- Account/Members menu
- possibly Volume or Audio controls

The menu bar is described as distinct from the desktop icons — it sits at the top of the browser window, exactly like a real Classic Mac menu bar.

---

## 6. Visual Style

**Confirmed design language:**
- Classic Mac OS / System 7 aesthetic (1984–1991 era)
- "Summery" interpretation — not dark/brooding, uses a warm cream/tan palette
- CRT-style visual effects on video content
- Pixelated, 1-bit style icons
- Thick black 2px borders on windows (System 7 convention)
- Title bar with striped drag handle (horizontal lines)
- Chicago font (system font of classic Mac)

**system.css design tokens (directly applicable):**

```css
/* Colors */
--sys-color-white: #FFFFFF
--sys-color-black: #000000
--sys-color-grey: #A5A5A5
--sys-color-darkgrey: #B6B7B8
--primary: #FFFFFF   /* window backgrounds */
--secondary: #000000 /* borders, text */
--tertiary: #A5A5A5  /* inactive elements */

/* Spacing */
--element-spacing: 8px
--grouped-element-spacing: 6px
--box-shadow: 2px 2px   /* flat drop shadow, no blur */

/* Fonts */
Chicago_12 (by Giles Booth)
Geneva_9 (by Giles Booth)
Monaco (monospace)
```

**Window title bar stripes:**
```css
background: linear-gradient(/* alternating 6.67% bands */);
```

**For place.org adaptation:**
Swap `--primary: #FFFFFF` → deep space blue (your background)
Keep `--secondary: #000000` → use a luminous teal or white for borders
Keep `2px 2px` flat shadow — critical for the retro feel
Chicago font → keep or substitute with a pixel-grid monospace

---

## 7. Mobile Strategy

**V3 (2021) mobile approach:**
- Separate native apps: iOS (App Store) and Android (Google Play)
- Web app on mobile is likely a simplified view rather than full desktop metaphor
- Mobile navigation uses a **bottom tab bar with 4 sections**: Player, Mixtapes, On Air, Newsroom
- The pixel/retro aesthetic is maintained: "pixelated graphics which can be changed to a handful of stark colors"
- Mobile-specific feature: **PoolCam** — 1-bit, black-and-white dithered photography (Macintosh camera aesthetic)

**Web mobile:** Sources describe the full desktop metaphor as primarily a web/desktop experience. Mobile web likely degrades to a simpler player layout.

---

## 8. Sound Design

**Confirmed:** No public documentation of specific interaction sounds exists. The retro OS convention (which Poolsuite appears to follow) includes:
- Classic Mac startup chime on boot
- Window open/close sounds
- Click sounds on icons

The PoolCam feature on mobile confirms interest in period-authentic audio/visual details.

---

## 9. Easter Eggs

**Confirmed:** Multiple sources mention "Easter eggs embedded throughout the interface for gamified engagement" (ProductCool review). No specific Easter eggs are documented publicly.

**Thematic element:** "Uncle Rick's Garage" and the 1994 Kawasaki 750XX jet ski motif — used as a navigation metaphor in V3, not just a visual decoration.

---

## Tech Stack (Confirmed)

| Layer | Technology |
|-------|-----------|
| Frontend | SPA (framework unknown, likely React or Svelte based on era) |
| Backend | Cloudflare Workers |
| Audio source | SoundCloud API (proxied) |
| Analytics | Plausible (privacy-first), Facebook Pixel |
| Audio format | HLS/DASH, 160kbps AAC |
| Asset hosting | Standard CDN (no source maps visible) |
| PWA | Yes — service worker, precache manifests confirmed in DevelopersContrib repo |

The DevelopersContrib `poolsuitecom` repo (83.2% JS, 10.7% CSS, 4.1% HTML, 2% Smarty) suggests a build-tool-compiled SPA with service worker caching.

---

## Open-Source Clones / Recreations

| Project | Language | What it does |
|---------|----------|-------------|
| [poolsuite-cli](https://github.com/jamespember/poolsuite-cli) | Shell | Terminal stream player via yt-dlp/mpv |
| [go-poolsuite](https://github.com/mrusme/go-poolsuite) | Go | Go module wrapper (archived Apr 2025) |
| [PoolPartyFM](https://github.com/NewbieScripterRepo/PoolPartyFM) | NativeScript+Vue | Android clone |
| [poolside-fm-player](https://github.com/JoaoTMDias/poolside-fm-player) | React+Electron | macOS menu bar player |

None are direct web UI clones. The closest to the desktop metaphor is daedalOS (not Poolsuite-specific) by Dustin Brett.

---

## place.org Adaptation Notes

**Direct imports (interaction patterns):**
1. Boot ritual: full-screen splash → delayed desktop reveal
2. Desktop icons below main window, not scattered — organized row
3. Floating draggable windows with System 7 title bars
4. Waveform from pre-computed JSON samples, not live AnalyserNode
5. Channel switcher as dropdown within the player window
6. Menu bar at top of viewport (not a dock at bottom)

**Invert the palette:**
- Poolsuite: warm cream `#FFFFFF` background, black `#000000` borders
- place.org: deep space blue background, luminous teal/white borders
- Keep the `2px solid` flat borders — this is the most critical System 7 signal
- Keep the striped title bar gradient — swap colors

**Keep the audio backend pattern:**
- SoundCloud playlist → proxy endpoint is the cleanest approach
- Pre-computed waveform JSON is simpler than live Web Audio AnalyserNode
- Cloudflare Workers is a good match for a lightweight audio proxy

---

## Sources

- [Poolsuite - Wikipedia](https://en.wikipedia.org/wiki/Poolsuite)
- [Android PoolSuite FM NativeScript Part 3 (API details)](https://newbiescripter.com/android-poolsuite-fm-in-nativescript-part-3-playing-the-music/)
- [poolsuite-cli README (SoundCloud stream details)](https://github.com/jamespember/poolsuite-cli)
- [MakeUseOf: retro radio review](https://www.makeuseof.com/i-didnt-expect-retro-radio-app-to-be-this-cool-or-addictive/)
- [Poolsuite V3 announcement](https://palmreport.poolsuite.net/poolsuite-v3/)
- [Hacker News: poolside.fm thread (API rate limit discussion)](https://news.ycombinator.com/item?id=22371629)
- [Worklife VC: Marty Bell founder interview](https://www.worklife.vc/blog/founder-of-poolside-fm-knows-how-to-make-shit-go-viral)
- [Domus interview (design aesthetic)](https://www.domusweb.it/en/design/gallery/2020/07/08/poolsidefm-is-a-window-to-the-happiest-eighties-right-into-the-web-browser.html)
- [DevelopersContrib poolsuitecom repo](https://github.com/DevelopersContrib/poolsuitecom)
- [system.css (Classic Mac CSS)](https://github.com/sakofchit/system.css)
- [system7.style](https://system7.style/)
- [classicy React components](https://github.com/robbiebyrd/classicy)
- [WinBox.js DeepWiki](https://deepwiki.com/nextapps-de/winbox)
- [daedalOS window manager implementation](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-part-1-window-manager-197k)
- [osxdaily: Poolsuite FM review with screenshots](https://osxdaily.com/2023/06/10/poolsuite-fm-plays-summery-jams-in-a-retro-style-music-app/)

#research #ui #retro-os #place-org #window-management #web-audio
