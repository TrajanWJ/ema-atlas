'use client';

import { useEffect, useMemo } from "react";
import { useLoopsStore } from "@/src/stores/loops-store";
import { DeskTile } from "../DeskTile";
import { useWindowStore } from "@/src/stores/window-store";

export function OpenLoopsTile() {
	const { loops, load, close } = useLoopsStore();
	const openWindow = useWindowStore((s) => s.openWindow);

	useEffect(() => {
		void load();
	}, [load]);

	const open = useMemo(
		() => loops.filter((l) => l.state === "open").sort((a, b) => b.weight - a.weight),
		[loops],
	);

	return (
		<DeskTile
			title={`Open loops — ${open.length}`}
			action={
				<button
					type="button"
					onClick={() => openWindow("loops")}
					style={{
						background: "transparent",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "4px",
						color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
						fontSize: "0.68rem",
						padding: "2px 6px",
						cursor: "pointer",
					}}
				>
					open app
				</button>
			}
		>
			{open.length === 0 ? (
				<div
					style={{
						color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
						fontSize: "0.82rem",
						textAlign: "center",
						padding: "1.5rem 1rem",
					}}
				>
					Mental space clear.
				</div>
			) : (
				<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
					{open.slice(0, 6).map((l) => (
						<li
							key={l.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								padding: "0.4rem 0.25rem",
								borderBottom: "1px solid rgba(255,255,255,0.04)",
							}}
						>
							<button
								type="button"
								onClick={() => void close(l.id)}
								title="Close loop"
								style={{
									width: "12px",
									height: "12px",
									borderRadius: "3px",
									border: "2px solid #8ab4ff",
									background: "transparent",
									cursor: "pointer",
									flexShrink: 0,
									padding: 0,
								}}
							/>
							<span
								style={{
									flex: 1,
									fontSize: "0.82rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{l.title}
							</span>
							{l.waitingOn && (
								<span
									style={{
										fontSize: "0.65rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
									}}
								>
									{l.waitingOn}
								</span>
							)}
						</li>
					))}
				</ul>
			)}
		</DeskTile>
	);
}
