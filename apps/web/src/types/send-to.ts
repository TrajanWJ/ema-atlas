import type { AppId } from "./window";

export type SendPayloadType =
	| "braindump_item"
	| "task"
	| "text"
	| "journal_entry";

export interface SendPayload {
	readonly type: SendPayloadType;
	readonly data: Readonly<Record<string, unknown>>;
	readonly sourceAppId: AppId;
}

export interface SendTarget {
	readonly appId: AppId;
	readonly label: string;
	readonly accepts: readonly SendPayloadType[];
}
