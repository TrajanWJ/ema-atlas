import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const DISPATCH_ACTIVE = "/home/trajan/dispatch/active";

export async function GET() {
  const tasks: Record<string, unknown>[] = [];
  try {
    const files = await readdir(DISPATCH_ACTIVE);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readFile(join(DISPATCH_ACTIVE, file), "utf-8");
        const data = JSON.parse(raw);
        tasks.push({
          id: data.id || file.replace(".json", ""),
          priority: data.priority || "P3",
          agent: data.agent || "unassigned",
          description: data.description || data.task || file,
          created: data.created || data.timestamp,
          started: data.started,
          context: data.context,
          status: "active",
        });
      } catch { /* skip malformed */ }
    }
  } catch {
    // Directory may not exist or be empty
  }

  return NextResponse.json({ tasks, count: tasks.length });
}
