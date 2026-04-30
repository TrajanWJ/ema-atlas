/**
 * Re-reads all user-scoped stores after an auth change.
 *
 * Zustand stores initialize at module load time (before auth is known).
 * Call this after login/signup/logout so every store picks up the
 * correct user's persisted data.
 *
 * NOTE: DB-backed stores (inbox, tasks, habits, notes, sticky) are NOT
 * reloaded here — the DB worker may not be ready yet (loadSession fires
 * before DB init). Instead, each app component re-loads its store on mount,
 * and we schedule a deferred DB reload below.
 */

import { useSettingsStore } from '@/src/stores/settings-store';
import { useDockStore } from '@/src/stores/dock-store';
import { useLauncherStore } from '@/src/stores/launcher-store';
import { useVirtualDesktopStore } from '@/src/stores/virtual-desktop-store';
import { useWorkspaceStore } from '@/src/stores/workspace-store';
import { useWindowStore } from '@/src/stores/window-store';
import { useStickyStore } from '@/src/stores/sticky-store';
import { useInboxStore } from '@/src/stores/inbox-store';
import { useTaskStore } from '@/src/stores/task-store';
import { useHabitStore } from '@/src/stores/habit-store';
import { useNotesStore } from '@/src/stores/notes-store';
import { useFileStore } from '@/src/stores/file-store';

export function rehydrateUserStores(): void {
	// localStorage-backed stores — safe to reload immediately
	useSettingsStore.getState().rehydrate();
	useDockStore.getState().rehydrate();
	useLauncherStore.getState().rehydrate();
	useVirtualDesktopStore.getState().rehydrate();
	useWorkspaceStore.getState().rehydrate();
	useWindowStore.getState().rehydrate();

	// DB-backed stores — schedule after DB has time to initialize.
	// The DB worker init is triggered by the first db.query()/db.exec() call
	// and takes ~200-500ms for WASM+OPFS. We defer so we don't race it.
	scheduleDbReload();
}

function scheduleDbReload(): void {
	// Use setTimeout to let the boot sequence's DB init complete first.
	// Each store's load() internally calls db.init() (idempotent) so
	// even if the DB isn't ready yet, the await will wait for it.
	setTimeout(() => {
		// Skip DB-backed loads in static export contexts (Tauri .app, file://)
		// where there's no Node server backing the /api/db endpoint. The
		// store calls would 404 cascade and pollute the console; under
		// Tauri the daemon owns this data anyway (Wave II).
		if (isStaticExportContext()) {
			return;
		}
		void useInboxStore.getState().load().catch(() => {});
		void useTaskStore.getState().load().catch(() => {});
		void useHabitStore.getState().load().catch(() => {});
		void useNotesStore.getState().load().catch(() => {});
		void useFileStore.getState().loadFolders().catch(() => {});
		void useStickyStore.getState().rehydrate();
	}, 100);
}

function isStaticExportContext(): boolean {
	if (typeof window === "undefined") return true;
	// Tauri .app — bundled static export, no /api routes
	if ("__TAURI__" in window || "__TAURI_INTERNALS__" in window) return true;
	// Direct file:// or any non-http protocol — also no server
	if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return true;
	return false;
}
