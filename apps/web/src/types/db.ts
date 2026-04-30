export type DbRequestType = "init" | "exec" | "query";
export type DbResponseType = "ready" | "result" | "exec-done" | "error";

export interface DbRequestInit {
	readonly id: string;
	readonly type: "init";
}

export interface DbRequestExec {
	readonly id: string;
	readonly type: "exec";
	readonly sql: string;
	readonly params?: readonly unknown[];
}

export interface DbRequestQuery {
	readonly id: string;
	readonly type: "query";
	readonly sql: string;
	readonly params?: readonly unknown[];
}

export type DbRequest = DbRequestInit | DbRequestExec | DbRequestQuery;

export interface DbResponseReady {
	readonly id: string;
	readonly type: "ready";
}

export interface DbResponseResult {
	readonly id: string;
	readonly type: "result";
	readonly rows: readonly Record<string, unknown>[];
	readonly columns: readonly string[];
}

export interface DbResponseExecDone {
	readonly id: string;
	readonly type: "exec-done";
}

export interface DbResponseError {
	readonly id: string;
	readonly type: "error";
	readonly message: string;
}

export type DbResponse =
	| DbResponseReady
	| DbResponseResult
	| DbResponseExecDone
	| DbResponseError;
