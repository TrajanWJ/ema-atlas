import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Use the safe restart script (detaches, writes CONTINUE.md, then restarts)
    const { stdout } = await execAsync(
      "/home/trajan/bin/safe-gateway-restart.sh 'Frontend Layer restart request'",
      { timeout: 10000 }
    );
    return NextResponse.json({
      success: true,
      message: "Gateway restart initiated",
      output: stdout.trim(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Restart failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
