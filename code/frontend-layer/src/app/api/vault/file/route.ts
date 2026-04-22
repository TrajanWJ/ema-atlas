import { NextResponse } from "next/server";
import { readFile, stat, writeFile, unlink, mkdir } from "fs/promises";
import { join, resolve, dirname } from "path";

const VAULT_PATH = "/home/trajan/vault";
const MAX_SIZE = 1024 * 512; // 512KB

function safePath(path: string): string | null {
  const fullPath = resolve(join(VAULT_PATH, path));
  if (!fullPath.startsWith(VAULT_PATH)) return null;
  return fullPath;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const fullPath = safePath(path);
  if (!fullPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    const s = await stat(fullPath);
    if (s.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large", size: s.size }, { status: 413 });
    }

    const content = await readFile(fullPath, "utf-8");
    return NextResponse.json({
      content,
      path,
      size: s.size,
      modified: s.mtime.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "File not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, content } = body as { path?: string; content?: string };

    if (!path || typeof content !== "string") {
      return NextResponse.json({ error: "path and content required" }, { status: 400 });
    }

    const fullPath = safePath(path);
    if (!fullPath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");

    const s = await stat(fullPath);
    return NextResponse.json({
      success: true,
      path,
      size: s.size,
      modified: s.mtime.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const fullPath = safePath(path);
  if (!fullPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    await stat(fullPath); // verify exists
    await unlink(fullPath);
    return NextResponse.json({ success: true, path });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
