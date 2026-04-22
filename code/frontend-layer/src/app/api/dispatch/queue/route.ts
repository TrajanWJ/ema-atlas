import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const DISPATCH_QUEUE = "/home/trajan/dispatch/queue";

export async function GET() {
  const tasks: Record<string, unknown>[] = [];
  try {
    const files = await readdir(DISPATCH_QUEUE);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readFile(join(DISPATCH_QUEUE, file), "utf-8");
        const data = JSON.parse(raw);
        tasks.push({
          id: data.id || file.replace(".json", ""),
          priority: data.priority || "P3",
          agent: data.agent || "unassigned",
          description: data.description || data.task || file,
          created: data.created || data.timestamp,
          context: data.context,
          status: "queued",
        });
      } catch { /* skip malformed */ }
    }
  } catch {
    // Directory may not exist or be empty
  }

  tasks.sort((a, b) => {
    const pa = parseInt(String(a.priority || "P9").replace(/[^0-9]/g, "")) || 9;
    const pb = parseInt(String(b.priority || "P9").replace(/[^0-9]/g, "")) || 9;
    return pa - pb;
  });

  return NextResponse.json({ tasks, count: tasks.length });
}
