"use client";

import Link from "next/link";
import { AppContent } from "@/src/components/window-manager/AppContent";
import { APP_LABELS } from "@/src/lib/constants";
import { registerAllApps } from "@/src/lib/app-registrations";
import { useUrlNav } from "@/src/lib/use-url-nav";
import type { AppId } from "@/src/types/window";

registerAllApps();

export function PanelAppFrame({ appId }: { readonly appId: AppId }) {
	useUrlNav();
	const label = APP_LABELS[appId];

	return (
		<main
			className="min-h-dvh"
			style={{
				background: "var(--place-void)",
				color: "var(--place-text-primary)",
				fontFamily: "var(--place-font-sans)",
			}}
		>
			<div className="flex min-h-dvh flex-col">
				<header
					className="glass-elevated flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-2"
					style={{
						borderColor: "var(--place-border-default)",
					}}
				>
					<div className="flex min-w-0 flex-col">
						<span
							className="text-[10px] uppercase tracking-wider"
							style={{ color: "var(--place-text-tertiary)" }}
						>
							EMA panel
						</span>
						<h1 className="truncate text-sm font-semibold">{label}</h1>
					</div>
					<Link
						href="/"
						className="rounded-md px-3 py-1 text-xs"
						style={{
							background: "var(--place-surface-2)",
							color: "var(--place-text-secondary)",
							border: "1px solid var(--place-border-subtle)",
						}}
					>
						Desktop
					</Link>
				</header>
				<section
					className="min-h-0 flex-1 overflow-auto"
					data-panel-app={appId}
					style={{ background: "var(--place-base)" }}
				>
					<AppContent appId={appId} />
				</section>
			</div>
		</main>
	);
}
