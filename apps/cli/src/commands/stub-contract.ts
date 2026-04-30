import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";

export type StubCommand = {
  verb: string;
  flags?: string[];
  required?: string[];
  summary: string;
};

type StubOptions = {
  noun: string;
  docRef: string;
  commands: StubCommand[];
  status?: string;
  usage?: string;
};

export function runStubContract(args: ParsedArgs, opts: StubOptions): number {
  const verb = args.positional[0];
  const json = flagBool(args, "json");
  const help = flagBool(args, "help") || args.flags.h === true || verb === undefined || verb === "help";

  if (help) {
    const status = opts.status ?? "pending_daemon_writer";
    if (json) {
      emitJson({
        noun: opts.noun,
        status,
        commands: opts.commands,
        doc: opts.docRef,
      });
    } else {
      emitPretty(`ema ${opts.noun} — agent workspace commands`);
      emitPretty(`status: ${status}`);
      emitPretty("");
      emitPretty(opts.usage ?? `Usage: ema ${opts.noun} <subcommand> [flags...] [--json]`);
      emitPretty("");
      for (const cmd of opts.commands) {
        emitPretty(`  ${cmd.verb.padEnd(10)} ${cmd.summary}`);
        const flags = cmd.flags ?? [];
        if (flags.length > 0) emitPretty(`             flags: ${flags.map((f) => `--${f}`).join(", ")}`);
        const required = cmd.required ?? [];
        if (required.length > 0) emitPretty(`             required: ${required.map((f) => `--${f}`).join(", ")}`);
      }
      emitPretty("");
      emitPretty(`Docs: ${opts.docRef}`);
    }
    return 0;
  }

  const cmd = opts.commands.find((c) => c.verb === verb);

  if (!cmd) {
    emitError(
      `ema ${opts.noun}: unknown subcommand "${verb ?? ""}" ` +
        `(expected: ${opts.commands.map((c) => c.verb).join(" | ")})`,
    );
    emitError(`See ${opts.docRef} for the full grammar.`);
    return 64;
  }

  const missing = (cmd.required ?? []).filter((name) => !flagString(args, name));
  if (missing.length > 0) {
    emitError(`ema ${opts.noun} ${cmd.verb}: missing ${missing.map((m) => `--${m}`).join(", ")}`);
    emitError(`See ${opts.docRef} for examples and field meanings.`);
    return 64;
  }

  const flags: Record<string, string | boolean | null> = {};
  for (const name of cmd.flags ?? []) {
    flags[name] = flagString(args, name) ?? (args.flags[name] === true ? true : null);
  }

  const note = `pending daemon writer; command grammar is active for agent/workspace coordination`;
  if (json) {
    emitJson({
      ok: true,
      command: `${opts.noun} ${cmd.verb}`,
      status: "pending_daemon_writer",
      flags,
      note,
      doc: opts.docRef,
    });
  } else {
    emitPretty(`ema ${opts.noun} ${cmd.verb}: ${note}`);
    emitPretty(`  ${cmd.summary}`);
    for (const [k, v] of Object.entries(flags)) {
      if (v !== null && v !== undefined) emitPretty(`  --${k} ${String(v)}`);
    }
    emitPretty(`  docs: ${opts.docRef}`);
  }
  return 0;
}
