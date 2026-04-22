import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lines = Math.min(parseInt(searchParams.get("lines") || "50", 10), 200);

  try {
    const { stdout } = await execAsync(
      `journalctl -u openclaw-gateway --no-pager -n ${lines} --output=short-iso 2>/dev/null || tail -n ${lines} /var/log/openclaw-gateway.log 2>/dev/null || echo "No logs found"`,
      { timeout: 10000 }
    );
    return NextResponse.json({
      logs: stdout.trim(),
      lines,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch logs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
