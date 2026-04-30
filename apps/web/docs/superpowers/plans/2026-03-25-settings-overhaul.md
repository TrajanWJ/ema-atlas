# Settings & Customization Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat-tab Settings app with a 27-page sidebar+detail-panel settings system featuring dual-color pickers, glass controls, typography, themes, per-app settings, wallpaper upload, and live preview — all persisted per-user.

**Architecture:** Rewrite `settings-store.ts` with expanded state (142 fields), keep manual localStorage persistence pattern (scoped by `userKey()`), add migration from old shape. Rewrite `SettingsApp.tsx` as sidebar+detail layout. Build 8 reusable control components, 14 system pages, 13 app settings pages. Extend existing theme presets with settings overrides. All CSS sync hooks updated/added for new settings.

**Tech Stack:** React 19, Zustand 5, Framer Motion, Tailwind (inline styles for settings components matching existing pattern), wa-sqlite (OPFS for file uploads)

**Spec:** `docs/superpowers/specs/2026-03-25-settings-overhaul-design.md`

---

## Phase 1: Foundation (Store + Migration + Controls)

### Task 1: Settings Types & Defaults

**Files:**
- Create: `src/types/settings.ts`
- Create: `src/lib/settings-defaults.ts`

All type definitions and default values extracted into dedicated files. This is the single source of truth referenced by store, migration, and UI.

- [ ] **Step 1:** Create `src/types/settings.ts` with all interfaces from the spec — `SettingsState`, `FocusSettings`, `TasksSettings`, `JournalSettings`, `HabitsSettings`, `BrainDumpSettings`, `NotesSettings`, `MusicSettings`, `TerminalSettings`, `FinderSettings`, `CalculatorSettings`, `ClockSettings`, `SystemMonitorSettings`, `PipesSettings`, `AppSettings` (the container), plus `SettingsKey` type alias. Import `AppId` from `src/types/window.ts`. Use `as const` satisfies patterns for union types. No enums.

- [ ] **Step 2:** Create `src/lib/settings-defaults.ts` with `DEFAULT_SETTINGS: SettingsState` and per-app defaults (`DEFAULT_FOCUS_SETTINGS`, etc.). Export each individually and the combined default. Journal template default: `"## {{date}}\n\n### How am I feeling?\n\n### What happened today?\n\n### Grateful for\n"`.

- [ ] **Step 3:** Verify build passes.

Run: `pnpm tsc --noEmit 2>&1 | head -20`
Expected: No errors from the new files.

- [ ] **Step 4:** Commit.

```bash
git add src/types/settings.ts src/lib/settings-defaults.ts
git commit -m "feat(settings): add expanded settings types and defaults — 142 fields"
```

---

### Task 2: Settings Store Rewrite

**Files:**
- Modify: `src/stores/settings-store.ts` (full rewrite)
- Create: `src/lib/settings-migration.ts`

Rewrite the store to use the new types. Keep the existing manual `loadSettings`/`saveSettings` pattern with `userKey()` scoping. Add migration from v1 (old shape) to v2 (new shape).

- [ ] **Step 1:** Create `src/lib/settings-migration.ts` with `migrateSettings(raw: unknown): SettingsState`. Logic: detect old shape (has `accentColor` but no `primaryColor`), rename `accentColor` → `primaryColor`, add new `accentColor: '#6B95F0'`, convert `fontSize` string to number (small→14, medium→16, large→18), read `soundEnabled` from desktopStore localStorage key if present, spread all new defaults under. Export `SETTINGS_VERSION = 2`.

- [ ] **Step 2:** Rewrite `src/stores/settings-store.ts`:
  - Import types from `src/types/settings.ts`, defaults from `src/lib/settings-defaults.ts`, migration from `src/lib/settings-migration.ts`
  - State shape: `SettingsState & { setSetting, setAppSetting, getSetting, resetSettings, resetAppSettings, rehydrate }`
  - `setSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K])` — type-safe setter, triggers debounced save (100ms via `setTimeout` + clear pattern)
  - `setAppSetting<A extends keyof AppSettings>(appId: A, key: keyof AppSettings[A], value)` — nested app setter
  - `loadSettings()` — read from `userKey('place-settings')`, parse JSON, run `migrateSettings()`, merge with defaults
  - `saveSettings()` — serialize state (exclude functions), write to `userKey('place-settings')` localStorage
  - Remove old `FontSize`, `DesktopSettings` type exports — replace with re-exports from `src/types/settings.ts`

- [ ] **Step 3:** Fix all TypeScript errors from consumers of old types. Grep for imports from `settings-store` that reference `FontSize`, `DesktopSettings`, `SettingsKey`, `WallpaperType`, `BgAnimationType`, `DockPosition`, `DockSize`. Update each import to use new types from `src/types/settings.ts`.

Run: `pnpm tsc --noEmit 2>&1 | head -40`

- [ ] **Step 4:** Verify the app loads without errors in the browser.

Run: `pnpm dev` (check for runtime errors in console)

- [ ] **Step 5:** Update `soundEnabled` consumers. Grep for `soundEnabled` in `desktopStore` consumers: `src/components/desktop/ContextMenu.tsx`, `src/hooks/use-sound.ts`, and any other files reading `desktopStore.soundEnabled`. Change them to read from `useSettingsStore(s => s.soundEnabled)` instead. Remove `soundEnabled` field and `setSoundEnabled` action from `desktop-store.ts`.

- [ ] **Step 6:** Update `rehydrate-stores.ts` if it calls store methods that changed API.

- [ ] **Step 7:** Commit all modified files.

```bash
git add src/stores/settings-store.ts src/stores/desktop-store.ts src/lib/settings-migration.ts src/hooks/ src/components/
git commit -m "feat(settings): rewrite store with 142 fields, migration, debounced save"
```

---

### Task 3: Color Utilities

**Files:**
- Create: `src/lib/color-utils.ts`
- Create: `src/lib/color-presets.ts`

Extract and expand color conversion utilities from the existing `useAccentSync` hook. Add color preset data.

- [ ] **Step 1:** Create `src/lib/color-utils.ts`:
  - `hexToHsl(hex: string): { h: number; s: number; l: number }` — extract from existing `use-accent-sync.ts`
  - `hslToHex(h, s, l): string` — extract from existing
  - `hexToRgb(hex: string): { r: number; g: number; b: number }` — extract from existing
  - `adjustLightness(hex: string, amount: number): string` — extract from existing
  - `generateColorScale(hex: string): Record<string, string>` — generates 7 shades (900→50) + glow/subtle/border alpha variants. Returns object with keys like `400`, `500`, `900`, `glow`, `subtle`, `border`.
  - `generateCssVars(hex: string, prefix: string): Record<string, string>` — wraps `generateColorScale`, returns `{ '--place-{prefix}-400': '#...', ... }`

- [ ] **Step 2:** Create `src/lib/color-presets.ts`:
  ```typescript
  export const COLOR_PRESETS = [
    { id: 'ocean', name: 'Ocean', primary: '#0EA5E9', accent: '#2DD4A8' },
    { id: 'sunset', name: 'Sunset', primary: '#F97316', accent: '#EF4444' },
    { id: 'forest', name: 'Forest', primary: '#22C55E', accent: '#16A34A' },
    { id: 'neon', name: 'Neon', primary: '#A855F7', accent: '#EC4899' },
    { id: 'mono', name: 'Monochrome', primary: '#94A3B8', accent: '#CBD5E1' },
    { id: 'ember', name: 'Ember', primary: '#DC2626', accent: '#F59E0B' },
    { id: 'midnight', name: 'Midnight', primary: '#6366F1', accent: '#8B5CF6' },
    { id: 'rose', name: 'Rose', primary: '#F43F5E', accent: '#FB923C' },
  ] as const
  ```

- [ ] **Step 3:** Commit.

```bash
git add src/lib/color-utils.ts src/lib/color-presets.ts
git commit -m "feat(settings): color utility functions and preset data"
```

---

### Task 4: CSS Sync Hooks — Update Existing + Add New

**Files:**
- Modify: `src/hooks/use-accent-sync.ts` → rename to `src/hooks/use-primary-sync.ts`
- Create: `src/hooks/use-accent-sync.ts` (new — for secondary/accent color)
- Modify: `src/hooks/use-glass-intensity.ts` (expand with tint + saturation)
- Modify: `src/hooks/use-font-size.ts` (read number not enum)
- Modify: `src/hooks/use-window-radius.ts` (expand range)
- Create: `src/hooks/use-font-family.ts`
- Create: `src/hooks/use-font-weight.ts`
- Create: `src/hooks/use-line-spacing.ts`
- Create: `src/hooks/use-color-mode.ts`
- Create: `src/hooks/use-contrast.ts`
- Create: `src/hooks/use-inactive-window-opacity.ts`
- Create: `src/hooks/use-title-bar-style.ts`

- [ ] **Step 1:** Rename via `git mv src/hooks/use-accent-sync.ts src/hooks/use-primary-sync.ts`. Update it to read `primaryColor` instead of `accentColor`. Replace inline color math with calls to `generateCssVars(hex, 'primary')` from `color-utils.ts`. Update all imports across the codebase (grep for `useAccentSync` and `use-accent-sync`).

- [ ] **Step 2:** Create new `src/hooks/use-accent-sync.ts` — reads `accentColor` from settings, calls `generateCssVars(hex, 'secondary')` to set `--place-secondary-*` vars on root. Same pattern as primary sync. **NOTE:** No new `--place-accent-*` scale — accent maps to the existing `--place-secondary-*` scale that the codebase already uses.

- [ ] **Step 3:** Modify `use-glass-intensity.ts` — add reads for `glassTint` and `glassSaturation` from settings. After setting blur/bg vars, also set `--glass-tint: color-mix(in oklch, var(--place-primary-900) {tint*100}%, transparent)` and add `saturate({saturation})` to backdrop-filter composition on each tier.

- [ ] **Step 4:** Modify `use-font-size.ts` — read `fontSize` as `number` instead of enum. Set `document.documentElement.style.fontSize = ${fontSize}px`. Remove the old `FONT_SIZE_MAP`.

- [ ] **Step 5:** Modify `use-window-radius.ts` — only change is expanding the comment about valid range to 0-28.

- [ ] **Step 6:** Create `use-font-family.ts` — reads `fontFamily`, sets `--place-font-sans` on root. Create `use-font-weight.ts` — reads `fontWeight`, sets `--place-font-weight-base` and `--place-font-weight-heading` (base + 200). Create `use-line-spacing.ts` — reads `lineSpacing`, maps to number (compact=1.3, comfortable=1.5, spacious=1.7), sets `--place-line-height`.

- [ ] **Step 7:** Create `use-color-mode.ts` — reads `colorMode`, sets `data-theme` attribute on `<html>`. When `'auto'`, listens to `matchMedia('(prefers-color-scheme: dark)')` change events. Create `use-contrast.ts` — reads `contrast`, sets `data-contrast` attribute.

- [ ] **Step 8:** Create `use-inactive-window-opacity.ts` — reads `inactiveWindowOpacity`, exports the value for WindowManager to consume. Create `use-title-bar-style.ts` — reads `titleBarStyle`, exports the value for WindowTitleBar to consume.

- [ ] **Step 8b:** Create `use-wallpaper-tint.ts` — reads `wallpaperTint` and `wallpaperTintOpacity`, returns CSS properties for the wallpaper tint overlay (`::after` pseudo or a sibling div with `mix-blend-mode: overlay` and primary color at specified opacity). Create `use-wallpaper-fit.ts` — reads `wallpaperFit`, returns `backgroundSize` and `backgroundRepeat` values. Both hooks export computed style objects for the wallpaper container to consume.

- [ ] **Step 8c:** Create `use-auto-accent.ts` — reads `autoPrimaryFromWallpaper` and `wallpaper`/`customWallpaperUrl` from settings. When enabled and wallpaper changes: loads image into offscreen canvas, samples pixel data via `getImageData`, runs k-means clustering (k=5), picks cluster with highest `saturation * luminance` score, calls `setSetting('primaryColor', extractedHex)`. Export as a hook that runs in the root layout. On CORS failure, shows a warning toast and disables the feature.

- [ ] **Step 9:** Wire all new hooks into the root layout (or wherever `useAccentSync` was previously called). Grep for where hooks are invoked and add the new ones alongside.

- [ ] **Step 10:** Verify build and that existing color/glass behavior still works.

Run: `pnpm tsc --noEmit && pnpm dev`

- [ ] **Step 11:** Commit.

```bash
git add src/hooks/
git commit -m "feat(settings): update CSS sync hooks — primary/accent split, typography, glass, color mode"
```

---

### Task 5: Reusable Control Components

**Files:**
- Create: `src/components/apps/settings/controls/RangeSlider.tsx`
- Create: `src/components/apps/settings/controls/SegmentedControl.tsx`
- Create: `src/components/apps/settings/controls/ToggleWithSub.tsx`
- Create: `src/components/apps/settings/controls/PresetCards.tsx`
- Create: `src/components/apps/settings/controls/ColorPicker.tsx`
- Create: `src/components/apps/settings/controls/FileDropZone.tsx`
- Create: `src/components/apps/settings/controls/KeyRecorder.tsx`
- Create: `src/components/apps/settings/controls/MiniPreview.tsx`

Build all 8 control components. Each is self-contained with inline styles (matching existing settings pattern). These are the building blocks for every settings page.

- [ ] **Step 1:** Create `RangeSlider.tsx`. Props: `min, max, step, value, onChange, ticks?: Array<{value, label}>, showValue?: boolean, formatValue?: (v: number) => string, label?: string`. Styled with inline styles: 4px track (`--place-surface-3`), 14px circle thumb (`--place-primary-400`). ARIA: `role="slider"`, `aria-valuemin/max/now/text`.

- [ ] **Step 2:** Create `SegmentedControl.tsx`. Props: `options: Array<{value: string, label: string, icon?: ReactNode}>, value: string, onChange: (v: string) => void`. Flex row with equal-width buttons. Animated sliding background indicator using framer-motion `layoutId`. ARIA: `role="radiogroup"` + `role="radio"` children.

- [ ] **Step 3:** Create `ToggleWithSub.tsx`. Props: `enabled: boolean, onToggle: (v: boolean) => void, label: string, description?: string, children?: ReactNode`. Standard toggle (36x20px) with collapsible children area that slides in when enabled (framer-motion `AnimatePresence`).

- [ ] **Step 4:** Create `PresetCards.tsx`. Props: `presets: Array<{id, name, preview: ReactNode}>, activeId?: string, onSelect: (id: string) => void`. Horizontal scrollable row. Each card has accent ring when selected.

- [ ] **Step 5:** Create `ColorPicker.tsx`. Props: `value: string, onChange: (hex: string) => void, swatchHistory?: string[]`. Components: HueRail (horizontal gradient canvas, click/drag sets hue), SatLightPad (square canvas, click/drag sets S+L), HexInput (text field, validates on blur), SwatchHistory (row of 8 recent colors). Uses `color-utils.ts` for conversions.

- [ ] **Step 6:** Create `FileDropZone.tsx`. Props: `accept: string, maxSize: number, onUpload: (file: File, url: string) => void`. Dashed border, drag-over highlight, file type validation, size validation with error toast.

- [ ] **Step 7:** Create `KeyRecorder.tsx`. Props: `value: string, onChange: (combo: string) => void`. Click to enter recording mode, captures key combo, displays formatted string (e.g., "Ctrl+Shift+Space").

- [ ] **Step 8:** Create `MiniPreview.tsx`. Simple container with predefined preview types: `type: 'window' | 'glass'`. Window preview: tiny 60x40px rounded rect that reflects current corner radius. Glass preview: blurred surface over colorful gradient strip.

- [ ] **Step 9:** Verify build.

Run: `pnpm tsc --noEmit`

- [ ] **Step 10:** Commit.

```bash
git add src/components/apps/settings/controls/
git commit -m "feat(settings): 8 reusable control components — ColorPicker, RangeSlider, SegmentedControl, etc."
```

---

## Phase 2: Settings Shell & System Pages

### Task 6: Settings App Shell (Sidebar + Detail Panel)

**Files:**
- Rewrite: `src/components/apps/settings/SettingsApp.tsx`
- Create: `src/components/apps/settings/SettingsSidebar.tsx`
- Create: `src/components/apps/settings/SettingsPage.tsx`

- [ ] **Step 1:** Create `SettingsSidebar.tsx`. Props: `activePage: string, onNavigate: (pageId: string) => void`. Renders 4 groups (Look & Feel, Desktop, System, App Settings) with collapsible group headers. Each item: icon + label. Active item has accent highlight. Group items defined as static data array.

- [ ] **Step 2:** Create `SettingsPage.tsx`. Props: `icon: ReactNode, title: string, description: string, children: ReactNode`. Renders: icon header row, description text, then children (the page content). This is the wrapper every page uses.

- [ ] **Step 3:** Rewrite `SettingsApp.tsx`. Layout: flex row — `SettingsSidebar` (200px fixed) + detail panel (flex-1, scrollable). State: `activePage` string. Live preview strip at top with pulsing dot. Lazy-load page components via a `pageMap` that maps page IDs to React.lazy imports. Render the active page component inside `SettingsPage` wrapper. Fall back to `ColorsPage` as default.

- [ ] **Step 4:** Verify the shell renders with the sidebar. Pages will be empty placeholders initially.

Run: `pnpm dev` → open Settings app

- [ ] **Step 5:** Commit.

```bash
git add src/components/apps/settings/SettingsApp.tsx src/components/apps/settings/SettingsSidebar.tsx src/components/apps/settings/SettingsPage.tsx
git commit -m "feat(settings): sidebar + detail panel shell with lazy-loaded page routing"
```

---

### Task 7: Colors Page

**Files:**
- Create: `src/components/apps/settings/pages/ColorsPage.tsx`

- [ ] **Step 1:** Build `ColorsPage.tsx` with sections: Primary Color (ColorPicker), Accent Color (ColorPicker), Auto-Primary from Wallpaper (ToggleWithSub), Appearance (SegmentedControl dark/light/auto), Contrast (SegmentedControl standard/increased/high), Color Presets (PresetCards using `COLOR_PRESETS` data). Each section uses a `Section` wrapper (title + content) — define locally or extract as shared component.

- [ ] **Step 2:** Wire all controls to `useSettingsStore` via `setSetting()`.

- [ ] **Step 3:** Verify live preview: changing primary color updates the settings UI itself.

- [ ] **Step 4:** Commit.

```bash
git add src/components/apps/settings/pages/ColorsPage.tsx
git commit -m "feat(settings): Colors page — dual color pickers, mode, contrast, presets"
```

---

### Task 8: Glass & Blur Page

**Files:**
- Create: `src/components/apps/settings/pages/GlassPage.tsx`

- [ ] **Step 1:** Build `GlassPage.tsx` with sections: Glass Intensity (RangeSlider 0-3, named stops), Blur Amount (RangeSlider 0-40px), Glass Tint (RangeSlider 0-50%), Glass Saturation (RangeSlider 50-200%), Glass Style Presets (PresetCards with 5 presets: Frosted/Crystal/Smoky/Transparent/Neon). Each preset rendered as actual glass surface preview via `MiniPreview type="glass"`.

- [ ] **Step 2:** Glass presets click handler: sets all 4 glass values at once via multiple `setSetting()` calls.

- [ ] **Step 3:** Commit.

```bash
git add src/components/apps/settings/pages/GlassPage.tsx
git commit -m "feat(settings): Glass & Blur page — intensity, blur, tint, saturation, presets"
```

---

### Task 9: Wallpaper Page

**Files:**
- Create: `src/components/apps/settings/pages/WallpaperPage.tsx`

- [ ] **Step 1:** Build `WallpaperPage.tsx` with sections:
  - Gallery: category tabs + thumbnail grid from `src/lib/background-images.ts` data
  - Upload: `FileDropZone` saving to OPFS. On upload, generate thumbnail via canvas resize, save both to OPFS, set wallpaper to `'custom'` and `customWallpaperUrl` to the OPFS blob URL.
  - Custom URL: text input with preview thumbnail + Apply button
  - Photos folder browser: read OPFS `/photos/wallpapers/` directory, show thumbnails, click to apply
  - Opacity: `RangeSlider` 0-100%
  - Fit: `SegmentedControl` cover/contain/fill/tile
  - Tint: `ToggleWithSub` — toggle + opacity `RangeSlider` 10-80%

- [ ] **Step 2:** Commit.

```bash
git add src/components/apps/settings/pages/WallpaperPage.tsx
git commit -m "feat(settings): Wallpaper page — gallery, upload, URL, fit, tint, opacity"
```

---

### Task 10: Typography Page

**Files:**
- Create: `src/components/apps/settings/pages/TypographyPage.tsx`

- [ ] **Step 1:** Build `TypographyPage.tsx` with sections:
  - Font Size: `RangeSlider` 12-20px with named stops (Compact/Small/Standard/Large/XL). Live preview text block below the slider that updates in real-time.
  - Font Family: custom dropdown where each option renders in its own font. Options array with `fontFamily` CSS values.
  - Font Weight: `SegmentedControl` Light/Regular/Medium
  - Line Spacing: `SegmentedControl` Compact/Comfortable/Spacious

- [ ] **Step 2:** Commit.

```bash
git add src/components/apps/settings/pages/TypographyPage.tsx
git commit -m "feat(settings): Typography page — font size, family, weight, line spacing"
```

---

### Task 11: Animations Page

**Files:**
- Create: `src/components/apps/settings/pages/AnimationsPage.tsx`

- [ ] **Step 1:** Build `AnimationsPage.tsx`:
  - Background Animation Type: grid of cards with animation name + description (live canvas previews are a stretch goal — start with static labels). Animation types from existing `BgAnimationType` list.
  - Speed: `RangeSlider` 0.1-2x
  - Interactive: toggle
  - Window Transition Style: `SegmentedControl` Scale/Fade/Slide/Flip
  - Reduced Motion: toggle with "(System)" label when OS prefers reduced motion
  - Boot Animation: `ToggleWithSub` with speed `SegmentedControl` Normal/Fast/Instant

- [ ] **Step 2:** Commit.

```bash
git add src/components/apps/settings/pages/AnimationsPage.tsx
git commit -m "feat(settings): Animations page — bg type, speed, transitions, reduced motion, boot"
```

---

### Task 12: Themes Page

**Files:**
- Create: `src/components/apps/settings/pages/ThemesPage.tsx`
- Modify: `src/lib/theme-presets.ts` (extend with `settings?` field)

- [ ] **Step 1:** Extend `ThemePreset` interface in `theme-presets.ts` — add optional `settings?: Partial<SettingsState>` and `wallpaperGradient?: string` fields. Add the 7 new mood themes (Midnight, Polar, Ember, Terminal, Sakura, Ocean, Neon) with both `tokens` (using `buildTokens`) and `settings` overrides as specified in the spec table.

- [ ] **Step 2:** Build `ThemesPage.tsx`:
  - Theme Gallery: grid of cards showing each theme's `preview` colors as swatches + name + description + Apply button. Active theme shows checkmark.
  - Apply logic: apply `tokens` to `:root` (existing pattern from ThemeGallery), then apply `settings` overrides via `setSetting()` for each key, then sync `primaryColor`/`accentColor` from the theme's primary/secondary preview colors.
  - Custom Themes section (placeholder for now): "Save Current as Theme" button, shows empty custom themes list.
  - Import/Export buttons (placeholder: just the UI, full logic is a stretch goal).

- [ ] **Step 3:** Commit.

```bash
git add src/lib/theme-presets.ts src/components/apps/settings/pages/ThemesPage.tsx
git commit -m "feat(settings): Themes page — 17 built-in themes with settings overrides"
```

---

### Task 13: Dock, Windows, Desktop, Launcher Pages

**Files:**
- Create: `src/components/apps/settings/pages/DockPage.tsx`
- Create: `src/components/apps/settings/pages/WindowsPage.tsx`
- Create: `src/components/apps/settings/pages/DesktopPage.tsx`
- Create: `src/components/apps/settings/pages/LauncherPage.tsx`

- [ ] **Step 1:** Build `DockPage.tsx`: Position (3 mini-screen buttons), Size (SegmentedControl S/M/L), Spacing (RangeSlider 2-12), Magnification (ToggleWithSub + intensity slider), Auto-Hide (toggle), Show Labels (toggle), Running Indicators (toggle), Pinned Apps (static list for now, drag-reorder is stretch).

- [ ] **Step 2:** Build `WindowsPage.tsx`: Corner Radius (RangeSlider 0-28 + MiniPreview), Shadows (toggle), Inactive Opacity (RangeSlider 50-100%), Snap Zones (toggle), Title Bar Style (SegmentedControl Default/Compact/Hidden), Double-Click Action (dropdown), Window Animations (toggle).

- [ ] **Step 3:** Build `DesktopPage.tsx`: Show Icons (toggle), Icon Size (RangeSlider 32-72), Grid Spacing (RangeSlider 60-120), Sort Order (dropdown), Virtual Desktops (ToggleWithSub).

- [ ] **Step 4:** Build `LauncherPage.tsx`: Style (SegmentedControl Spotlight/Fullscreen), Recent Apps (RangeSlider 0-8), Grid Columns (RangeSlider 3-8, visible when fullscreen), Show Categories (toggle).

- [ ] **Step 5:** Commit.

```bash
git add src/components/apps/settings/pages/DockPage.tsx src/components/apps/settings/pages/WindowsPage.tsx src/components/apps/settings/pages/DesktopPage.tsx src/components/apps/settings/pages/LauncherPage.tsx
git commit -m "feat(settings): Desktop category pages — Dock, Windows, Desktop, Launcher"
```

---

### Task 14: System Pages (Sound, Notifications, Data, About)

**Files:**
- Create: `src/components/apps/settings/pages/SoundPage.tsx`
- Create: `src/components/apps/settings/pages/NotificationsPage.tsx`
- Create: `src/components/apps/settings/pages/DataPage.tsx`
- Create: `src/components/apps/settings/pages/AboutPage.tsx`

- [ ] **Step 1:** Build `SoundPage.tsx`: Master Sound (toggle, reads `soundEnabled` from settings store), Master Volume (RangeSlider 0-100%), Category Volumes (3 RangeSliders for UI/Notifications/Music), Sound Pack (dropdown: Default/Mechanical/Soft/Sci-Fi/Silent with 4 preview buttons each).

- [ ] **Step 2:** Build `NotificationsPage.tsx`: Master toggle, Badge Count (toggle), Position (4 mini-screen corner buttons), Per-App Toggles (list of notification-capable apps: Focus, Tasks, Brain Dump, Habits).

- [ ] **Step 3:** Build `DataPage.tsx`: Export button (reuse existing export logic from `DataManagement.tsx`), Import button (reuse existing import logic), Storage Usage bar (estimate via `navigator.storage.estimate()`), Selective Reset buttons (Appearance/App Data/Files/Factory Reset with confirmation dialogs). Factory Reset requires typing "RESET".

- [ ] **Step 4:** Build `AboutPage.tsx`: Version string, Tech Stack list (static data), Browser Capabilities (feature detection for OPFS, Service Worker, Notifications, Wake Lock, etc. with green/red dots), Device Info (navigator.userAgent parse, screen size, pixel ratio), Keyboard Shortcuts (expandable list of shortcuts from `use-keyboard-shortcuts.ts`).

- [ ] **Step 5:** Commit.

```bash
git add src/components/apps/settings/pages/SoundPage.tsx src/components/apps/settings/pages/NotificationsPage.tsx src/components/apps/settings/pages/DataPage.tsx src/components/apps/settings/pages/AboutPage.tsx
git commit -m "feat(settings): System category pages — Sound, Notifications, Data, About"
```

---

## Phase 3: App Settings Pages

### Task 15: App Settings — Productivity Apps (Focus, Tasks, Journal, Habits)

**Files:**
- Create: `src/components/apps/settings/app-pages/FocusSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/TasksSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/JournalSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/HabitsSettingsPage.tsx`

Each page follows the same pattern: `SettingsPage` wrapper, sections with group titles, controls bound to `settingsStore.app.{appId}.{setting}` via `setAppSetting()`.

- [ ] **Step 1:** Build `FocusSettingsPage.tsx`: Timer Defaults (4 RangeSliders: duration 5-120, break 1-30, long break 5-60, sessions before long break 2-8), Behavior (4 toggles + dim opacity ToggleWithSub), Sounds (complete sound dropdown + tick ToggleWithSub), Integrations (link task toggle + auto-journal toggle).

- [ ] **Step 2:** Build `TasksSettingsPage.tsx`: Display (defaultView SegmentedControl List/Kanban, completedBehavior SegmentedControl Show/Fade/Hide, sortOrder dropdown, showSubtaskProgress toggle), Behavior (confirmDelete toggle, autoArchive ToggleWithSub + days slider, quickAddPosition SegmentedControl Top/Bottom).

- [ ] **Step 3:** Build `JournalSettingsPage.tsx`: Editor (defaultMode SegmentedControl Write/Split/Preview, font dropdown System/Serif/Mono, spellCheck toggle), Daily Templates (template textarea with markdown preview, showMoodPicker toggle, showOneThing toggle), Reminders (reminder ToggleWithSub + time input).

- [ ] **Step 4:** Build `HabitsSettingsPage.tsx`: Display (defaultView SegmentedControl Daily/Week/Month/Streaks, weekStart SegmentedControl Mon/Sun, streakAnimations toggle), Behavior (dayResetTime time input, allowBackfill toggle, reminder ToggleWithSub + time).

- [ ] **Step 5:** Commit.

```bash
git add src/components/apps/settings/app-pages/FocusSettingsPage.tsx src/components/apps/settings/app-pages/TasksSettingsPage.tsx src/components/apps/settings/app-pages/JournalSettingsPage.tsx src/components/apps/settings/app-pages/HabitsSettingsPage.tsx
git commit -m "feat(settings): app settings — Focus, Tasks, Journal, Habits"
```

---

### Task 16: App Settings — Capture & Content Apps (Brain Dump, Notes, Music)

**Files:**
- Create: `src/components/apps/settings/app-pages/BrainDumpSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/NotesSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/MusicSettingsPage.tsx`

- [ ] **Step 1:** Build `BrainDumpSettingsPage.tsx`: defaultView (SegmentedControl Queue/Kanban), quickCaptureShortcut (KeyRecorder), autoCategorize (toggle), captureSound (toggle), sendToDefault (dropdown Tasks/Notes/Journal/Ask).

- [ ] **Step 2:** Build `NotesSettingsPage.tsx`: autoSave (ToggleWithSub + interval RangeSlider 1-30s), defaultFormat (SegmentedControl Markdown/Plain), font (dropdown System/Mono/Serif), wordWrap (toggle), lineNumbers (toggle).

- [ ] **Step 3:** Build `MusicSettingsPage.tsx`: defaultStation (dropdown), autoPlayOnFocus (toggle), pauseOnBreak (toggle), crossfade (ToggleWithSub + duration RangeSlider 1-5s), visualizer (SegmentedControl Bars/Wave/Circular/None).

- [ ] **Step 4:** Commit.

```bash
git add src/components/apps/settings/app-pages/BrainDumpSettingsPage.tsx src/components/apps/settings/app-pages/NotesSettingsPage.tsx src/components/apps/settings/app-pages/MusicSettingsPage.tsx
git commit -m "feat(settings): app settings — Brain Dump, Notes, Music"
```

---

### Task 17: App Settings — Utility Apps (Terminal, Finder, Calculator, Clock, System Monitor, Pipes)

**Files:**
- Create: `src/components/apps/settings/app-pages/TerminalSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/FinderSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/CalculatorSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/ClockSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/SystemMonitorSettingsPage.tsx`
- Create: `src/components/apps/settings/app-pages/PipesSettingsPage.tsx`

- [ ] **Step 1:** Build `TerminalSettingsPage.tsx`: font (dropdown mono fonts), fontSize (RangeSlider 10-20), colorScheme (PresetCards: Default/Dracula/Monokai/Solarized/Nord/One Dark), cursorStyle (SegmentedControl Block/Underline/Bar), cursorBlink (toggle), scrollback (RangeSlider 100-10000).

- [ ] **Step 2:** Build `FinderSettingsPage.tsx`: defaultView (SegmentedControl Grid/List/Columns), showHidden (toggle), thumbnailSize (SegmentedControl S/M/L/XL), sortBy (dropdown Name/Date/Size/Type), previewPanel (toggle).

- [ ] **Step 3:** Build `CalculatorSettingsPage.tsx`: defaultMode (SegmentedControl Basic/Scientific/Programmer), thousandsSeparator (toggle), decimalPlaces (RangeSlider 0-10), showHistory (toggle).

- [ ] **Step 4:** Build `ClockSettingsPage.tsx`: format (SegmentedControl 12h/24h), showSeconds (toggle), worldClocks (add/remove list with timezone search dropdown), style (SegmentedControl Digital/Analog/Minimal).

- [ ] **Step 5:** Build `SystemMonitorSettingsPage.tsx`: refreshInterval (RangeSlider 1-30s), chartStyle (SegmentedControl Line/Bar/Gauge), showInMenuBar (toggle).

- [ ] **Step 6:** Build `PipesSettingsPage.tsx`: autoRun (toggle), debugMode (toggle), maxExecutionTime (RangeSlider 5-120s), notifyOnComplete (toggle).

- [ ] **Step 7:** Commit.

```bash
git add src/components/apps/settings/app-pages/
git commit -m "feat(settings): app settings — Terminal, Finder, Calculator, Clock, System Monitor, Pipes"
```

---

## Phase 4: Cleanup & Polish

### Task 18: Delete Old Settings Components

**Files:**
- Delete: `src/components/apps/settings/AccentPicker.tsx`
- Delete: `src/components/apps/settings/AppearanceTab.tsx`
- Delete: `src/components/apps/settings/DesktopTab.tsx`
- Delete: `src/components/apps/settings/DockSettings.tsx`
- Delete: `src/components/apps/settings/SystemInfo.tsx`
- Delete: `src/components/apps/settings/SoundSettings.tsx`
- Delete: `src/components/apps/settings/NotificationSettings.tsx`
- Delete: `src/components/apps/settings/AboutTab.tsx`
- Delete: `src/components/apps/settings/DataManagement.tsx`
- Delete: `src/components/apps/settings/StorageTab.tsx`
- Delete: `src/components/apps/settings/ThemeGallery.tsx`
- Delete: `src/hooks/use-accent-color.ts` (legacy DB-backed hook, replaced by new sync hooks)

- [ ] **Step 1:** Grep for imports of each deleted file across the entire codebase. Fix any remaining references before deleting.

Run: `grep -r "AccentPicker\|AppearanceTab\|DesktopTab\|DockSettings\|SystemInfo\|SoundSettings\|NotificationSettings\|AboutTab\|DataManagement\|StorageTab\|ThemeGallery\|use-accent-color" src/ --include="*.ts" --include="*.tsx" -l`

- [ ] **Step 2:** Delete all listed files.

- [ ] **Step 3:** Verify build passes.

Run: `pnpm tsc --noEmit`

- [ ] **Step 4:** Commit.

```bash
git add -A
git commit -m "refactor(settings): delete old tab components and legacy accent hook"
```

---

### Task 19: CSS Additions for New Features

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1:** Add to `globals.css`:
  - `--place-font-weight-base: 400` and `--place-font-weight-heading: 600` default values
  - `--place-line-height: 1.5` default
  - **NOTE:** Do NOT add `--place-accent-*` vars — accent color maps to existing `--place-secondary-*` scale
  - `[data-theme="light"]` rule set: invert `--place-void` to near-white, `--place-base` to light gray, surfaces to progressively lighter grays, text colors to dark/medium grays, borders to dark with low opacity
  - `[data-contrast="increased"]` rule set: boost `--place-text-primary` to 0.95 opacity, add subtle borders to interactive elements
  - `[data-contrast="high"]` rule set: solid backgrounds behind text, 2px borders on all interactive, WCAG AAA contrast ratios
  - `[data-titlebar="compact"]` and `[data-titlebar="hidden"]` rules for window chrome

- [ ] **Step 2:** Verify both dark and light mode look reasonable (light mode may need iteration — start with a working baseline).

- [ ] **Step 3:** Commit.

```bash
git add app/globals.css
git commit -m "feat(settings): CSS additions — light mode, contrast modes, titlebar styles, typography vars"
```

---

### Task 20: Integration Verification & Final Commit

- [ ] **Step 1:** Run full type check.

Run: `pnpm tsc --noEmit`

- [ ] **Step 2:** Run existing tests to check for regressions.

Run: `pnpm test 2>&1 | tail -30`

- [ ] **Step 3:** Manual smoke test in browser:
  - Open Settings app → verify sidebar loads with all 27 pages
  - Navigate to each page → verify it renders without errors
  - Change primary color → verify UI updates live
  - Change glass intensity → verify glass updates
  - Apply a theme → verify all settings change
  - Change font size → verify all text scales
  - Navigate to an app settings page → verify controls work
  - Refresh page → verify all settings persisted

- [ ] **Step 4:** Fix any issues found during smoke test.

- [ ] **Step 5:** Final commit if any fixes were made.

```bash
git add -A
git commit -m "fix(settings): integration fixes from smoke testing"
```

---

## Dependency Graph

```
Task 1 (Types & Defaults)
  ├─► Task 2 (Store Rewrite)
  └─► Task 3 (Color Utils)
        │
        └─► Task 4 (Hooks) ─► Task 5 (Controls) ─► Task 6 (Shell)
                                                       │
                              ┌─────────────────────────┤ (all parallelizable)
                              ├─► Task 7 (Colors Page)
                              ├─► Task 8 (Glass Page)
                              ├─► Task 9 (Wallpaper Page)
                              ├─► Task 10 (Typography Page)
                              ├─► Task 11 (Animations Page)
                              ├─► Task 12 (Themes Page)
                              ├─► Task 13 (Desktop Pages ×4)
                              ├─► Task 14 (System Pages ×4)
                              ├─► Task 15 (App: Productivity ×4)
                              ├─► Task 16 (App: Capture ×3)
                              └─► Task 17 (App: Utility ×6)
                                    │
                                    └─► (all pages complete)
                                          └─► Task 18 (Delete Old) ─► Task 19 (CSS) ─► Task 20 (Verify)
```

Tasks 7-17 are **parallelizable** — they only depend on the shell (Task 6) and controls (Task 5) being complete. Task 18 (Delete Old) depends on Task 6+ (new shell stops importing old components). Tasks 1-6 must be sequential.

**Deliberate spec deviations:**
- Migration runs in store's `loadSettings()` rather than a separate `useSettingsMigration` hook (cleaner, avoids hook ordering issues)
- DB sync (wa-sqlite secondary persistence) is deferred — localStorage-only for initial implementation
- `--place-accent-*` CSS scale is NOT created despite spec line 444 mentioning it — accent maps to existing `--place-secondary-*` per spec line 25
