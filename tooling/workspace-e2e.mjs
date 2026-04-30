#!/usr/bin/env node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn, execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "apps/cli/dist/bin.js");
const DAEMON_DIR = path.join(ROOT, "apps/daemon");

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on("error", reject);
  });
}

function waitForWs(url, timeoutMs = 20_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => ws.terminate(), 500);
      ws.once("open", () => {
        clearTimeout(timer);
        ws.close();
        resolve();
      });
      ws.once("error", () => {
        clearTimeout(timer);
        if (Date.now() - started > timeoutMs) reject(new Error(`daemon did not open ${url}`));
        else setTimeout(attempt, 150);
      });
      ws.once("close", () => {
        clearTimeout(timer);
        if (Date.now() - started > timeoutMs) reject(new Error(`daemon did not open ${url}`));
      });
    };
    attempt();
  });
}

function runCli(env, args) {
  return new Promise((resolve, reject) => {
    execFile("node", [CLI, ...args, "--json"], { cwd: ROOT, env }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`cli ${args.join(" ")} failed\n${stderr}\n${stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim().split(/\n/).at(-1)));
      } catch (parseError) {
        reject(new Error(`cli ${args.join(" ")} returned non-json\n${stdout}\n${parseError.message}`));
      }
    });
  });
}

function assertOk(result, label) {
  if (!result?.ok) throw new Error(`${label} did not return ok: ${JSON.stringify(result)}`);
  if (JSON.stringify(result).includes("pending_daemon_writer")) {
    throw new Error(`${label} returned pending_daemon_writer`);
  }
  return result;
}

async function main() {
  const port = await freePort();
  const temp = await mkdtemp(path.join(tmpdir(), "ema-workspace-e2e-"));
  const db = path.join(temp, "canonical.db");
  const env = {
    ...process.env,
    EMA_CANONICAL_DB: db,
    EMA_IPC_PORT: String(port),
    EMA_DAEMON_URL: `ws://127.0.0.1:${port}`,
    EMA_IPC_URL: `ws://127.0.0.1:${port}/`,
  };
  const daemon = spawn("gleam", ["run"], {
    cwd: DAEMON_DIR,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let daemonLog = "";
  daemon.stdout.on("data", (chunk) => { daemonLog += chunk.toString(); });
  daemon.stderr.on("data", (chunk) => { daemonLog += chunk.toString(); });

  try {
    await waitForWs(env.EMA_DAEMON_URL);

    assertOk(await runCli(env, ["agent", "orient"]), "agent orient");
    const campaign = assertOk(await runCli(env, ["campaign", "create", "--title", "E2E campaign"]), "campaign create").resource;
    const mission = assertOk(await runCli(env, ["mission", "create", "--campaign", campaign, "--title", "E2E mission"]), "mission create").resource;
    const lane = assertOk(await runCli(env, ["lane", "open", "--mission", mission, "--title", "E2E lane"]), "lane open").resource;
    assertOk(await runCli(env, ["lane", "claim", "--lane", lane, "--actor", "actor:e2e", "--scope", "workspace lifecycle", "--goal", "prove daemon loop", "--next", "move active"]), "lane claim");
    assertOk(await runCli(env, ["lane", "move", "--lane", lane, "--status", "active"]), "lane move");
    const queue = assertOk(await runCli(env, ["queue", "add", "--lane", lane, "--title", "E2E queue", "--why", "prove queue lifecycle"]), "queue add").resource;
    assertOk(await runCli(env, ["queue", "block", "--queue-item", queue, "--blocked-by", "problem:e2e", "--reason", "blocked for test"]), "queue block");
    assertOk(await runCli(env, ["queue", "ready", "--queue-item", queue, "--reason", "dependency cleared"]), "queue ready");
    assertOk(await runCli(env, ["queue", "close", "--queue-item", queue, "--result", "done", "--verify", "e2e"]), "queue close");
    const problem = assertOk(await runCli(env, ["problem", "log", "--lane", lane, "--title", "E2E problem", "--cause", "test"]), "problem log").resource;
    assertOk(await runCli(env, ["problem", "solution", "--problem", problem, "--title", "E2E solution", "--verify", "e2e"]), "problem solution");
    assertOk(await runCli(env, ["problem", "link", "--from", problem, "--to", queue, "--relation", "blocks"]), "problem link");
    const handoff = assertOk(await runCli(env, ["handoff", "request", "--from", "actor:e2e", "--to", "actor:next", "--needed", "continue verification"]), "handoff request").resource;
    assertOk(await runCli(env, ["handoff", "accept", "--handoff", handoff, "--actor", "actor:next"]), "handoff accept");
    assertOk(await runCli(env, ["handoff", "complete", "--handoff", handoff, "--actor", "actor:next", "--outcome", "accepted", "--verify", "e2e"]), "handoff complete");
    assertOk(await runCli(env, ["agent", "report", "--actor", "actor:e2e", "--lane", lane, "--changed", "workspace lifecycle", "--verified", "workspace-e2e", "--next", "none"]), "agent report");
    assertOk(await runCli(env, ["lane", "close", "--lane", lane, "--reason", "complete", "--verify", "workspace-e2e"]), "lane close");

    assertOk(await runCli(env, ["agent", "orient"]), "final agent orient");
    const laneList = assertOk(await runCli(env, ["lane", "list", "--all-projects"]), "lane list");
    const queueList = assertOk(await runCli(env, ["queue", "list", "--all-projects"]), "queue list");
    const laneRecords = laneList.records ?? laneList.lanes ?? [];
    const queueRecords = queueList.records ?? queueList.queue ?? queueList.queue_items ?? [];
    const laneRecord = laneRecords.find((item) => item.id === lane || item.lane_id === lane);
    const queueRecord = queueRecords.find((item) => item.id === queue || item.queue_item_id === queue);
    if (laneRecord?.status !== "done") {
      throw new Error(`lane did not close: ${JSON.stringify(laneRecord ?? laneList)}`);
    }
    if (queueRecord?.status !== "closed") {
      throw new Error(`queue did not close: ${JSON.stringify(queueRecord ?? queueList)}`);
    }

    console.log(JSON.stringify({ ok: true, port, db, campaign, mission, lane, queue, problem, handoff }));
  } catch (error) {
    console.error(daemonLog);
    throw error;
  } finally {
    if (daemon.pid) {
      try {
        process.kill(-daemon.pid, "SIGTERM");
      } catch {
        daemon.kill("SIGTERM");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (daemon.pid) {
      try {
        process.kill(-daemon.pid, "SIGKILL");
      } catch {
        // Already stopped.
      }
    }
    await rm(temp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
