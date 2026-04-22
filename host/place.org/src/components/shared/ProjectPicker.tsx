'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useProjectsStore } from "@/src/stores/projects-store";
import type { Project } from "@/src/types/project";

interface ProjectPickerProps {
	readonly value: string | null;
	readonly onChange: (projectId: string | null) => void;
	readonly allowNone?: boolean;
	readonly placeholder?: string;
	readonly compact?: boolean;
}

export function ProjectPicker({
	value,
	onChange,
	allowNone = true,
	placeholder = "No project",
	compact = false,
}: ProjectPickerProps) {
	const { projects, create, load } = useProjectsStore();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (projects.length === 0) void load();
	}, [projects.length, load]);

	useEffect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [open]);

	const selected = useMemo(
		() => projects.find((p) => p.id === value) ?? null,
		[projects, value],
	);

	const filtered = useMemo(() => {
		const active = projects.filter((p) => p.status === "active");
		if (!query.trim()) return active;
		const q = query.toLowerCase();
		return active.filter((p) => p.title.toLowerCase().includes(q));
	}, [projects, query]);

	const canCreate = query.trim().length > 0 && !filtered.some((p) => p.title.toLowerCase() === query.trim().toLowerCase());

	async function handleCreate() {
		const title = query.trim();
		if (!title) return;
		const project = await create(title);
		onChange(project.id);
		setQuery("");
		setOpen(false);
	}

	function handleSelect(p: Project | null) {
		onChange(p?.id ?? null);
		setQuery("");
		setOpen(false);
	}

	const triggerLabel = selected?.title ?? placeholder;
	const triggerColor = selected?.color ?? undefined;

	return (
		<div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={compact ? "text-xs" : "text-sm"}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: "6px",
					padding: compact ? "2px 8px" : "4px 10px",
					borderRadius: "6px",
					border: "1px solid rgba(255,255,255,0.08)",
					background: "rgba(255,255,255,0.04)",
					color: "var(--place-text-primary, rgba(255,255,255,0.87))",
					cursor: "pointer",
					fontFamily: "inherit",
					maxWidth: "200px",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				{triggerColor && (
					<span
						aria-hidden
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: triggerColor,
							flexShrink: 0,
						}}
					/>
				)}
				<span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{triggerLabel}</span>
				<span style={{ opacity: 0.5, fontSize: "0.7em" }}>▾</span>
			</button>
			{open && (
				<div
					style={{
						position: "absolute",
						top: "calc(100% + 4px)",
						left: 0,
						minWidth: "220px",
						maxHeight: "320px",
						overflowY: "auto",
						background: "var(--place-base, #0b0c14)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: "8px",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
						zIndex: 1000,
						padding: "4px",
					}}
					role="listbox"
				>
					<input
						type="text"
						placeholder="Search or create…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && canCreate) void handleCreate();
							if (e.key === "Escape") setOpen(false);
						}}
						autoFocus
						style={{
							width: "100%",
							padding: "6px 8px",
							background: "rgba(255,255,255,0.04)",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: "6px",
							color: "inherit",
							fontFamily: "inherit",
							fontSize: "0.85rem",
							outline: "none",
							marginBottom: "4px",
						}}
					/>
					{allowNone && !query && (
						<button
							type="button"
							onClick={() => handleSelect(null)}
							style={{
								display: "block",
								width: "100%",
								textAlign: "left",
								padding: "6px 8px",
								background: value == null ? "rgba(255,255,255,0.05)" : "transparent",
								border: "none",
								borderRadius: "4px",
								color: "var(--place-text-secondary, rgba(255,255,255,0.6))",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: "0.85rem",
							}}
						>
							{placeholder}
						</button>
					)}
					{filtered.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => handleSelect(p)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
								width: "100%",
								textAlign: "left",
								padding: "6px 8px",
								background: value === p.id ? "rgba(255,255,255,0.05)" : "transparent",
								border: "none",
								borderRadius: "4px",
								color: "inherit",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: "0.85rem",
							}}
						>
							<span
								aria-hidden
								style={{
									width: "8px",
									height: "8px",
									borderRadius: "50%",
									background: p.color ?? "rgba(255,255,255,0.2)",
									flexShrink: 0,
								}}
							/>
							<span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
								{p.title}
							</span>
						</button>
					))}
					{canCreate && (
						<button
							type="button"
							onClick={handleCreate}
							style={{
								display: "block",
								width: "100%",
								textAlign: "left",
								padding: "6px 8px",
								marginTop: "4px",
								background: "transparent",
								border: "1px dashed rgba(255,255,255,0.1)",
								borderRadius: "4px",
								color: "var(--place-accent, #8ab4ff)",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: "0.85rem",
							}}
						>
							+ Create "{query.trim()}"
						</button>
					)}
					{filtered.length === 0 && !canCreate && (
						<div
							style={{
								padding: "8px",
								color: "var(--place-text-secondary, rgba(255,255,255,0.5))",
								fontSize: "0.8rem",
							}}
						>
							No projects yet.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
