'use client';

import { useEffect } from "react";
import { RightNowStrip } from "./RightNowStrip";
import { HighlightTile } from "./tiles/HighlightTile";
import { TodayTasksTile } from "./tiles/TodayTasksTile";
import { CaptureTile } from "./tiles/CaptureTile";
import { ScheduleTile } from "./tiles/ScheduleTile";
import { OpenLoopsTile } from "./tiles/OpenLoopsTile";
import { PressureGaugeTile } from "./tiles/PressureGaugeTile";
import { LatestBreathTile } from "./tiles/LatestBreathTile";
import { WellnessPingTile } from "./tiles/WellnessPingTile";
import { FeelCheckTile } from "./tiles/FeelCheckTile";
import { WormholeTile } from "./tiles/WormholeTile";
import { MorningIntentTile } from "./tiles/MorningIntentTile";
import { EveningCloseTile } from "./tiles/EveningCloseTile";
import { OneWordTile } from "./tiles/OneWordTile";
import { LedgerTile } from "./tiles/LedgerTile";
import { RiverTile } from "./tiles/RiverTile";
import { WeekTurnTile } from "./tiles/WeekTurnTile";

export function DeskShell() {
	useEffect(() => {
		const prevOverflow = document.body.style.overflow;
		const prevMargin = document.body.style.margin;
		document.body.style.overflow = "hidden";
		document.body.style.margin = "0";
		return () => {
			document.body.style.overflow = prevOverflow;
			document.body.style.margin = prevMargin;
		};
	}, []);

	return (
		<div
			style={{
				width: "100%",
				height: "100dvh",
				display: "grid",
				gridTemplateRows: "auto auto 1fr auto auto",
				gap: "0.625rem",
				padding: "0.75rem",
				boxSizing: "border-box",
				fontFamily:
					"var(--place-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif)",
			}}
		>
			{/* Top strip: Right Now */}
			<RightNowStrip />

			{/* Second strip: morning intent + evening close + highlight */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr 1fr",
					gap: "0.625rem",
					minHeight: 0,
				}}
			>
				<MorningIntentTile />
				<HighlightTile />
				<EveningCloseTile />
			</div>

			{/* Main grid: tasks + loops (left) | capture + schedule + wormhole (right) */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
					gap: "0.625rem",
					minHeight: 0,
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateRows: "1fr 1fr",
						gap: "0.625rem",
						minHeight: 0,
					}}
				>
					<TodayTasksTile />
					<OpenLoopsTile />
				</div>
				<div
					style={{
						display: "grid",
						gridTemplateRows: "auto auto 1fr auto",
						gap: "0.625rem",
						minHeight: 0,
					}}
				>
					<CaptureTile />
					<ScheduleTile />
					<RiverTile />
					<WormholeTile />
				</div>
			</div>

			{/* Week Turn — fills a narrow row below main before the bottom strip */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr",
					gap: "0.625rem",
					minHeight: 0,
				}}
			>
				<WeekTurnTile />
			</div>

			{/* Bottom strip: pressure + breath + wellness + feel + word + ledger */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1.2fr 1fr 1fr 0.8fr 1.5fr",
					gap: "0.625rem",
					minHeight: 0,
				}}
			>
				<PressureGaugeTile />
				<LatestBreathTile />
				<WellnessPingTile />
				<FeelCheckTile />
				<OneWordTile />
				<LedgerTile />
			</div>
		</div>
	);
}
