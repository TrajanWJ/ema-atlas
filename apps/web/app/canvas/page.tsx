"use client";

import { CanvasCore } from "@/src/components/apps/canvas/CanvasCore";
import { holodeckInsetStyle } from "@/src/lib/holodeck-layout";

export default function CanvasPage() {
	return (
		<div style={holodeckInsetStyle()}>
			<CanvasCore fullPage />
		</div>
	);
}
