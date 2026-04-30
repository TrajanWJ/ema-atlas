"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { ImmersiveNav } from '@/src/components/navigation/ImmersiveNav';
import { BackToDesktop } from '@/src/components/navigation/BackToDesktop';

export default function ImmersiveLayout({ children }: { children: ReactNode }) {
	const [tauriBlocked, setTauriBlocked] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const isTauri =
			"__TAURI__" in window || "__TAURI_INTERNALS__" in window;
		setTauriBlocked(isTauri);
	}, []);

	if (tauriBlocked) {
		return (
			<div
				style={{
					height: "100dvh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "var(--place-void)",
					color: "var(--place-text-primary)",
				}}
			>
				<div
					style={{
						maxWidth: 480,
						padding: "32px 36px",
						background: "var(--place-surface-1)",
						border: "1px solid var(--place-border-default)",
						borderRadius: 12,
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontSize: "0.7rem",
							letterSpacing: "0.12em",
							textTransform: "uppercase",
							color: "var(--place-secondary-400)",
							marginBottom: 12,
						}}
					>
						EMA · workspace
					</div>
					<h1 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "0 0 12px" }}>
						This route is part of place.org
					</h1>
					<p
						style={{
							fontSize: "0.85rem",
							color: "var(--place-text-secondary)",
							margin: "0 0 20px",
							lineHeight: 1.5,
						}}
					>
						The portfolio / about / community / services pages live on the
						deployed web. EMA is the workspace.
					</p>
					<a
						href="/"
						style={{
							display: "inline-block",
							padding: "0.6rem 1rem",
							borderRadius: 8,
							border: "1px solid var(--place-primary-400)",
							background: "var(--place-primary-subtle)",
							color: "var(--place-primary-400)",
							textDecoration: "none",
							fontSize: "0.85rem",
							fontWeight: 600,
						}}
					>
						← Back to workspace
					</a>
				</div>
			</div>
		);
	}

	return (
		<div
			className="h-dvh overflow-y-auto bg-[var(--bg-deep)] text-[var(--text-primary)]"
			style={{ animation: 'page-fade-in 0.2s ease' }}
		>
			<style>{`
				@keyframes page-fade-in {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`}</style>
			<ImmersiveNav />
			<main className="pt-14">
				{children}
			</main>
			<BackToDesktop />
		</div>
	);
}
