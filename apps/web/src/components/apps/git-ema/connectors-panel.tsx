"use client";

import { useState } from "react";
import {
	MOCK_PROJECTION_LABEL,
	gitEmaUserConnectorsProjection,
} from "@/src/app/mock-projections";
import { sendCommand } from "@/src/lib/ipc";
import { useConnectors } from "@/src/projections/use-connectors";
import { PickerDialog } from "./picker-dialog";

type Connector = {
	id: string;
	provider: "google_drive" | "github";
	status: "connected" | "disconnected";
	display_label: string;
};

type ConnectorsShape = { connectors: Connector[] };

const PROVIDERS: Array<{ id: "google_drive" | "github"; label: string }> = [
	{ id: "google_drive", label: "Google Drive" },
	{ id: "github", label: "GitHub" },
];

/**
 * Staged OAuth buttons + connected-state management.
 *
 * The local projection shows the intended connector contract while the real
 * Google/GitHub OAuth path remains disabled until the daemon writer lands.
 */
export function ConnectorsPanel() {
	const view = useConnectors();
	const isMock = view.offline;
	const projection = (view.data ?? gitEmaUserConnectorsProjection) as unknown as ConnectorsShape;
	const connectors: Connector[] =
		projection.connectors ?? gitEmaUserConnectorsProjection.connectors;
	const [pickerFor, setPickerFor] = useState<Connector | null>(null);

	function byProvider(pid: Connector["provider"]): Connector | undefined {
		return connectors.find((c) => c.provider === pid);
	}

	async function connect(provider: Connector["provider"]) {
		await sendCommand("connector.connect", { provider });
	}

	async function disconnect(connectorId: string) {
		await sendCommand("connector.disconnect", { connector_id: connectorId });
	}

	return (
		<section
			className="flex flex-col gap-3 rounded-lg border p-4"
			style={{
				background: "var(--place-surface-1)",
				borderColor: "var(--place-border-default)",
			}}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-wider"
						style={{ color: "var(--place-secondary-400)" }}
					>
						connector projection
					</span>
					<h2 className="text-lg font-semibold" style={{ color: "var(--place-text-primary)" }}>
						Connectors
					</h2>
				</div>
				{isMock && (
					<span
						className="rounded-full px-2 py-0.5 text-xs"
						style={{
							background: "var(--place-primary-subtle)",
							color: "var(--place-primary-400)",
						}}
					>
						{MOCK_PROJECTION_LABEL}
					</span>
				)}
			</div>
			<p className="text-xs" style={{ color: "var(--place-text-tertiary)" }}>
				Staged mode. Connector actions stay disabled until the daemon OAuth
				writer is present.
			</p>
			<ul className="flex flex-col gap-2">
				{PROVIDERS.map(({ id, label }) => {
					const c = byProvider(id);
					const connected = c?.status === "connected";
					return (
						<li
							key={id}
							className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
							data-connected={connected ? "true" : "false"}
							data-provider={id}
							style={{
								background: "var(--place-surface-2)",
								borderColor: "var(--place-border-default)",
								color: "var(--place-text-secondary)",
							}}
						>
							<span
								className="font-medium"
								style={{ color: "var(--place-text-primary)" }}
							>
								{label}
							</span>
							<span className="text-xs" style={{ color: "var(--place-text-tertiary)" }}>
								{connected ? c?.display_label : "not connected"}
							</span>
							<span className="ml-auto flex gap-2">
								{connected ? (
									<>
										<button
											type="button"
											className="rounded-md px-2 py-1 text-xs"
											style={{
												background: "var(--place-surface-3)",
												color: "var(--place-text-primary)",
											}}
											onClick={() => c && setPickerFor(c)}
											disabled={isMock}
										>
											Browse
										</button>
										<button
											type="button"
											className="rounded-md px-2 py-1 text-xs"
											style={{
												background: "var(--place-surface-3)",
												color: "var(--place-text-secondary)",
											}}
											onClick={() => c && disconnect(c.id)}
											disabled={isMock}
										>
											Disconnect
										</button>
									</>
								) : (
									<button
										type="button"
										className="rounded-md px-2 py-1 text-xs"
										style={{
											background: "var(--place-primary-subtle)",
											color: "var(--place-primary-400)",
										}}
										onClick={() => connect(id)}
										disabled={isMock}
									>
										Connect {label}
									</button>
								)}
							</span>
						</li>
					);
				})}
			</ul>

			{pickerFor && (
				<PickerDialog
					connector={pickerFor}
					onClose={() => setPickerFor(null)}
				/>
			)}
		</section>
	);
}
