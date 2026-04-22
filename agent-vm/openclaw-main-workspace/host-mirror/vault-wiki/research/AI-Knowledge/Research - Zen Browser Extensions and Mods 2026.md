---
date: 2026-03-29T00:00:00.000Z
tags:
  - research
  - browser
  - zen-browser
  - firefox
  - extensions
  - productivity
status: active
type: research
wiki_id: research/AI-Knowledge/Research_-_Zen_Browser_Extensions_and_Mods_2026
imported_from: vault/Research/AI-Knowledge/Research - Zen Browser Extensions and Mods 2026.md
imported_at: '2026-04-04T00:23:56.988Z'
summary: ''
---

# Research - Zen Browser Extensions and Mods 2026

> Comprehensive catalog of Zen Mods (CSS), Firefox extensions, and integration patterns for a developer/entrepreneur running 10+ concurrent projects.

---

## How the Extension System Works

Zen is Firefox-based (Gecko engine). Every extension on addons.mozilla.org installs without modification.

**Two distinct customization layers:**
- **Zen Mods** — CSS/JS injections that modify Zen's own browser chrome (UI). Managed in Settings > Zen Mods. Install at `https://zen-browser.app/mods/[UUID]/`
- **Firefox Extensions** — standard WebExtensions that modify web page content and browser behavior. Install from [addons.mozilla.org](https://addons.mozilla.org)

**Important:** Zen has native vertical tabs, workspaces (isolated tab contexts), split view (up to 4 tiles), and Essentials (pinned tab sidebar). Extensions that replicate these features elsewhere (Tree Style Tab, Sidebery) are partially redundant — but some add value on top.

---

## Part 1: Zen Mods Catalog

Source: `github.com/zen-browser/theme-store` — 72 mods as of early 2026

### High-Priority Mods for Power Users

| Mod | UUID | What It Does |
|-----|------|-------------|
| **Sidebar Expand on Hover** | `bd92a9a0` | Collapses sidebar; expands on mouse hover — maximizes content real estate |
| **Hide Inactive Workspaces** | `803c7895` | Hides inactive workspace icons — essential with 10+ workspaces |
| **SuperPins** | `ad97bb70` | Transforms Essentials (pinned tabs) into fully customizable button-style UI |
| **Better Find Bar** | `a6335949` | Moves find bar from bottom to top; floating; theme-matched |
| **Better Unloaded Tabs** | `f7c71d9a` | Greyscale + transparent styling for suspended/unloaded tabs |
| **Zen Context Menu** | `81fcd6b3` | Declutter right-click menu; hide options you don't use |
| **smaller zen toast popup** | `e51b85e6` | Reduces "New background tab opened!" toast — fires constantly under heavy use |
| **Container Halo** | `cb5efa80` | Colored ring around tab indicating its container context |
| **Vertical Split Tab Groups** | `4c2bec61` | Display tab groups from split view as vertical lists |
| **Bleeding Corners Fix** | `7d577b21` | Fixes white outline visual bug on rounded corners |

### Tab Management Mods

| Mod | UUID | What It Does |
|-----|------|-------------|
| **Ghost Tabs** | `c01d3e22` | Unloaded tabs appear ghost-like (alternative to Better Unloaded Tabs) |
| **Better Active Tab** | `d8b79d4a` | Bright line on active tab for clearer current context |
| **Better Tab Indicators** | `664c54f9` | Alternative styling for sidebar tab state indicators |
| **Improved Collapsed Tabs** | `6437fd0d` | Cleaner collapsed tab appearance |
| **Compact tabs title** | `35f24f2c` | Shows first characters of tab title even in compact mode |
| **Tab Text Size** | `d868eaf4` | Configurable tab/folder/workspace text size |
| **Tab Numbers** | `22c9ec3b` | Shows number per tab (enables Ctrl+1…9 navigation) |
| **Only Close On Hover** | `4596d8f9` | Hides tab close button until hover |

### Layout & Navigation Mods

| Mod | UUID | What It Does |
|-----|------|-------------|
| **Super Sleek UI** | `570afd9d` | Minimalistic UI with grid-style quick access, smaller navbar |
| **Lean** | `1e86cf37` | Strips extensions, spaces, and toolbar clutter |
| **Cleaned URL bar** | `a5f6a231` | Removes visual noise from URL bar |
| **Hide Toolbar** | `e34745fd` | Hides toolbar/navbar including in single toolbar mode |
| **Zen Back Forward** | `c8d9e6e6` | Hides back/forward buttons when not needed |
| **Floating Status Bar** | `906c6915` | Detaches status bar from fixed bottom-left position |
| **Disable Status Bar** | `b51ff956` | Removes status bar on URL hover entirely |
| **No Top Sites** | `e122b5d9` | Hides top sites from URL bar dropdown |
| **sleek border** | `bc25808c` | Subtle opacity borders for refined modern look |
| **NavBar Margin** | `6c122084` | Adds top/bottom margin to navbar |
| **Better CtrlTab Panel** | `72f8f48d` | Restyled Ctrl+Tab switcher panel |

### Container & Workspace Mods

| Mod | UUID | What It Does |
|-----|------|-------------|
| **Colored container tab** | `3ff55ba7` | Changes default container tab indicator style |
| **Private Mode Highlighting** | `58649066` | Configurable background/border for private windows |

### Other Mods (Lower Priority)

| Mod | UUID | What It Does |
|-----|------|-------------|
| **Audio Indicator Enhanced** | `2317fd93` | Polished audio indicator with visualizer mode |
| **Pimp your PiP** | `599a1599` | Picture-in-Picture tweaks — useful for keeping video reference while coding |
| **Load Bar** | `ae7868dc` | Sleek loading progress bar in single toolbar mode |
| **Tab Preview Enhanced** | `87196c08` | Better tab preview respecting background color |
| **Floating History** | `253a3a74` | Floating, responsive history panel |
| **Tidy Popup** | `79dde383` | Replaces divider lines with spacers in popup panels |
| **Transparent Zen** | `642854b5` | Transparent tab background with animations (by sameerasw) |
| **Extensions List** | `181e41d4` | List view instead of grid for extensions popout |
| **Custom Statusbar** | `32aca67a` | Fine-grained status bar styling controls |

---

## Part 2: Privacy Stack

All work in Zen without modification.

| Extension | URL | What It Does | Priority |
|-----------|-----|-------------|----------|
| **uBlock Origin** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/) | Ad/tracker/malware blocker via filter lists. Mozilla Platinum award 2025. Chrome deprecated it — Firefox is now its primary home. Use Medium mode for developer control. | Essential |
| **Privacy Badger** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/privacy-badger17/) | Adaptive tracker blocking via ML heuristics (not static lists). EFF project. Complements uBlock. Blocked 65% of third-party trackers in 2024 EFF audit. | High |
| **LocalCDN** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/localcdn-fork-of-decentraleyes/) | Serves CDN libraries locally (jQuery, Bootstrap, etc.) — prevents CDN fingerprinting; speeds pages. Fork of Decentraleyes with wider library support. | High |
| **Cookie AutoDelete** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/) | Auto-deletes cookies when tab/container closes. Configure per-site allowlists. Essential pairing with Multi-Account Containers. | High |
| **ClearURLs** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/clearurls/) | Strips tracking parameters from URLs (`utm_*`, `fbclid`, etc.) silently. Mozilla Bronze award 2025. | Medium |
| **DuckDuckGo Privacy Essentials** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/duckduckgo-for-firefox/) | Tracker blocking + fingerprint protection + private search in one. Silver award 2025. Less granular than uBlock but simpler. | Optional |

**Note on HTTPS Everywhere:** Deprecated 2023. Use Firefox's native HTTPS-Only Mode at Settings > Privacy & Security instead.

---

## Part 3: Tab & Session Management

| Extension | URL | What It Does | Notes |
|-----------|-----|-------------|-------|
| **Firefox Multi-Account Containers** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) | Isolated browsing contexts per container — separate cookies, logins, history | Deep Zen integration: assign containers to Workspaces. Enable "Switch to workspace where container is set as default" in Settings > Tab Management > Workspaces. Turns Workspaces into profile-like environments. The most powerful extension in the list when combined with Zen. |
| **Tab Session Manager** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/tab-session-manager/) | Save/restore complete window+tab states; auto-save; cloud sync | Zen's tab state isn't crash-guaranteed. This adds named sessions, scheduled autosave, cross-device sync. Critical for multi-project context management. |
| **Auto Tab Discard** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/auto-tab-discard/) | Suspends inactive tabs to free RAM; per-domain exclusions | Pairs with Better Unloaded Tabs mod to make discarded tabs visually obvious. |
| **Sideberry** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/sidebery/) | Tree-style vertical tabs with hierarchical nesting + container integration | Partially redundant with Zen's native tabs — but adds true recursive nesting and more powerful container-tab grouping. Worth evaluating if you have deep tab trees. |

---

## Part 4: Keyboard Navigation (Vim-style)

Three main options. Pick one and commit.

| Extension | URL | Best For | Score |
|-----------|-----|---------|-------|
| **Tridactyl** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/tridactyl-vim/) | Committed Vim/Neovim users who want `.tridactylrc` portability and full excmd system | 7.6/10 overall, 10/10 Vim feel |
| **Vimium-FF** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/vimium-ff/) | Anyone who wants Vim navigation without configuration investment — works immediately | 8.4/10 overall |
| **Surfingkeys** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/surfingkeys_ff/) | Developers who want JS-scriptable keybindings with cross-browser support | 6.4/10 overall |

**Verdict:** Tridactyl for Neovim daily users. Vimium-FF for everyone else.

Key Tridactyl strengths: `.tridactylrc` config file (dotfile portability), per-domain key overrides, native messenger for OS-level commands.
Key Vimium-FF strengths: cleaner hint rendering, zero setup, gentle learning curve.

---

## Part 5: Developer Tools

| Extension | URL | What It Does | Relevance |
|-----------|-----|-------------|-----------|
| **React Developer Tools** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/) | Inspect React component tree, props, state, hooks; profile renders. Adds Components + Profiler tabs to DevTools. | Essential for any React project |
| **Wappalyzer** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/wappalyzer/) | Detects tech stack of any website — framework, CMS, CDN, analytics, 1000+ technologies | Competitive intelligence; rapid stack profiling before pitching or building integrations |
| **Octotree** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/octotree/) | IDE-style persistent file tree sidebar on GitHub; repo/file/issue bookmarks | Eliminates file navigation friction in large repos. Updated May 2025. |
| **Refined GitHub** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/refined-github/) | 100+ UX improvements to GitHub: diff readability, keyboard nav, PR enhancements | Complements Octotree — different pain point (interaction quality vs. navigation). Together they make GitHub feel like a proper tool. |
| **Tampermonkey** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) | Userscript manager — run custom JS on any page. 10M+ users. Find scripts at [greasyfork.org](https://greasyfork.org). Bronze award 2025. | Automate repetitive SaaS actions, scrape, inject features into tools you can't fork |
| **Web Developer** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/web-developer/) | Web dev toolbar: CSS/JS/cookie inspection, form manipulation, element outlines | Swiss Army knife for frontend debugging; especially useful for layout debugging |
| **Stylus** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/styl-us/) | Inject custom CSS into any website | Fix broken third-party dashboards/SaaS tools without forking. Complements Zen Mods (which covers browser chrome only). |

**Note on JSON viewer:** Firefox ships a capable built-in JSON viewer (syntax highlight, collapse, filter, raw view). A separate JSONView extension is usually unnecessary.

---

## Part 6: AI Extensions

Firefox 133+ has a native AI chatbot sidebar at Settings > Firefox Labs. Supports Claude, ChatGPT, Gemini, Mistral, Copilot natively — check this first.

| Extension | URL | What It Does | Notes |
|-----------|-----|-------------|-------|
| **Claude Sidebar** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/claude-sidebar/) | Access Claude from any page in a sidebar panel | Useful for per-tab Claude access vs. global Firefox sidebar |
| **AI Anywhere for ChatGPT** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/ai_anywhere/) | Alt+i hotkey opens AI panel (ChatGPT/Claude/Gemini/Perplexity/DeepSeek) | Lightweight keyboard shortcut fallback. No subscription gate — connects to your existing accounts. |
| **Sider AI** | [sider.ai](https://sider.ai/) | Multi-model AI sidebar; reads page content; chats with links/images/PDFs | Most fully-featured AI sidebar. Can summarize, translate, rewrite, pull from multiple models. |
| **Duck.ai Chat on Sidebar** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/duckduckgo-ai-chat-sidebar/) | Privacy-first AI sidebar (ChatGPT, Claude, Llama, Mixtral). Free, no account. | Best option when you want AI without queries tied to an account. |

**Recommended approach:** Enable native Firefox AI sidebar pointing at Claude. Add AI Anywhere as keyboard shortcut fallback. Skip the others unless you have a specific unmet need.

---

## Part 7: Productivity & Reading

| Extension | URL | What It Does | Priority |
|-----------|-----|-------------|----------|
| **Bitwarden** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/) | Open-source password manager, passkey support, cross-device sync. Bronze award 2025. Free tier covers passkeys. | Essential |
| **Dark Reader** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/darkreader/) | Dynamic dark mode for all websites. Silver award 2025. CPU-heavy on complex pages; highly configurable per-site. | High |
| **SponsorBlock** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/sponsorblock/) | Community-crowdsourced skip for YouTube sponsors, intros, outros, filler. Bronze award 2025. | High |
| **LanguageTool** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/languagetool/) | Grammar/spell check across all web inputs — GitHub PRs, email, docs, anywhere you type in browser | High |
| **Floccus** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/floccus/) | Bookmark sync across browsers via GitHub/Nextcloud/WebDAV — no vendor lock-in | Medium — keeps project research bookmarks in version control |
| **Group Speed Dial** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/groupspeeddial/) | Visual speed dial new tab with folders, live dials, E2E encryption, cloud sync. No tracking. | Medium — per-project start pages |
| **Web Archives** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/view-page-archive/) | Access archived versions via Wayback Machine, Archive.is | Medium — research dead links, check historical competitor pages |
| **LeechBlock NG** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/leechblock-ng/) | Block distracting sites on schedule or time budget | Medium — self-management when running your own business |
| **Return YouTube Dislike** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/return-youtube-dislikes/) | Restores YouTube dislike count. Bronze award 2025. | Low — quick quality signal before investing time |
| **SingleFile** | [AMO](https://addons.mozilla.org/en-US/firefox/addon/single-file/) | Saves complete web pages as single self-contained HTML file | Medium — research archival; preserves docs that might disappear |

**Note on read-later tools:** Pocket shut down July 2025. Omnivore shut down its free cloud tier after ElevenLabs acquisition. Current best options: Raindrop.io ([AMO](https://addons.mozilla.org/en-US/firefox/addon/raindrop-io/)) for organized bookmarks + read-later, or Instapaper ([AMO](https://addons.mozilla.org/en-US/firefox/addon/instapaper-official/)) for pure read-later.

---

## Container + Workspace Integration Pattern

This combination is purpose-built for multi-project work in Zen:

**Stack:** Multi-Account Containers + Zen Workspaces + Container Halo mod + Colored container tab mod

**Setup:**
1. Create a named Container per project (e.g., "ClientA", "SaaS Prod", "Side Project B")
2. Assign each Container as default for a Zen Workspace
3. Enable "Switch to workspace where container is set as default when opening container tabs" in Settings > Tab Management > Workspaces
4. Container Halo mod draws a colored ring around each tab for instant visual context

**Result:** Opening a link in the "ClientA" container auto-moves it to the ClientA workspace. Each workspace has isolated cookies — simultaneous login to staging vs. prod, multiple client Google accounts, etc.

---

## Recommended Stacks

### Minimum Viable (15 min setup)
uBlock Origin · Multi-Account Containers · Bitwarden · Tab Session Manager · Dark Reader · Vimium-FF

### Full Power User Stack
**Privacy:** uBlock Origin + Privacy Badger + LocalCDN + ClearURLs + Cookie AutoDelete

**Project isolation:** Multi-Account Containers + Tab Session Manager + Auto Tab Discard

**Developer:** React DevTools + Refined GitHub + Octotree + Wappalyzer + Tampermonkey + Stylus

**Productivity:** Dark Reader + SponsorBlock + LanguageTool + Floccus + LeechBlock NG

**Keyboard:** Tridactyl (if you use Neovim daily) or Vimium-FF (otherwise)

**AI:** Firefox native sidebar (Claude) + AI Anywhere for hotkey access

**Zen Mods:** Sidebar Expand on Hover · Hide Inactive Workspaces · SuperPins · Better Find Bar · Better Unloaded Tabs · Zen Context Menu · smaller zen toast popup · Container Halo · Vertical Split Tab Groups · Bleeding Corners Fix

---

## Sources

- [Zen Mods store](https://zen-browser.app/mods/)
- [zen-browser/theme-store themes.json](https://github.com/zen-browser/theme-store/blob/main/themes.json)
- [Zen Browser docs — Extensions](https://docs.zen-browser.app/user-manual/extensions)
- [Zen Browser docs — Workspaces](https://docs.zen-browser.app/user-manual/workspaces)
- [DEV.to — My Recommended Zen Mods](https://dev.to/koshirok096/my-recommended-zen-mods-plugins-bite-size-article-53j1)
- [DEV.to — How to customize Zen Browser](https://dev.to/kelvinhey/how-to-customize-zen-browser-2373)
- [Mozilla — 2025 Firefox Extension Developer Awards](https://blog.mozilla.org/addons/2025/12/17/presenting-2025-firefox-extension-developer-award-recipients/)
- [Alexandru Nedelcu — My Favorite Firefox Extensions (Mar 2025)](https://alexn.org/blog/2025/03/15/firefox-extensions/)
- [DevCtrl — Tridactyl and Surfingkeys are Vimium on Steroids](https://devctrl.blog/posts/tridactyl-surfingkeys-vimium-on-steroids/)
- [XDA Developers — Multi-Account Containers fixed my tab chaos](https://www.xda-developers.com/firefox-multi-account-containers-separate-work-life/)
- [Zen Browser GitHub — Container + Workspace issue #734](https://github.com/zen-browser/desktop/issues/734)
- [Kevin The Tech Guy — Container Tabs in Zen](https://www.kevinthetechguy.ca/p/quick-tip-using-container-tabs-in)
- [allaboutcookies — Privacy Badger vs uBlock Origin 2026](https://allaboutcookies.org/privacy-badger-vs-ublock-origin)
- [Refined GitHub on GitHub](https://github.com/refined-github/refined-github)
- [Octotree on GitHub](https://github.com/ovity/octotree)

#research #browser #firefox #zen-browser #extensions #productivity #developer-tools
