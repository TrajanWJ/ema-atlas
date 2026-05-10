"use client";

import Link from "next/link";

import { AppContent } from "@/src/components/window-manager/AppContent";
import { APP_LABELS } from "@/src/lib/constants";
import { getApp, registerAllApps } from "@/src/lib/app-registrations";
import { holodeckInsetStyle } from "@/src/lib/holodeck-layout";
import { useUrlNav } from "@/src/lib/use-url-nav";
import type { AppId } from "@/src/types/window";

registerAllApps();

export function PanelAppFrame({ appId }: { readonly appId: AppId }) {
	useUrlNav();
	const label = APP_LABELS[appId];
	const app = getApp(appId);
	const desktopHref = `/?vapp=${appId}`;

	return (
		<main
			data-app={appId}
			className="min-h-dvh"
			style={{
				background:
					"radial-gradient(circle at 24% 18%, rgba(45, 212, 168, 0.08), transparent 30%), radial-gradient(circle at 76% 10%, rgba(91, 141, 239, 0.10), transparent 32%), var(--place-void)",
				color: "var(--place-text-primary)",
				fontFamily: "var(--place-font-sans)",
				...holodeckInsetStyle(),
			}}
		>
			<div className="flex min-h-dvh flex-col gap-3 p-3">
				<header
					className="glass-elevated flex items-center gap-3 rounded-2xl border px-3 py-2"
					style={{
						borderColor: "var(--place-border-default)",
						boxShadow: "0 18px 50px rgba(0, 0, 0, 0.28)",
					}}
				>
					<span
						className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
						style={{
							background: "rgba(255,255,255,0.06)",
							border: "1px solid var(--place-border-subtle)",
							color: "var(--place-text-primary)",
						}}
						aria-hidden="true"
					>
						{app?.icon ?? label.slice(0, 1)}
					</span>
					<div className="flex min-w-0 flex-1 flex-col">
						<span
							className="text-[10px] uppercase tracking-wider"
							style={{ color: "var(--place-text-tertiary)" }}
						>
							Workspace surface
						</span>
						<h1 className="truncate text-sm font-semibold">{label}</h1>
					</div>
					<Link
						href={desktopHref}
						className="inline-flex h-8 items-center rounded-lg px-3 text-[12px] font-semibold transition-colors"
						style={{
							color: "var(--place-text-secondary)",
							border: "1px solid var(--place-border-default)",
							background: "rgba(255,255,255,0.035)",
						}}
					>
						Open on desktop
					</Link>
				</header>
				<section
					className="glass min-h-0 flex-1 overflow-auto rounded-2xl border"
					data-panel-app={appId}
					style={{
						background: "rgba(8, 9, 14, 0.72)",
						borderColor: "var(--place-border-subtle)",
						boxShadow: "0 18px 60px rgba(0, 0, 0, 0.24)",
					}}
				>
					<AppContent appId={appId} />
				</section>
			</div>
		</main>
	);
}
