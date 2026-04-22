import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { Persistence } from "../src/persistence.ts";
import { SessionManager } from "../src/session-manager.ts";
import type { ProviderEvent } from "@claudeforge/shared";

class StubProvider {
  public startCalls: any[] = [];

  async *startSession(options: any): AsyncGenerator<ProviderEvent> {
    this.startCalls.push(options);
    yield { type: "session_init", providerSessionId: options.providerSessionId ?? "provider-new" };
    yield { type: "done", sessionId: options.localSessionId ?? options.sessionId ?? "unknown" };
  }

  async *sendMessage(): AsyncGenerator<ProviderEvent> {
    yield { type: "done", sessionId: "unused" };
  }

  abort(): void {}
  kill(): void {}
  isAlive(): boolean {
    return true;
  }
}

class StubRegistry {
  constructor(private provider: StubProvider) {}
  get(): StubProvider {
    return this.provider;
  }
}

function makeProject(directory: string) {
  const now = Date.now();
  return {
    id: "project-1",
    name: "proj",
    directory,
    categoryId: null,
    logChannelId: null,
    personality: "Hermes project persona",
    config: {},
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
}

test("SessionManager passes localSessionId and project personality into provider startSession", async () => {
  const root = mkdtempSync(join(tmpdir(), "claudeforge-session-hermes-"));
  const db = new Persistence(join(root, "data", "claudeforge.db"));
  db.upsertProject(makeProject(root));

  const provider = new StubProvider();
  const manager = new SessionManager(db, new StubRegistry(provider) as any);

  const session = await manager.createSession({
    projectId: "project-1",
    projectName: "proj",
    directory: root,
    name: "main",
    provider: "hermes",
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(provider.startCalls.length, 1);
  assert.equal(provider.startCalls[0].localSessionId, session.id);
  assert.equal(provider.startCalls[0].systemPrompt, "Hermes project persona");
  assert.equal(provider.startCalls[0].directory, root);
  assert.equal(provider.startCalls[0].providerSessionId, undefined);

  const persisted = db.getSession(session.id);
  assert.equal(persisted?.providerSessionId, "provider-new");
  assert.equal(persisted?.agentPersona, "Hermes project persona");
});

test("SessionManager passes providerSessionId back on resume instead of overloading sessionId", async () => {
  const root = mkdtempSync(join(tmpdir(), "claudeforge-session-hermes-resume-"));
  const db = new Persistence(join(root, "data", "claudeforge.db"));
  db.upsertProject(makeProject(root));

  const provider = new StubProvider();
  const manager = new SessionManager(db, new StubRegistry(provider) as any);

  const session = await manager.createSession({
    projectId: "project-1",
    projectName: "proj",
    directory: root,
    name: "resume-me",
    provider: "hermes",
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  const stored = db.getSession(session.id)!;
  stored.providerSessionId = "provider-existing";
  stored.status = "stopped";
  db.upsertSession(stored);

  provider.startCalls.length = 0;
  await manager.resumeSession(session.id);
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(provider.startCalls.length, 1);
  assert.equal(provider.startCalls[0].localSessionId, session.id);
  assert.equal(provider.startCalls[0].providerSessionId, "provider-existing");
  assert.equal(provider.startCalls[0].sessionId, undefined);
  assert.equal(provider.startCalls[0].systemPrompt, "Hermes project persona");
});
