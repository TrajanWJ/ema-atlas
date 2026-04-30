"use client";

// EMA daemon IPC for the place-port web shell.
//
// Wraps `@ema/surface-core/createIpcClient` as a lazy singleton and
// provides React hooks (`useProjection`, `useIpcConnection`,
// `useSendCommand`) so vApps can subscribe and dispatch without owning
// connection state.

import { createIpcClient, type ConnectionState, type IpcClient } from "@ema/surface-core";
import { useEffect, useRef, useState } from "react";

const DEFAULT_URL = "ws://127.0.0.1:49555";

let singleton: IpcClient | null = null;
let connectionState: ConnectionState = "idle";
const stateListeners = new Set<(state: ConnectionState) => void>();

function getClient(): IpcClient {
	if (singleton) return singleton;
	const url =
		typeof process !== "undefined" && process.env?.NEXT_PUBLIC_EMA_IPC_URL
			? process.env.NEXT_PUBLIC_EMA_IPC_URL
			: DEFAULT_URL;
	const client = createIpcClient({ url, surface: "web" });
	client.subscribeConnection((state) => {
		connectionState = state;
		for (const listener of stateListeners) listener(state);
	});
	client.connect();
	singleton = client;
	return client;
}

export function useIpcConnection(): ConnectionState {
	const [state, setState] = useState<ConnectionState>(() => {
		if (typeof window === "undefined") return "idle";
		getClient();
		return connectionState;
	});
	useEffect(() => {
		if (typeof window === "undefined") return;
		getClient();
		const listener = (next: ConnectionState): void => setState(next);
		stateListeners.add(listener);
		listener(connectionState);
		return () => {
			stateListeners.delete(listener);
		};
	}, []);
	return state;
}

export function useProjection<T = unknown>(name: string): T | null {
	const [data, setData] = useState<T | null>(null);
	const nameRef = useRef(name);
	nameRef.current = name;
	useEffect(() => {
		if (typeof window === "undefined") return;
		const client = getClient();
		const unsubscribe = client.subscribeProjection<T>(nameRef.current, (next) => {
			setData(next);
		});
		return () => unsubscribe();
	}, [name]);
	return data;
}

export interface CommandError {
	readonly class: string;
	readonly message: string;
}

export type CommandResult =
	| { ok: true; event_ids: string[]; resource?: string; warning?: { class: string; message: string } }
	| { ok: false; error: CommandError };

export async function sendCommand(
	op: string,
	args: Record<string, unknown>,
): Promise<CommandResult> {
	const client = getClient();
	const result = (await client.sendCommand(op, args)) as CommandResult;
	return result;
}
