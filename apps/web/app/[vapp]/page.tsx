import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PanelAppFrame } from "@/src/components/apps/PanelAppFrame";
import { isAppId } from "@/src/lib/app-ids";
import type { AppId } from "@/src/types/window";

const LEGACY_PANEL_ALIASES = {
	braindump: "brain-dump",
} as const satisfies Record<string, AppId>;

const PANEL_ROUTE_IDS = [
	"launchpad",
	"braindump",
	"brain-dump",
	"hq",
	"blueprint",
	"git-ema",
	"agent-work",
	"chronicle",
	"wiki",
	"threads",
	"settings",
] as const;

type PageProps = {
	readonly params: Promise<{ readonly vapp: string }>;
};

function resolvePanelAppId(value: string): AppId | null {
	const alias = LEGACY_PANEL_ALIASES[value as keyof typeof LEGACY_PANEL_ALIASES];
	if (alias) return alias;
	return isAppId(value) ? value : null;
}

export function generateStaticParams() {
	return PANEL_ROUTE_IDS.map((vapp) => ({ vapp }));
}

export default async function VAppPage({ params }: PageProps) {
	const { vapp } = await params;
	const appId = resolvePanelAppId(vapp);
	if (!appId) notFound();

	return (
		<Suspense fallback={null}>
			<PanelAppFrame appId={appId} />
		</Suspense>
	);
}
