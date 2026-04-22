import { create } from "zustand";
import { getAllApps } from "@/src/lib/app-registry";
import type { PlaceApp, FileEntry } from "@/src/lib/app-registry";
import { useFileStore } from "@/src/stores/file-store";
import type { FileRow, VirtualFolderRow } from "@/src/db/queries/files";
import { getFileTypeLabel, formatFileSize } from "@/src/lib/file-utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface VirtualFolder {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly parentId: string | null;
	readonly isSystem: boolean;
}

interface FinderState {
	readonly folders: readonly VirtualFolder[];
	readonly selectedFolderId: string;
	refreshAppFolders: () => void;
	setSelectedFolder: (id: string) => void;
	getFolderPath: (id: string) => readonly VirtualFolder[];
	getChildren: (parentId: string | null) => readonly VirtualFolder[];
	getFilesForFolder: (folderId: string) => readonly {
		file: FileEntry;
		appId: string;
		appName: string;
	}[];
	getUserFolderChildren: (parentId: string) => readonly VirtualFolderRow[];
}

// ----------------------------------------------------------------------------
// System folders (always present)
// ----------------------------------------------------------------------------

const SYSTEM_FOLDERS: readonly VirtualFolder[] = [
	{ id: "home", name: "Home", icon: "\u{1F3E0}", parentId: null, isSystem: true },
	{ id: "desktop", name: "Desktop", icon: "\u{1F5A5}\uFE0F", parentId: "home", isSystem: true },
	{ id: "documents", name: "Documents", icon: "\u{1F4C4}", parentId: "home", isSystem: true },
	{ id: "photos", name: "Photos", icon: "\u{1F5BC}\uFE0F", parentId: "home", isSystem: true },
	{ id: "apps", name: "Apps", icon: "\u{1F4E6}", parentId: "home", isSystem: true },
];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Map system folder IDs to the names used in virtual_folders */
const USER_FOLDER_IDS = new Set(["desktop", "documents", "photos"]);

function fileRowToFinderEntry(f: FileRow): {
	file: FileEntry;
	appId: string;
	appName: string;
} {
	return {
		file: {
			id: f.id,
			name: f.filename,
			type: getFileTypeLabel(f.mimeType),
			preview: `${formatFileSize(f.sizeBytes)} \u00B7 ${f.mimeType}`,
			createdAt: new Date(f.createdAt).getTime(),
			updatedAt: new Date(f.updatedAt).getTime(),
		},
		appId: "finder",
		appName: "Files",
	};
}

function buildUserFolders(): VirtualFolder[] {
	const userFolders = useFileStore.getState().folders;
	return userFolders
		.filter((f) => !f.isSystem)
		.map((f) => ({
			id: f.id,
			name: f.name,
			icon: "\u{1F4C1}",
			parentId: f.parentId,
			isSystem: false,
		}));
}

function buildAppFolders(): VirtualFolder[] {
	return getAllApps()
		.filter((app) => app.listFiles !== undefined)
		.map((app) => ({
			id: `app-${app.id}`,
			name: app.name,
			icon: "\u{1F4C1}",
			parentId: "apps",
			isSystem: false,
		}));
}

function getAppsWithFilesMap(): Map<string, { app: PlaceApp; files: readonly FileEntry[] }> {
	const map = new Map<string, { app: PlaceApp; files: readonly FileEntry[] }>();
	for (const app of getAllApps()) {
		if (app.listFiles) {
			map.set(app.id, { app, files: app.listFiles() });
		}
	}
	return map;
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useFinderStore = create<FinderState>((set, get) => ({
	folders: [...SYSTEM_FOLDERS, ...buildAppFolders(), ...buildUserFolders()],
	selectedFolderId: "home",

	refreshAppFolders: () => {
		const appFolders = buildAppFolders();
		const userFolders = buildUserFolders();
		set({ folders: [...SYSTEM_FOLDERS, ...appFolders, ...userFolders] });
	},

	setSelectedFolder: (id: string) => {
		set({ selectedFolderId: id });
	},

	getFolderPath: (id: string): readonly VirtualFolder[] => {
		const { folders } = get();
		const path: VirtualFolder[] = [];
		let current = folders.find((f) => f.id === id);
		while (current) {
			path.unshift(current);
			current = current.parentId
				? folders.find((f) => f.id === current?.parentId)
				: undefined;
		}
		return path;
	},

	getChildren: (parentId: string | null): readonly VirtualFolder[] => {
		const { folders } = get();
		return folders.filter((f) => f.parentId === parentId);
	},

	getFilesForFolder: (folderId: string) => {
		const appsMap = getAppsWithFilesMap();
		const results: Array<{ file: FileEntry; appId: string; appName: string }> = [];

		if (folderId.startsWith("app-")) {
			const appId = folderId.slice(4);
			const entry = appsMap.get(appId);
			if (entry) {
				for (const file of entry.files) {
					results.push({ file, appId: entry.app.id, appName: entry.app.name });
				}
			}
			return results;
		}

		if (folderId === "apps") {
			for (const [, entry] of appsMap) {
				for (const file of entry.files) {
					results.push({ file, appId: entry.app.id, appName: entry.app.name });
				}
			}
			return results;
		}

		if (folderId === "home") {
			// Home shows app files + all user files
			for (const [, entry] of appsMap) {
				for (const file of entry.files) {
					results.push({ file, appId: entry.app.id, appName: entry.app.name });
				}
			}
			const fileRows = useFileStore.getState().files;
			for (const f of fileRows) {
				results.push(fileRowToFinderEntry(f));
			}
			return results;
		}

		// System folders (desktop, documents, photos) and user-created folders
		if (USER_FOLDER_IDS.has(folderId) || !folderId.startsWith("app-")) {
			const fileRows = useFileStore.getState().files;
			for (const f of fileRows) {
				if (f.folderId === folderId) {
					results.push(fileRowToFinderEntry(f));
				}
			}
			return results;
		}

		return results;
	},

	getUserFolderChildren: (parentId: string): readonly VirtualFolderRow[] => {
		return useFileStore.getState().folders.filter((f) => f.parentId === parentId);
	},
}));
