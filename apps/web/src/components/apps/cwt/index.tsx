"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, RefreshCw, Radio } from "lucide-react";

const DEFAULT_CWT_URL = "http://localhost:3015";

function getCwtUrl(): string {
	const configured = process.env.NEXT_PUBLIC_CWT_WEB_URL?.trim();
	if (!configured) return DEFAULT_CWT_URL;
	return configured.replace(/\/+$/, "");
}

function canEmbedCwt(cwtUrl: string): boolean {
	if (typeof window === "undefined") return true;
	try {
		const cwt = new URL(cwtUrl);
		const current = window.location;
		const cwtIsDefaultLocalhost =
			(cwt.hostname === "localhost" || cwt.hostname === "127.0.0.1") &&
			(!cwt.port || cwt.port === "3015");

		if (!cwtIsDefaultLocalhost) return true;

		return (
			(current.hostname === "localhost" || current.hostname === "127.0.0.1") &&
			current.port === "5173"
		);
	} catch {
		return false;
	}
}

export function CwtApp() {
	const [frameKey, setFrameKey] = useState(0);
	const [embedAllowed, setEmbedAllowed] = useState(true);
	const cwtUrl = useMemo(getCwtUrl, []);
	const hostname = useMemo(() => {
		try {
			const url = new URL(cwtUrl);
			return url.host;
		} catch {
			return cwtUrl;
		}
	}, [cwtUrl]);

	useEffect(() => {
		setEmbedAllowed(canEmbedCwt(cwtUrl));
	}, [cwtUrl]);

	return (
		<section
			data-app="cwt"
			className="flex h-full min-h-[520px] w-full flex-col overflow-hidden"
			style={{
				background: "var(--place-base)",
				color: "var(--place-text-primary)",
			}}
		>
			<header
				className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-2"
				style={{
					background: "var(--place-surface-1)",
					borderColor: "var(--place-border-default)",
				}}
			>
				<div className="flex min-w-0 flex-col">
					<span
						className="text-[10px] uppercase tracking-wider"
						style={{ color: "var(--place-text-tertiary)" }}
					>
						central tracker
					</span>
					<h1 className="truncate text-sm font-semibold">Current Work</h1>
				</div>

				<div className="flex min-w-0 items-center gap-2">
					<span
						className="inline-flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
						style={{
							background: "var(--place-surface-2)",
							borderColor: "var(--place-border-subtle)",
							color: "var(--place-text-secondary)",
						}}
					>
						<Radio size={13} aria-hidden />
						<span className="truncate font-mono">{hostname}</span>
					</span>
					<button
						type="button"
						title="Refresh CWT"
						aria-label="Refresh CWT"
						onClick={() => setFrameKey((value) => value + 1)}
						className="grid h-8 w-8 place-items-center rounded-md border transition-colors"
						style={{
							background: "var(--place-surface-2)",
							borderColor: "var(--place-border-subtle)",
							color: "var(--place-text-secondary)",
						}}
					>
						<RefreshCw size={15} aria-hidden />
					</button>
					<a
						href={cwtUrl}
						target="_blank"
						rel="noreferrer"
						title="Open standalone CWT"
						aria-label="Open standalone CWT"
						className="grid h-8 w-8 place-items-center rounded-md border transition-colors"
						style={{
							background: "var(--place-primary-subtle)",
							borderColor: "var(--place-primary-border)",
							color: "var(--place-primary-400)",
						}}
					>
						<ExternalLink size={15} aria-hidden />
					</a>
				</div>
			</header>

			{embedAllowed ? (
				<div className="min-h-0 flex-1">
					<iframe
						key={frameKey}
						src={cwtUrl}
						title="Current Work Tracker"
						className="h-full w-full border-0"
						allow="clipboard-read; clipboard-write"
					/>
				</div>
			) : (
				<div
					className="grid min-h-0 flex-1 place-items-center p-6 text-center"
					style={{ background: "var(--place-surface-0)" }}
				>
					<div
						className="flex max-w-md flex-col items-center gap-3 rounded-xl border p-5"
						style={{
							background: "var(--place-surface-1)",
							borderColor: "var(--place-border-default)",
						}}
					>
						<AlertTriangle
							size={22}
							aria-hidden
							style={{ color: "var(--place-secondary-400)" }}
						/>
						<div className="flex flex-col gap-1">
							<h2 className="text-base font-semibold">
								Open Current Work in its own tab
							</h2>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--place-text-secondary)" }}
							>
								The local CWT server only allows iframe embedding from EMA on
								<code> localhost:5173</code>. This EMA server is running from a
								different origin, so the vApp avoids a blocked frame and gives you
								the standalone launch target instead.
							</p>
						</div>
						<a
							href={cwtUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
							style={{
								background: "var(--place-primary-subtle)",
								borderColor: "var(--place-primary-border)",
								color: "var(--place-primary-400)",
							}}
						>
							<ExternalLink size={15} aria-hidden />
							Open {hostname}
						</a>
					</div>
				</div>
			)}
		</section>
	);
}

export default CwtApp;
