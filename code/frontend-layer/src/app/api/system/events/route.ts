import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial ping
      send("ping", { time: Date.now() });

      // Poll and push updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          // System health
          let usagePct = 0;
          try {
            const raw = await readFile("/home/trajan/.claude-pace.json", "utf-8");
            const pace = JSON.parse(raw);
            usagePct = Math.round(pace.used_pct ?? 0);
          } catch { /* */ }

          send("health", {
            usagePct,
            time: Date.now(),
          });
        } catch {
          send("error", { message: "Poll failed" });
        }
      }, 5000);

      // Keep alive — close after 5 min to avoid leaked connections
      setTimeout(() => {
        clearInterval(interval);
        try { controller.close(); } catch { /* */ }
      }, 300000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
