import test from "node:test";
import assert from "node:assert/strict";

import { commands } from "../src/commands.ts";

function optionValues(commandName: string, optionName: string): string[] {
  const command = commands.find((entry) => entry.name === commandName);
  assert.ok(command, `command ${commandName} should exist`);

  const option = command.options?.find((item: any) => item.name === optionName);
  assert.ok(option, `${commandName}.${optionName} should exist`);

  return (option.choices ?? []).map((choice: any) => choice.value);
}

function subcommandOptionValues(commandName: string, subcommandName: string, optionName: string): string[] {
  const command = commands.find((entry) => entry.name === commandName);
  assert.ok(command, `command ${commandName} should exist`);

  const sub = command.options?.find((item: any) => item.name === subcommandName);
  assert.ok(sub, `${commandName}.${subcommandName} should exist`);

  const option = sub.options?.find((item: any) => item.name === optionName);
  assert.ok(option, `${commandName}.${subcommandName}.${optionName} should exist`);

  return (option.choices ?? []).map((choice: any) => choice.value);
}

test("Hermes is offered anywhere ClaudeForge asks for a provider choice", () => {
  assert.deepEqual(optionValues("open", "provider"), ["claude", "codex", "hermes"]);
  assert.deepEqual(subcommandOptionValues("session", "new", "provider"), ["claude", "codex", "hermes"]);
  assert.deepEqual(optionValues("run", "provider"), ["claude", "codex", "hermes"]);
});
