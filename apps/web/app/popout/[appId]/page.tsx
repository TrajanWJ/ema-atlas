import { PopoutPageClient } from "./popout-page-client";

const STATIC_POPOUT_APPS = [
	"launchpad",
	"cockpit",
	"agent-work",
	"hq",
	"atlas",
	"blueprint",
	"chronicle",
	"git-ema",
	"clients",
	"threads",
	"wiki",
	"settings",
	"place-tools",
	"terminal",
	"finder",
] as const;

export function generateStaticParams() {
	return STATIC_POPOUT_APPS.map((appId) => ({ appId }));
}

export default function PopoutPage({
	params,
}: {
	params: Promise<{ appId: string }>;
}) {
	return <PopoutPageClient params={params} />;
}
