'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useFileStore } from "@/src/stores/file-store";
import { isImageMime, getDownloadUrl, getThumbnailUrl, formatFileSize } from "@/src/lib/file-utils";
import type { FileRow } from "@/src/db/queries/files";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type FolderOption = "all" | "desktop" | "documents" | "photos";

const FOLDER_OPTIONS: readonly { readonly value: FolderOption; readonly label: string }[] = [
	{ value: "all", label: "All Folders" },
	{ value: "desktop", label: "Desktop" },
	{ value: "documents", label: "Documents" },
	{ value: "photos", label: "Photos" },
] as const;

// ----------------------------------------------------------------------------
// PhotosToolbar
// ----------------------------------------------------------------------------

function PhotosToolbar({
	folder,
	onFolderChange,
	count,
}: {
	readonly folder: FolderOption;
	readonly onFolderChange: (f: FolderOption) => void;
	readonly count: number;
}) {
	return (
		<div
			className="flex items-center gap-3 px-3 py-2"
			style={{
				borderBottom: "1px solid var(--place-border, rgba(255,255,255,0.06))",
				background: "var(--place-surface, rgba(255,255,255,0.03))",
			}}
		>
			<select
				value={folder}
				onChange={(e) => onFolderChange(e.target.value as FolderOption)}
				className="rounded px-2 py-1 text-xs"
				style={{
					background: "var(--place-input, rgba(255,255,255,0.06))",
					color: "var(--place-text-primary, #fff)",
					border: "1px solid var(--place-border, rgba(255,255,255,0.08))",
					outline: "none",
				}}
			>
				{FOLDER_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			<span
				className="ml-auto text-xs"
				style={{ color: "var(--place-text-muted, rgba(255,255,255,0.4))" }}
			>
				{count} {count === 1 ? "image" : "images"}
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// PhotoThumbnail
// ----------------------------------------------------------------------------

function PhotoThumbnail({
	file,
	onClick,
}: {
	readonly file: FileRow;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative overflow-hidden rounded-md"
			style={{
				aspectRatio: "1",
				background: "var(--place-input, rgba(255,255,255,0.04))",
				border: "1px solid var(--place-border, rgba(255,255,255,0.06))",
			}}
		>
			<img
				src={getThumbnailUrl(file.id)}
				alt={file.filename}
				loading="lazy"
				className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
				draggable={false}
			/>
			<div
				className="pointer-events-none absolute inset-x-0 bottom-0 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100"
				style={{
					background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
				}}
			>
				<p className="truncate text-[10px] text-white">{file.filename}</p>
				<p className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>
					{formatFileSize(file.sizeBytes)}
				</p>
			</div>
		</button>
	);
}

// ----------------------------------------------------------------------------
// PhotoGrid
// ----------------------------------------------------------------------------

function PhotoGrid({
	images,
	onSelect,
}: {
	readonly images: readonly FileRow[];
	readonly onSelect: (index: number) => void;
}) {
	if (images.length === 0) {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center gap-3"
				style={{ color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}
			>
				<svg
					width={40}
					height={40}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={1.2}
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<circle cx="8.5" cy="8.5" r="1.5" />
					<polyline points="21 15 16 10 5 21" />
				</svg>
				<span className="text-xs">No images found</span>
				<span className="text-[10px]" style={{ color: "var(--place-text-ghost, rgba(255,255,255,0.15))" }}>
					Upload images using Finder to see them here
				</span>
			</div>
		);
	}

	return (
		<div
			className="grid flex-1 gap-2 overflow-y-auto p-3"
			style={{
				gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
				alignContent: "start",
			}}
		>
			{images.map((file, idx) => (
				<PhotoThumbnail
					key={file.id}
					file={file}
					onClick={() => onSelect(idx)}
				/>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Lightbox
// ----------------------------------------------------------------------------

function Lightbox({
	images,
	index,
	onClose,
	onPrev,
	onNext,
}: {
	readonly images: readonly FileRow[];
	readonly index: number;
	readonly onClose: () => void;
	readonly onPrev: () => void;
	readonly onNext: () => void;
}) {
	const file = images[index];
	if (!file) return null;

	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft") onPrev();
			if (e.key === "ArrowRight") onNext();
		}
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [onClose, onPrev, onNext]);

	return (
		<div
			className="absolute inset-0 z-50 flex items-center justify-center"
			style={{ background: "rgba(0, 0, 0, 0.85)" }}
			onClick={onClose}
			onKeyDown={undefined}
			role="dialog"
			aria-label="Image lightbox"
		>
			{/* Close button */}
			<button
				type="button"
				onClick={onClose}
				className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
				style={{ color: "rgba(255,255,255,0.7)" }}
				aria-label="Close lightbox"
			>
				<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			{/* Prev arrow */}
			{images.length > 1 && (
				<button
					type="button"
					onClick={(e) => { e.stopPropagation(); onPrev(); }}
					className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
					style={{ color: "rgba(255,255,255,0.7)" }}
					aria-label="Previous image"
				>
					<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</button>
			)}

			{/* Image */}
			<img
				src={getDownloadUrl(file.id)}
				alt={file.filename}
				className="max-h-[85%] max-w-[85%] object-contain"
				onClick={(e) => e.stopPropagation()}
				draggable={false}
			/>

			{/* Next arrow */}
			{images.length > 1 && (
				<button
					type="button"
					onClick={(e) => { e.stopPropagation(); onNext(); }}
					className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
					style={{ color: "rgba(255,255,255,0.7)" }}
					aria-label="Next image"
				>
					<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			)}

			{/* Caption */}
			<div
				className="absolute bottom-4 text-center text-xs"
				style={{ color: "rgba(255,255,255,0.5)" }}
			>
				{file.filename} — {index + 1} / {images.length}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// PhotosApp
// ----------------------------------------------------------------------------

export function PhotosApp() {
	const { files, folders, loading, loadFolders, loadFiles } = useFileStore();
	const [folder, setFolder] = useState<FolderOption>("all");
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const [allFiles, setAllFiles] = useState<readonly FileRow[]>([]);

	useEffect(() => {
		void loadFolders();
	}, [loadFolders]);

	useEffect(() => {
		if (folder === "all") {
			// Load all system folders and merge
			const systemIds = ["desktop", "documents", "photos"];
			Promise.all(
				systemIds.map((id) => loadFiles(id).then(() => useFileStore.getState().files)),
			).then((results) => {
				const seen = new Set<string>();
				const merged: FileRow[] = [];
				for (const batch of results) {
					for (const f of batch) {
						if (!seen.has(f.id)) {
							seen.add(f.id);
							merged.push(f);
						}
					}
				}
				setAllFiles(merged);
			});
		} else {
			void loadFiles(folder);
		}
	}, [folder, loadFiles, folders]);

	const images = useMemo(() => {
		const source = folder === "all" ? allFiles : files;
		return source.filter((f) => isImageMime(f.mimeType));
	}, [folder, files, allFiles]);

	const handleSelect = useCallback((index: number) => {
		setLightboxIndex(index);
	}, []);

	const handleClose = useCallback(() => {
		setLightboxIndex(null);
	}, []);

	const handlePrev = useCallback(() => {
		setLightboxIndex((prev) => {
			if (prev === null) return null;
			return prev > 0 ? prev - 1 : images.length - 1;
		});
	}, [images.length]);

	const handleNext = useCallback(() => {
		setLightboxIndex((prev) => {
			if (prev === null) return null;
			return prev < images.length - 1 ? prev + 1 : 0;
		});
	}, [images.length]);

	if (loading && images.length === 0) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Loading photos...
			</div>
		);
	}

	return (
		<div className="relative flex h-full flex-col" style={{ background: "var(--place-base, #08090E)" }}>
			<PhotosToolbar
				folder={folder}
				onFolderChange={setFolder}
				count={images.length}
			/>
			<PhotoGrid images={images} onSelect={handleSelect} />
			{lightboxIndex !== null && (
				<Lightbox
					images={images}
					index={lightboxIndex}
					onClose={handleClose}
					onPrev={handlePrev}
					onNext={handleNext}
				/>
			)}
		</div>
	);
}
