"use client";

import { useEffect, useState } from "react";
import { sendCommand } from "@/src/lib/ipc";

type Connector = {
	id: string;
	provider: "google_drive" | "github";
	display_label: string;
};

type PickerItem = {
	id: string;
	display_name: string;
	kind_hint: string;
};

type PickerCommandResult = {
	picker_items?: PickerItem[];
};

/**
 * Fake picker dialog. Fetches the daemon's hard-coded demo catalog for
 * the given connector and lets the user create attachments from any
 * picked item. No real API call.
 */
export function PickerDialog({
	connector,
	onClose,
}: {
	connector: Connector;
	onClose: () => void;
}) {
	const [items, setItems] = useState<PickerItem[]>([]);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const res = await sendCommand("connector.list_picker_items", {
				connector_id: connector.id,
			});
			if (cancelled) return;
			const picker = (res as unknown as PickerCommandResult).picker_items ?? [];
			setItems(picker);
		})();
		return () => {
			cancelled = true;
		};
	}, [connector.id]);

	async function importOne(item: PickerItem) {
		setBusy(true);
		try {
			await sendCommand("connector.import_resource", {
				connector_id: connector.id,
				picker_item_id: item.id,
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-label="Browse source"
		>
			<button
				type="button"
				aria-label="Close picker"
				className="absolute inset-0"
				style={{
					background: "var(--place-surface-1)",
					opacity: 0.7,
					backdropFilter: "blur(6px)",
				}}
				onClick={onClose}
			/>
			<div
				className="relative z-10 flex max-h-[70vh] w-full max-w-md flex-col gap-3 rounded-lg border p-4"
				style={{
					background: "var(--place-surface-1)",
					borderColor: "var(--place-border-default)",
					color: "var(--place-text-primary)",
				}}
			>
				<header className="flex items-center justify-between gap-3">
					<h3 className="text-base font-semibold">Browse {connector.display_label}</h3>
					<button
						type="button"
						className="rounded-md px-2 py-1 text-xs"
						style={{
							background: "var(--place-surface-3)",
							color: "var(--place-text-secondary)",
						}}
						onClick={onClose}
					>
						Close
					</button>
				</header>
				<ul className="flex flex-col gap-2 overflow-auto">
					{items.length === 0 && (
						<li className="text-sm" style={{ color: "var(--place-text-tertiary)" }}>
							Nothing to show.
						</li>
					)}
					{items.map((it) => (
						<li
							key={it.id}
							className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
							style={{
								background: "var(--place-surface-2)",
								borderColor: "var(--place-border-default)",
							}}
						>
							<span style={{ color: "var(--place-text-primary)" }}>{it.display_name}</span>
							<span className="text-xs" style={{ color: "var(--place-text-tertiary)" }}>
								{it.kind_hint}
							</span>
							<button
								type="button"
								className="ml-auto rounded-md px-2 py-1 text-xs"
								style={{
									background: "var(--place-primary-subtle)",
									color: "var(--place-primary-400)",
								}}
								onClick={() => importOne(it)}
								disabled={busy}
							>
								Import
							</button>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
