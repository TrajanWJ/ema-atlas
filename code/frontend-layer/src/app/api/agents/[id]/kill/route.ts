import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });
  }

  try {
    const { stdout } = await execAsync(
      `openclaw agent stop ${id} 2>&1 || echo "No active sessions"`,
      { timeout: 10000 }
    );
    return NextResponse.json({
      success: true,
      agent: id,
      output: stdout.trim(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kill failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
