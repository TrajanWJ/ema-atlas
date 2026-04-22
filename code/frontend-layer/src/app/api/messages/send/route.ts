import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, agent } = body as { message?: string; agent?: string };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const agentId = agent || "main";
    const sanitized = message.trim().replace(/"/g, '\\"').replace(/\$/g, "\\$");

    // Try sending via openclaw CLI
    try {
      const { stdout, stderr } = await execAsync(
        `openclaw agent send ${agentId} "${sanitized}"`,
        { timeout: 15000 }
      );
      return NextResponse.json({
        success: true,
        method: "cli",
        agent: agentId,
        response: stdout.trim() || "Message sent",
      });
    } catch (cliErr) {
      // CLI failed — try gateway REST
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("http://localhost:18789/api/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message.trim(), agentId }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          return NextResponse.json({ success: true, method: "gateway-rest", agent: agentId });
        }
      } catch {
        // gateway REST also failed
      }

      const errMsg = cliErr instanceof Error ? cliErr.message : "Unknown error";
      return NextResponse.json({
        success: false,
        error: `Failed to send: ${errMsg.substring(0, 200)}`,
      }, { status: 502 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
