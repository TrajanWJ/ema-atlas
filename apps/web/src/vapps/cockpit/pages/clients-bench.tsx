"use client";

import { ClientBenchView } from "../components/client-bench-view";

export function ClientsBenchPage({ clientId }: { readonly clientId: string }) {
	return <ClientBenchView clientId={clientId} />;
}
