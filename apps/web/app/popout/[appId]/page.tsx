'use client';

import { use } from "react";
import { PopoutShell } from "@/src/components/popout/PopoutShell";

export default function PopoutPage({
	params,
}: {
	params: Promise<{ appId: string }>;
}) {
	const { appId } = use(params);

	return <PopoutShell appIdParam={appId} />;
}
