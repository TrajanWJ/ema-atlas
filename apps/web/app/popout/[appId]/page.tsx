import { PopoutPageClient } from "./popout-page-client";
import { STATIC_POPOUT_VAPPS } from "@/src/lib/vapp-route-contract";

export function generateStaticParams() {
	return STATIC_POPOUT_VAPPS.map((appId) => ({ appId }));
}

export default function PopoutPage({
	params,
}: {
	params: Promise<{ appId: string }>;
}) {
	return <PopoutPageClient params={params} />;
}
