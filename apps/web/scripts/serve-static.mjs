#!/usr/bin/env node
/**
 * Tiny static file server for the bundled `out/` directory.
 *
 * Why: the dev server (next dev on :5173) executes server-side code
 * (api/db, api/files, etc) that doesn't exist in the bundled .app.
 * Testing against `next dev` therefore lies — we miss .app-specific
 * crashes (better-sqlite3 cascade, fetch 404s on /api routes, etc).
 *
 * This script serves `apps/web/out/` over plain HTTP so Playwright can
 * test the EXACT bytes that ship in the Tauri .app. Any crash that
 * shows up here will show up in the .app.
 *
 * Usage:
 *   node scripts/serve-static.mjs              # serves on :4174
 *   node scripts/serve-static.mjs --port 4175  # custom port
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "out");

const portArgIdx = process.argv.indexOf("--port");
const PORT = portArgIdx > -1 ? Number(process.argv[portArgIdx + 1]) : 4174;

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".wasm": "application/wasm",
	".map": "application/json",
};

async function tryFile(p) {
	try {
		const s = await stat(p);
		if (s.isFile()) return p;
		if (s.isDirectory()) {
			const idx = join(p, "index.html");
			const ix = await stat(idx).catch(() => null);
			if (ix?.isFile()) return idx;
		}
	} catch {
		/* not found */
	}
	return null;
}

const server = createServer(async (req, res) => {
	try {
		const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
		const safe = normalize(urlPath).replace(/^\/+|\/+$/g, "");
		const candidate = safe ? join(ROOT, safe) : ROOT;

		// 1. exact path (or directory index)
		let file = await tryFile(candidate);
		// 2. fallback: append .html
		if (!file && safe) {
			file = await tryFile(`${candidate}.html`);
		}
		// 3. SPA-style fallback to index.html for unknown routes
		if (!file) {
			file = await tryFile(join(ROOT, "index.html"));
		}

		if (!file) {
			res.writeHead(404, { "content-type": "text/plain" });
			res.end("404 not found");
			return;
		}

		const body = await readFile(file);
		// Cross-origin isolation headers required by wa-sqlite (SharedArrayBuffer)
		res.writeHead(200, {
			"content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
			"cross-origin-opener-policy": "same-origin",
			"cross-origin-embedder-policy": "require-corp",
			"cache-control": "no-store",
		});
		res.end(body);
	} catch (e) {
		res.writeHead(500, { "content-type": "text/plain" });
		res.end(`500 ${e?.message ?? "internal error"}`);
	}
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`[serve-static] http://127.0.0.1:${PORT}/  (root: ${ROOT})`);
});
