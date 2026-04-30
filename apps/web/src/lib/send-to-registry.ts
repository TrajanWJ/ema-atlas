import { getSyncChannel } from "./sync-channel";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";
import type { SendPayload, SendPayloadType, SendTarget } from "@/src/types/send-to";

// ----------------------------------------------------------------------------
// Registry — which apps accept which payload types
// ----------------------------------------------------------------------------

const SEND_TARGETS: readonly SendTarget[] = [
	{
		appId: "brain-dump",
		label: "Brain Dump",
		accepts: ["text", "task"],
	},
	{
		appId: "tasks",
		label: "Tasks",
		accepts: ["braindump_item", "text"],
	},
	{
		appId: "journal",
		label: "Journal",
		accepts: ["text", "braindump_item", "task"],
	},
] as const;

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export function getTargetsForPayload(
	payloadType: SendPayloadType,
	excludeAppId?: AppId,
): readonly SendTarget[] {
	return SEND_TARGETS.filter(
		(t) => t.accepts.includes(payloadType) && t.appId !== excludeAppId,
	);
}

// ----------------------------------------------------------------------------
// Send action
// ----------------------------------------------------------------------------

export function sendToApp(payload: SendPayload, targetAppId: AppId): void {
	const sync = getSyncChannel();

	// Broadcast the payload to all contexts (parent + popouts)
	sync.broadcast({
		type: "drag_payload",
		source: sync.getSourceId(),
		timestamp: Date.now(),
		payload: { sendTo: targetAppId, ...payload },
	});

	// Ensure the target app is open somewhere
	const store = useWindowStore.getState();
	const existing = store.getWindowsByApp(targetAppId);
	if (existing.length === 0) {
		store.openWindow(targetAppId);
	} else {
		// Focus the first existing window of that app
		const win = existing[0];
		if (win) {
			store.focusWindow(win.id);
		}
	}
}
