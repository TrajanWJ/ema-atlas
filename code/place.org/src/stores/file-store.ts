import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { getCurrentUserId } from "@/src/lib/current-user";
import { getDownloadUrl } from "@/src/lib/file-utils";
import {
	getUserFolders,
	getFilesInFolder,
	createFolder as createFolderQuery,
	renameFolder as renameFolderQuery,
	deleteFolder as deleteFolderQuery,
	renameFile as renameFileQuery,
	moveFile as moveFileQuery,
	deleteFile as deleteFileQuery,
	searchFiles as searchFilesQuery,
	ensureSystemFolders,
} from "@/src/db/queries/files";
import type { FileRow, VirtualFolderRow } from "@/src/db/queries/files";
import type { FileVersionRow } from "@/src/db/queries/file-versions";
import {
	getVersions as getVersionsQuery,
} from "@/src/db/queries/file-versions";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface FileState {
	readonly files: readonly FileRow[];
	readonly folders: readonly VirtualFolderRow[];
	readonly versions: readonly FileVersionRow[];
	readonly currentFolderId: string | null;
	readonly loading: boolean;
}

interface FileActions {
	loadFolders(): Promise<void>;
	loadFiles(folderId: string): Promise<void>;
	upload(file: File, folderId: string): Promise<FileRow>;
	download(id: string): void;
	renameFile(id: string, filename: string): Promise<void>;
	moveFile(id: string, folderId: string): Promise<void>;
	deleteFile(id: string): Promise<void>;
	createFolder(name: string, parentId: string | null): Promise<void>;
	renameFolder(id: string, name: string): Promise<void>;
	deleteFolder(id: string): Promise<void>;
	search(query: string): Promise<readonly FileRow[]>;
	loadVersions(fileId: string): Promise<void>;
	restoreVersion(fileId: string, versionId: string): Promise<void>;
	rehydrate(): void;
}

type FileStore = FileState & FileActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useFileStore = create<FileStore>((set, get) => ({
	files: [],
	folders: [],
	versions: [],
	currentFolderId: null,
	loading: false,

	async loadFolders() {
		set({ loading: true });
		try {
			const db = getDbClient();
			await ensureSystemFolders(db);
			const folders = await getUserFolders(db);
			set({ folders });
		} catch (err) {
			console.error("[file-store] loadFolders failed:", err);
		} finally {
			set({ loading: false });
		}
	},

	async loadFiles(folderId) {
		set({ loading: true, currentFolderId: folderId });
		try {
			const db = getDbClient();
			const files = await getFilesInFolder(db, folderId);
			set({ files });
		} catch (err) {
			console.error("[file-store] loadFiles failed:", err);
		} finally {
			set({ loading: false });
		}
	},

	async upload(file, folderId) {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("folderId", folderId);
		formData.append("userId", getCurrentUserId());

		const res = await fetch("/api/files", {
			method: "POST",
			headers: { "X-User-Id": getCurrentUserId() },
			body: formData,
		});

		if (!res.ok) {
			const data: unknown = await res.json().catch(() => ({}));
			const message =
				typeof data === "object" && data !== null && "message" in data
					? String((data as Record<string, unknown>).message)
					: `Upload failed (${res.status})`;
			throw new Error(message);
		}

		const row = (await res.json()) as FileRow;
		set((s) => ({ files: [...s.files, row] }));
		return row;
	},

	download(id) {
		window.open(getDownloadUrl(id));
	},

	async renameFile(id, filename) {
		try {
			const db = getDbClient();
			await renameFileQuery(db, id, filename);
			const { currentFolderId } = get();
			if (currentFolderId) {
				const files = await getFilesInFolder(db, currentFolderId);
				set({ files });
			}
		} catch (err) {
			console.error("[file-store] renameFile failed:", err);
		}
	},

	async moveFile(id, folderId) {
		try {
			const db = getDbClient();
			await moveFileQuery(db, id, folderId);
			const { currentFolderId } = get();
			if (currentFolderId) {
				const files = await getFilesInFolder(db, currentFolderId);
				set({ files });
			}
		} catch (err) {
			console.error("[file-store] moveFile failed:", err);
		}
	},

	async deleteFile(id) {
		try {
			const db = getDbClient();
			await deleteFileQuery(db, id);
			const { currentFolderId } = get();
			if (currentFolderId) {
				const files = await getFilesInFolder(db, currentFolderId);
				set({ files });
			}
		} catch (err) {
			console.error("[file-store] deleteFile failed:", err);
		}
	},

	async createFolder(name, parentId) {
		try {
			const db = getDbClient();
			await createFolderQuery(db, name, parentId);
			const folders = await getUserFolders(db);
			set({ folders });
		} catch (err) {
			console.error("[file-store] createFolder failed:", err);
		}
	},

	async renameFolder(id, name) {
		try {
			const db = getDbClient();
			await renameFolderQuery(db, id, name);
			const folders = await getUserFolders(db);
			set({ folders });
		} catch (err) {
			console.error("[file-store] renameFolder failed:", err);
		}
	},

	async deleteFolder(id) {
		try {
			const db = getDbClient();
			await deleteFolderQuery(db, id);
			const folders = await getUserFolders(db);
			set({ folders });
		} catch (err) {
			console.error("[file-store] deleteFolder failed:", err);
		}
	},

	async search(query) {
		try {
			const db = getDbClient();
			const results = await searchFilesQuery(db, query);
			return results;
		} catch (err) {
			console.error("[file-store] search failed:", err);
			return [];
		}
	},

	async loadVersions(fileId) {
		try {
			const db = getDbClient();
			const versions = await getVersionsQuery(db, fileId);
			set({ versions });
		} catch (err) {
			console.error("[file-store] loadVersions failed:", err);
		}
	},

	async restoreVersion(fileId, versionId) {
		try {
			const res = await fetch(
				`/api/files/${fileId}/versions/${versionId}`,
				{
					method: "POST",
					headers: { "X-User-Id": getCurrentUserId() },
				},
			);
			if (!res.ok) {
				throw new Error(`Restore failed (${res.status})`);
			}
			// Reload file list and versions
			const { currentFolderId } = get();
			if (currentFolderId) {
				const db = getDbClient();
				const files = await getFilesInFolder(db, currentFolderId);
				set({ files });
			}
			await get().loadVersions(fileId);
		} catch (err) {
			console.error("[file-store] restoreVersion failed:", err);
		}
	},

	rehydrate() {
		set({ files: [], folders: [], versions: [], currentFolderId: null });
		get().loadFolders();
	},
}));
