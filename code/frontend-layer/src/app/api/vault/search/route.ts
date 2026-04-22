import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const VAULT_PATH = "/home/trajan/vault";
const MAX_RESULTS = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query too short (min 2 chars)" }, { status: 400 });
  }

  // Sanitize: only allow alphanumeric, spaces, hyphens, underscores, dots
  const sanitized = query.replace(/[^\w\s\-._]/g, "");

  try {
    const { stdout } = await execFileAsync("grep", [
      "-r", "-i", "-n", "--include=*.md", "--include=*.txt", "--include=*.json",
      "-l", sanitized, VAULT_PATH,
    ], { maxBuffer: 1024 * 1024, timeout: 10000 });

    const files = stdout.trim().split("\n").filter(Boolean).slice(0, MAX_RESULTS);

    // Get matching lines from each file
    const results: { path: string; line: string; lineNumber: number }[] = [];

    for (const file of files.slice(0, 20)) {
      try {
        const { stdout: grepOut } = await execFileAsync("grep", [
          "-i", "-n", "-m", "3", sanitized, file,
        ], { maxBuffer: 1024 * 64, timeout: 5000 });

        for (const matchLine of grepOut.trim().split("\n").filter(Boolean)) {
          const colonIdx = matchLine.indexOf(":");
          if (colonIdx === -1) continue;
          const lineNumber = parseInt(matchLine.slice(0, colonIdx), 10);
          const line = matchLine.slice(colonIdx + 1).trim();
          const relativePath = file.replace(VAULT_PATH + "/", "");
          results.push({ path: relativePath, line: line.slice(0, 200), lineNumber });
        }
      } catch {
        // skip files that fail
      }
    }

    return NextResponse.json({ results, total: files.length });
  } catch (e) {
    // grep returns exit code 1 when no matches
    if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 1) {
      return NextResponse.json({ results: [], total: 0 });
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
