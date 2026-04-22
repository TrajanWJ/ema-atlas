# ExecuDeck Phase 1 Scaffold - Implementation Plan

## Approach
Next.js 15 App Router + shadcn/ui + Zustand + idb-keyval. Full Phase 1: terminal runtime, page tree, split-view layout, state stores, initial bootstrap.

## Tasks

### Task 1: Initialize Next.js + Tailwind + shadcn/ui
1. Run `npx create-next-app@latest` in a temp dir, then merge into existing project (preserving existing contracts/docs/config)
2. Install shadcn/ui: `npx shadcn@latest init`
3. Install core deps: `zustand`, `idb-keyval`, `lucide-react`
4. Update tsconfig to preserve existing `@contracts/*` alias and add `@/*` alias
5. Verify: `npm run dev` starts without errors

### Task 2: Root Layout + Providers + Theme
1. Create `app/layout.tsx` with dark theme, Inter/mono fonts
2. Create `app/providers.tsx` wrapping Zustand context
3. Create `app/globals.css` with Tailwind + CSS custom properties for ExecuDeck theme tokens (dark, terminal-green accents)
4. Verify: App renders blank dark page

### Task 3: Zustand State Stores
1. Create `src/state/workspace-store.ts`: tabs[], activeTabId, mode ('terminal'|'gui'|'split'), addTab(), removeTab(), switchTab(), setMode()
2. Create `src/state/message-store.ts`: messages Record<tabId, SessionMessage[]>, addMessage(), getHistory()
3. Create `src/state/manifest-store.ts`: manifests PageManifest[], navTree NavNode[], updateManifest(), getManifest()
4. Create `src/lib/initial-state.ts`: Bootstrap EM tab, MD tab, default page tree, blank pages
5. Verify: Import stores, no TS errors

### Task 4: Layout Shell (TopBar + SplitView + StatusBar)
1. Install shadcn components: `button`, `tabs`, `tooltip`, `separator`
2. Create `src/components/layout/TopBar.tsx`: Tab bar with tab switching, add/close buttons, mode toggle (terminal/gui/split)
3. Create `src/components/layout/SplitView.tsx`: CSS Grid resizable 50/50 split, respects mode from workspace store
4. Create `src/components/layout/StatusBar.tsx`: Bottom bar showing active agent, mode, connection status
5. Create `app/page.tsx`: Compose TopBar + SplitView + StatusBar
6. Verify: Layout renders with split view, mode toggle works

### Task 5: Terminal Surface
1. Create `src/components/terminal/GrammarToken.tsx`: Styled prefix renderer for > @ # ! tokens
2. Create `src/components/terminal/MessageBlock.tsx`: Renders single OutputBlock (narrative, delegation, status, hint, reference)
3. Create `src/components/terminal/MessageList.tsx`: Scrollable list of SessionMessage[], auto-scroll to bottom
4. Create `src/components/terminal/InputBar.tsx`: Text input with command detection (/ prefix), submit handler
5. Create `src/components/terminal/TerminalSurface.tsx`: Container composing MessageList + InputBar, reads from message store by active tab
6. Verify: Terminal renders, can type messages, grammar tokens display correctly

### Task 6: Canvas Surface + Page Tree
1. Install shadcn components: `scroll-area`, `collapsible`
2. Create `src/components/canvas/PageTree.tsx`: Recursive NavNode[] tree with expand/collapse, click to select page
3. Create `src/components/canvas/PageRenderer.tsx`: Renders PageManifest root ComponentNode tree (basic: Card, TextElement stubs)
4. Create `src/components/canvas/Inspector.tsx`: Stub panel showing selected node properties
5. Create `src/components/canvas/CanvasSurface.tsx`: Container with PageTree sidebar + PageRenderer main area
6. Verify: Page tree renders initial nav structure, clicking pages shows content area

### Task 7: Persistence + Bootstrap
1. Create `src/lib/persistence.ts`: Save/load LocalStateSnapshot to IndexedDB via idb-keyval
2. Wire up auto-save on state changes (debounced)
3. Wire up bootstrap: On first load (no saved state), initialize from initial-state.ts
4. On subsequent loads, restore from IndexedDB
5. Verify: Refresh browser, state persists

### Task 8: Integration + Polish
1. Wire all surfaces into page.tsx with proper store connections
2. Ensure tab switching works across both surfaces
3. Add keyboard shortcut: Ctrl+1/2/3 for mode switching
4. Add welcome message in EM tab on first load
5. Final verify: Full layout functional, tabs switch, mode toggles, persistence works
