import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	outputFileTracingRoot: workspaceRoot,
	serverExternalPackages: ["better-sqlite3"],
	turbopack: {
		root: workspaceRoot,
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
					{ key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
				],
			},
		];
	},
};

export default nextConfig;
