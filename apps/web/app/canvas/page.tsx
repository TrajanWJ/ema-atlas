import { Suspense } from "react";

import { PanelAppFrame } from "@/src/components/apps/PanelAppFrame";

export default function CanvasPage() {
	return (
		<Suspense fallback={null}>
			<PanelAppFrame appId="canvas" />
		</Suspense>
	);
}
