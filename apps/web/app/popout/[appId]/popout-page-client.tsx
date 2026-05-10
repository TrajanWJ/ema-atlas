"use client";

import { use } from "react";
import { PopoutShell } from "@/src/components/popout/PopoutShell";

export function PopoutPageClient({
	params,
}: {
	readonly params: Promise<{ appId: string }>;
}) {
	const { appId } = use(params);
	return <PopoutShell appIdParam={appId} />;
}
