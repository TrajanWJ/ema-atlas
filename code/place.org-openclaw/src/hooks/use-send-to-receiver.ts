'use client';

import { useEffect } from "react";
import { getSyncChannel } from "@/src/lib/sync-channel";
import type { SyncMessage } from "@/src/lib/sync-channel";
import type { AppId } from "@/src/types/window";
import type { SendPayload } from "@/src/types/send-to";

// ----------------------------------------------------------------------------
// Type guard for incoming drag_payload messages
// ----------------------------------------------------------------------------

interface SendToMessage extends SendPayload {
	readonly sendTo: AppId;
}

function isSendToMessage(p: unknown): p is SendToMessage {
	if (typeof p !== "object" || p === null) return false;
	const obj = p as Record<string, unknown>;
	return (
		typeof obj.sendTo === "string" &&
		typeof obj.type === "string" &&
		typeof obj.sourceAppId === "string" &&
		typeof obj.data === "object" &&
		obj.data !== null
	);
}

// ----------------------------------------------------------------------------
// Hook — subscribes to SyncChannel for payloads targeting this app
// ----------------------------------------------------------------------------

export function useSendToReceiver(
	appId: AppId,
	handler: (payload: SendPayload) => void,
): void {
	useEffect(() => {
		const sync = getSyncChannel();

		const unsubscribe = sync.subscribe((msg: SyncMessage) => {
			if (msg.type !== "drag_payload") return;
			if (!isSendToMessage(msg.payload)) return;
			if (msg.payload.sendTo !== appId) return;

			handler({
				type: msg.payload.type,
				data: msg.payload.data,
				sourceAppId: msg.payload.sourceAppId,
			});
		});

		return unsubscribe;
	}, [appId, handler]);
}
