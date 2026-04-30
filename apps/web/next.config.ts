import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	serverExternalPackages: ["better-sqlite3"],
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
