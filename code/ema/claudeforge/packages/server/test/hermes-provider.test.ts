import test from "node:test";
import assert from "node:assert/strict";

const encoder = new TextEncoder();

function makeSseResponse(chunks: string[], headers: Record<string, string> = {}): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers,
  });
}

test("HermesProvider streams text and hermes.tool.progress with session continuity", async () => {
  const originalFetch = globalThis.fetch;
  process.env.HERMES_BASE_URL = "http://127.0.0.1:8642";
  process.env.HERMES_API_KEY = "test-key";
  process.env.HERMES_MODEL = "gpt-5.4";

  const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ input, init });

    return makeSseResponse(
      [
        'event: hermes.tool.progress\ndata: {"tool":"read_file","label":"Read config"}\n\n',
        'data: {"choices":[{"delta":{"content":"Hello from Hermes"}}]}\n\n',
        'data: [DONE]\n\n',
      ],
      { "X-Hermes-Session-Id": "hermes-session-123" },
    );
  }) as typeof fetch;

  try {
    const { HermesProvider } = await import("../src/providers/hermes-provider.ts");
    const provider = new HermesProvider();

    const events = [] as Array<any>;
    for await (const event of provider.startSession({
      localSessionId: "local-1",
      directory: "/tmp",
      systemPrompt: "be useful",
    })) {
      events.push(event);
    }

    assert.deepEqual(events, [{ type: "done", sessionId: "local-1" }]);

    const streamed = [] as Array<any>;
    for await (const event of provider.sendMessage("local-1", "hi")) {
      streamed.push(event);
    }

    assert.equal(fetchCalls.length, 1);
    assert.equal(String(fetchCalls[0].input), "http://127.0.0.1:8642/v1/chat/completions");
    assert.equal((fetchCalls[0].init?.headers as Headers).get("Authorization"), "Bearer test-key");

    const body = JSON.parse(String(fetchCalls[0].init?.body));
    assert.equal(body.model, "gpt-5.4");
    assert.equal(body.stream, true);
    assert.deepEqual(body.messages, [
      { role: "system", content: "be useful" },
      { role: "user", content: "hi" },
    ]);

    assert.deepEqual(streamed, [
      { type: "session_init", providerSessionId: "hermes-session-123" },
      {
        type: "tool_use",
        tool: "read_file",
        input: "",
        toolCall: {
          id: streamed[1].toolCall.id,
          kind: "read",
          tool: "read_file",
          title: "Read config",
          input: "",
        },
      },
      { type: "text", content: "Hello from Hermes" },
      { type: "done", sessionId: "local-1" },
    ]);
    assert.match(streamed[1].toolCall.id, /^hermes-/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("HermesProvider reuses stored Hermes session id on subsequent messages", async () => {
  const originalFetch = globalThis.fetch;
  process.env.HERMES_BASE_URL = "http://127.0.0.1:8642";

  const headersSeen: string[] = [];
  let callCount = 0;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    callCount += 1;
    headersSeen.push((init?.headers as Headers).get("X-Hermes-Session-Id") ?? "");

    return makeSseResponse(
      ['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', 'data: [DONE]\n\n'],
      callCount === 1 ? { "X-Hermes-Session-Id": "session-A" } : {},
    );
  }) as typeof fetch;

  try {
    const { HermesProvider } = await import("../src/providers/hermes-provider.ts?case=reuse");
    const provider = new HermesProvider();

    for await (const _event of provider.startSession({ localSessionId: "local-2", directory: "/tmp" })) {
      // init
    }
    for await (const _event of provider.sendMessage("local-2", "first")) {
      // consume
    }
    for await (const _event of provider.sendMessage("local-2", "second")) {
      // consume
    }

    assert.deepEqual(headersSeen, ["", "session-A"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
