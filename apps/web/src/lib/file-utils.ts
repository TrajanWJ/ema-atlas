// ----------------------------------------------------------------------------
// File utility helpers for the virtual file system
// ----------------------------------------------------------------------------

const TEXT_APPLICATION_TYPES = new Set([
	"application/json",
	"application/javascript",
	"application/xml",
	"application/xhtml+xml",
	"application/typescript",
	"application/x-yaml",
	"application/toml",
	"application/x-sh",
]);

/** Get a human-readable file type label from MIME type */
export function getFileTypeLabel(mimeType: string): string {
	if (mimeType.startsWith("image/")) return "Image";
	if (mimeType.startsWith("text/")) return "Text";
	if (mimeType.startsWith("audio/")) return "Audio";
	if (mimeType.startsWith("video/")) return "Video";
	if (mimeType === "application/pdf") return "PDF";
	return "File";
}

/** Format bytes as human-readable string */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Get the file extension from a filename (lowercase, no dot) */
export function getExtension(filename: string): string {
	const dotIndex = filename.lastIndexOf(".");
	if (dotIndex < 1) return "";
	return filename.slice(dotIndex + 1).toLowerCase();
}

/** Check if a MIME type is an image */
export function isImageMime(mimeType: string): boolean {
	return mimeType.startsWith("image/");
}

/** Check if a MIME type is viewable as text */
export function isTextMime(mimeType: string): boolean {
	if (mimeType.startsWith("text/")) return true;
	return TEXT_APPLICATION_TYPES.has(mimeType);
}

/** Get thumbnail URL for a file */
export function getThumbnailUrl(fileId: string): string {
	return `/api/files/${fileId}?thumbnail=1`;
}

/** Get download URL for a file */
export function getDownloadUrl(fileId: string): string {
	return `/api/files/${fileId}`;
}
