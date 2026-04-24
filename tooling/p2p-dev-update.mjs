#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_OUT = ".ema-dev-updates";
const DEFAULT_PORT = 49_666;
const MANIFEST_NAME = "manifest.json";
const UPDATE_PATH = "/ema-dev-update";
const EXCLUDES = [
  ".git",
  ".DS_Store",
  ".ema-dev-updates",
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".vite",
  ".next",
  "_build",
  "erl_crash.dump",
];

const command = process.argv[2];
const flags = parseFlags(process.argv.slice(3));

try {
  switch (command) {
    case "pack":
      await packCommand(flags);
      break;
    case "serve":
      await serveCommand(flags);
      break;
    case "check":
      await checkCommand(flags);
      break;
    case "apply":
      await applyCommand(flags);
      break;
    default:
      usage(command ? `Unknown command: ${command}` : undefined);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

async function packCommand(options) {
  const repo = path.resolve(options.repo ?? DEFAULT_REPO);
  const outDir = path.resolve(repo, options.out ?? DEFAULT_OUT);
  const channel = options.channel ?? "dev";
  const version = options.version ?? await inferVersion(repo);
  const buildId = options.buildId ?? await inferBuildId(repo);
  const peerId = options.peerId ?? os.hostname();
  const createdAt = new Date().toISOString();
  const safeVersion = slug(`${version}-${buildId}`);
  const archiveName = `ema-dev-update-${safeVersion}.tgz`;
  const archivePath = path.join(outDir, archiveName);

  if (channel !== "dev" && !options.allowNonDev) {
    throw new Error("Refusing to pack a non-dev channel without --allow-non-dev.");
  }

  await mkdir(outDir, { recursive: true });
  await run("tar", [
    "-czf",
    archivePath,
    ...EXCLUDES.flatMap((item) => ["--exclude", item]),
    "-C",
    repo,
    ".",
  ]);

  const archiveStat = await stat(archivePath);
  const sha256 = await sha256File(archivePath);
  const manifest = {
    schema: "ema.dev_update.v0",
    channel,
    product: "ema",
    version,
    build_id: buildId,
    peer_id: peerId,
    created_at: createdAt,
    archive: {
      path: `${UPDATE_PATH}/${archiveName}`,
      filename: archiveName,
      size_bytes: archiveStat.size,
      sha256,
      format: "tar+gzip",
    },
    apply: {
      mode: "replace_files",
      backup: "tarball_before_apply",
      restart_required: true,
    },
  };

  await writeJsonAtomic(path.join(outDir, MANIFEST_NAME), manifest);
  printManifest(manifest);
}

async function serveCommand(options) {
  const repo = path.resolve(options.repo ?? DEFAULT_REPO);
  const outDir = path.resolve(repo, options.out ?? DEFAULT_OUT);
  const host = options.host ?? "0.0.0.0";
  const port = Number(options.port ?? DEFAULT_PORT);

  if (options.pack) {
    await packCommand({ ...options, repo, out: options.out ?? DEFAULT_OUT });
  }

  const server = http.createServer(async (request, response) => {
    try {
      response.setHeader("Access-Control-Allow-Origin", "*");
      const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

      if (requestUrl.pathname === `${UPDATE_PATH}/${MANIFEST_NAME}` || requestUrl.pathname === "/manifest.json") {
        return await sendFile(response, path.join(outDir, MANIFEST_NAME), "application/json");
      }

      if (requestUrl.pathname.startsWith(`${UPDATE_PATH}/`)) {
        const filename = path.basename(requestUrl.pathname);
        return await sendFile(response, path.join(outDir, filename), "application/gzip");
      }

      response.writeHead(404);
      response.end("not found\n");
    } catch (error) {
      response.writeHead(500);
      response.end(`${error instanceof Error ? error.message : error}\n`);
    }
  });

  server.listen(port, host, () => {
    console.log(`EMA dev update peer serving ${outDir}`);
    console.log(`manifest: http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}${UPDATE_PATH}/${MANIFEST_NAME}`);
  });
}

async function checkCommand(options) {
  const manifest = await fetchManifest(required(options.peer, "--peer is required"));
  printManifest(manifest);
}

async function applyCommand(options) {
  const peer = required(options.peer, "--peer is required");
  const target = path.resolve(options.target ?? DEFAULT_REPO);
  const incomingDir = path.resolve(target, DEFAULT_OUT, "incoming");
  const backupDir = path.resolve(target, DEFAULT_OUT, "backups");
  const manifest = await fetchManifest(peer);

  assertDevManifest(manifest, options);
  await assertDevTarget(target, options);

  const archiveUrl = resolvePeerUrl(peer, manifest.archive.path);
  const archivePath = path.join(incomingDir, manifest.archive.filename);
  await mkdir(incomingDir, { recursive: true });
  await mkdir(backupDir, { recursive: true });

  console.log(`downloading ${archiveUrl}`);
  await downloadFile(archiveUrl, archivePath);

  const actualSha = await sha256File(archivePath);
  if (actualSha !== manifest.archive.sha256) {
    throw new Error(`Checksum mismatch. Expected ${manifest.archive.sha256}, got ${actualSha}.`);
  }

  const backupName = `pre-${slug(manifest.version)}-${Date.now()}.tgz`;
  const backupPath = path.join(backupDir, backupName);
  console.log(`creating backup ${backupPath}`);
  await run("tar", [
    "-czf",
    backupPath,
    ...EXCLUDES.flatMap((item) => ["--exclude", item]),
    "-C",
    target,
    ".",
  ]);

  if (!options.yes) {
    console.log("dry run complete; pass --yes to extract this update into the target workspace.");
    return;
  }

  console.log(`applying ${manifest.version} from peer ${manifest.peer_id}`);
  await run("tar", ["-xzf", archivePath, "-C", target]);
  await writeJsonAtomic(path.join(target, DEFAULT_OUT, "last-applied.json"), {
    applied_at: new Date().toISOString(),
    peer,
    manifest,
    backup: backupPath,
  });
  console.log("applied. Restart the daemon/web/dev build to pick up updated files.");
}

async function fetchManifest(peer) {
  const url = resolvePeerUrl(peer, `${UPDATE_PATH}/${MANIFEST_NAME}`);
  const body = await fetchText(url);
  const manifest = JSON.parse(body);
  validateManifest(manifest);
  return manifest;
}

function validateManifest(manifest) {
  if (manifest?.schema !== "ema.dev_update.v0") throw new Error("Invalid update manifest schema.");
  if (!manifest.archive?.path || !manifest.archive?.filename || !manifest.archive?.sha256) {
    throw new Error("Update manifest is missing archive metadata.");
  }
}

function assertDevManifest(manifest, options) {
  if (manifest.channel !== "dev" && !options.allowNonDev) {
    throw new Error(`Refusing ${manifest.channel} update. Dev updater only accepts channel=dev.`);
  }
}

async function assertDevTarget(target, options) {
  if (options.allowNonDev) return;

  const candidates = [
    path.join(target, "package.json"),
    path.join(target, "apps", "web", "package.json"),
  ];

  for (const candidate of candidates) {
    try {
      const pkg = JSON.parse(await readFile(candidate, "utf8"));
      if (String(pkg.version ?? "").includes("dev")) return;
    } catch {
      // Keep looking.
    }
  }

  const daemonToml = path.join(target, "apps", "daemon", "gleam.toml");
  try {
    const text = await readFile(daemonToml, "utf8");
    if (text.includes('version = "0.0.5"')) return;
  } catch {
    // Fall through to refusal.
  }

  throw new Error("Target does not look like an EMA dev workspace. Pass --allow-non-dev to override.");
}

async function inferVersion(repo) {
  for (const file of ["package.json", path.join("apps", "web", "package.json")]) {
    try {
      const pkg = JSON.parse(await readFile(path.join(repo, file), "utf8"));
      if (pkg.version) return pkg.version;
    } catch {
      // Keep looking.
    }
  }
  return "0.0.5-dev";
}

async function inferBuildId(repo) {
  try {
    const { stdout } = await runCapture("git", ["rev-parse", "--short=12", "HEAD"], { cwd: repo });
    return stdout.trim();
  } catch {
    return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  }
}

function resolvePeerUrl(peer, suffix) {
  const base = peer.startsWith("http://") || peer.startsWith("https://")
    ? peer
    : `http://${peer}`;
  return new URL(suffix, base.endsWith("/") ? base : `${base}/`).toString();
}

async function sendFile(response, filename, contentType) {
  const fileStat = await stat(filename);
  response.writeHead(200, {
    "content-type": contentType,
    "content-length": fileStat.size,
    "cache-control": "no-store",
  });
  createReadStream(filename).pipe(response);
}

async function downloadFile(url, destination) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ema-dev-update-"));
  const tmpFile = path.join(tmpDir, path.basename(destination));

  await new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed with HTTP ${response.statusCode}`));
        return;
      }

      const output = createWriteStream(tmpFile);
      response.pipe(output);
      output.on("finish", () => output.close(resolve));
      output.on("error", reject);
    });
    request.on("error", reject);
  });

  await rename(tmpFile, destination);
}

async function fetchText(url) {
  return await new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Request failed with HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.setEncoding("utf8");
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve(body));
    });
    request.on("error", reject);
  });
}

async function sha256File(filename) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(filename)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

async function writeJsonAtomic(filename, data) {
  await mkdir(path.dirname(filename), { recursive: true });
  const tmp = `${filename}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, filename);
}

function run(commandName, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      code === 0 ? resolve() : reject(new Error(`${commandName} exited with ${code}`));
    });
  });
}

function runCapture(commandName, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => {
      code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr || `${commandName} exited with ${code}`));
    });
  });
}

function parseFlags(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    const key = camel(arg.slice(2));
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function camel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function slug(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function required(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function printManifest(manifest) {
  console.log(JSON.stringify(manifest, null, 2));
}

function usage(error) {
  if (error) console.error(error);
  console.log(`Usage:
  node tooling/p2p-dev-update.mjs pack [--repo .] [--out .ema-dev-updates]
  node tooling/p2p-dev-update.mjs serve [--repo .] [--port 49666] [--pack]
  node tooling/p2p-dev-update.mjs check --peer http://peer:49666
  node tooling/p2p-dev-update.mjs apply --peer http://peer:49666 [--target .] [--yes]
`);
  process.exitCode = error ? 1 : 0;
}
