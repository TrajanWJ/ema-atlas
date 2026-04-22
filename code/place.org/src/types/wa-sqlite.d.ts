// Type stubs for wa-sqlite dynamic imports used in the DB worker.
// The library ships no TypeScript declarations; these are minimal shims.
declare module "wa-sqlite/dist/wa-sqlite-async.mjs" {
	const module: {
		default(): Promise<unknown>;
	};
	export default module.default;
}

declare module "wa-sqlite/src/sqlite-api.js" {
	export function Factory(module: unknown): unknown;
}

declare module "wa-sqlite/src/examples/AccessHandlePoolVFS.js" {
	export class AccessHandlePoolVFS {
		readonly isReady: Promise<void>;
		constructor(name: string);
	}
}
