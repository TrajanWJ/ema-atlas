'use client';

import { useEffect, useMemo, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { useTaskStore } from "@/src/stores/task-store";
import { useLoopsStore } from "@/src/stores/loops-store";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useResponsibilitiesStore, isDrifting } from "@/src/stores/responsibilities-store";
import { dayBundle, pressureScore, pressureTone } from "@/src/context/bundle";
import { useWindowStore } from "@/src/stores/window-store";

interface PlateItem {
	readonly id: string;
	readonly kind: "task" | "loop" | "capture" | "responsibility";
	readonly label: string;
	readonly weight: number; // 1..5
	readonly color: string;
	readonly onOpen?: () => void;
}

const KIND_COLORS: Record<PlateItem["kind"], string> = {
	task: "#8ab4ff",
	loop: "#f59e0b",
	capture: "#ffcf73",
	responsibility: "#f6a5c0",
};

export function PlateApp() {
	const { tasks, load: loadTasks } = useTaskStore();
	const { loops, load: loadLoops } = useLoopsStore();
	const { items: inbox, load: loadInbox } = useInboxStore();
	const { responsibilities, load: loadResp } = useResponsibilitiesStore();
	const openWindow = useWindowStore((s) => s.openWindow);
	const [pressure, setPressure] = useState<{ score: number; tone: string }>({ score: 0, tone: "calm" });

	useEffect(() => {
		void loadTasks();
		void loadLoops();
		void loadInbox();
		void loadResp();
		void (async () => {
			try {
				const db = getDbClient();
				const b = await dayBundle(db);
				const score = pressureScore(b);
				setPressure({ score, tone: pressureTone(score) });
			} catch {
				/* silent */
			}
		})();
	}, [loadTasks, loadLoops, loadInbox, loadResp]);

	const items = useMemo<readonly PlateItem[]>(() => {
		const out: PlateItem[] = [];

		for (const t of tasks) {
			if (t.status === "complete" || t.status === "archived") continue;
			const weight = t.priority === "must" ? 5 : t.priority === "should" ? 3 : 2;
			out.push({
				id: `task:${t.id}`,
				kind: "task",
				label: t.title,
				weight,
				color: KIND_COLORS.task,
				onOpen: () => openWindow("tasks"),
			});
		}

		for (const l of loops) {
			if (l.state !== "open") continue;
			out.push({
				id: `loop:${l.id}`,
				kind: "loop",
				label: l.title,
				weight: l.weight,
				color: KIND_COLORS.loop,
				onOpen: () => openWindow("loops"),
			});
		}

		for (const i of inbox) {
			out.push({
				id: `capture:${i.id}`,
				kind: "capture",
				label: i.content.slice(0, 60),
				weight: 1,
				color: KIND_COLORS.capture,
				onOpen: () => openWindow("brain-dump"),
			});
		}

		for (const r of responsibilities) {
			if (!r.active) continue;
			const drift = isDrifting(r);
			out.push({
				id: `resp:${r.id}`,
				kind: "responsibility",
				label: r.title,
				weight: drift ? 4 : 2,
				color: KIND_COLORS.responsibility,
				onOpen: () => openWindow("responsibilities"),
			});
		}

		return out.sort((a, b) => b.weight - a.weight);
	}, [tasks, loops, inbox, responsibilities, openWindow]);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
			}}
		>
			<div
				style={{
					padding: "0.5rem 0.75rem",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					display: "flex",
					alignItems: "center",
					gap: "0.75rem",
					fontSize: "0.72rem",
					color: "var(--place-text-secondary, rgba(255,255,255,0.5))",
				}}
			>
				<span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
					On my plate — {items.length}
				</span>
				<span style={{ flex: 1 }} />
				<span style={{ textTransform: "capitalize" }}>{pressure.tone}</span>
				<span style={{ opacity: 0.5 }}>·</span>
				<Legend />
			</div>

			<div
				style={{
					flex: 1,
					overflow: "auto",
					padding: "1rem",
					display: "flex",
					flexWrap: "wrap",
					gap: "0.5rem",
					alignContent: "flex-start",
				}}
			>
				{items.length === 0 ? (
					<div
						style={{
							width: "100%",
							textAlign: "center",
							padding: "3rem 1rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
							fontSize: "0.9rem",
						}}
					>
						Plate is clear. Breathe.
					</div>
				) : (
					items.map((item) => <PlateBlob key={item.id} item={item} />)
				)}
			</div>
		</div>
	);
}

function PlateBlob({ item }: { readonly item: PlateItem }) {
	// weight 1..5 → size 44..112
	const size = 44 + (item.weight - 1) * 17;
	const fontSize = 0.62 + (item.weight - 1) * 0.06;

	return (
		<button
			type="button"
			onClick={item.onOpen}
			title={`${item.kind}: ${item.label}`}
			style={{
				minWidth: `${size}px`,
				height: `${size}px`,
				borderRadius: "50%",
				border: `1.5px solid ${item.color}`,
				background: `radial-gradient(circle at 30% 30%, ${item.color}26, ${item.color}0d)`,
				padding: "8px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontSize: `${fontSize}rem`,
				fontFamily: "inherit",
				textAlign: "center",
				cursor: "pointer",
				lineHeight: 1.1,
				overflow: "hidden",
				transition: "transform 0.15s ease, background 0.15s ease",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.transform = "scale(1.05)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = "scale(1)";
			}}
		>
			<span
				style={{
					display: "-webkit-box",
					WebkitLineClamp: 3,
					WebkitBoxOrient: "vertical",
					overflow: "hidden",
				}}
			>
				{item.label}
			</span>
		</button>
	);
}

function Legend() {
	return (
		<div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
			{(["task", "loop", "capture", "responsibility"] as const).map((k) => (
				<span
					key={k}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "3px",
						fontSize: "0.65rem",
						color: "var(--place-text-secondary, rgba(255,255,255,0.5))",
					}}
				>
					<span
						aria-hidden
						style={{
							width: "6px",
							height: "6px",
							borderRadius: "50%",
							background: KIND_COLORS[k],
						}}
					/>
					{k}
				</span>
			))}
		</div>
	);
}
