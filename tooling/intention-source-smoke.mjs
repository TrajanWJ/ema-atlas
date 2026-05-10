#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const cmd = process.argv[2] ?? "projection";
const args =
  cmd === "projection"
    ? ["apps/cli/dist/bin.js", "intention", "projection", "--project", "proslync-app-ios-final", "--json"]
    : [
        "apps/cli/dist/bin.js",
        "intention",
        "harvest",
        "--project",
        "proslync-app-ios-final",
        "--max-sources",
        "25",
        "--json",
      ];

const result = spawnSync("node", args, {
  cwd: process.cwd(),
  encoding: "utf8",
});

process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
