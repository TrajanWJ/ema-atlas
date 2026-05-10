#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import WebSocket from "ws";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "apps/cli/dist/bin.js");
const DAEMON_DIR = path.join(ROOT, "apps/daemon");
const INTENTION_STORE = path.join(ROOT, ".ema-dev", "intention-backfeed");
const REVIEWS_PATH = path.join(INTENTION_STORE, "reviews.json");
const SMOKE_PROJECT = "sprint3-smoke";
const SMOKE_INTENTION_PATH = path.join(INTENTION_STORE, `${SMOKE_PROJECT}.json`);
const SMOKE_INTENTION_ID = "intent:sprint3-smoke";

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

function assertOperational(result, label) {
  const serialized = JSON.stringify(result);
  if (!result?.ok) throw new Error(`${label} did not return ok: ${serialized}`);
  if (serialized.includes("pending_daemon_writer")) {
    throw new Error(`${label} returned pending_daemon_writer`);
  }
  return result;
}

async function main() {
  const port = await freePort();
  const temp = await mkdtemp(path.join(tmpdir(), "ema-agent-workspace-round-trip-"));
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
  daemon.stdout.on("data", (chunk) => {
    daemonLog += chunk.toString();
  });
  daemon.stderr.on("data", (chunk) => {
    daemonLog += chunk.toString();
  });
  const originalReviews = existsSync(REVIEWS_PATH) ? readFileSync(REVIEWS_PATH, "utf8") : null;

  try {
    writeSmokeIntention();
    await waitForWs(env.EMA_DAEMON_URL);

    assertOperational(await runCli(env, ["agent", "orient"]), "agent orient");
    const lane = assertOperational(await runCli(env, ["lane", "open", "--title", "Sprint 3 smoke lane"]), "lane open").resource;
    assertOperational(
      await runCli(env, [
        "lane",
        "claim",
        "--lane",
        lane,
        "--actor",
        "actor:sprint3-smoke",
        "--scope",
        "coordination writer hardening",
        "--goal",
        "prove supported lane writes are daemon-backed",
        "--next",
        "add queue item",
      ]),
      "lane claim",
    );
    assertOperational(await runCli(env, ["lane", "list", "--all-projects"]), "lane list");
    const queue = assertOperational(
      await runCli(env, ["queue", "add", "--lane", lane, "--title", "Sprint 3 smoke queue", "--why", "prove queue writer path"]),
      "queue add",
    ).resource;
    assertOperational(await runCli(env, ["queue", "list", "--all-projects"]), "queue list");
    assertOperational(await runCli(env, ["queue", "close", "--queue-item", queue, "--result", "done", "--verify", "round-trip"]), "queue close");
    assertOperational(await runCli(env, ["checkup", "runtime"]), "checkup runtime");
    assertOperational(
      await runCli(env, ["intention", "backfeed", "--project", SMOKE_PROJECT, "--intent", SMOKE_INTENTION_ID, "--destination", "queue", "--dry-run"]),
      "intention backfeed dry-run",
    );
    assertOperational(
      await runCli(env, ["intention", "accept", "--project", SMOKE_PROJECT, "--intent", SMOKE_INTENTION_ID, "--reason", "round-trip smoke"]),
      "intention accept",
    );
    assertOperational(
      await runCli(env, ["intention", "backfeed", "--project", SMOKE_PROJECT, "--intent", SMOKE_INTENTION_ID, "--destination", "queue", "--approve", "reviewed"]),
      "intention backfeed reviewed",
    );
  } catch (error) {
    if (daemonLog) console.error(daemonLog);
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
    rmSync(SMOKE_INTENTION_PATH, { force: true });
    if (originalReviews === null) rmSync(REVIEWS_PATH, { force: true });
    else writeFileSync(REVIEWS_PATH, originalReviews);
  }

  console.log(JSON.stringify({ ok: true, db, port }));
}

function writeSmokeIntention() {
  mkdirSync(INTENTION_STORE, { recursive: true });
  const generatedAt = new Date().toISOString();
  writeFileSync(
    SMOKE_INTENTION_PATH,
    JSON.stringify(
      {
        ok: true,
        command: "intention.projection",
        source: "ema_intention_cli",
        authority: "file_backed_review_projection",
        generated_at: generatedAt,
        project: SMOKE_PROJECT,
        stats: {
          sources_seen: 1,
          records_parsed: 1,
          candidate_intents: 1,
          proslync_relevant: 0,
          ema_relevant: 1,
          lost_followups: 1,
          duplicates_skipped: 0,
        },
        top_tags: [
          { tag: "ema_build_process_intent", count: 1 },
          { tag: "lost_followup", count: 1 },
        ],
        intents: [
          {
            id: SMOKE_INTENTION_ID,
            title: "EMA: Sprint 3 smoke intention",
            raw_text: "Ensure intention backfeed dry-run and reviewed queue paths stay operational through daemon-backed queue.add.",
            tags: ["ema_build_process_intent", "lost_followup"],
            confidence: 0.99,
            review_state: "new",
            recommended_destination: "ema_queue",
            evidence_ref: "smoke:agent-workspace-round-trip",
            source_path: "tooling/agent-workspace-round-trip.mjs",
            source_type: "ema_doc",
            source_family: "ema",
            project_hint: SMOKE_PROJECT,
            occurred_at: generatedAt,
            role: "smoke",
          },
        ],
        recommended_queue: [],
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
