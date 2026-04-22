import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  const results: string[] = [];

  // Clear .next/cache
  try {
    await execAsync("rm -rf /home/trajan/projects/frontend-layer/.next/cache", { timeout: 5000 });
    results.push("Next.js cache cleared");
  } catch { results.push("Next.js cache: skipped"); }

  // Clear /tmp old files
  try {
    const { stdout } = await execAsync(
      "find /tmp -maxdepth 1 -user trajan -mmin +60 -type f -delete 2>/dev/null; echo done",
      { timeout: 5000 }
    );
    results.push("Temp files cleaned");
  } catch { results.push("Temp cleanup: skipped"); }

  return NextResponse.json({ success: true, results });
}
