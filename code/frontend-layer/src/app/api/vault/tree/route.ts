import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";

const VAULT_PATH = "/home/trajan/vault";
const MAX_DEPTH = 4;
const IGNORED = new Set([".obsidian", ".git", ".trash", "node_modules", ".DS_Store"]);

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modified?: string;
  children?: TreeNode[];
}

async function buildTree(dirPath: string, relativePath: string, depth: number): Promise<TreeNode[]> {
  if (depth > MAX_DEPTH) return [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    const sorted = entries
      .filter((e) => !IGNORED.has(e.name) && !e.name.startsWith("."))
      .sort((a, b) => {
        // Directories first, then alphabetical
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    for (const entry of sorted) {
      const fullPath = join(dirPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const children = await buildTree(fullPath, relPath, depth + 1);
        nodes.push({
          name: entry.name,
          path: relPath,
          type: "directory",
          children,
        });
      } else {
        try {
          const s = await stat(fullPath);
          nodes.push({
            name: entry.name,
            path: relPath,
            type: "file",
            size: s.size,
            modified: s.mtime.toISOString(),
          });
        } catch {
          nodes.push({ name: entry.name, path: relPath, type: "file" });
        }
      }
    }

    return nodes;
  } catch {
    return [];
  }
}

export async function GET() {
  const tree = await buildTree(VAULT_PATH, "", 0);
  return NextResponse.json({ tree });
}
