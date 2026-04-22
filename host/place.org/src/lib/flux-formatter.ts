import type { AppEvent } from "./event-bus";

// ----------------------------------------------------------------------------
// Event-to-text formatter for Flux timeline
// ----------------------------------------------------------------------------

interface FormattedEvent {
	readonly content: string;
	readonly icon: string;
	readonly skip: boolean;
}

/** Map appId to a color CSS variable for the timeline dot */
export function appColor(appId: string): string {
	const colors: Record<string, string> = {
		"brain-dump": "var(--accent-warm)",
		journal: "var(--accent-blue)",
		focus: "var(--accent-urgent)",
		tasks: "var(--accent-success)",
		habits: "var(--accent-blue)",
		calendar: "var(--accent-warm)",
		timer: "var(--accent-urgent)",
	};
	return colors[appId] ?? "var(--text-secondary)";
}

/** Map appId to a single-character icon for compact display */
function appIcon(appId: string): string {
	const icons: Record<string, string> = {
		"brain-dump": "\u{1f4ad}",
		focus: "\u{1f3af}",
		tasks: "\u2705",
		habits: "\u{1f504}",
		calendar: "\u{1f4c5}",
		timer: "\u23f1\ufe0f",
	};
	return icons[appId] ?? "\u{1f4cc}";
}

function payload(event: AppEvent, key: string): string {
	const val = event.payload[key];
	return typeof val === "string" ? val : "";
}

function payloadNumber(event: AppEvent, key: string): number {
	const val = event.payload[key];
	return typeof val === "number" ? val : 0;
}

/** Convert a raw AppEvent into a human-readable timeline entry */
export function formatEvent(event: AppEvent): FormattedEvent {
	const key = `${event.appId}:${event.eventType}`;

	switch (key) {
		// Focus / Timer
		case "focus:session_started":
		case "timer:session_started":
			return {
				content: `Started focus session: ${payload(event, "label") || "Untimed"}`,
				icon: appIcon(event.appId),
				skip: false,
			};
		case "focus:session_completed":
		case "timer:session_completed": {
			const mins = payloadNumber(event, "duration");
			return {
				content: `Completed ${mins > 0 ? `${mins}min` : ""} focus session`,
				icon: appIcon(event.appId),
				skip: false,
			};
		}
		case "focus:block_started":
			return {
				content: `Focus block: ${payload(event, "label") || payload(event, "type")}`,
				icon: appIcon(event.appId),
				skip: false,
			};
		case "focus:block_completed":
			return {
				content: `Finished focus block: ${payload(event, "label") || payload(event, "type")}`,
				icon: appIcon(event.appId),
				skip: false,
			};

		// Tasks
		case "tasks:task_created":
			return {
				content: `Created task: ${payload(event, "title")}`,
				icon: appIcon("tasks"),
				skip: false,
			};
		case "tasks:task_completed":
			return {
				content: `Completed task: ${payload(event, "title")}`,
				icon: appIcon("tasks"),
				skip: false,
			};
		case "tasks:task_updated":
			return {
				content: `Updated task: ${payload(event, "title")}`,
				icon: appIcon("tasks"),
				skip: false,
			};

		// Brain Dump
		case "brain-dump:item_created":
			return {
				content: `Captured thought: ${payload(event, "content")}`,
				icon: appIcon("brain-dump"),
				skip: false,
			};
		case "brain-dump:item_processed":
			return {
				content: `Processed inbox item: ${payload(event, "content")}`,
				icon: appIcon("brain-dump"),
				skip: false,
			};

		// Habits
		case "habits:habit_toggled":
			return {
				content: `Checked off habit: ${payload(event, "name")}`,
				icon: appIcon("habits"),
				skip: false,
			};
		case "habits:habit_created":
			return {
				content: `New habit: ${payload(event, "name")}`,
				icon: appIcon("habits"),
				skip: false,
			};

		// Journal — skip to avoid double-logging
		case "journal:entry_saved":
			return { content: "", icon: "", skip: true };

		// Calendar
		case "calendar:block_created":
			return {
				content: `Scheduled: ${payload(event, "label")}`,
				icon: appIcon("calendar"),
				skip: false,
			};

		// Generic fallback
		default:
			return {
				content: `${event.appId}: ${event.eventType.replace(/_/g, " ")}`,
				icon: appIcon(event.appId),
				skip: false,
			};
	}
}

/** Format a timestamp (ms) to HH:MM */
export function formatTime(timestamp: number): string {
	const d = new Date(timestamp);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
