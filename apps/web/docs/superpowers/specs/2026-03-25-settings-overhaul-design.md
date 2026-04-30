# Settings & Customization Overhaul

**Date:** 2026-03-25
**Status:** Approved
**Scope:** Complete replacement of the Settings app — 27 pages, 142 settings, 8 built-in themes, per-user persistence, per-app settings

## Overview

Replace the existing flat-tab Settings app with a professional sidebar+detail-panel layout. Add dual-color system (primary + accent), expanded glass controls, typography settings, theme presets, per-app settings for all 13 configurable apps, wallpaper file upload with virtual filesystem integration, and live preview of all changes.

The existing 8-tab settings with ~17 settings becomes 27 pages with 142 settings organized into 4 categories: Look & Feel (6), Desktop (4), System (4), App Settings (13).

### Relationship to Existing Theme System

The codebase already has a token-based theme system (`src/lib/theme-presets.ts`) with 10 community-recognized themes (Nord, Catppuccin Mocha, Dracula, Tokyo Night, Rose Pine, Solarized Dark, Gruvbox Dark, One Dark, Monochrome, plus the default Midnight Teal). These themes set CSS custom properties directly via a `tokens: Record<string, string>` pattern.

**Decision: Keep and extend the existing themes.** The 10 existing themes are retained. Each theme is enhanced to also carry non-token settings (glass intensity, wallpaper, font family, animations, etc.) as an optional `settings: Partial<SettingsState>` alongside the existing `tokens` map. This is additive — existing theme application (setting CSS vars) continues to work, but themes can now also configure the broader settings surface. The 8 "mood" themes from the brainstorm (Midnight, Polar, Ember, Terminal, Sakura, Ocean, Neon) become additional entries, bringing the total to 17+ built-in themes.

### CSS Variable Naming

The existing CSS uses `--place-primary-*` for the main teal color and `--place-secondary-*` for the blue accent. This mapping is preserved:
- `primaryColor` (settings) → `--place-primary-*` CSS vars (via `useAccentSync`, renamed to `usePrimarySync`)
- `accentColor` (settings) → `--place-secondary-*` CSS vars (via new `useAccentSync` hook)

No new `--place-accent-*` scale is introduced — the accent color maps to the existing `--place-secondary-*` scale. The `buildTokens` helper in `theme-presets.ts` already generates both scales.

### Apps Excluded from App Settings

The following apps have no configurable settings page: `settings` (self), `about-place`, `about-trajan` (static content), `photos`, `documents`, `canvas`, `rss` (not yet built or too simple). If these apps gain configurable behavior later, pages can be added.

## Architecture

### Layout

Sidebar + detail panel. Sidebar has grouped categories (Look & Feel, Desktop, System, App Settings) with icons. Each sidebar item navigates to a scrollable detail panel on the right. Live preview strip at top indicates changes apply instantly.

Sidebar groups use collapsible headers with icon + label per item. Active item highlighted with accent color. Detail panel has icon header + description per page, settings organized into titled groups.

### Settings Store Expansion

**File:** `src/stores/settings-store.ts` — complete rewrite.

The store expands from ~17 fields to ~142 fields organized into sections. App settings are nested under an `app` key with per-app objects.

```typescript
interface SettingsState {
  // Colors
  primaryColor: string          // hex, default '#2DD4A8'
  accentColor: string           // hex, default '#6B95F0'
  autoPrimaryFromWallpaper: boolean // default false
  colorMode: 'dark' | 'light' | 'auto' // default 'dark'
  contrast: 'standard' | 'increased' | 'high' // default 'standard'

  // Wallpaper
  wallpaper: string             // id or 'custom', default 'default'
  customWallpaperUrl: string | null
  wallpaperOpacity: number      // 0-1, default 0.85
  wallpaperFit: 'cover' | 'contain' | 'fill' | 'tile' // default 'cover'
  wallpaperTint: boolean        // default false
  wallpaperTintOpacity: number  // 0.1-0.8, default 0.3

  // Glass & Blur
  glassIntensity: number        // 0-3, default 1.3
  blurAmount: number | null     // 0-40px or null (auto: tier_base_blur * glassIntensity), default null
  glassTint: number             // 0-0.5, default 0.05
  glassSaturation: number       // 0.5-2.0, default 1.0

  // Typography
  fontSize: number              // 12-20px, default 16
  fontFamily: string            // default 'system-ui'
  fontWeight: 300 | 400 | 500   // default 400
  lineSpacing: 'compact' | 'comfortable' | 'spacious' // default 'comfortable'

  // Animations
  bgAnimation: string           // default 'dots-connect'
  bgAnimationSpeed: number      // 0.1-2, default 0.8
  bgAnimationInteractive: boolean // default true
  windowTransitionStyle: 'scale' | 'fade' | 'slide' | 'flip' // default 'scale'
  reducedMotion: boolean | 'system' // default 'system'
  bootAnimation: boolean        // default true
  bootSpeed: 'normal' | 'fast' | 'instant' // default 'normal'

  // Dock
  dockPosition: 'bottom' | 'left' | 'right' // default 'bottom'
  dockSize: 'small' | 'medium' | 'large' // default 'medium'
  dockMagnification: boolean    // default true
  dockMagnificationScale: number // 1.2-2.0, default 1.5
  dockAutoHide: boolean         // default false
  dockSpacing: number           // 2-12px, default 4
  dockShowLabels: boolean       // default false
  dockRunningIndicators: boolean // default true

  // Windows
  windowCornerRadius: number    // 0-28px, default 14
  windowShadows: boolean        // default true
  windowAnimations: boolean     // default true
  inactiveWindowOpacity: number // 0.5-1.0, default 1.0
  snapZones: boolean            // default true
  titleBarStyle: 'default' | 'compact' | 'hidden' // default 'default'
  doubleClickTitleBar: 'maximize' | 'minimize' | 'shade' // default 'maximize'

  // Desktop
  showDesktopIcons: boolean     // default true
  desktopIconSize: number       // 32-72px, default 48
  desktopGridSpacing: number    // 60-120px, default 90
  desktopSortOrder: 'manual' | 'alphabetical' | 'type' | 'recent' // default 'manual'
  virtualDesktopsEnabled: boolean // default false

  // Launcher
  launcherStyle: 'spotlight' | 'fullscreen' // default 'spotlight'
  launcherRecentCount: number   // 0-8, default 4
  launcherGridColumns: number   // 3-8, default 5
  launcherShowCategories: boolean // default true

  // Sound
  masterVolume: number          // 0-1, default 0.5
  volumeUI: number              // 0-1, default 0.7
  volumeNotifications: number   // 0-1, default 0.7
  volumeMusic: number           // 0-1, default 0.7
  soundPack: string             // default 'default'

  // Sound (migrated from desktopStore)
  soundEnabled: boolean         // default true — migrated from desktopStore.soundEnabled

  // Notifications
  notificationBadges: boolean   // default true
  notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' // default 'top-right'
  notificationApps: Partial<Record<AppId, boolean>> // per-app toggles, typed to known app IDs

  // App Settings (nested)
  app: {
    focus: FocusSettings
    tasks: TasksSettings
    journal: JournalSettings
    habits: HabitsSettings
    brainDump: BrainDumpSettings
    notes: NotesSettings
    music: MusicSettings
    terminal: TerminalSettings
    finder: FinderSettings
    calculator: CalculatorSettings
    clock: ClockSettings
    systemMonitor: SystemMonitorSettings
    pipes: PipesSettings
  }
}
```

### Per-App Settings Types

```typescript
interface FocusSettings {
  defaultDuration: number       // 5-120 min, default 25
  defaultBreak: number          // 1-30 min, default 5
  longBreak: number             // 5-60 min, default 15
  sessionsBeforeLongBreak: number // 2-8, default 4
  autoStartBreaks: boolean      // default true
  autoStartFocus: boolean       // default false
  keepAwake: boolean            // default true
  dimOtherWindows: boolean      // default false
  dimOpacity: number            // 0.3-0.8, default 0.5
  completeSound: string         // default 'bell'
  tickSound: boolean            // default false
  tickVolume: number            // 0-1, default 0.3
  linkTask: boolean             // default true
  autoJournal: boolean          // default false
}

interface TasksSettings {
  defaultView: 'list' | 'kanban' // default 'list'
  completedBehavior: 'show' | 'fade' | 'hide' // default 'fade'
  sortOrder: 'manual' | 'priority' | 'due-date' | 'created' | 'alphabetical' // default 'manual'
  showSubtaskProgress: boolean  // default true
  confirmDelete: boolean        // default true
  autoArchive: boolean          // default false
  autoArchiveDays: number       // 1-30, default 7
  quickAddPosition: 'top' | 'bottom' // default 'top'
}

interface JournalSettings {
  defaultMode: 'write' | 'split' | 'preview' // default 'write'
  font: 'system' | 'serif' | 'mono' // default 'system'
  spellCheck: boolean           // default true
  template: string              // default daily template
  showMoodPicker: boolean       // default true
  showOneThing: boolean         // default true
  reminder: boolean             // default false
  reminderTime: string          // HH:mm, default '21:00'
}

interface HabitsSettings {
  defaultView: 'daily' | 'week' | 'month' | 'streaks' // default 'daily'
  weekStart: 'monday' | 'sunday' // default 'monday'
  streakAnimations: boolean     // default true
  dayResetTime: string          // HH:mm, default '00:00'
  allowBackfill: boolean        // default true
  reminder: boolean             // default false
  reminderTime: string          // HH:mm, default '20:00'
}

interface BrainDumpSettings {
  defaultView: 'queue' | 'kanban' // default 'queue'
  quickCaptureShortcut: string  // default 'ctrl+shift+space'
  autoCategorize: boolean       // default true
  captureSound: boolean         // default true
  sendToDefault: string         // default 'ask'
}

interface NotesSettings {
  autoSave: boolean             // default true
  autoSaveInterval: number      // 1-30s, default 3
  defaultFormat: 'markdown' | 'plaintext' // default 'markdown'
  font: string                  // default 'mono'
  wordWrap: boolean             // default true
  lineNumbers: boolean          // default false
}

interface MusicSettings {
  defaultStation: string        // default first station
  autoPlayOnFocus: boolean      // default false
  pauseOnBreak: boolean         // default false
  crossfade: boolean            // default true
  crossfadeDuration: number     // 1-5s, default 2
  visualizer: 'bars' | 'wave' | 'circular' | 'none' // default 'bars'
}

interface TerminalSettings {
  font: string                  // default 'JetBrains Mono'
  fontSize: number              // 10-20px, default 13
  colorScheme: string           // default 'default'
  cursorStyle: 'block' | 'underline' | 'bar' // default 'block'
  cursorBlink: boolean          // default true
  scrollback: number            // 100-10000, default 1000
}

interface FinderSettings {
  defaultView: 'grid' | 'list' | 'columns' // default 'grid'
  showHidden: boolean           // default false
  thumbnailSize: 'small' | 'medium' | 'large' | 'xlarge' // default 'medium'
  sortBy: 'name' | 'date' | 'size' | 'type' // default 'name'
  previewPanel: boolean         // default false
}

interface CalculatorSettings {
  defaultMode: 'basic' | 'scientific' | 'programmer' // default 'basic'
  thousandsSeparator: boolean   // default true
  decimalPlaces: number         // 0-10, default 6
  showHistory: boolean          // default true
}

interface ClockSettings {
  format: '12h' | '24h'        // default '12h'
  showSeconds: boolean          // default true
  worldClocks: Array<{ zone: string; label: string }> // default []
  style: 'digital' | 'analog' | 'minimal' // default 'digital'
}

interface SystemMonitorSettings {
  refreshInterval: number       // 1-30s, default 5
  chartStyle: 'line' | 'bar' | 'gauge' // default 'line'
  showInMenuBar: boolean        // default false
}

interface PipesSettings {
  autoRun: boolean              // default true
  debugMode: boolean            // default false
  maxExecutionTime: number      // 5-120s, default 30
  notifyOnComplete: boolean     // default true
}
```

### Per-User Persistence

Settings persist per-user through two mechanisms:

1. **Zustand + localStorage (primary, fast):** Store key scoped as `place-settings-{userId}`. The existing `userKey()` utility in `src/lib/user-storage.ts` handles scoping. On hydration, reads the user-scoped key. On sign-out, dehydrates. On sign-in, rehydrates from new user's key.

2. **wa-sqlite DB (secondary, durable):** The `settings` table uses key-prefix scoping — `src/db/queries/settings.ts` prepends `{userId}:` to keys via `scopedKey()`. There is no `user_id` column on the settings table (unlike other tables that got `user_id` in migrations 8-9). This key-prefix approach is retained for compatibility. App settings stored as JSON blobs: key = `app.{appId}`, value = JSON object.

3. **Custom themes:** Stored in DB: key = `custom-theme-{themeId}`, value = JSON of theme config + base64 thumbnail. Scoped by `user_id`.

4. **Uploaded files:** Stored in OPFS under `/users/{userId}/photos/wallpapers/`. File references use `opfs://` scheme URIs resolved at render time.

**Sync flow:** Settings write to localStorage immediately (instant reactivity) and async-write to DB (durability). On app load, localStorage is checked first; if empty (new device), DB is queried and localStorage is populated.

### Migration

- Rename current `accentColor` store field to `primaryColor`
- Add new `accentColor` field with default `#6B95F0`
- Convert `fontSize` from `'small'|'medium'|'large'` enum to number (small=14, medium=16, large=18)
- All new fields get defaults — existing users see no changes until they visit settings
- Old settings store shape is detected and migrated on first hydration via Zustand `version` + `migrate` function

## Themes System

### Built-In Themes (17+)

The existing 10 token-based themes are retained and extended. Each theme already has `tokens: Record<string, string>` (CSS vars) and `preview` colors. Themes are enhanced with an optional `settings` field for non-token appearance settings.

A theme is applied in two steps: (1) apply CSS tokens to `:root` (existing behavior), (2) apply settings overrides to the settings store (new behavior). A confirmation dialog is shown first.

**Extended theme type (extends existing `ThemePreset` from `theme-presets.ts`):**
```typescript
interface ThemePreset {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly tokens: Record<string, string> // existing — CSS custom properties
  readonly preview: { void: string; surface: string; primary: string; secondary: string; text: string } // existing
  readonly settings?: Partial<Omit<SettingsState, 'app'>> // NEW — non-token appearance settings
  readonly wallpaperGradient?: string // NEW — CSS gradient for generated wallpapers
}
```

**Existing themes (tokens only, no settings overrides needed — colors/surfaces are fully defined by tokens):**
1. Midnight Teal (default) — #2DD4A8 / #6B95F0
2. Nord — #88C0D0 / #5E81AC
3. Catppuccin Mocha — #CBA6F7 / #89B4FA
4. Dracula — #BD93F9 / #8BE9FD
5. Tokyo Night — #7AA2F7 / #BB9AF7
6. Rose Pine — #EBBCBA / #C4A7E7
7. Solarized Dark — #2AA198 / #268BD2
8. Gruvbox Dark — #B8BB26 / #83A598
9. One Dark — #61AFEF / #C678DD
10. Monochrome — #FFFFFF / #888888

**New mood themes (tokens + settings overrides for glass/animation/typography/dock/windows):**

| Theme | Primary | Accent | Mode | Glass (intensity/blur/tint/sat) | Animation | Font | Radius | Dock | Titlebar |
|-------|---------|--------|------|-------|-----------|------|--------|------|----------|
| Midnight | #8B5CF6 | #6366F1 | dark | 2.0/20/0.15/0.8 | aurora 0.4 | Inter 300 | 18 | bottom M | compact |
| Polar | #0EA5E9 | #0284C7 | light | 1.0/12/0.02/1.2 | particles 0.5 | Inter 400 | 12 | bottom M | default |
| Ember | #DC2626 | #F59E0B | dark | 1.5/14/0.12/1.5 | fireflies 0.6 | system-ui 400 | 16 | bottom M | default |
| Terminal | #22C55E | #16A34A | dark | 0/0/0/1.0 | matrix 1.0 | JetBrains Mono 400 | 2 | left S | compact |
| Sakura | #F43F5E | #E879F9 | dark | 1.6/16/0.1/1.3 | particles 0.3 | Inter 300 | 20 | bottom M | default |
| Ocean | #0EA5E9 | #2DD4A8 | dark | 1.4/16/0.1/1.6 | waves 0.5 | system-ui 400 | 14 | bottom M | default |
| Neon | #A855F7 | #EC4899 | dark | 1.2/10/0.2/2.0 | starfield 1.2 | Space Grotesk 500 | 10 | bottom L | hidden |

### Custom Themes

- "Save Current as Theme" captures all appearance settings + desktop screenshot as thumbnail
- Custom themes stored in DB with `custom-theme-{id}` key, scoped by user_id
- Import/export as `.place-theme` JSON files with Zod schema validation
- Custom themes appear above built-in themes in the gallery

## Component Structure

### New Files

```
src/components/apps/settings/
  SettingsApp.tsx              — rewrite: sidebar + detail panel layout
  SettingsSidebar.tsx          — sidebar navigation with grouped items
  SettingsPage.tsx             — generic detail panel wrapper (icon header + sections)

  pages/
    ColorsPage.tsx             — dual color pickers, mode, contrast, presets
    WallpaperPage.tsx          — gallery, upload, URL, display options
    GlassPage.tsx              — intensity, blur, tint, saturation, presets
    TypographyPage.tsx         — font size/family/weight/spacing with preview
    AnimationsPage.tsx         — bg animation, window transitions, motion prefs
    ThemesPage.tsx             — gallery, save custom, import/export
    DockPage.tsx               — position, size, behavior, pinned apps
    WindowsPage.tsx            — radius, shadows, snap, titlebar, transitions
    DesktopPage.tsx            — icons, grid, virtual desktops
    LauncherPage.tsx           — style, recent apps, grid, categories
    SoundPage.tsx              — volumes, sound pack
    NotificationsPage.tsx      — global, per-app, position, badges
    DataPage.tsx               — export, import, storage, selective reset
    AboutPage.tsx              — version, tech stack, capabilities, shortcuts

  app-pages/
    FocusSettingsPage.tsx      — timer defaults, behavior, sounds, integrations
    TasksSettingsPage.tsx      — views, sorting, completed behavior, archive
    JournalSettingsPage.tsx    — editor, templates, mood/onething, reminders
    HabitsSettingsPage.tsx     — views, week start, streaks, day reset, backfill
    BrainDumpSettingsPage.tsx  — views, quick capture, categorize, send-to
    NotesSettingsPage.tsx      — auto-save, format, font, wrap, line numbers
    MusicSettingsPage.tsx      — station, focus integration, crossfade, visualizer
    TerminalSettingsPage.tsx   — font, colors, cursor, scrollback
    FinderSettingsPage.tsx     — views, hidden files, thumbnails, sort, preview
    CalculatorSettingsPage.tsx — mode, number formatting, history
    ClockSettingsPage.tsx      — format, seconds, world clocks, style
    SystemMonitorSettingsPage.tsx — refresh, chart style, menu bar
    PipesSettingsPage.tsx      — auto-run, debug, timeout, notifications

  controls/
    ColorPicker.tsx            — HSL hue rail + sat/lightness pad + hex input + swatch history
    RangeSlider.tsx            — styled slider with labels, tick marks, value display
    SegmentedControl.tsx       — animated sliding indicator segmented buttons
    ToggleWithSub.tsx          — toggle that reveals sub-controls when enabled
    PresetCards.tsx             — horizontal scrollable visual preset cards
    KeyRecorder.tsx            — click-to-record keyboard shortcut input
    FileDropZone.tsx           — drag-and-drop + click file upload zone
    MiniPreview.tsx            — tiny live preview widgets (window, glass, etc.)

src/lib/
  color-presets.ts             — color preset data (8 presets)
  theme-presets.ts             — built-in theme definitions (8 themes)
  settings-migration.ts        — migration logic for old → new settings shape
  color-utils.ts               — HSL conversion, shade generation, wallpaper color extraction
```

### Deleted Files

All current settings tab/component files are replaced:
- `AccentPicker.tsx` → replaced by `ColorPicker.tsx`
- `AppearanceTab.tsx` → replaced by `ColorsPage.tsx` + `WallpaperPage.tsx`
- `DesktopTab.tsx` → replaced by `DesktopPage.tsx` + `WindowsPage.tsx`
- `DockSettings.tsx` → replaced by `DockPage.tsx`
- `SystemInfo.tsx` → replaced by `AboutPage.tsx`
- `SoundSettings.tsx` → replaced by `SoundPage.tsx`
- `NotificationSettings.tsx` → replaced by `NotificationsPage.tsx`
- `AboutTab.tsx` → replaced by `AboutPage.tsx`
- `DataManagement.tsx` → replaced by `DataPage.tsx`
- `StorageTab.tsx` → functionality merged into `DataPage.tsx` (storage usage bar + per-folder breakdown)
- `ThemeGallery.tsx` → replaced by `ThemesPage.tsx` (enhanced with settings overrides + custom themes)

### Hooks

**Modified:**
- `useAccentSync` → renamed to `usePrimarySync`, generates `--place-primary-*` vars from `primaryColor`
- `useGlassIntensity` → expanded to also apply `glassTint` and `glassSaturation`
- `useFontSize` → reads number instead of enum
- `useWindowRadius` → expanded range 0-28

**New:**
- `useAccentSync` (new) — generates `--place-secondary-*` CSS variable scale from `accentColor` (maps to existing secondary scale)
- `useFontFamily` — sets `--place-font-sans` from `fontFamily` setting
- `useFontWeight` — sets `--place-font-weight-base` and `--place-font-weight-heading`
- `useLineSpacing` — sets `--place-line-height`
- `useColorMode` — toggles `data-theme` attribute, listens to `prefers-color-scheme`
- `useContrast` — sets `data-contrast` attribute, overrides text opacity vars
- `useWallpaperTint` — manages `::after` overlay on wallpaper container
- `useWallpaperFit` — sets `background-size` + `background-repeat`
- `useAutoAccent` — wallpaper color extraction via canvas + k-means clustering
- `useInactiveWindowOpacity` — dims unfocused windows
- `useTitleBarStyle` — sets `data-titlebar` on windows
- `useSettingsMigration` — runs once on hydration, migrates old shape to new

### CSS Changes

**globals.css additions:**
- `--place-accent-*` scale (7 shades + 3 alpha variants) — parallel to `--place-primary-*`
- `--place-font-weight-base`, `--place-font-weight-heading`
- `--place-line-height`
- `data-theme="light"` rule set — inverted surface scale, dark text colors
- `data-contrast="increased"` and `data-contrast="high"` rule sets
- `data-titlebar="compact"` and `data-titlebar="hidden"` rules

## Control Components

### ColorPicker

Full HSL picker:
- Horizontal hue rail (0-360) at bottom — 100% width, 20px tall
- Square saturation/lightness pad above (200x200px) — X=saturation, Y=lightness
- Hex text input with paste support (validates on blur)
- RGB text inputs (3 narrow fields)
- Swatch history strip — last 8 colors, stored per-user in settings

### RangeSlider

Styled replacement for native range input:
- Custom track (4px tall, `--place-surface-3`)
- Custom thumb (14px circle, accent color)
- Optional tick marks at labeled stops
- Optional value label (right-aligned or above thumb)
- Optional min/max labels
- Props: `min`, `max`, `step`, `value`, `ticks`, `showValue`, `formatValue`

### SegmentedControl

Animated selection indicator:
- Flex row of buttons, equal width
- Sliding background indicator behind active segment (framer-motion `layoutId`)
- Each option can have icon + text or text only
- Props: `options: Array<{value, label, icon?}>`, `value`, `onChange`

### FileDropZone

Drag-and-drop upload:
- Dashed border container, 150px tall
- Accepts specified MIME types
- Shows drag-over highlight state
- Progress bar during upload
- Saves to OPFS via `src/lib/file-system.ts`
- Props: `accept`, `maxSize`, `onUpload`, `path` (OPFS destination)

## Pages — Detailed Implementation

### 1. Colors Page

**Sections:**
- Primary Color: `ColorPicker` bound to `primaryColor`
- Accent Color: `ColorPicker` bound to `accentColor`
- Auto-Primary from Wallpaper: `ToggleWithSub` — when enabled, disables primary picker with "Controlled by wallpaper" overlay. Extraction uses canvas `drawImage` + `getImageData`, k-means clustering (k=5), picks cluster with highest `saturation * luminance`.
- Appearance: `SegmentedControl` — dark/light/auto. Auto listens to `matchMedia('(prefers-color-scheme: dark)')`.
- Contrast: `SegmentedControl` — standard/increased/high.
- Color Presets: `PresetCards` — 8 curated primary+accent combos as gradient swatches.

### 2. Wallpaper Page

**Sections:**
- Gallery: Category tabs (Abstract, Nature, Gradient, Minimal, Dark) + thumbnail grid (120x80px). Click applies instantly. Expand to 15+ wallpapers.
- Upload File: `FileDropZone` accepting jpg/png/webp/gif, max 10MB. Saves to OPFS `/users/{userId}/photos/wallpapers/`. Generates 200px thumbnail on upload.
- Custom URL: Text input with paste detection + 120x80 preview + "Apply" button.
- Photos Folder Browser: Compact grid of uploaded thumbnails (80x60px). Click to apply. Right-click context menu. "View all in Finder" link.
- Opacity: `RangeSlider` 0-100%.
- Fit: `SegmentedControl` — cover/contain/fill/tile with mini visual icons.
- Tint: `ToggleWithSub` — enable + opacity slider (10-80%). Applies `::after` with primary color + `mix-blend-mode: overlay`.

### 3. Glass & Blur Page

**Sections:**
- Glass Intensity: `RangeSlider` 0-3x with named stops (None/Subtle/Standard/Frosted/Heavy/Max).
- Blur Amount: `RangeSlider` 0-40px. Override mode — when set, bypasses intensity-derived blur.
- Glass Tint: `RangeSlider` 0-50%. Adds primary color into glass surfaces via `color-mix()`.
- Glass Saturation: `RangeSlider` 50-200%. Applies `backdrop-filter: saturate(X)`.
- Glass Style Presets: `PresetCards` — 5 presets (Frosted/Crystal/Smoky/Transparent/Neon), each rendered as actual glass surface over colorful strip. Click sets all 4 values.

### 4. Typography Page

**Sections:**
- Font Size: `RangeSlider` 12-20px with named stops. Live preview text block below.
- Font Family: Dropdown where each option renders in its own font. Options: System Default, Inter, JetBrains Mono, IBM Plex Sans, Space Grotesk, Geist. Fonts loaded with `font-display: swap`.
- Font Weight: `SegmentedControl` — Light(300)/Regular(400)/Medium(500). Headings auto-offset +200.
- Line Spacing: `SegmentedControl` — Compact(1.3)/Comfortable(1.5)/Spacious(1.7).

### 5. Animations Page

**Sections:**
- Background Animation Type: Grid of 100x70px cards, each running miniature live canvas preview. Types: Dots Connect, Particles, Waves, Matrix Rain, Aurora, Starfield, Fireflies, None.
- Animation Speed: `RangeSlider` 0.1-2x.
- Interactive Particles: Toggle.
- Window Transition Style: 4-way selector with tiny animated preview on hover. Options: Scale/Fade/Slide/Flip.
- Reduced Motion: Toggle with "(System)" label when OS requests it. Master kill-switch for all animations.
- Boot Animation: Toggle + speed selector (Normal/Fast/Instant).

### 6. Themes Page

**Sections:**
- Theme Gallery: Grid of 160x120px cards with mini desktop mockups. 8 built-in themes. Click shows confirmation dialog then applies all appearance values.
- Custom Themes: Saved themes appear above built-in with "Custom" badge. Rename/delete on right-click.
- Save Current as Theme: Button → inline popover with name input + "Save". Captures desktop screenshot as thumbnail.
- Import/Export: Import accepts `.place-theme` JSON with Zod validation + preview. Export serializes to `.place-theme` download.

### 7. Dock Page

**Sections:**
- Position: 3 mini-screen visual selectors (bottom/left/right).
- Icon Size: `SegmentedControl` S(36)/M(44)/L(56)px.
- Icon Spacing: `RangeSlider` 2-12px.
- Magnification: `ToggleWithSub` — toggle + intensity slider 1.2-2.0x.
- Auto-Hide: Toggle.
- Show Labels: Toggle.
- Running Indicators: Toggle.
- Pinned Apps Manager: Drag-and-drop list with grip handles + X remove + "Add App" popover.

### 8. Windows Page

**Sections:**
- Corner Radius: `RangeSlider` 0-28px with tiny live window preview.
- Shadows: Toggle.
- Inactive Window Opacity: `RangeSlider` 50-100%.
- Snap Zones: Toggle.
- Title Bar Style: `SegmentedControl` — Default/Compact/Hidden.
- Double-Click Title Bar: Dropdown — Maximize/Minimize/Shade.
- Window Animations: Toggle.

### 9. Desktop Page

**Sections:**
- Show Desktop Icons: Toggle.
- Icon Size: `RangeSlider` 32-72px.
- Grid Spacing: `RangeSlider` 60-120px.
- Sort Order: Dropdown — Manual/Alphabetical/By Type/Recent.
- Virtual Desktops: `ToggleWithSub` — toggle + inline desktop manager (list with add/remove).

### 10. Launcher Page

**Sections:**
- Launcher Style: `SegmentedControl` — Spotlight/Full Screen.
- Recent Apps: `RangeSlider` 0-8.
- Grid Columns: `RangeSlider` 3-8 (visible only when fullscreen style).
- Show Categories: Toggle.

### 11. Sound Page

**Sections:**
- Master Sound: Toggle (existing `desktopStore.soundEnabled`).
- Master Volume: `RangeSlider` 0-100%.
- Category Volumes: 3 sliders (UI/Notifications/Music) 0-100%.
- Sound Pack: Dropdown with preview buttons. Packs: Default, Mechanical, Soft, Sci-Fi, Silent.

### 12. Notifications Page

**Sections:**
- Master Toggle.
- Badge Count: Toggle.
- Position: 4 mini-screen visual selectors (corners).
- Per-App Toggles: List of notification-capable apps with individual toggles.

### 13. Data & Storage Page

**Sections:**
- Export All Data: Button → JSON download.
- Import Data: File picker → preview → confirmation.
- Storage Usage: Segmented horizontal bar (DB/OPFS/localStorage/cache) with legend.
- Selective Reset: Category buttons (Appearance/App Data/Files/Factory Reset) with confirmation. Factory Reset requires typing "RESET".

### 14. About Page

**Sections (read-only):**
- Version & Build info.
- Tech Stack list.
- Browser Capabilities with green/red indicators.
- Device Info.
- Keyboard Shortcuts expandable list.

### App Settings Pages (15-27)

Each app settings page follows the same pattern: icon header, grouped sections, controls bound to `settingsStore.app.{appId}.{setting}`. Full setting definitions are in the Per-App Settings Types section above.

All app settings pages are lazy-loaded — component code is only imported when the user navigates to that page.

## Live Preview

All changes apply instantly to the desktop behind the Settings window. The settings window shows a "Live Preview" indicator strip at the top with a pulsing green dot.

Implementation: Every setting change triggers the corresponding hook (or direct CSS variable update). The settings window itself uses the same glass/color/typography as the rest of the OS, so it also updates in real-time.

For wallpaper changes, the wallpaper container updates its `background-image` immediately. For glass changes, the settings window's own glass surface updates (since it uses the same CSS variables). For color changes, the accent-colored elements in the settings UI itself change color.

## Migration Detail

The settings store uses Zustand's `version` + `migrate` pattern:

```typescript
// version 1 → version 2 migration
function migrate(persisted: unknown, version: number): SettingsState {
  const old = persisted as Record<string, unknown>
  if (version < 2) {
    // Rename accentColor → primaryColor, add new accentColor
    old.primaryColor = old.accentColor ?? '#2DD4A8'
    old.accentColor = '#6B95F0'
    // Convert fontSize enum to number
    const fontMap = { small: 14, medium: 16, large: 18 }
    if (typeof old.fontSize === 'string') {
      old.fontSize = fontMap[old.fontSize as keyof typeof fontMap] ?? 16
    }
    // Migrate soundEnabled from desktopStore
    // (read from desktopStore localStorage on first hydration)
    old.soundEnabled = old.soundEnabled ?? true
  }
  // All new fields get defaults via spread with DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...old } as SettingsState
}
```

The `FontSize` type was previously exported — any downstream imports must be updated to use `number` instead.

## Performance Considerations

With 142 settings and multiple hooks reacting to changes, rapid slider drags could cause write amplification. Mitigations:

1. **Debounced localStorage writes:** The store's `persist` middleware writes to localStorage on a 100ms debounce during active slider interaction (using `requestAnimationFrame`).
2. **CSS updates via RAF:** Hooks that set CSS variables (color sync, glass intensity, etc.) batch updates into a single `requestAnimationFrame` callback.
3. **Lazy-loaded app settings pages:** Each app settings page component is loaded via `React.lazy()` — only imported when the user navigates to that page.

## Accessibility

- ColorPicker: keyboard-navigable hue rail (arrow keys) and sat/lightness pad (arrow keys for both axes). ARIA labels on all interactive regions.
- RangeSlider: proper `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (formatted value).
- SegmentedControl: `role="radiogroup"` with `role="radio"` children, arrow-key navigation.
- Sidebar: `role="navigation"` with `aria-current="page"` on active item. Arrow-key navigation between items.
- All setting labels linked to controls via `htmlFor`/`id` or `aria-labelledby`.

## Testing Strategy

- Unit tests for settings store (migration, persistence, defaults)
- Unit tests for color utility functions (HSL conversion, shade generation, k-means)
- Component tests for each control (ColorPicker, RangeSlider, SegmentedControl, FileDropZone)
- Integration test: apply theme → verify all CSS variables set correctly
- Integration test: change user → verify settings reload
