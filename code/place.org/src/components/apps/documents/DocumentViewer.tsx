'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useFileStore } from "@/src/stores/file-store";
import {
	getDownloadUrl,
	getExtension,
	formatFileSize,
	isTextMime,
} from "@/src/lib/file-utils";
import { renderMarkdown } from "@/src/lib/markdown";
import type { FileRow } from "@/src/db/queries/files";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const DOCUMENT_MIMES = new Set([
	"application/pdf",
	"text/plain",
	"text/markdown",
	"text/html",
	"text/css",
	"text/csv",
	"application/json",
	"application/javascript",
	"application/typescript",
	"application/xml",
	"application/x-yaml",
	"application/toml",
	"application/x-sh",
]);

function isDocumentFile(f: FileRow): boolean {
	return isTextMime(f.mimeType) || DOCUMENT_MIMES.has(f.mimeType);
}

function isMarkdown(filename: string): boolean {
	const ext = getExtension(filename);
	return ext === "md" || ext === "markdown";
}

function isPdf(mimeType: string): boolean {
	return mimeType === "application/pdf";
}

// ----------------------------------------------------------------------------
// DocSidebar
// ----------------------------------------------------------------------------

function DocSidebar({
	files,
	selectedId,
	onSelect,
}: {
	readonly files: readonly FileRow[];
	readonly selectedId: string | null;
	readonly onSelect: (id: string) => void;
}) {
	return (
		<div
			style={{
				width: 180,
				minWidth: 180,
				borderRight: "1px solid var(--place-border, rgba(255,255,255,0.08))",
				overflowY: "auto",
				padding: "0.25rem 0",
				background: "var(--place-surface-dim, rgba(0,0,0,0.3))",
			}}
		>
			<div
				style={{
					padding: "0.375rem 0.625rem",
					fontSize: "0.65rem",
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					color: "var(--place-text-ghost, rgba(255,255,255,0.25))",
				}}
			>
				Files
			</div>
			{files.length === 0 && (
				<div
					style={{
						padding: "0.5rem 0.625rem",
						fontSize: "0.75rem",
						color: "var(--place-text-muted, rgba(255,255,255,0.3))",
					}}
				>
					No documents
				</div>
			)}
			{files.map((f) => (
				<button
					key={f.id}
					type="button"
					onClick={() => onSelect(f.id)}
					style={{
						display: "block",
						width: "100%",
						textAlign: "left",
						padding: "0.3rem 0.625rem",
						fontSize: "0.75rem",
						color:
							f.id === selectedId
								? "var(--place-text-primary)"
								: "var(--place-text-secondary)",
						background:
							f.id === selectedId
								? "var(--place-accent-dim, rgba(96,165,250,0.12))"
								: "transparent",
						border: "none",
						cursor: "pointer",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{f.filename}
				</button>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// DocToolbar
// ----------------------------------------------------------------------------

function DocToolbar({
	file,
}: {
	readonly file: FileRow;
}) {
	const handleDownload = useCallback(() => {
		window.open(getDownloadUrl(file.id));
	}, [file.id]);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0.375rem 0.625rem",
				borderBottom: "1px solid var(--place-border, rgba(255,255,255,0.08))",
				fontSize: "0.75rem",
				color: "var(--place-text-secondary)",
				gap: "0.5rem",
			}}
		>
			<span
				style={{
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
					fontWeight: 500,
				}}
			>
				{file.filename}
			</span>
			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
				<span style={{ fontSize: "0.65rem", color: "var(--place-text-muted)" }}>
					{formatFileSize(file.sizeBytes)}
				</span>
				<button
					type="button"
					onClick={handleDownload}
					style={{
						background: "var(--place-surface-raised, rgba(255,255,255,0.06))",
						border: "1px solid var(--place-border, rgba(255,255,255,0.08))",
						borderRadius: 4,
						padding: "0.2rem 0.5rem",
						fontSize: "0.65rem",
						color: "var(--place-text-secondary)",
						cursor: "pointer",
					}}
				>
					Download
				</button>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// DocContent
// ----------------------------------------------------------------------------

function DocContent({
	file,
	content,
	loading,
}: {
	readonly file: FileRow;
	readonly content: string | null;
	readonly loading: boolean;
}) {
	if (loading) {
		return (
			<div
				className="flex h-full items-center justify-center"
				style={{ color: "var(--place-text-muted)", fontSize: "0.8rem" }}
			>
				Loading...
			</div>
		);
	}

	// PDF: render in iframe
	if (isPdf(file.mimeType)) {
		return (
			<iframe
				src={getDownloadUrl(file.id)}
				title={file.filename}
				style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
			/>
		);
	}

	// Markdown: rendered HTML
	if (isMarkdown(file.filename) && content !== null) {
		const html = renderMarkdown(content);
		return (
			<div
				// biome-ignore lint/security/noDangerouslySetInnerHtml: output of renderMarkdown is sanitized
				dangerouslySetInnerHTML={{ __html: html }}
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "0.75rem",
					color: "var(--place-text-primary)",
					fontFamily: "sans-serif",
					fontSize: "0.85rem",
					lineHeight: 1.7,
				}}
				className="markdown-preview"
			/>
		);
	}

	// Text / code: monospace with line numbers
	if (content !== null) {
		const lines = content.split("\n");
		const gutterWidth = String(lines.length).length;
		return (
			<div style={{ flex: 1, overflowY: "auto", display: "flex" }}>
				<pre
					style={{
						margin: 0,
						padding: "0.5rem 0",
						fontFamily: "var(--place-font-mono, monospace)",
						fontSize: "0.78rem",
						lineHeight: 1.5,
						display: "flex",
						width: "100%",
					}}
				>
					<div
						aria-hidden
						style={{
							textAlign: "right",
							paddingRight: "0.75rem",
							paddingLeft: "0.5rem",
							color: "var(--place-text-ghost, rgba(255,255,255,0.2))",
							userSelect: "none",
							flexShrink: 0,
						}}
					>
						{lines.map((_, i) => (
							<div key={`ln-${String(i)}`}>
								{String(i + 1).padStart(gutterWidth, " ")}
							</div>
						))}
					</div>
					<code
						style={{
							flex: 1,
							overflowX: "auto",
							paddingRight: "0.75rem",
							color: "var(--place-text-primary)",
						}}
					>
						{lines.map((line, i) => (
							<div key={`code-${String(i)}`}>{line || " "}</div>
						))}
					</code>
				</pre>
			</div>
		);
	}

	return (
		<div
			className="flex h-full items-center justify-center"
			style={{ color: "var(--place-text-muted)", fontSize: "0.8rem" }}
		>
			Unable to display this file
		</div>
	);
}

// ----------------------------------------------------------------------------
// DocumentViewer (main export)
// ----------------------------------------------------------------------------

export function DocumentViewer() {
	const { files, loadFiles, loadFolders } = useFileStore();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [content, setContent] = useState<string | null>(null);
	const [loadingContent, setLoadingContent] = useState(false);

	// Load documents folder on mount
	useEffect(() => {
		void loadFolders().then(() => loadFiles("documents"));
	}, [loadFolders, loadFiles]);

	const docFiles = useMemo(
		() => files.filter(isDocumentFile),
		[files],
	);

	const selectedFile = useMemo(
		() => docFiles.find((f) => f.id === selectedId) ?? null,
		[docFiles, selectedId],
	);

	// Fetch text content when selection changes
	useEffect(() => {
		if (selectedFile === null || isPdf(selectedFile.mimeType)) {
			setContent(null);
			return;
		}

		setLoadingContent(true);
		fetch(getDownloadUrl(selectedFile.id))
			.then((r) => r.text())
			.then((text) => setContent(text))
			.catch(() => setContent(null))
			.finally(() => setLoadingContent(false));
	}, [selectedFile]);

	return (
		<div className="flex h-full" style={{ background: "var(--place-base, #08090E)" }}>
			<DocSidebar
				files={docFiles}
				selectedId={selectedId}
				onSelect={setSelectedId}
			/>
			<div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
				{selectedFile ? (
					<>
						<DocToolbar file={selectedFile} />
						<DocContent
							file={selectedFile}
							content={content}
							loading={loadingContent}
						/>
					</>
				) : (
					<div
						className="flex flex-1 flex-col items-center justify-center gap-3"
						style={{ padding: "2rem" }}
					>
						<svg
							width={32}
							height={32}
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--place-text-ghost, rgba(255,255,255,0.15))"
							strokeWidth={1.5}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
						</svg>
						<span
							style={{
								fontSize: "0.8rem",
								color: "var(--place-text-muted, rgba(255,255,255,0.25))",
							}}
						>
							Select a document to view
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
