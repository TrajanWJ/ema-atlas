#!/usr/bin/env node
// M1 round-trip: connect to the daemon, say hello, subscribe to the
// event stream, issue debug.ping, and confirm we see at least one
// streamed event envelope (dispatch.started or dispatch.ended).
//
// Exits 0 on success, 1 on failure. Prints a one-line summary.

import WebSocket from "ws";

const URL = process.env.EMA_IPC_URL ?? "ws://127.0.0.1:49555/";
const TIMEOUT_MS = 5000;

const deadline = Date.now() + TIMEOUT_MS;
const ws = new WebSocket(URL);

let sawHelloAck = false;
let sawCommandResult = false;
let sawStreamedEvent = false;

const timer = setTimeout(() => {
  fail("timeout");
}, TIMEOUT_MS);

function fail(reason) {
  console.error(`m1-round-trip: FAIL (${reason})`);
  clearTimeout(timer);
  try {
    ws.close();
  } catch {
    // ignore
  }
  process.exit(1);
}

function succeed() {
  console.log("m1-round-trip: OK");
  clearTimeout(timer);
  ws.close();
  process.exit(0);
}

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      v: 0,
      id: "msg-hello-1",
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
    sawHelloAck = true;
    ws.send(
      JSON.stringify({
        v: 0,
        id: "msg-sub-1",
        type: "subscribe",
        channel: "events",
      })
    );
    ws.send(
      JSON.stringify({
        v: 0,
        id: "msg-cmd-1",
        type: "command",
        op: "debug.ping",
        args: {},
      })
    );
    return;
  }

  if (msg.type === "command_result") {
    if (!msg.ok) return fail("command failed: " + JSON.stringify(msg.error));
    sawCommandResult = true;
  }

  if (msg.type === "event") {
    sawStreamedEvent = true;
  }

  if (sawHelloAck && sawCommandResult && sawStreamedEvent) {
    succeed();
  }

  if (Date.now() > deadline) fail("deadline hit");
});

ws.on("error", (e) => fail("ws error: " + e.message));
ws.on("close", () => {
  if (!(sawHelloAck && sawCommandResult && sawStreamedEvent)) {
    fail(
      `socket closed — helloAck=${sawHelloAck} cmdResult=${sawCommandResult} event=${sawStreamedEvent}`
    );
  }
});
