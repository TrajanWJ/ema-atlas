'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useResponsibilitiesStore } from "@/src/stores/responsibilities-store";
import type { Responsibility } from "@/src/types/responsibility";

interface ResponsibilityPickerProps {
	readonly value: string | null;
	readonly onChange: (responsibilityId: string | null) => void;
	readonly allowNone?: boolean;
	readonly placeholder?: string;
	readonly compact?: boolean;
}

export function ResponsibilityPicker({
	value,
	onChange,
	allowNone = true,
	placeholder = "No responsibility",
	compact = false,
}: ResponsibilityPickerProps) {
	const { responsibilities, create, load } = useResponsibilitiesStore();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (responsibilities.length === 0) void load();
	}, [responsibilities.length, load]);

	useEffect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [open]);

	const selected = useMemo(
		() => responsibilities.find((r) => r.id === value) ?? null,
		[responsibilities, value],
	);

	const filtered = useMemo(() => {
		const active = responsibilities.filter((r) => r.active);
		if (!query.trim()) return active;
		const q = query.toLowerCase();
		return active.filter((r) => r.title.toLowerCase().includes(q));
	}, [responsibilities, query]);

	const canCreate =
		query.trim().length > 0 &&
		!filtered.some((r) => r.title.toLowerCase() === query.trim().toLowerCase());

	async function handleCreate() {
		const title = query.trim();
		if (!title) return;
		const r = await create(title);
		onChange(r.id);
		setQuery("");
		setOpen(false);
	}

	function handleSelect(r: Responsibility | null) {
		onChange(r?.id ?? null);
		setQuery("");
		setOpen(false);
	}

	const triggerLabel = selected?.title ?? placeholder;

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
				<span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
					{triggerLabel}
				</span>
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
								background:
									value == null ? "rgba(255,255,255,0.05)" : "transparent",
								border: "none",
								borderRadius: "4px",
								color:
									"var(--place-text-secondary, rgba(255,255,255,0.6))",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: "0.85rem",
							}}
						>
							{placeholder}
						</button>
					)}
					{filtered.map((r) => (
						<button
							key={r.id}
							type="button"
							onClick={() => handleSelect(r)}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								gap: "2px",
								width: "100%",
								textAlign: "left",
								padding: "6px 8px",
								background:
									value === r.id ? "rgba(255,255,255,0.05)" : "transparent",
								border: "none",
								borderRadius: "4px",
								color: "inherit",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: "0.85rem",
							}}
						>
							<span>{r.title}</span>
							{r.role && (
								<span
									style={{
										fontSize: "0.7rem",
										color:
											"var(--place-text-secondary, rgba(255,255,255,0.4))",
									}}
								>
									{r.role}
								</span>
							)}
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
								color: "var(--place-accent, #f6a5c0)",
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
								color:
									"var(--place-text-secondary, rgba(255,255,255,0.5))",
								fontSize: "0.8rem",
							}}
						>
							No responsibilities yet.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
