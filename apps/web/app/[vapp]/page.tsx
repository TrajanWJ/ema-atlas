import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PanelAppFrame } from "@/src/components/apps/PanelAppFrame";
import { ROUTABLE_VAPPS, VAPP_ALIASES, resolveVappRoute } from "@/src/lib/vapp-route-contract";
import type { AppId } from "@/src/types/window";

type PageProps = {
	readonly params: Promise<{ readonly vapp: string }>;
};

export function generateStaticParams() {
	const ids = new Set<string>([...ROUTABLE_VAPPS, ...Object.keys(VAPP_ALIASES)]);
	return [...ids].map((vapp) => ({ vapp }));
}

export default async function VAppPage({ params }: PageProps) {
	const { vapp } = await params;
	const resolved = resolveVappRoute(vapp);
	if (!resolved) notFound();

	return (
		<Suspense fallback={null}>
			<PanelAppFrame appId={resolved.id as AppId} />
		</Suspense>
	);
}
