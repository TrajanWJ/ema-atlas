#!/usr/bin/env node
// M2 dispatch round-trip: connect to the daemon, drive the canonical
// dispatch -> execution -> tool sequence end-to-end, and confirm each
// daemon-emitted event lands on the subscribed event channel in order.
//
// This is the executable verification gate for L2 (humble-sketch
// lane:01KR0RQ6JK). The 6-event chain is:
//
//   dispatch.started -> execution.started -> tool.invoked
//   -> tool.returned -> execution.ended  -> dispatch.ended
//
// Exits 0 on success, 1 on failure. Prints a one-line summary on each
// command_result and a final OK/FAIL line.

import WebSocket from "ws";

const URL = process.env.EMA_IPC_URL ?? "ws://127.0.0.1:49555/";
const TIMEOUT_MS = 15_000;
const ORG = process.env.EMA_TEST_ORG ?? "org:01J00000000000000000000001";
const ACTOR = process.env.EMA_TEST_ACTOR ?? "actor:m2-round-trip";
const PROVIDER = process.env.EMA_TEST_PROVIDER ?? "simulated";

// Unique intent so concurrent harness CLIs running in parallel don't pollute
// the event stream we're observing.
const RUN_TAG = `m2-${process.pid}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
const INTENT = `m2 round-trip smoke ${RUN_TAG}`;

const EXPECTED_KINDS = [
  "dispatch.started",
  "execution.started",
  "tool.invoked",
  "tool.returned",
  "execution.ended",
  "dispatch.ended",
];

let nextId = 0;
function msgId(prefix) {
  nextId += 1;
  return `${prefix}-${Date.now().toString(36)}-${nextId.toString(36)}`;
}

const deadline = Date.now() + TIMEOUT_MS;
const ws = new WebSocket(URL);

const observedKinds = [];
const pendingCommands = new Map();
let dispatchId = null;
let executionId = null;
let stage = "hello";

const timer = setTimeout(() => {
  fail(`timeout (stage=${stage}, observed=${observedKinds.join(",") || "none"})`);
}, TIMEOUT_MS);

function fail(reason) {
  console.error(`m2-dispatch-round-trip: FAIL (${reason})`);
  clearTimeout(timer);
  try {
    ws.close();
  } catch {
    // ignore
  }
  process.exit(1);
}

function succeed() {
  console.log(
    `m2-dispatch-round-trip: OK (dispatch=${dispatchId} execution=${executionId} kinds=[${observedKinds.join(", ")}])`
  );
  clearTimeout(timer);
  ws.close();
  process.exit(0);
}

function send(obj, expectedKindFromCommand) {
  const id = msgId("m2");
  pendingCommands.set(id, { op: obj.op ?? obj.type, expected: expectedKindFromCommand });
  ws.send(JSON.stringify({ ...obj, id }));
  return id;
}

function sendCommand(op, args, expectedKind) {
  return send({ v: 0, type: "command", op, args }, expectedKind);
}

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      v: 0,
      id: "msg-hello-m2",
      type: "hello",
      surface: "desktop",
      device_id: null,
    })
  );
});

ws.on("message", (raw) => {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return fail("non-json frame");
  }

  if (msg.type === "hello") {
    stage = "subscribe";
    ws.send(
      JSON.stringify({
        v: 0,
        id: "msg-sub-events-m2",
        type: "subscribe",
        channel: "events",
      })
    );
    stage = "dispatch.start";
    sendCommand(
      "dispatch.start",
      {
        org_id: ORG,
        actor_id: ACTOR,
        intent: INTENT,
        provider: PROVIDER,
      },
      "dispatch.started"
    );
    return;
  }

  if (msg.type === "command_result") {
    if (msg.ok !== true) {
      return fail(
        `command failed: ${JSON.stringify(msg.error ?? {})} (in_reply_to=${msg.in_reply_to})`
      );
    }
    const tracked = pendingCommands.get(msg.in_reply_to);
    pendingCommands.delete(msg.in_reply_to);
    if (!tracked) return; // unrelated command

    if (tracked.op === "dispatch.start") {
      dispatchId = msg.resource ?? null;
      if (!dispatchId) return fail("dispatch.start did not return a resource id");
      stage = "execution.start";
      sendCommand(
        "execution.start",
        {
          org_id: ORG,
          actor_id: ACTOR,
          dispatch_id: dispatchId,
          exec_kind: "tool",
          name: "m2.smoke",
          provider: PROVIDER,
        },
        "execution.started"
      );
      return;
    }

    if (tracked.op === "execution.start") {
      executionId = msg.resource ?? null;
      if (!executionId)
        return fail("execution.start did not return a resource id");
      stage = "tool.invoke";
      sendCommand(
        "tool.invoke",
        {
          org_id: ORG,
          actor_id: ACTOR,
          dispatch_id: dispatchId,
          execution_id: executionId,
          tool_name: "m2.echo",
          args_json: JSON.stringify({ text: "hello" }),
          provider: PROVIDER,
        },
        "tool.invoked"
      );
      return;
    }

    if (tracked.op === "tool.invoke") {
      stage = "tool.return";
      sendCommand(
        "tool.return",
        {
          org_id: ORG,
          actor_id: ACTOR,
          dispatch_id: dispatchId,
          execution_id: executionId,
          tool_name: "m2.echo",
          result_summary: "ok",
        },
        "tool.returned"
      );
      return;
    }

    if (tracked.op === "tool.return") {
      stage = "execution.end";
      sendCommand(
        "execution.end",
        {
          org_id: ORG,
          actor_id: ACTOR,
          dispatch_id: dispatchId,
          execution_id: executionId,
          outcome: "ok",
          duration_ms: 1,
        },
        "execution.ended"
      );
      return;
    }

    if (tracked.op === "execution.end") {
      stage = "dispatch.end";
      sendCommand(
        "dispatch.end",
        {
          org_id: ORG,
          actor_id: ACTOR,
          dispatch_id: dispatchId,
          outcome: "ok",
          provider: PROVIDER,
        },
        "dispatch.ended"
      );
      return;
    }

    if (tracked.op === "dispatch.end") {
      stage = "awaiting-events";
      maybeFinish();
      return;
    }
  }

  if (msg.type === "event") {
    const ev = msg.event ?? {};
    const kind = ev.kind ?? null;
    const evOrg = ev.org_id ?? null;
    if (!kind || !EXPECTED_KINDS.includes(kind)) {
      return;
    }
    if (evOrg && evOrg !== ORG) {
      return; // not our org
    }
    let payload = {};
    if (typeof ev.payload_json === "string") {
      try {
        payload = JSON.parse(ev.payload_json);
      } catch {
        payload = {};
      }
    }
    const evDispatch = payload.dispatch_id ?? null;
    const evIntent = payload.intent ?? null;
    if (kind === "dispatch.started") {
      // Identify our run by INTENT before we know the dispatchId.
      if (evIntent !== INTENT) return;
      if (!dispatchId && evDispatch) dispatchId = evDispatch;
    } else if (dispatchId) {
      if (evDispatch && evDispatch !== dispatchId) return;
    } else {
      // dispatchId not yet observed — wait for the dispatch.started for our
      // run, then resume.
      return;
    }
    observedKinds.push(kind);
    maybeFinish();
  }

  if (Date.now() > deadline) {
    fail(
      `deadline hit (stage=${stage}, observed=${observedKinds.join(",") || "none"})`
    );
  }
});

function maybeFinish() {
  if (observedKinds.length < EXPECTED_KINDS.length) return;
  // Verify the prefix of observed kinds equals EXPECTED_KINDS in order.
  for (let i = 0; i < EXPECTED_KINDS.length; i += 1) {
    if (observedKinds[i] !== EXPECTED_KINDS[i]) {
      return fail(
        `event order mismatch: expected[${i}]=${EXPECTED_KINDS[i]} observed[${i}]=${observedKinds[i]}`
      );
    }
  }
  succeed();
}

ws.on("error", (e) => fail("ws error: " + e.message));
ws.on("close", () => {
  if (observedKinds.length < EXPECTED_KINDS.length) {
    fail(
      `socket closed before chain complete (observed=${observedKinds.join(",") || "none"})`
    );
  }
});
